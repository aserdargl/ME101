use serde_json::{json, Value};
use worker::*;
use crate::{cloud::{Cloud, field, string}, policy::{self, Decision}};

fn update_application(cloud: &Cloud, uid: &str, application: &Value, updates: Value) -> Value {
    let mut fields = application["fields"].as_object().cloned().unwrap_or_default();
    for (key, value) in updates.as_object().into_iter().flatten() { fields.insert(key.clone(), value.clone()); }
    json!({"update":{"name":cloud.document_name("applications",uid),"fields":fields},
        "currentDocument":{"updateTime":application["updateTime"]}})
}

pub async fn review(cloud: &Cloud, actor: &str, decision: Decision) -> Result<(u16, Value)> {
    let Some(application) = cloud.document("applications", &decision.uid).await? else {
        return Ok((404, json!({"error":"Başvuru bulunamadı."})));
    };
    let admin = cloud.document("admins", &decision.uid).await?.is_some();
    if let Err(message) = policy::validate(&decision, actor, admin, field(&application,"status")) {
        return Ok((409,json!({"error":message})));
    }
    if decision.action == "reject" {
        reject(cloud, actor, &decision.uid, &application).await
    } else { approve(cloud, actor, &decision, &application).await }
}

async fn approve(cloud: &Cloud, actor: &str, decision: &Decision, application: &Value) -> Result<(u16,Value)> {
    let no = decision.no.as_deref().unwrap_or_else(|| field(application,"no")).trim();
    let name = decision.name.as_deref().unwrap_or_else(|| field(application,"name")).trim();
    if !policy::valid_number(no) || name.is_empty() || name.chars().count() > 200 {
        return Ok((400,json!({"error":"Geçerli öğrenci numarası ve ad-soyad gerekli."})));
    }
    let Some(account) = cloud.target_user(&decision.uid).await? else {
        return Ok((409,json!({"error":"Giriş hesabı bulunamadı. Başvuruyu reddedebilirsiniz."})));
    };
    let email = account["email"].as_str().unwrap_or("").to_lowercase();
    if email.is_empty() || email != field(application,"email") || account["disabled"] == true {
        return Ok((409,json!({"error":"Hesap bilgileri değişmiş veya hesap kapalı."})));
    }
    let claim = cloud.document("numberClaims", no).await?;
    if claim.as_ref().is_some_and(|value| field(value,"uid") != decision.uid) {
        return Ok((409,json!({"error":"Bu numara başka hesaba bağlı. Önce mevcut bağlantıyı kontrol ediniz."})));
    }
    let enrollment = cloud.document("enrollments", &decision.uid).await?;
    if enrollment.as_ref().is_some_and(|value| field(value,"no") != no) {
        return Ok((409,json!({"error":"Hesap başka numaraya bağlı. Önce bağlantıyı düzeltiniz."})));
    }
    let roster = cloud.document("studentNumbers", no).await?;
    if roster.as_ref().is_some_and(|value| value["fields"]["enabled"]["booleanValue"] != true) {
        return Ok((409,json!({"error":"Numara listede devre dışı. Önce listeyi güncelleyiniz."})));
    }
    let mut writes = Vec::new();
    if claim.is_none() { writes.push(json!({"update":{"name":cloud.document_name("numberClaims",no),"fields":{"uid":string(&decision.uid)}},"currentDocument":{"exists":false}})); }
    if enrollment.is_none() {
        let key = roster.as_ref().map(|value| field(value,"nameKey").to_string()).unwrap_or_else(|| policy::name_key(name));
        writes.push(json!({"update":{"name":cloud.document_name("enrollments",&decision.uid),"fields":{"no":string(no),"nameKey":string(&key),"email":string(&email)}},"currentDocument":{"exists":false}}));
    }
    if roster.is_none() { writes.push(json!({"update":{"name":cloud.document_name("studentNumbers",no),"fields":{
        "no":string(no),"name":string(name),"nameKey":string(&policy::name_key(name)),"enabled":{"booleanValue":true}}},"currentDocument":{"exists":false}})); }
    writes.push(update_application(cloud,&decision.uid,application,json!({"status":string("approved"),"reviewedBy":string(actor),
        "approvedNo":string(no),"approvedName":string(name)})));
    if !cloud.commit(writes).await? { return Ok((409,json!({"error":"Kayıt değişmiş. Listeyi yenileyip tekrar deneyiniz."}))); }
    Ok((200,json!({"ok":true,"status":"approved"})))
}

async fn reject(cloud: &Cloud, actor: &str, uid: &str, application: &Value) -> Result<(u16,Value)> {
    if field(application,"status") == "pending" {
        let mut writes = vec![update_application(cloud,uid,application,json!({"status":string("rejected"),
            "reviewedBy":string(actor),"deletionStatus":string("pending")})),
            json!({"update":{"name":cloud.document_name("rejectedEmails",field(application,"email")),"fields":{"uid":string(uid)}}})];
        if let Some(enrollment) = cloud.document("enrollments", uid).await? {
            let no = field(&enrollment,"no");
            if cloud.document("numberClaims",no).await?.is_some_and(|value| field(&value,"uid") == uid) {
                writes.push(json!({"delete":cloud.document_name("numberClaims",no)}));
            }
            writes.push(json!({"delete":cloud.document_name("enrollments",uid)}));
        }
        if !cloud.commit(writes).await? { return Ok((409,json!({"error":"Başvuru değişmiş. Listeyi yenileyiniz."}))); }
    }
    let deleted = finish_deletion(cloud,uid).await.unwrap_or(false);
    Ok((if deleted {200} else {202},json!({"ok":true,"status":"rejected","deletionStatus":if deleted {"deleted"} else {"pending"}})))
}

pub async fn finish_deletion(cloud: &Cloud, uid: &str) -> Result<bool> {
    if cloud.document("admins",uid).await?.is_some() { return Ok(false); }
    let Some(application) = cloud.document("applications",uid).await? else { return Ok(false); };
    if field(&application,"status") != "rejected" || field(&application,"deletionStatus") != "pending" { return Ok(false); }
    if !cloud.delete_user(uid).await? { return Ok(false); }
    cloud.commit(vec![update_application(cloud,uid,&application,json!({"deletionStatus":string("deleted")}))]).await
}
