const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { fixture, mathFixture } = require("./pptx-fixture.cjs");
const root = path.resolve(__dirname, "..");
const port = Number(process.env.MEE101_QA_PORT || 4189);
const instructorFixture = process.env.MEE101_QA_INSTRUCTOR === "1";
const baselineApp = process.env.MEE101_QA_BASELINE === "1"
  ? require("node:child_process").execFileSync("git", ["show", "HEAD:app.js"], { cwd: root }) : null;
const original = [{ id: "qa-original", week: "5. Hafta", title: "Korunacak Özgün Notlar", description: "Mevcut özel not ve görsel verileri.", custom: { keep: true }, slides: [{ kicker: "5. HAFTA", title: "Özel açıklama", defaultViewMode: "web", pptSummaryBullets: ["Kendi eklediğim madde"], html: '<p class="lead">Benim özgün açıklamam</p><p data-user-note="keep">Bu not silinmemeli.</p>' }] }];
const seed = `<script>window.MEE101_GITHUB_ENABLED=${instructorFixture ? "true" : "false"};if(!localStorage.getItem('qa-seeded')){localStorage.setItem('me101_all_lectures_v2',${JSON.stringify(JSON.stringify(original))});localStorage.setItem('mee101_preferred_view_mode_v1','ppt');localStorage.setItem('qa-seeded','true');}sessionStorage.setItem('me101_instructor_unlocked','true');</script>`;
const harness = `<script>
document.addEventListener('DOMContentLoaded', () => {
const testButton=document.createElement('button');testButton.id='qa-import';testButton.textContent="Örnek PPTX'i Seç";testButton.style='position:fixed;bottom:12px;left:12px;z-index:700;padding:12px';document.body.appendChild(testButton);
testButton.onclick=async()=>{const bytes=await(await fetch('/fixture.pptx')).arrayBuffer();handlePptxFileChosen(new File([bytes],'Orijinal-Gorselli-Deney.pptx',{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}));openPptxModal('tab-add-manual');};
const repairButton=document.createElement('button');repairButton.textContent='Örnek Dosyayla Görselleri Onar';repairButton.style='position:fixed;bottom:12px;left:190px;z-index:700;padding:12px';document.body.appendChild(repairButton);
repairButton.onclick=async()=>{const bytes=await(await fetch('/fixture.pptx')).arrayBuffer();const transfer=new DataTransfer();transfer.items.add(new File([bytes],'Orijinal-Gorselli-Deney.pptx',{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}));const input=document.getElementById('inp-edit-pptx-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));};
const proof=document.createElement('output');proof.id='qa-proof';proof.className='visually-hidden';document.body.appendChild(proof);
setInterval(()=>{const saved=LECTURES.find(lecture=>lecture.id==='qa-original');const imported=LECTURES.find(lecture=>lecture.id.startsWith('custom-'));proof.textContent=JSON.stringify({originalPreserved:JSON.stringify(saved)===${JSON.stringify(JSON.stringify(original[0]))},lectureCount:LECTURES.length,importedImages:imported?.slides.map(slide=>slide.extractedImages.length),temporaryMedia:imported?JSON.stringify(imported).includes('blob:'):false,width:innerWidth,scrollWidth:document.documentElement.scrollWidth});},150);
});
</script>`;

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (url.pathname === "/math-fixture.pptx") { res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation"); return res.end(await mathFixture()); }
  res.setHeader("Cache-Control", "no-store");
  if (url.pathname === "/firebase-config.js") {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    if (instructorFixture) return res.end('window.MEE101_FIREBASE_EMULATORS=true;window.MEE101_APPROVAL_URL="http://127.0.0.1:8797/";window.MEE101_FIREBASE_CONFIG={apiKey:"demo-key",projectId:"demo-lecturenotes",authDomain:"demo-lecturenotes.firebaseapp.com",appId:"1:123:web:demo"};');
    return res.end(process.env.MEE101_QA_FIREBASE === "1"
      ? 'window.MEE101_FIREBASE_EMULATORS=true;window.MEE101_APPROVAL_URL="http://127.0.0.1:8787/";window.MEE101_FIREBASE_CONFIG={apiKey:"demo-key",projectId:"demo-lecturenotes",authDomain:"demo-lecturenotes.firebaseapp.com",appId:"1:123:web:demo"};'
      : 'window.MEE101_FIREBASE_CONFIG=null;');
  }
  if (instructorFixture && url.pathname.startsWith("/data/")) { res.writeHead(404); return res.end(); }
  if (url.pathname === "/portal-startup.js") {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    let bundle = fs.readFileSync(path.join(root, "portal-startup.js"), "utf8");
    if (instructorFixture) bundle = bundle.replaceAll("https://api.github.com", "http://127.0.0.1:4198")
      .replace("https://raw.githubusercontent.com/${this.owner}/${this.repository}", "http://127.0.0.1:4198/raw");
    if (baselineApp) bundle = bundle.slice(0, bundle.indexOf("\n/* app.js */\n")) + "\n/* app.js */\n" + baselineApp + "\n;\n";
    return res.end(bundle);
  }
  if (instructorFixture && url.pathname === "/github-repository.js") {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    return res.end(fs.readFileSync(path.join(root, "github-repository.js"), "utf8").replaceAll("https://api.github.com", "http://127.0.0.1:4198"));
  }
  if (baselineApp && url.pathname === "/app.js") { res.setHeader("Content-Type", "text/javascript; charset=utf-8"); return res.end(baselineApp); }
  if (url.pathname === "/fixture.pptx") { res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation"); return res.end(await fixture()); }
  const filename = path.resolve(root, "." + (url.pathname === "/qa" || url.pathname === "/qa-roster" || url.pathname === "/" ? "/index.html" : url.pathname));
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(filename, (error, bytes) => {
    if (error) { res.writeHead(404); return res.end(); }
    const types = { ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8" };
    res.setHeader("Content-Type", types[path.extname(filename)] || "application/octet-stream");
    res.end(["/qa", "/qa-roster"].includes(url.pathname) ? bytes.toString().replace("<head>", "<head>" + seed).replace("</body>", harness + '<script src="/tests/ui-regression.js"></script>' + (url.pathname === '/qa-roster' ? '<script src="/tests/registered-roster-qa.js"></script>' : '') + '</body>') : bytes);
  });
}).listen(port, "127.0.0.1", () => process.stdout.write(`Isolated preview: http://127.0.0.1:${port}/qa\n`));
