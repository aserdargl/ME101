/* Synthetic accounts and GitHub endpoints; never contacts a live project. */
const http = require("node:http");
const fs = require("node:fs");
const { generateKeyPairSync, createHash } = require("node:crypto");
const authBase = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const storeBase = "http://127.0.0.1:8088/v1/projects/demo-lecturenotes/databases/(default)/documents";

async function writeDocument(path, fields) {
  const response = await fetch(`${storeBase}/${path}`, { method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
  if (!response.ok) throw Error(`Synthetic document failed: ${response.status}`);
}

async function setup() {
  const response = await fetch(`${authBase}/accounts:signUp?key=demo-key`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "instructor@example.test", password: "Synthetic-Only-Password123!", returnSecureToken: true }) });
  const account = await response.json();
  if (!response.ok && account.error?.message !== "EMAIL_EXISTS") throw Error("Synthetic account failed");
  const lookup = await fetch(`${authBase}/accounts:lookup?key=demo-key`, { method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ email: ["instructor@example.test"] }) });
  const uid = (await lookup.json()).users[0].localId;
  // Fixed UID mapping is set in the local Worker vars, never in the live project.
  const update = await fetch(`${authBase}/accounts:update?key=demo-key`, { method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ localId: uid, emailVerified: true }) });
  if (!update.ok) throw Error("Synthetic email verification failed");
  await writeDocument(`admins/${uid}`, { role: { stringValue: "owner" } });
  await writeDocument("studentNumbers/00123", { no: { stringValue: "00123" }, name: { stringValue: "Synthetic Student" }, nameKey: { stringValue: "synthetic student" }, enabled: { booleanValue: true } });
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  const secret = { project_id: "demo-lecturenotes", client_email: "synthetic@demo-lecturenotes.iam.gserviceaccount.com", private_key: privateKey };
  fs.writeFileSync("approval-worker/.dev.vars.test", `FIREBASE_ADMIN_UID=${JSON.stringify(uid)}\nFIREBASE_SERVICE_ACCOUNT=${JSON.stringify(secret)}\n`);
  const codes = new Map();
  const blobs = new Map(), trees = new Map(), commits = new Map();
  const sha = text => createHash("sha1").update(text).digest("hex");
  const initialTree = sha("initial tree"), initialCommit = sha("initial commit");
  let head = initialCommit;
  blobs.set(sha("source"), "Preserved source");
  trees.set(initialTree, { "index.html": sha("source") });
  commits.set(head, { tree: { sha: initialTree }, parents: [] });
  http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:4198");
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:4197");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type,X-GitHub-Api-Version");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const send = (data, status = 200) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    if (url.pathname === "/login/oauth/authorize") {
      const code = `fixture-${codes.size}`;
      codes.set(code, { challenge: url.searchParams.get("code_challenge"), identity: url.searchParams.get("fixture") || "owner" });
      const callback = new URL(url.searchParams.get("redirect_uri"));
      callback.searchParams.set("state", url.searchParams.get("state")); callback.searchParams.set("code", code);
      res.writeHead(302, { Location: callback.href }); return res.end();
    }
    if (url.pathname === "/login/oauth/access_token") {
      let body = ""; for await (const bytes of req) body += bytes;
      const data = JSON.parse(body);
      const challenge = createHash("sha256").update(data.code_verifier).digest("base64url");
      const proof = codes.get(data.code);
      if (proof?.challenge !== challenge || data.repository_id !== "1431606275") return send({ error: "invalid_grant" }, 400);
      codes.delete(data.code);
      return send({ access_token: proof.identity === "owner" ? "synthetic-github-token" : `synthetic-${proof.identity}` });
    }
    if (url.pathname.startsWith("/raw/")) {
      const [, , revision, ...parts] = url.pathname.split("/");
      const tree = trees.get(commits.get(revision)?.tree.sha);
      const text = blobs.get(tree?.[parts.join("/")]);
      if (text === undefined) return send({ error: "missing" }, 404);
      return res.end(text);
    }
    if (!["Bearer synthetic-github-token", "Bearer synthetic-installation-token", "Bearer synthetic-other", "Bearer synthetic-readonly"].includes(req.headers.authorization)) return send({ error: "unauthorized" }, 401);
    if (url.pathname === "/user") return send({ login: req.headers.authorization === "Bearer synthetic-other" ? "other" : "aserdargl", id: 34934960 });
    if (url.pathname === "/repos/aserdargl/ME101") return send({ permissions: { push: req.headers.authorization !== "Bearer synthetic-readonly" } });
    const path = url.pathname.replace("/repos/aserdargl/ME101", "");
    let body = ""; for await (const bytes of req) body += bytes;
    const data = body ? JSON.parse(body) : {};
    if (path === "/git/ref/heads/main") return send({ object: { sha: head } });
    if (path.startsWith("/git/commits/")) return send(commits.get(path.split("/").pop()));
    if (path === "/git/blobs") { const id = sha(data.content); blobs.set(id, data.content); return send({ sha: id }, 201); }
    if (path === "/git/trees") {
      const tree = { ...trees.get(data.base_tree) };
      for (const entry of data.tree) {
        if (entry.type === "tree") {
          for (const key of Object.keys(tree)) if (key === entry.path || key.startsWith(entry.path + "/")) delete tree[key];
          for (const [name, sha] of Object.entries(trees.get(entry.sha))) tree[entry.path + "/" + name] = sha;
        } else if (entry.sha === null) delete tree[entry.path];
        else tree[entry.path] = entry.sha;
      }
      const id = sha(JSON.stringify(tree)); trees.set(id, tree); return send({ sha: id }, 201);
    }
    if (path === "/git/commits") {
      const id = sha(body); commits.set(id, { tree: { sha: data.tree }, parents: data.parents }); return send({ sha: id }, 201);
    }
    if (path === "/git/refs/heads/main") {
      if (data.force !== false || commits.get(data.sha)?.parents[0] !== head) return send({ error: "non-fast-forward" }, 422);
      if (trees.get(commits.get(data.sha).tree.sha)["index.html"] !== sha("source")) return send({ error: "source changed" }, 422);
      head = data.sha; return send({ object: { sha: head } });
    }
    send({ error: "unimplemented synthetic endpoint" }, 404);
  }).listen(4198, "127.0.0.1", () => process.stdout.write("Synthetic instructor and GitHub fixtures ready\n"));
}
setup().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
