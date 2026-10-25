/** Compares complete login UI on localhost with synthetic accounts and timed SDKs. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const baseline = new Map(['index.html', 'portal-startup.js'].map(file =>
  [file, execFileSync('git', ['show', `${process.env.LOGIN_BASELINE_REF || 'c9f455c'}:${file}`], { cwd: root })]));
const authSdk = `
const auth = {currentUser:null, authStateReady:async()=>{}};
let listener=()=>{};
export const getAuth=()=>auth, setPersistence=async()=>{}, browserSessionPersistence={};
export function onAuthStateChanged(_, callback){listener=callback;callback(null);}
export async function signInWithEmailAndPassword(){
  await new Promise(r=>setTimeout(r,100));
  const user={uid:'qa-admin',email:'qa@example.test',emailVerified:true,getIdToken:async()=>'synthetic-token'};
  auth.currentUser=user;listener(user);return {user};
}
export async function signOut(){auth.currentUser=null;listener(null);}
`;
const dbSdk = `
export const initializeFirestore=()=>({}), memoryLocalCache=()=>({});
export const doc=(_,collection,id)=>collection+'/'+id, collection=(_,name)=>name;
export async function getDocFromServer(reference){
  window.qaLogin.roleReads++;
  await new Promise(r=>setTimeout(r,250));
  return {exists:()=>reference==='admins/qa-admin'};
}
export function onSnapshot(reference,options,next){
  window.qaLogin.listeners++;
  const timer=setTimeout(()=>next({metadata:{fromCache:false},docs:[]}),500);
  return ()=>clearTimeout(timer);
}
`;

async function main() {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    try {
      let body = url.searchParams.has('before') && baseline.has(name) ? baseline.get(name) : await fs.readFile(file);
      if (name === 'index.html' && url.searchParams.has('before')) body = body.toString().replace(/portal-startup.js\?v=[^"\s]+/, 'portal-startup.js?before=1');
      if (name === 'portal-startup.js') await delay(250);
      response.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(name)] || 'application/octet-stream');
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const before of [true, false]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'www.gstatic.com') {
          await delay(500);
          const body = url.pathname.endsWith('/firebase-app.js') ? 'export const initializeApp=()=>({});'
            : url.pathname.endsWith('/firebase-auth.js') ? authSdk : dbSdk;
          return route.fulfill({ contentType: 'text/javascript', headers: {'Access-Control-Allow-Origin':'*'}, body });
        }
        if (url.origin !== origin) return route.abort();
        if (url.pathname === '/publisher/session') {
          await delay(150);
          return route.fulfill({ json: {ok:true} });
        }
        if (url.pathname === '/firebase-config.js') return route.fulfill({ contentType: 'text/javascript',
          body: `window.MEE101_FIREBASE_CONFIG={projectId:'synthetic'};window.MEE101_APPROVAL_URL='${origin}/';window.MEE101_GITHUB_ENABLED=false;` });
        return route.continue();
      });
      await page.addInitScript(() => {
        window.qaLogin = {roleReads:0,listeners:0};
        const note = [{id:'qa-preserve',week:'1',title:'Keep notes',description:'Preserve',slides:[{title:'Keep',html:'<p>Original note</p>'}]}];
        localStorage.setItem('me101_all_lectures_v2', JSON.stringify(note));
        localStorage.setItem('qa-settings', 'preserved');
      });
      await page.goto(origin + (before ? '/?before=1' : '/'), { waitUntil: 'domcontentloaded' });
      await page.locator('#btn-admin-toggle').click();
      await page.locator('#inp-instructor-email').fill('qa@example.test');
      await page.locator('#inp-instructor-password').fill('Synthetic-only-123!');
      const start = Date.now();
      await page.locator('#btn-submit-admin-login').click();
      await page.waitForFunction(() => isAdminAuthenticated && document.getElementById('admin-login-backdrop').classList.contains('hidden'));
      const result = await page.evaluate(() => ({...qaLogin, readyMs:Math.round(performance.now()),
        notes:JSON.parse(localStorage.getItem('me101_all_lectures_v2'))[0].slides[0].html,
        settings:localStorage.getItem('qa-settings')}));
      result.submitMs = Date.now() - start;
      console.info(JSON.stringify({version:before?'before':'after',...result}));
      if (!before) { assert.equal(result.roleReads, 1); assert.equal(result.listeners, 3); }
      assert.equal(result.notes, '<p>Original note</p>');
      assert.equal(result.settings, 'preserved');
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
