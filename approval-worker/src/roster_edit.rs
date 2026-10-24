use serde::Deserialize;
use serde_json::Value;
#[cfg(any(test, target_arch = "wasm32"))]
use serde_json::json;
use crate::policy;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Original {
    pub no: String,
    pub name: String,
    pub enabled: bool,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub surname: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Edit {
    pub original: Original,
    pub no: String,
    pub first_name: String,
    pub surname: String,
}

impl Edit {
    pub fn validate(&self) -> Result<(), &'static str> {
        let name = self.name();
        if !policy::valid_number(self.no.trim()) || self.first_name.trim().is_empty() || name.chars().count() > 200 {
            return Err("Geçerli öğrenci numarası ve isim gerekli (ad-soyad en fazla 200 karakter).");
        }
        if let Some(email) = &self.original.email {
            if email.contains('/') || !email.contains('@') || email.len() > 254 { return Err("Geçersiz öğrenci kaydı."); }
        } else if !policy::valid_number(&self.original.no) { return Err("Geçersiz öğrenci kaydı."); }
        Ok(())
    }

    pub fn name(&self) -> String {
        format!("{} {}", self.first_name.trim(), self.surname.trim()).split_whitespace().collect::<Vec<_>>().join(" ")
    }

    pub fn matches(&self, document: &Value) -> bool {
        let fields = &document["fields"];
        fields["no"]["stringValue"].as_str() == Some(&self.original.no)
            && fields["name"]["stringValue"].as_str() == Some(&self.original.name)
            && fields["enabled"]["booleanValue"].as_bool() == Some(self.original.enabled)
            && fields["email"]["stringValue"].as_str() == self.original.email.as_deref()
            && fields["firstName"]["stringValue"].as_str() == self.original.first_name.as_deref()
            && fields["surname"]["stringValue"].as_str() == self.original.surname.as_deref()
    }
}

#[cfg(target_arch = "wasm32")]
mod runtime {
    use super::*;
    use crate::cloud::{Cloud, field, string};
    use worker::Result;

    fn update(document: &Value, changes: Value) -> Value {
        let mut fields = document["fields"].as_object().cloned().unwrap_or_default();
        for (key, value) in changes.as_object().into_iter().flatten() { fields.insert(key.clone(), value.clone()); }
        json!({"update":{"name":document["name"],"fields":fields},"currentDocument":{"updateTime":document["updateTime"]}})
    }

    fn conflict() -> (u16, Value) {
        (409, json!({"error":"Kayıt veya numara eşleşmesi değişmiş. Listeyi yenileyip tekrar deneyiniz."}))
    }

    /// Renames the roster key and its claimed account links in one guarded commit.
    pub async fn save(cloud: &Cloud, edit: Edit) -> Result<(u16, Value)> {
        if let Err(error) = edit.validate() { return Ok((400, json!({"error":error}))); }
        let collection = if edit.original.email.is_some() { "students" } else { "studentNumbers" };
        let id = edit.original.email.as_deref().unwrap_or(&edit.original.no);
        let Some(source) = cloud.document(collection, id).await? else { return Ok(conflict()); };
        if !edit.matches(&source) { return Ok(conflict()); }
        let moving = edit.original.email.is_none() && edit.no.trim() != edit.original.no;
        if moving && (cloud.document("studentNumbers", edit.no.trim()).await?.is_some()
            || cloud.document("numberClaims", edit.no.trim()).await?.is_some()) { return Ok(conflict()); }
        let name = edit.name();
        let mut write = update(&source, json!({"no":string(edit.no.trim()),"name":string(&name),
            "firstName":string(edit.first_name.trim()),"surname":string(edit.surname.trim())}));
        if edit.original.email.is_none() { write["update"]["fields"]["nameKey"] = string(&policy::name_key(&name)); }
        let student_fields = write["update"]["fields"].clone();
        let mut writes = Vec::new();
        if moving {
            writes.push(json!({"delete":source["name"],"currentDocument":{"updateTime":source["updateTime"]}}));
            write["update"]["name"] = json!(cloud.document_name(collection, edit.no.trim()));
            write["currentDocument"] = json!({"exists":false});
        }
        writes.push(write);
        if edit.original.email.is_none() && !account_links(cloud, &edit, moving, &mut writes).await? { return Ok(conflict()); }
        if !cloud.commit(writes).await? { return Ok(conflict()); }
        let student = student_fields.as_object().into_iter().flatten().map(|(key, value)| {
            (key.clone(), value.get("stringValue").or_else(|| value.get("booleanValue")).cloned().unwrap_or(Value::Null))
        }).collect::<serde_json::Map<_, _>>();
        Ok((200, json!({"ok":true,"student":student})))
    }

    async fn account_links(cloud: &Cloud, edit: &Edit, moving: bool, writes: &mut Vec<Value>) -> Result<bool> {
        let claim = cloud.document("numberClaims", &edit.original.no).await?;
        let Some(claim) = claim else {
            // Prevent a concurrent enrollment from claiming the old number during a move.
            if moving { writes.push(json!({"delete":cloud.document_name("numberClaims",&edit.original.no),"currentDocument":{"exists":false}})); }
            return Ok(true);
        };
        let uid = field(&claim,"uid");
        if !policy::valid_uid(uid) || cloud.document("admins",uid).await?.is_some() { return Ok(false); }
        let Some(enrollment) = cloud.document("enrollments",uid).await? else { return Ok(false); };
        if field(&enrollment,"no") != edit.original.no { return Ok(false); }
        let changes = json!({"no":string(edit.no.trim()),"nameKey":string(&policy::name_key(&edit.name()))});
        writes.push(update(&enrollment, changes.clone()));
        if let Some(request) = cloud.document("registrationRequests",uid).await? {
            if field(&request,"no") == edit.original.no { writes.push(update(&request,changes)); }
        }
        if let Some(application) = cloud.document("applications",uid).await? {
            if field(&application,"status") == "approved" {
                if field(&application,"approvedNo") != edit.original.no { return Ok(false); }
                writes.push(update(&application,json!({"approvedNo":string(edit.no.trim()),"approvedName":string(&edit.name())})));
            }
        }
        if moving {
            writes.push(json!({"delete":claim["name"],"currentDocument":{"updateTime":claim["updateTime"]}}));
            writes.push(json!({"update":{"name":cloud.document_name("numberClaims",edit.no.trim()),"fields":claim["fields"]},"currentDocument":{"exists":false}}));
        }
        Ok(true)
    }
}

#[cfg(target_arch = "wasm32")]
pub use runtime::save;

#[cfg(test)]
mod tests {
    use super::*;
    fn edit() -> Edit { serde_json::from_value(json!({"original":{"no":"001","name":"Ali Kaya","enabled":true},
        "no":"002","firstName":"Ahmet Serdar","surname":"Güldibi"})).unwrap() }
    #[test]
    fn validates_numbers_and_preserves_explicit_name_parts() {
        let mut value = edit(); assert!(value.validate().is_ok()); assert_eq!(value.name(),"Ahmet Serdar Güldibi");
        value.no = "2e3".into(); assert!(value.validate().is_err());
    }
    #[test]
    fn stale_edits_cannot_overwrite_changed_names_or_disabled_state() {
        let value = edit();
        let mut document = json!({"fields":{"no":{"stringValue":"001"},"name":{"stringValue":"Ali Kaya"},"enabled":{"booleanValue":true}}});
        assert!(value.matches(&document));
        document["fields"]["enabled"]["booleanValue"] = json!(false); assert!(!value.matches(&document));
    }
}
