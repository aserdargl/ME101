/* Requires demo Firebase emulators, instructor-fixtures.cjs and the local Rust Worker. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash, randomUUID } = require("node:crypto");
const base = "http://127.0.0.1:8797";
const origin = "http://127.0.0.1:4197";
const store = "http://127.0.0.1:8088/v1/projects/demo-lecturenotes/databases/(default)/documents";

async function login(email = "instructor@example.test", password = "Synthetic-Only-Password123!") {
  const response = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const account = await response.json(); assert.equal(response.status, 200);
  return account;
}
async function call(operation, token, body = {}, from = origin) {
  const response = await fetch(`${base}/publisher/${operation}`, { method: "POST",
    headers: { Origin: from, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body) });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = { error: text }; }
  return { status: response.status, data, headers: response.headers };
}

test("password session publishes atomically, rejects stale updates, preserves roster and leaks no GitHub key", async () => {
  const { idToken } = await login();
  const roster = () => fetch(`${store}/studentNumbers/00123`, { headers: { Authorization: "Bearer owner" } }).then(response => response.json());
  const before = await roster();
  const session = await call("session", idToken);
  assert.deepEqual(session.data, { ok: true }); assert.equal(session.headers.get("cache-control"), "no-store");
  const current = await call("current", idToken);
  assert.equal(current.status, 200);
  const text = JSON.stringify([{ id: "synthetic-only", week: "3. Hafta", title: "Sentetik uzak ders", description: "QA",
    slides: [{ title: "Sentetik slayt", html: "Özgün açıklama 😀", custom: "kept" }] }]);
  const blob = await call("blob", idToken, { content: text }); assert.equal(blob.status, 200);
  const body = { head: current.data.head, id: randomUUID(), parts: [blob.data.sha],
    digest: createHash("sha256").update(text).digest("hex"), lectureCount: 1 };
  const saved = await call("commit", idToken, body); assert.equal(saved.status, 200, JSON.stringify(saved.data));
  assert.equal(saved.data.digest, body.digest);
  const latest = await call("current", idToken); assert.equal(latest.data.manifest.id, body.id);
  const raw = await fetch(`http://127.0.0.1:4198/raw/${latest.data.head}/data/snapshots/${body.id}/0.txt`);
  assert.equal(await raw.text(), text);
  assert.equal((await call("commit", idToken, body)).status, 409);
  assert.equal((await call("commit", idToken, { ...body, id: "../index.html" })).status, 400);
  assert.deepEqual(await roster(), before);
  assert.equal(JSON.stringify([session.data, saved.data, latest.data]).includes("synthetic-installation-token"), false);
});

test("missing, forged, wrong-origin and revoked administrator sessions cannot publish", async () => {
  assert.equal((await call("session", null)).status, 401);
  assert.equal((await call("session", "forged")).status, 401);
  const account = await login();
  assert.equal((await call("session", account.idToken, {}, "https://untrusted.example")).status, 403);
  const path = `${store}/admins/${account.localId}`;
  const original = await (await fetch(path, { headers: { Authorization: "Bearer owner" } })).json();
  await fetch(path, { method: "DELETE", headers: { Authorization: "Bearer owner" } });
  try { assert.equal((await call("session", account.idToken)).status, 403); }
  finally {
    await fetch(path, { method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ fields: original.fields }) });
  }
});
