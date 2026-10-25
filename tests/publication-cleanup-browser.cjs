/** Publishes synthetic deletions on localhost; every external account and GitHub request is intercepted. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { fakeGitHub } = require('./github-fixture.cjs');
const { GitHubLectureRepository } = require('../github-repository.js');
const root = path.resolve(__dirname, '..');
const original = ['removed', 'kept'].map(id => ({ id, week:'1. Hafta', title:id, description:'Synthetic only', slides:[{title:id,html:'<p>Keep this note</p>'}] }));

async function run() {
 const github = fakeGitHub();
 const reader = new GitHubLectureRepository({owner:'aserdargl',repository:'ME101',crypto:webcrypto,fetch:github.fetch,baseUrl:'https://aserdargl.github.io/ME101/'});
 await reader.login('synthetic');
 const first = await reader.publish(original, await reader.readCurrent());
 const server = http.createServer(async (request, response) => {
  const name = new URL(request.url,'http://localhost').pathname.slice(1) || 'index.html';
  if (name === 'firebase-config.js') {response.setHeader('Content-Type','text/javascript');return response.end('window.MEE101_FIREBASE_CONFIG=null;');}
  const file = path.resolve(root,name);
  if (!file.startsWith(root+path.sep)) return response.writeHead(403).end();
  try {response.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(name)]||'application/octet-stream');response.end(await fs.readFile(file));} catch {response.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin = `http://127.0.0.1:${server.address().port}`;
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage();
  page.on('dialog',dialog=>dialog.accept());
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.hostname==='api.github.com'||url.pathname.startsWith('/data/')){
    const target=url.pathname.startsWith('/data/')?'https://aserdargl.github.io/ME101'+url.pathname:url.href;
    const result=await github.fetch(target,{method:request.method(),body:request.postData(),headers:request.headers()});
    return route.fulfill({status:result.status,body:await result.text(),headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin}});
   }
   return url.origin===origin?route.continue():route.abort();
  });
  await page.addInitScript(original=>{
   localStorage.setItem('me101_all_lectures_v2',JSON.stringify(original));
   localStorage.setItem('qa-settings','keep');
   Object.defineProperty(window,'InstructorLectureRepository',{
    get:()=>class extends window.GitHubLectureRepository {
     constructor(options){super({...options,baseUrl:location.origin+'/'});}
     login(){return super.login('synthetic');}
    },set(){}
   });
  },original);
  await page.goto(origin);
  await page.waitForFunction(()=>document.querySelectorAll('.btn-read').length===2);
  await page.waitForFunction(()=>document.getElementById('cloud-status-text').textContent.includes('GitHub'));
  await page.evaluate(async()=>{await LecturePublishing.login();isAdminAuthenticated=true;renderCatalog();});
  await page.locator('[data-del-lec="removed"]').click();
  await page.evaluate(()=>{LECTURES.push({id:'new',week:'2. Hafta',title:'New',description:'Synthetic only',slides:[{title:'New',html:'<p>New note</p>'}]});saveAllLecturesToStorage();renderCatalog();});
  await page.locator('#btn-cloud-publish').click();
  await page.waitForFunction(()=>!document.getElementById('btn-cloud-publish').disabled);
  const result = await reader.readPublished();
  assert.deepEqual(result.lectures.map(lecture=>lecture.id),['kept','new']);
  assert.equal(result.lectures[0].slides[0].html,'<p>Keep this note</p>');
  const tree=github.trees.get(github.commits.get(github.state.head).tree.sha);
  assert.equal(tree.has(`data/snapshots/${first.id}/0.txt`),false);
  assert.equal(github.blobs.get(tree.get('index.html')),'<h1>Mevcut site</h1>');
  assert.equal(await page.evaluate(()=>localStorage.getItem('qa-settings')),'keep');
  assert.deepEqual(errors,[]);
  console.info('Browser publication passed: deleted lesson stays removed, new lesson appears, retained notes and settings survive, obsolete snapshot paths removed, source preserved.');
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
