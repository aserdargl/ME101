use serde_json::{json, Value};
use worker::*;
use crate::{cloud::Cloud, github_app, instructor, publication::{Publication, MAX_BODY}};

async fn current(env: &Env) -> Result<Value> {
    let reference=github_app::object(env,"/git/ref/heads/main",Method::Get,None).await?;
    let head=reference["object"]["sha"].as_str().ok_or("Ortak kayıt bulunamadı.")?;
    let commit=github_app::object(env,&format!("/git/commits/{head}"),Method::Get,None).await?;
    Ok(json!({"head":head,"tree":commit["tree"]["sha"]}))
}

async fn read_current(env: &Env) -> Result<Value> {
    let mut result=current(env).await?;
    let test=env.var("FIREBASE_PROJECT")?.to_string()=="demo-lecturenotes";
    let base=if test {"http://127.0.0.1:4198/raw"} else {"https://raw.githubusercontent.com/aserdargl/ME101"};
    let mut response=Fetch::Url(Url::parse(&format!("{base}/{}/data/manifest.json",result["head"].as_str().unwrap_or("")))?).send().await?;
    result["manifest"]=match response.status_code() {
        200=>response.json::<Value>().await?,404=>Value::Null,
        _=>return Err(Error::RustError("Ortak ders kaydı okunamadı.".into()))
    };
    Ok(result)
}

async fn blob(env: &Env, content: &str) -> Result<Value> {
    github_app::object(env,"/git/blobs",Method::Post,Some(json!({"content":content,"encoding":"utf-8"}))).await
}

/// Always extends the latest source tree and uses a non-forced update, preserving published history.
async fn commit(env: &Env, publication: Publication) -> Result<(u16, Value)> {
    let current=current(env).await?;
    if current["head"]!=publication.head {return Ok((409,json!({"error":"Başka bir cihazdan yeni kayıt var. Yerel notlarınız korundu; yeniden Yayımla ile birleştirin."})));}
    let mut manifest=json!({"id":publication.id,"parts":publication.parts.len(),"digest":publication.digest,
        "savedAt":js_sys::Date::new_0().to_iso_string().as_string(),"lectureCount":publication.lecture_count});
    if publication.format==Some(2) {
        manifest["format"]=json!(2);manifest["partLength"]=json!(publication.part_length);
        manifest["hashes"]=json!(publication.hashes);manifest["blobs"]=json!(publication.parts);
        manifest["encodings"]=json!(publication.encodings);
    }
    let file=blob(env,&manifest.to_string()).await?;
    let entries=publication.entries(file["sha"].as_str().ok_or("Yayın dosyası oluşturulamadı.")?);
    let tree=github_app::object(env,"/git/trees",Method::Post,Some(json!({"base_tree":current["tree"],"tree":entries}))).await?;
    let commit=github_app::object(env,"/git/commits",Method::Post,Some(json!({"message":"Update published MEE 101 lecture notes",
        "tree":tree["sha"],"parents":[publication.head]}))).await?;
    let (status,_)=github_app::api(env,"/git/refs/heads/main",Method::Patch,Some(json!({"sha":commit["sha"],"force":false}))).await?;
    if [409,422].contains(&status) {return Ok((409,json!({"error":"GitHub’da daha yeni değişiklik var. Yerel notlarınız korundu; yeniden Yayımla ile birleştirin."})));}
    if status!=200 {return Err(Error::RustError("Yayın tamamlanamadı.".into()));}
    let mut result=manifest;result["commit"]=commit["sha"].clone();
    Ok((200,result))
}

async fn execute(req: &mut Request, env: &Env) -> Result<(u16, Value)> {
    let Some(token)=req.headers().get("Authorization")?.and_then(|value|value.strip_prefix("Bearer ").map(str::to_owned)) else {
        return Ok((401,json!({"error":"Öğretim üyesi girişi gerekli."})));
    };
    let cloud=Cloud::connect(env).await?;
    let Some(actor)=cloud.lookup(json!({"idToken":token}),None).await? else {return Ok((401,json!({"error":"Oturum geçersiz veya süresi dolmuş. Yeniden giriş yapın."})));};
    let uid=actor["localId"].as_str().unwrap_or("");
    let expected=env.var("FIREBASE_ADMIN_UID")?.to_string();
    if uid!=expected || !instructor::valid_admin(uid,&actor,cloud.document("admins",uid).await?.is_some()) {
        return Ok((403,json!({"error":"Yayımlama yalnızca yetkili öğretim üyesine açık."})));
    }
    if req.headers().get("Content-Length")?.and_then(|value|value.parse::<usize>().ok()).is_some_and(|size|size>MAX_BODY) {
        return Ok((413,json!({"error":"Yayın parçası çok büyük. Yerel kayıtlarınız korundu."})));
    }
    let text=req.text().await?;
    if text.len()>MAX_BODY {return Ok((413,json!({"error":"Yayın parçası çok büyük."})));}
    let body:Value=match serde_json::from_str(&text) {Ok(value)=>value,Err(_)=>return Ok((400,json!({"error":"Geçersiz yayın isteği."})))};
    match req.path().as_str() {
        "/publisher/session"=>{github_app::token(env).await?;Ok((200,json!({"ok":true})))},
        "/publisher/current"=>Ok((200,read_current(env).await?)),
        "/publisher/blob"=>match body["content"].as_str().filter(|value|value.chars().count()<=8*1024*1024) {
            Some(content)=>Ok((200,blob(env,content).await?)),None=>Ok((400,json!({"error":"Geçersiz yayın parçası."})))
        },
        "/publisher/commit"=>match serde_json::from_value::<Publication>(body) {
            Ok(value) if value.valid()=>commit(env,value).await,
            _=>Ok((400,json!({"error":"Geçersiz yayın kaydı."})))
        },
        _=>Ok((404,json!({"error":"Bulunamadı."})))
    }
}

pub async fn handle(req: &mut Request, env: &Env) -> (u16, Value) {
    if req.method()!=Method::Post {return (405,json!({"error":"Bu işlem desteklenmiyor."}));}
    execute(req,env).await.unwrap_or_else(|_|(503,json!({"error":"Yayın bağlantısı kurulamadı. Yerel notlarınız korundu; yeniden deneyin veya yayın uygulaması yapılandırmasını kontrol edin."})))
}
