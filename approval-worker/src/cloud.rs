use serde_json::{json, Value};
use wasm_bindgen::prelude::*;
use worker::*;

#[wasm_bindgen(inline_js = r#"
export async function googleAssertion(secret) {
  const account = JSON.parse(secret);
  const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const text = value => encode(new TextEncoder().encode(JSON.stringify(value)));
  const now = Math.floor(Date.now()/1000);
  const data = text({alg:'RS256',typ:'JWT'})+'.'+text({iss:account.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
  const pem = account.private_key.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
  const key = await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(data));
  return data+'.'+encode(new Uint8Array(signature));
}
"#)]
extern "C" {
    #[wasm_bindgen(catch, js_name = googleAssertion)]
    async fn google_assertion(secret: String) -> std::result::Result<JsValue, JsValue>;
}

thread_local! {
    static TOKEN: std::cell::RefCell<Option<(String, f64)>> = const { std::cell::RefCell::new(None) };
}

pub struct Cloud {
    pub project: String,
    pub api_key: String,
    token: String,
    pub auth_base: String,
    store_base: String,
}

pub async fn request(url: &str, method: Method, token: Option<&str>, body: Option<Value>) -> Result<(u16, Value)> {
    let headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    if let Some(token) = token { headers.set("Authorization", &format!("Bearer {token}"))?; }
    let mut init = RequestInit::new();
    init.with_method(method).with_headers(headers);
    if let Some(body) = body { init.with_body(Some(JsValue::from_str(&body.to_string()))); }
    let mut response = Fetch::Request(Request::new_with_init(url, &init)?).send().await?;
    let status = response.status_code();
    let value = response.json::<Value>().await.unwrap_or(Value::Null);
    Ok((status, value))
}

impl Cloud {
    pub async fn connect(env: &Env) -> Result<Self> {
        let project = env.var("FIREBASE_PROJECT")?.to_string();
        let emulated = project == "demo-lecturenotes" && env.var("EMULATOR").map(|value| value.to_string() == "true").unwrap_or(false);
        let token = if emulated { "owner".into() } else { Self::access_token(env, &project).await? };
        let auth_base = if emulated { "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1" } else { "https://identitytoolkit.googleapis.com/v1" }.into();
        let host = if emulated { "http://127.0.0.1:8088/v1" } else { "https://firestore.googleapis.com/v1" };
        Ok(Self { store_base: format!("{host}/projects/{project}/databases/(default)/documents"), project,
            api_key: env.var("FIREBASE_API_KEY")?.to_string(), token, auth_base })
    }

    async fn access_token(env: &Env, project: &str) -> Result<String> {
        if let Some(token) = TOKEN.with(|cache| cache.borrow().as_ref().filter(|(_, expiry)| *expiry > js_sys::Date::now()).map(|(token, _)| token.clone())) { return Ok(token); }
        let secret = env.secret("FIREBASE_SERVICE_ACCOUNT")?.to_string();
        let account: Value = serde_json::from_str(&secret)?;
        if account["project_id"] != project { return Err(Error::RustError("Hizmet hesabı projesi uyuşmuyor.".into())); }
        let assertion = google_assertion(secret).await.map_err(|_| Error::RustError("Hizmet kimliği hazırlanamadı.".into()))?.as_string().ok_or("Hizmet kimliği geçersiz.")?;
        let headers = Headers::new(); headers.set("Content-Type", "application/x-www-form-urlencoded")?;
        let mut init = RequestInit::new();
        init.with_method(Method::Post).with_headers(headers).with_body(Some(JsValue::from_str(&format!("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion={assertion}"))));
        let mut response = Fetch::Request(Request::new_with_init("https://oauth2.googleapis.com/token", &init)?).send().await?;
        if response.status_code() != 200 { return Err(Error::RustError("Hizmet yetkilendirmesi başarısız.".into())); }
        let value = response.json::<Value>().await?;
        let token = value["access_token"].as_str().ok_or("Hizmet erişimi alınamadı.")?.to_string();
        TOKEN.with(|cache| *cache.borrow_mut() = Some((token.clone(), js_sys::Date::now() + 3_000_000.0)));
        Ok(token)
    }

    pub fn document_name(&self, collection: &str, id: &str) -> String {
        format!("projects/{}/databases/(default)/documents/{collection}/{id}", self.project)
    }

    pub async fn document(&self, collection: &str, id: &str) -> Result<Option<Value>> {
        let id = js_sys::encode_uri_component(id).as_string().unwrap_or_default();
        let (status, value) = request(&format!("{}/{collection}/{id}", self.store_base), Method::Get, Some(&self.token), None).await?;
        match status { 200 => Ok(Some(value)), 404 => Ok(None), _ => Err(Error::RustError("Ortak kayıt okunamadı.".into())) }
    }

    pub async fn commit(&self, writes: Vec<Value>) -> Result<bool> {
        let (status, _) = request(&format!("{}:commit", self.store_base), Method::Post, Some(&self.token), Some(json!({"writes":writes}))).await?;
        match status { 200 => Ok(true), 400 | 409 | 412 => Ok(false), _ => Err(Error::RustError("Ortak kayıt güncellenemedi.".into())) }
    }

    pub async fn lookup(&self, body: Value, token: Option<&str>) -> Result<Option<Value>> {
        let (status, value) = request(&format!("{}/accounts:lookup?key={}", self.auth_base, self.api_key), Method::Post, token, Some(body)).await?;
        if status != 200 { return Ok(None); }
        Ok(value["users"].as_array().and_then(|users| users.first()).cloned())
    }

    pub async fn delete_user(&self, uid: &str) -> Result<bool> {
        let (status, value) = request(&format!("{}/accounts:delete?key={}", self.auth_base, self.api_key), Method::Post,
            Some(&self.token), Some(json!({"localId":uid,"targetProjectId":self.project}))).await?;
        Ok(status == 200 || value["error"]["message"].as_str() == Some("USER_NOT_FOUND"))
    }

    pub async fn target_user(&self, uid: &str) -> Result<Option<Value>> {
        self.lookup(json!({"localId":[uid],"targetProjectId":self.project}), Some(&self.token)).await
    }

    pub async fn deletion_jobs(&self) -> Result<Vec<Value>> {
        let (status, value) = request(&format!("{}:runQuery", self.store_base), Method::Post, Some(&self.token), Some(json!({"structuredQuery":{
            "from":[{"collectionId":"applications"}],"where":{"fieldFilter":{"field":{"fieldPath":"deletionStatus"},"op":"EQUAL","value":{"stringValue":"pending"}}},"limit":10
        }}))).await?;
        if status != 200 { return Err(Error::RustError("Silme kuyruğu okunamadı.".into())); }
        Ok(value.as_array().into_iter().flatten().filter_map(|row| row.get("document").cloned()).collect())
    }
}

pub fn field<'a>(document: &'a Value, key: &str) -> &'a str {
    document["fields"][key]["stringValue"].as_str().unwrap_or("")
}
pub fn string(value: &str) -> Value { json!({"stringValue":value}) }
