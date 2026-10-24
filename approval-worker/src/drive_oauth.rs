use serde_json::{json, Value};
use wasm_bindgen::prelude::*;
use worker::*;
use crate::{cloud::{self, Cloud, field, string}, drive, github_flow};

const CALLBACK: &str = "https://lecturenotes-approval.aserdargl.workers.dev/drive/callback";
const SCOPE: &str = "https://www.googleapis.com/auth/drive.file";

#[wasm_bindgen(inline_js = r#"
export async function driveProof() {
  const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
  const verifier = random();
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return JSON.stringify({state:random(),verifier,challenge});
}
"#)]
extern "C" {
    #[wasm_bindgen(catch, js_name = driveProof)]
    async fn drive_proof() -> std::result::Result<JsValue, JsValue>;
}

pub async fn start(env: &Env, cloud: &Cloud, body: &Value) -> Result<Response> {
    let request_id = body["requestId"].as_str().unwrap_or("");
    if !github_flow::valid_nonce(request_id) { return drive::respond(env,400,json!({"error":"Geçersiz bağlantı isteği."})); }
    let proof:Value = serde_json::from_str(&drive_proof().await.map_err(|_|Error::RustError("Drive bağlantısı hazırlanamadı.".into()))?.as_string().ok_or("Bağlantı hazırlanamadı.")?)?;
    let previous = cloud.document("portalSettings","drive-oauth").await?;
    let fields = json!({"state":string(proof["state"].as_str().unwrap_or("")),"verifier":string(proof["verifier"].as_str().unwrap_or("")),
        "requestId":string(request_id),"expiresAt":string(&(js_sys::Date::now()+600_000.0).to_string()),"used":string("false")});
    if !drive::save_settings(cloud,"drive-oauth",fields,previous.as_ref()).await? { return drive::respond(env,409,json!({"error":"Başka bir bağlantı isteği var. Yeniden deneyin."})); }
    let client = env.var("DRIVE_CLIENT_ID")?.to_string();
    let mut url = Url::parse("https://accounts.google.com/o/oauth2/v2/auth")?;
    url.query_pairs_mut().append_pair("client_id",&client).append_pair("redirect_uri",CALLBACK).append_pair("response_type","code")
        .append_pair("scope",SCOPE).append_pair("access_type","offline").append_pair("prompt","consent")
        .append_pair("state",proof["state"].as_str().unwrap_or("")).append_pair("code_challenge",proof["challenge"].as_str().unwrap_or(""))
        .append_pair("code_challenge_method","S256");
    drive::respond(env,200,json!({"ok":true,"url":url.as_str()}))
}

async fn create_folder(token: &str, name: &str) -> Result<String> {
    let (status, result) = cloud::request("https://www.googleapis.com/drive/v3/files?fields=id",Method::Post,Some(token),
        Some(json!({"name":name,"mimeType":"application/vnd.google-apps.folder"}))).await?;
    if status != 200 { return Err(Error::RustError("Drive klasörü oluşturulamadı.".into())); }
    Ok(result["id"].as_str().ok_or("Drive klasörü doğrulanamadı.")?.to_string())
}

async fn exchange(env: &Env, cloud: &Cloud, pending: &Value, code: &str) -> Result<()> {
    let client = env.var("DRIVE_CLIENT_ID")?.to_string();
    let secret = env.secret("DRIVE_CLIENT_SECRET")?.to_string();
    let token = drive::form("https://oauth2.googleapis.com/token",&[("client_id",&client),("client_secret",&secret),("code",code),
        ("redirect_uri",CALLBACK),("code_verifier",field(pending,"verifier")),("grant_type","authorization_code")]).await?;
    let access = token["access_token"].as_str().ok_or("Drive erişimi alınamadı.")?;
    let previous = cloud.document("portalSettings","drive").await?;
    let refresh = token["refresh_token"].as_str().or_else(||previous.as_ref().map(|value|field(value,"refreshToken"))).filter(|v|!v.is_empty()).ok_or("Kalıcı Drive izni alınamadı.")?;
    let (assets, backups) = if let Some(previous) = &previous {
        (field(previous,"assetsFolder").to_string(),field(previous,"backupFolder").to_string())
    } else { (create_folder(access,"ME101 — Course Files").await?,create_folder(access,"ME101 — Backups").await?) };
    let fields = json!({"refreshToken":string(refresh),"assetsFolder":string(&assets),"backupFolder":string(&backups),"scope":string(SCOPE)});
    if !drive::save_settings(cloud,"drive",fields,previous.as_ref()).await? { return Err(Error::RustError("Drive ayarları kaydedilemedi.".into())); }
    drive::clear_token();
    Ok(())
}

pub async fn callback(req: &Request, env: &Env) -> Result<Response> {
    let query = req.url()?.query_pairs().map(|(key,value)|(key.into_owned(),value.into_owned())).collect::<std::collections::HashMap<_,_>>();
    let cloud = Cloud::connect(env).await?;
    let Some(pending) = cloud.document("portalSettings","drive-oauth").await? else { return Response::error("Bağlantı isteği bulunamadı.",400); };
    let state = query.get("state").map(String::as_str).unwrap_or("");
    if !github_flow::valid_nonce(state) || field(&pending,"state") != state || field(&pending,"used") != "false"
        || field(&pending,"expiresAt").parse::<f64>().unwrap_or(0.0) < js_sys::Date::now() { return Response::error("Bağlantı isteği geçersiz veya süresi dolmuş.",400); }
    let uid = env.var("FIREBASE_ADMIN_UID")?.to_string();
    let actor = cloud.target_user(&uid).await?;
    if !actor.is_some_and(|user|user["disabled"]!=true && user["emailVerified"]==true) || cloud.document("admins",&uid).await?.is_none() {
        return Response::error("Öğretim üyesi yetkisi doğrulanamadı.",403);
    }
    let mut fields = pending["fields"].clone(); fields["used"] = string("true");
    if !drive::save_settings(&cloud,"drive-oauth",fields,Some(&pending)).await? { return Response::error("Bağlantı isteği daha önce kullanılmış.",409); }
    let result = if let Some(code) = query.get("code").filter(|value|value.len()<=4096) { exchange(env,&cloud,&pending,code).await } else { Err(Error::RustError("Google bağlantısı iptal edildi.".into())) };
    finish(env,json!({"type":"mee101-drive","requestId":field(&pending,"requestId"),"ok":result.is_ok(),
        "error":if result.is_ok(){""}else{"Drive bağlantısı tamamlanamadı. Google hesabını ve uygulama izinlerini kontrol edin."}}))
}

fn finish(env: &Env, data: Value) -> Result<Response> {
    let target = serde_json::to_string(&env.var("ALLOWED_ORIGIN")?.to_string())?;
    let data = data.to_string().replace('<',"\\u003c");
    let html = format!("<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\"><title>LectureNotes Drive</title><p>Google Drive bağlantısı ders portalına iletildi. Bu pencereyi kapatabilirsiniz.</p><script>if(window.opener){{window.opener.postMessage({data},{target});window.close();}}</script></html>");
    let headers = Headers::new(); headers.set("Cache-Control","no-store")?;
    headers.set("Referrer-Policy","no-referrer")?;
    headers.set("Content-Security-Policy","default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'")?;
    Ok(Response::from_html(html)?.with_headers(headers))
}
