use serde_json::{json,Value};
use worker::*;
use crate::{cloud::{Cloud,field}, decisions, policy::{Decision,valid_uid}};

fn respond(status:u16, value:Value, origin:&str) -> Result<Response> {
    let headers=Headers::new();
    headers.set("Access-Control-Allow-Origin",origin)?;
    headers.set("Access-Control-Allow-Methods","POST, GET, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers","Authorization, Content-Type")?;
    headers.set("Cache-Control","no-store")?;
    headers.set("Content-Type","application/json; charset=utf-8")?;
    headers.set("Vary","Origin")?;
    let response=if status==204 {Response::empty()?} else {Response::from_json(&value)?};
    Ok(response.with_status(status).with_headers(headers))
}

#[event(fetch)]
pub async fn main(mut req:Request, env:Env, _ctx:Context) -> Result<Response> {
    if req.path().starts_with("/github/") { return crate::github_oauth::handle(&req,&env).await; }
    let origin=env.var("ALLOWED_ORIGIN")?.to_string();
    if req.path()=="/health" && req.method()==Method::Get {
        return respond(200,json!({"ok":true,"service":"lecturenotes-approval"}),&origin);
    }
    if req.headers().get("Origin")?.as_deref()!=Some(origin.as_str()) {
        return Response::error("Forbidden",403);
    }
    if req.method()==Method::Options { return respond(204,Value::Null,&origin); }
    if req.path()!="/review" || req.method()!=Method::Post { return respond(404,json!({"error":"Bulunamadı."}),&origin); }
    let Some(authorization)=req.headers().get("Authorization")? else { return respond(401,json!({"error":"Yönetici girişi gerekli."}),&origin); };
    let Some(token)=authorization.strip_prefix("Bearer ") else { return respond(401,json!({"error":"Geçersiz oturum."}),&origin); };
    if req.headers().get("Content-Length")?.and_then(|value|value.parse::<usize>().ok()).is_some_and(|size|size>4096) {
        return respond(413,json!({"error":"İstek çok büyük."}),&origin);
    }
    let body=req.text().await?;
    if body.len()>4096 { return respond(413,json!({"error":"İstek çok büyük."}),&origin); }
    let decision:Decision=match serde_json::from_str(&body) {Ok(value)=>value,Err(_)=>return respond(400,json!({"error":"Geçersiz istek."}),&origin)};
    if !valid_uid(&decision.uid) { return respond(400,json!({"error":"Geçersiz kullanıcı."}),&origin); }
    match execute(&env,token,decision).await {
        Ok((status,value))=>respond(status,value,&origin),
        Err(_)=>respond(503,json!({"error":"İşlem tamamlanamadı. Erişim durumu panelden kontrol edilerek yeniden denenebilir."}),&origin)
    }
}

async fn execute(env:&Env, token:&str, decision:Decision)->Result<(u16,Value)> {
    let cloud=Cloud::connect(env).await?;
    let Some(actor)=cloud.lookup(json!({"idToken":token}),None).await? else {return Ok((401,json!({"error":"Oturum geçersiz veya süresi dolmuş."})));};
    let uid=actor["localId"].as_str().unwrap_or("");
    if actor["emailVerified"]!=true || actor["disabled"]==true || !valid_uid(uid)
        || cloud.document("admins",uid).await?.is_none() {
        return Ok((403,json!({"error":"Bu işlem yalnızca yetkili yöneticiye açık."})));
    }
    decisions::review(&cloud,uid,decision).await
}

#[event(scheduled)]
pub async fn scheduled(_event:ScheduledEvent,env:Env,_ctx:ScheduleContext) {
    let Ok(cloud)=Cloud::connect(&env).await else {return;};
    let Ok(jobs)=cloud.deletion_jobs().await else {return;};
    for job in jobs {
        let uid=job["name"].as_str().unwrap_or("").rsplit('/').next().unwrap_or("");
        if valid_uid(uid) && field(&job,"status")=="rejected" {let _=decisions::finish_deletion(&cloud,uid).await;}
    }
}
