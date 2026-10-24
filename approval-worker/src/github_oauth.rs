use serde_json::{json, Value};
use wasm_bindgen::prelude::*;
use worker::*;
use crate::github_flow;

const CALLBACK: &str = "https://lecturenotes-approval.aserdargl.workers.dev/github/callback";

#[wasm_bindgen(inline_js = r#"
export async function githubProof() {
  const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
  const verifier = random();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return JSON.stringify({state:random(),verifier,challenge});
}
"#)]
extern "C" {
    #[wasm_bindgen(catch, js_name = githubProof)]
    async fn github_proof() -> std::result::Result<JsValue, JsValue>;
}

fn is_test(env: &Env) -> bool {
    env.var("FIREBASE_PROJECT").map(|v| v.to_string()=="demo-lecturenotes").unwrap_or(false)
        && env.var("EMULATOR").map(|v| v.to_string()=="true").unwrap_or(false)
}

async fn proof() -> Result<Value> {
    let value = github_proof().await.map_err(|_| Error::RustError("Giriş hazırlanamadı.".into()))?;
    Ok(serde_json::from_str(&value.as_string().ok_or("Giriş hazırlanamadı.")?)?)
}

fn secure_headers() -> Result<Headers> {
    let headers=Headers::new();
    headers.set("Cache-Control","no-store")?;
    headers.set("Referrer-Policy","no-referrer")?;
    headers.set("X-Content-Type-Options","nosniff")?;
    Ok(headers)
}

async fn start(req: &Request, env: &Env) -> Result<Response> {
    let id=req.url()?.query_pairs().find(|(key,_)| key=="request_id").map(|(_,value)|value.into_owned()).unwrap_or_default();
    if !github_flow::valid_nonce(&id) { return Response::error("Geçersiz giriş isteği.",400); }
    let client=env.var("GITHUB_CLIENT_ID")?.to_string();
    let proof=proof().await?;
    let state=proof["state"].as_str().ok_or("Giriş hazırlanamadı.")?;
    let verifier=proof["verifier"].as_str().ok_or("Giriş hazırlanamadı.")?;
    let mut target=Url::parse(if is_test(env) {"http://127.0.0.1:4198/login/oauth/authorize"} else {"https://github.com/login/oauth/authorize"})?;
    let callback=if is_test(env) {"http://127.0.0.1:8797/github/callback"} else {CALLBACK};
    target.query_pairs_mut().append_pair("client_id",&client).append_pair("redirect_uri",callback)
        .append_pair("state",state).append_pair("code_challenge",proof["challenge"].as_str().unwrap_or_default())
        .append_pair("code_challenge_method","S256").append_pair("login","aserdargl").append_pair("allow_signup","false");
    let headers=secure_headers()?;
    headers.set("Location",target.as_str())?;
    headers.set("Set-Cookie",&github_flow::login_cookie(state,verifier,&id))?;
    Ok(Response::empty()?.with_status(302).with_headers(headers))
}

async fn github_request(url: &str, body: Option<Value>, token: Option<&str>) -> Result<(u16,Value)> {
    let headers=Headers::new(); headers.set("Accept","application/json")?;
    headers.set("User-Agent","LectureNotes-Publisher")?;
    headers.set("X-GitHub-Api-Version","2022-11-28")?;
    if let Some(token)=token {headers.set("Authorization",&format!("Bearer {token}"))?;}
    let mut init=RequestInit::new(); init.with_headers(headers.clone());
    if let Some(body)=body {
        headers.set("Content-Type","application/json")?;
        init.with_method(Method::Post).with_headers(headers).with_body(Some(JsValue::from_str(&body.to_string())));
    }
    let mut response=Fetch::Request(Request::new_with_init(url,&init)?).send().await?;
    Ok((response.status_code(),response.json::<Value>().await.unwrap_or(Value::Null)))
}

