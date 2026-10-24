use serde_json::{json, Value};
use worker::*;
use crate::{cloud::{self, Cloud, field, string}, drive_policy::{self, AssetRegistration}};

thread_local! {
    static TOKEN: std::cell::RefCell<Option<(String, f64)>> = const { std::cell::RefCell::new(None) };
}

pub fn clear_token() { TOKEN.with(|value| *value.borrow_mut() = None); }

pub fn configured(env: &Env) -> bool {
    env.var("DRIVE_CLIENT_ID").is_ok() && env.secret("DRIVE_CLIENT_SECRET").is_ok()
}

pub fn respond(env: &Env, status: u16, value: Value) -> Result<Response> {
    let headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", &env.var("ALLOWED_ORIGIN")?.to_string())?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type")?;
    headers.set("Cache-Control", "no-store")?;
    headers.set("Content-Type", "application/json; charset=utf-8")?;
    headers.set("Vary", "Origin")?;
    Ok(Response::from_json(&value)?.with_status(status).with_headers(headers))
}

pub async fn admin(req: &Request, env: &Env) -> Result<Option<Cloud>> {
    let authorization = req.headers().get("Authorization")?.unwrap_or_default();
    let Some(token) = authorization.strip_prefix("Bearer ") else { return Ok(None); };
    let cloud = Cloud::connect(env).await?;
    let Some(actor) = cloud.lookup(json!({"idToken":token}), None).await? else { return Ok(None); };
    let expected = env.var("FIREBASE_ADMIN_UID")?.to_string();
    if actor["localId"].as_str() != Some(&expected) || actor["emailVerified"] != true || actor["disabled"] == true
        || cloud.document("admins", &expected).await?.is_none() { return Ok(None); }
    Ok(Some(cloud))
}

pub async fn form(url: &str, values: &[(&str, &str)]) -> Result<Value> {
    let mut body = Url::parse("https://localhost/")?;
    body.query_pairs_mut().extend_pairs(values.iter().copied());
    let headers = Headers::new();
    headers.set("Content-Type", "application/x-www-form-urlencoded")?;
    let mut init = RequestInit::new();
    init.with_method(Method::Post).with_headers(headers).with_body(Some(body.query().unwrap_or("").into()));
    let mut response = Fetch::Request(Request::new_with_init(url, &init)?).send().await?;
    if response.status_code() != 200 { return Err(Error::RustError("Google bağlantısı doğrulanamadı.".into())); }
    response.json().await
}

pub async fn save_settings(cloud: &Cloud, id: &str, fields: Value, previous: Option<&Value>) -> Result<bool> {
    let condition = previous.map(|doc| json!({"updateTime":doc["updateTime"]})).unwrap_or(json!({"exists":false}));
    cloud.commit(vec![json!({"update":{"name":cloud.document_name("portalSettings", id),"fields":fields},"currentDocument":condition})]).await
}

pub struct Drive {
    pub token: String,
    pub assets: String,
    pub backups: String,
}

impl Drive {
    pub async fn connect(env: &Env, cloud: &Cloud) -> Result<Self> {
        let settings = cloud.document("portalSettings", "drive").await?.ok_or("Drive henüz bağlanmadı.")?;
        let cached = TOKEN.with(|cache| cache.borrow().as_ref().filter(|(_, expiry)| *expiry > js_sys::Date::now()).map(|(token, _)| token.clone()));
        let token = if let Some(token) = cached { token } else {
            let client = env.var("DRIVE_CLIENT_ID")?.to_string();
            let secret = env.secret("DRIVE_CLIENT_SECRET")?.to_string();
            let result = form("https://oauth2.googleapis.com/token", &[("client_id",&client),("client_secret",&secret),
                ("refresh_token",field(&settings,"refreshToken")),("grant_type","refresh_token")]).await?;
            let token = result["access_token"].as_str().ok_or("Drive oturumu açılamadı.")?.to_string();
            TOKEN.with(|cache| *cache.borrow_mut() = Some((token.clone(), js_sys::Date::now() + 3_000_000.0)));
            token
        };
        Ok(Self { token, assets:field(&settings,"assetsFolder").into(), backups:field(&settings,"backupFolder").into() })
    }

    pub async fn file(&self, id: &str) -> Result<Option<Value>> {
        if !drive_policy::valid_file_id(id) { return Ok(None); }
        let (status,value) = cloud::request(&format!("https://www.googleapis.com/drive/v3/files/{id}?fields=id,name,size,mimeType,sha256Checksum,parents,trashed"), Method::Get, Some(&self.token), None).await?;
        match status { 200=>Ok(Some(value)), 404=>Ok(None), _=>Err(Error::RustError("Drive dosyası okunamadı.".into())) }
    }
}

async fn register(env: &Env, cloud: &Cloud, input: AssetRegistration) -> Result<Response> {
    if let Err(error) = input.validate() { return respond(env,400,json!({"error":error})); }
    let drive = Drive::connect(env,cloud).await?;
    let Some(file) = drive.file(&input.file_id).await? else { return respond(env,404,json!({"error":"Drive dosyası bulunamadı."})); };
    if !input.matches(&file,&drive.assets) { return respond(env,409,json!({"error":"Dosyanın bütünlüğü doğrulanamadı; özgün notlar korunuyor."})); }
    if cloud.document("lectureAssets",&input.hash).await?.is_none() {
        let fields = json!({"fileId":string(&input.file_id),"sha256":string(&input.hash),
            "size":string(&input.size.to_string()),"mimeType":string(file["mimeType"].as_str().unwrap_or("application/octet-stream"))});
        let write = json!({"update":{"name":cloud.document_name("lectureAssets",&input.hash),"fields":fields},"currentDocument":{"exists":false}});
        if !cloud.commit(vec![write]).await? && cloud.document("lectureAssets",&input.hash).await?.is_none() {
            return respond(env,409,json!({"error":"Dosya kaydı tamamlanamadı; yerel notlar korunuyor."}));
        }
    }
    respond(env,200,json!({"ok":true,"hash":input.hash}))
}

