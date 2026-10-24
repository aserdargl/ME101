/* Requires only demo emulators and the local synthetic GitHub fixture. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const worker = "http://127.0.0.1:8797";
const store = "http://127.0.0.1:8088/v1/projects/demo-lecturenotes/databases/(default)/documents";

test("Rust OAuth bridge authenticates both services without changing existing roster data", async () => {
  const read = async () => (await fetch(`${store}/studentNumbers/00123`, { headers: { Authorization: "Bearer owner" } })).json();
  const before = await read();
  const start = await fetch(`${worker}/github/start?request_id=${"a".repeat(64)}`, { redirect: "manual" });
  assert.equal(start.status, 302);
  assert.equal(start.headers.get("cache-control"), "no-store");
  const cookie = start.headers.get("set-cookie").split(";")[0];
  const authorize = await fetch(start.headers.get("location"), { redirect: "manual" });
  const callback = await fetch(authorize.headers.get("location"), { headers: { Cookie: cookie } });
  const html = await callback.text();
  assert.equal(callback.status, 200);
  assert.match(callback.headers.get("content-security-policy"), /default-src 'none'/);
  const credentials = JSON.parse(html.match(/postMessage\((\{.*?\}),/s)[1]);
  assert.equal(credentials.requestId, "a".repeat(64));
  assert.equal(credentials.token, "synthetic-github-token");
  assert.ok(credentials.firebaseToken, credentials.error);
  const auth = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-key", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: credentials.firebaseToken, returnSecureToken: true })
  });
  const user = await auth.json();
  assert.equal(auth.status, 200, JSON.stringify(user.error));
  assert.equal(user.isNewUser, false);
  const uid = JSON.parse(Buffer.from(user.idToken.split(".")[1], "base64url")).sub;
  const admin = await fetch(`${store}/admins/${uid}`, { headers: { Authorization: "Bearer owner" } });
  assert.equal(admin.status, 200);
  assert.deepEqual(await read(), before);
});

test("missing state or browser cookie cannot return either credential", async () => {
  for (const suffix of ["/github/start?request_id=bad", "/github/callback?code=forged&state=" + "b".repeat(64)]) {
    const response = await fetch(worker + suffix);
    const text = await response.text();
    assert.equal(text.includes('"firebaseToken"'), false);
    assert.equal(text.includes('"token"'), false);
  }
});

test("other GitHub accounts and read-only repositories receive neither credential", async () => {
  for (const identity of ["other", "readonly"]) {
    const start = await fetch(`${worker}/github/start?request_id=${"c".repeat(64)}`, { redirect: "manual" });
    const authorizeUrl = new URL(start.headers.get("location"));
    authorizeUrl.searchParams.set("fixture", identity);
    const authorize = await fetch(authorizeUrl, { redirect: "manual" });
    const callback = await fetch(authorize.headers.get("location"), { headers: { Cookie: start.headers.get("set-cookie").split(";")[0] } });
    const html = await callback.text();
    assert.equal(html.includes('"firebaseToken"'), false);
    assert.equal(html.includes('"token"'), false);
    assert.match(html, /GitHub girişi tamamlanamadı/);
  }
});