async fn exchange(env: &Env, code: &str, verifier: &str) -> Result<String> {
    let test=is_test(env);
    let secret=if test {"synthetic-only".into()} else {env.secret("GITHUB_CLIENT_SECRET")?.to_string()};
    let callback=if test {"http://127.0.0.1:8797/github/callback"} else {CALLBACK};
    let login=if test {"http://127.0.0.1:4198"} else {"https://github.com"};
    let api=if test {"http://127.0.0.1:4198"} else {"https://api.github.com"};
    let (status,data)=github_request(&format!("{login}/login/oauth/access_token"),Some(json!({
        "client_id":env.var("GITHUB_CLIENT_ID")?.to_string(),"client_secret":secret,"code":code,
        "redirect_uri":callback,"code_verifier":verifier,"repository_id":"1431606275"
    })),None).await?;
    let token=data["access_token"].as_str().filter(|token| !token.is_empty() && token.len()<512).ok_or("GitHub girişi tamamlanamadı.")?;
    if status!=200 {return Err(Error::RustError("GitHub girişi tamamlanamadı.".into()));}
    let (status,user)=github_request(&format!("{api}/user"),None,Some(token)).await?;
    if status!=200 || user["login"].as_str().map(|v|v.eq_ignore_ascii_case("aserdargl"))!=Some(true)
        || (!test && user["id"] != 34934960_u64) {
        return Err(Error::RustError("Yalnızca depo sahibi giriş yapabilir.".into()));
    }
    let (status,repository)=github_request(&format!("{api}/repos/aserdargl/ME101"),None,Some(token)).await?;
    if status!=200 || repository["permissions"]["push"]!=true {return Err(Error::RustError("ME101 yazma izni gerekli.".into()));}
    Ok(token.into())
}

async fn callback(req: &Request, env: &Env) -> Result<Response> {
    let query: std::collections::HashMap<_,_>=req.url()?.query_pairs().map(|(k,v)|(k.into_owned(),v.into_owned())).collect();
    let cookie=req.headers().get("Cookie")?.unwrap_or_default();
    let Some((verifier,id))=github_flow::cookie_proof(&cookie,query.get("state").map(String::as_str).unwrap_or("")) else {
        return finish(env,json!({"type":"lecturenotes-github","error":"Giriş doğrulanamadı. Siteye dönüp yeniden deneyiniz."})).await;
    };
    let result=if let Some(code)=query.get("code").filter(|code|code.len()<=512) {exchange(env,code,&verifier).await} else {Err(Error::RustError("Giriş iptal edildi.".into()))};
    let data=match result {
        Ok(token)=>match crate::instructor::token(env).await {
            Ok(firebase_token)=>json!({"type":"lecturenotes-github","requestId":id,"token":token,"firebaseToken":firebase_token}),
            Err(_)=>json!({"type":"lecturenotes-github","requestId":id,"error":"Öğretim üyesi hesabı doğrulanamadı. Mevcut yönetici yapılandırmasını kontrol ediniz."})
        },
        Err(_)=>json!({"type":"lecturenotes-github","requestId":id,"error":"GitHub girişi tamamlanamadı. ME101 uygulama iznini ve hesabınızı kontrol ediniz."})
    };
    finish(env,data).await
}

async fn finish(env: &Env, data: Value) -> Result<Response> {
    let nonce=proof().await?["state"].as_str().ok_or("Giriş hazırlanamadı.")?.to_string();
    let target=serde_json::to_string(&env.var("ALLOWED_ORIGIN")?.to_string())?;
    let data=data.to_string().replace('<',"\\u003c");
    let html=format!("<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\"><title>LectureNotes · Öğretim Üyesi Girişi</title><p>Giriş sonucu ders portalına iletiliyor. Bu pencereyi kapatabilirsiniz.</p><script nonce=\"{nonce}\">if(window.opener){{window.opener.postMessage({data},{target});window.close();}}</script></html>");
    let headers=secure_headers()?;
    headers.set("Content-Security-Policy",&format!("default-src 'none'; script-src 'nonce-{nonce}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"))?;
    headers.set("Content-Type","text/html; charset=utf-8")?;
    headers.set("Set-Cookie",&github_flow::clear_cookie())?;
    Ok(Response::from_html(html)?.with_headers(headers))
}

/// Fixed login endpoints only; publication still goes directly to GitHub.
pub async fn handle(req: &Request, env: &Env) -> Result<Response> {
    if req.method()!=Method::Get {return Response::error("Method not allowed",405);}
    let result=if req.path()=="/github/start" {start(req,env).await} else if req.path()=="/github/callback" {callback(req,env).await} else {return Response::error("Not found",404);};
    match result {Ok(response)=>Ok(response),Err(_)=>Response::error("GitHub girişi şu anda hazırlanamadı. Yeniden deneyiniz.",503)}
}
