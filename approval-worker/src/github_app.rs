use serde_json::{json, Value};
use wasm_bindgen::prelude::*;
use worker::*;

const REPOSITORY: &str = "/repos/aserdargl/ME101";
thread_local! {
    static TOKEN: std::cell::RefCell<Option<(String, f64)>> = const { std::cell::RefCell::new(None) };
}

#[wasm_bindgen(inline_js = r#"
export async function publisherJwt(pem, issuer) {
  const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const text = value => encode(new TextEncoder().encode(JSON.stringify(value)));
  const now = Math.floor(Date.now()/1000);
  const data = text({alg:'RS256',typ:'JWT'})+'.'+text({iat:now-60,exp:now+540,iss:issuer});
  const binary = atob(pem.replace(/-----[^-]+-----/g,'').replace(/\s/g,''));
  const key = await crypto.subtle.importKey('pkcs8',Uint8Array.from(binary,c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  return data+'.'+encode(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(data))));
}
"#)]
extern "C" {
    #[wasm_bindgen(catch, js_name = publisherJwt)]
    async fn publisher_jwt(pem: String, issuer: String) -> std::result::Result<JsValue, JsValue>;
}

fn test(env: &Env) -> bool {
    env.var("FIREBASE_PROJECT").map(|v|v.to_string()=="demo-lecturenotes").unwrap_or(false)
        && env.var("EMULATOR").map(|v|v.to_string()=="true").unwrap_or(false)
}

async fn request(env: &Env, path: &str, method: Method, token: &str, body: Option<Value>) -> Result<(u16, Value)> {
    let base=if test(env) {"http://127.0.0.1:4198"} else {"https://api.github.com"};
    let headers=Headers::new();
    headers.set("Authorization",&format!("Bearer {token}"))?;
    headers.set("Accept","application/vnd.github+json")?;
    headers.set("User-Agent","LectureNotes-Publisher")?;
    headers.set("X-GitHub-Api-Version","2022-11-28")?;
    let mut init=RequestInit::new();init.with_method(method).with_headers(headers.clone());
    if let Some(body)=body {
        headers.set("Content-Type","application/json")?;
        init.with_headers(headers).with_body(Some(JsValue::from_str(&body.to_string())));
    }
    let mut response=Fetch::Request(Request::new_with_init(&format!("{base}{path}"),&init)?).send().await?;
    Ok((response.status_code(),response.json::<Value>().await.unwrap_or(Value::Null)))
}

/// Creates short-lived credentials restricted to ME101; they are never returned to a client.
pub async fn token(env: &Env) -> Result<String> {
    if test(env) {return Ok("synthetic-installation-token".into());}
    if let Some(token)=TOKEN.with(|cache|cache.borrow().as_ref().filter(|(_,expiry)|*expiry>js_sys::Date::now()).map(|(token,_)|token.clone())) {return Ok(token);}
    let jwt=publisher_jwt(env.secret("GITHUB_APP_PRIVATE_KEY")?.to_string(),env.var("GITHUB_CLIENT_ID")?.to_string()).await
        .map_err(|_|Error::RustError("Yayın bağlantısı hazırlanamadı.".into()))?.as_string().ok_or("Yayın bağlantısı hazırlanamadı.")?;
    let (status,installation)=request(env,&format!("{REPOSITORY}/installation"),Method::Get,&jwt,None).await?;
    if status!=200 {return Err(Error::RustError("ME101 uygulama kurulumu bulunamadı.".into()));}
    let id=installation["id"].as_u64().ok_or("Uygulama kurulumu geçersiz.")?;
    let (status,result)=request(env,&format!("/app/installations/{id}/access_tokens"),Method::Post,&jwt,
        Some(json!({"repositories":["ME101"],"permissions":{"contents":"write"}}))).await?;
    if status!=201 || result["permissions"]["contents"]!="write" {return Err(Error::RustError("Yayın izni alınamadı.".into()));}
    let token=result["token"].as_str().filter(|value|!value.is_empty()).ok_or("Yayın izni alınamadı.")?.to_string();
    let expiry=js_sys::Date::parse(result["expires_at"].as_str().unwrap_or(""))-60_000.0;
    if !expiry.is_finite() || expiry<=js_sys::Date::now() {return Err(Error::RustError("Yayın izni süresi geçersiz.".into()));}
    TOKEN.with(|cache|*cache.borrow_mut()=Some((token.clone(),expiry)));
    Ok(token)
}

pub async fn api(env: &Env, path: &str, method: Method, body: Option<Value>) -> Result<(u16, Value)> {
    let credential=token(env).await?;
    let result=request(env,&format!("{REPOSITORY}{path}"),method,&credential,body).await?;
    if result.0==401 {TOKEN.with(|cache|*cache.borrow_mut()=None);}
    Ok(result)
}

pub async fn object(env: &Env, path: &str, method: Method, body: Option<Value>) -> Result<Value> {
    let (status,value)=api(env,path,method,body).await?;
    if !(200..300).contains(&status) {return Err(Error::RustError("GitHub işlemi tamamlanamadı.".into()));}
    Ok(value)
}