async fn asset(req: &Request, env: &Env, hash: &str, ctx: &Context) -> Result<Response> {
    if !drive_policy::valid_hash(hash) { return respond(env,404,json!({"error":"Dosya bulunamadı."})); }
    let cache = Cache::default();
    let key = req.url()?.to_string();
    if let Some(response) = cache.get(key.clone(),false).await? { return Ok(response); }
    let cloud = Cloud::connect(env).await?;
    let Some(asset) = cloud.document("lectureAssets",hash).await? else { return respond(env,404,json!({"error":"Dosya bulunamadı."})); };
    let id = field(&asset,"fileId");
    if !drive_policy::valid_file_id(id) { return respond(env,404,json!({"error":"Dosya bulunamadı."})); }
    let drive = Drive::connect(env,&cloud).await?;
    let headers = Headers::new(); headers.set("Authorization",&format!("Bearer {}",drive.token))?;
    let mut init = RequestInit::new(); init.with_method(Method::Get).with_headers(headers);
    let mut response = Fetch::Request(Request::new_with_init(&format!("https://www.googleapis.com/drive/v3/files/{id}?alt=media"),&init)?).send().await?;
    if response.status_code() != 200 { return respond(env,503,json!({"error":"Drive dosyasına şu an ulaşılamıyor."})); }
    let headers = Headers::new();
    headers.set("Access-Control-Allow-Origin",&env.var("ALLOWED_ORIGIN")?.to_string())?;
    headers.set("Content-Type",field(&asset,"mimeType"))?;
    headers.set("Content-Length",field(&asset,"size"))?;
    headers.set("Cache-Control","public, max-age=31536000, immutable")?;
    headers.set("X-Content-Type-Options","nosniff")?;
    headers.set("Content-Security-Policy","sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data: https:")?;
    let mut response = Response::from_stream(response.stream()?)?.with_headers(headers);
    let cached = response.cloned()?;
    ctx.wait_until(async move { let _ = Cache::default().put(key,cached).await; });
    Ok(response)
}

pub async fn handle(mut req: Request, env: &Env, ctx: &Context) -> Result<Response> {
    let origin = env.var("ALLOWED_ORIGIN")?.to_string();
    if req.method() == Method::Get && req.path() == "/drive/callback" { return crate::drive_oauth::callback(&req,env).await; }
    if req.method() == Method::Get && req.path().starts_with("/drive/assets/") { return asset(&req,env,req.path().trim_start_matches("/drive/assets/"),ctx).await; }
    if req.headers().get("Origin")?.as_deref() != Some(&origin) { return Response::error("Forbidden",403); }
    if req.method() == Method::Options { return respond(env,200,Value::Null); }
    if req.method() != Method::Post { return respond(env,405,json!({"error":"Geçersiz yöntem."})); }
    if !configured(env) { return respond(env,503,json!({"error":"Google Drive bağlantısı henüz yapılandırılmadı."})); }
    let Some(cloud) = admin(&req,env).await? else { return respond(env,403,json!({"error":"Öğretim üyesi girişi gerekli."})); };
    if req.headers().get("Content-Length")?.and_then(|s|s.parse::<usize>().ok()).is_some_and(|size|size>65536) { return respond(env,413,json!({"error":"İstek çok büyük."})); }
    let text = req.text().await?;
    if text.len()>65536 { return respond(env,413,json!({"error":"İstek çok büyük."})); }
    let body:Value = match serde_json::from_str(&text) { Ok(value)=>value, Err(_)=>return respond(env,400,json!({"error":"Geçersiz istek."})) };
    match req.path().as_str() {
        "/drive/connect" => crate::drive_oauth::start(env,&cloud,&body).await,
        "/drive/session" => {
            let drive = Drive::connect(env,&cloud).await?;
            respond(env,200,json!({"ok":true,"token":drive.token,"assetsFolder":drive.assets,"backupFolder":drive.backups,"expiresIn":3000}))
        },
        "/drive/register" => match serde_json::from_value(body) { Ok(input)=>register(env,&cloud,input).await, Err(_)=>respond(env,400,json!({"error":"Geçersiz dosya kaydı."})) },
        "/drive/lookup" => {
            let hash = body["hash"].as_str().unwrap_or("");
            if !drive_policy::valid_hash(hash) { return respond(env,400,json!({"error":"Geçersiz dosya."})); }
            match cloud.document("lectureAssets",hash).await? {
                Some(file)=>respond(env,200,json!({"ok":true,"fileId":field(&file,"fileId"),"mimeType":field(&file,"mimeType")})),
                None=>respond(env,404,json!({"error":"Dosya bulunamadı."}))
            }
        },
        _=>respond(env,404,json!({"error":"Bulunamadı."}))
    }
}
