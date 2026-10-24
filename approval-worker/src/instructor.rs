use serde_json::Value;

/// Reuses only the explicitly configured, existing Firebase administrator.
pub fn valid_admin(uid: &str, user: &Value, registered: bool) -> bool {
    crate::policy::valid_uid(uid) && user["localId"] == uid
        && user["emailVerified"] == true && user["disabled"] != true && registered
}

#[cfg(target_arch = "wasm32")]
mod runtime {
    use super::*;
    use wasm_bindgen::prelude::*;
    use worker::*;

    #[wasm_bindgen(inline_js = r#"
export async function instructorToken(secret, uid) {
  const account = JSON.parse(secret);
  const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const text = value => encode(new TextEncoder().encode(JSON.stringify(value)));
  const now = Math.floor(Date.now()/1000);
  const payload = {iss:account.client_email,sub:account.client_email,
    aud:'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',iat:now,exp:now+300,uid};
  const data = text({alg:'RS256',typ:'JWT'})+'.'+text(payload);
  const pem = account.private_key.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
  const key = await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  return data+'.'+encode(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(data))));
}
"#)]
    extern "C" {
        #[wasm_bindgen(catch, js_name = instructorToken)]
        async fn instructor_token(secret: String, uid: String) -> std::result::Result<JsValue, JsValue>;
    }

    pub async fn token(env: &Env) -> Result<String> {
        let uid = env.var("FIREBASE_ADMIN_UID")?.to_string();
        let cloud = crate::cloud::Cloud::connect(env).await?;
        let user = cloud.target_user(&uid).await?.ok_or("Yönetici hesabı bulunamadı.")?;
        if !valid_admin(&uid, &user, cloud.document("admins", &uid).await?.is_some()) {
            return Err(Error::RustError("Mevcut yönetici hesabı doğrulanamadı.".into()));
        }
        let secret = env.secret("FIREBASE_SERVICE_ACCOUNT")?.to_string();
        if serde_json::from_str::<Value>(&secret)?["project_id"] != cloud.project {
            return Err(Error::RustError("Hizmet hesabı projesi uyuşmuyor.".into()));
        }
        instructor_token(secret, uid).await.map_err(|_| Error::RustError("Yönetici girişi hazırlanamadı.".into()))?
            .as_string().ok_or_else(|| Error::RustError("Yönetici girişi hazırlanamadı.".into()))
    }
}

#[cfg(target_arch = "wasm32")]
pub use runtime::token;

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn requires_existing_verified_enabled_admin_and_exact_binding() {
        let user = json!({"localId":"existing-admin", "emailVerified":true});
        assert!(valid_admin("existing-admin", &user, true));
        assert!(!valid_admin("another-admin", &user, true));
        assert!(!valid_admin("existing-admin", &user, false));
        assert!(!valid_admin("", &user, true));
        assert!(!valid_admin("existing-admin", &json!({"localId":"existing-admin","emailVerified":false}), true));
        assert!(!valid_admin("existing-admin", &json!({"localId":"existing-admin","emailVerified":true,"disabled":true}), true));
    }
}
