const { test } = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { GitHubOAuthClient } = require("../github-oauth-client.js");

function browserFixture(blocked = false) {
  const listeners = new Map(), timers = new Map(); let next = 0, opened;
  const popup = { closed: false, close() { this.closed = true; } };
  const browser = {
    location: { hostname: "aserdargl.github.io" },
    open(url) { opened = new URL(url); return blocked ? null : popup; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    setInterval(callback) { const id = ++next; timers.set(id, callback); return id; },
    setTimeout(callback) { const id = ++next; timers.set(id, callback); return id; },
    clearInterval(id) { timers.delete(id); }, clearTimeout(id) { timers.delete(id); }
  };
  const client = new GitHubOAuthClient({ serverUrl: "https://server.example/", window: browser, crypto: webcrypto });
  const message = overrides => listeners.get("message")?.({ origin: "https://server.example", source: popup,
    data: { type: "lecturenotes-github", requestId: opened.searchParams.get("request_id"), token: "ghu_synthetic" }, ...overrides });
  return { client, message, popup, listeners, timers, browser, requestId: () => opened.searchParams.get("request_id") };
}

test("OAuth ignores forged origins, other windows and stale requests before accepting its own popup", async () => {
  const fixture = browserFixture(); const login = fixture.client.login();
  fixture.message({ origin: "https://attacker.example" });
  fixture.message({ source: {} });
  fixture.message({ data: { type: "lecturenotes-github", requestId: "wrong", token: "ghu_attacker" } });
  assert.equal(fixture.client.pending, true);
  fixture.message(); assert.equal(await login, "ghu_synthetic");
  assert.equal(fixture.listeners.size, 0); assert.equal(fixture.timers.size, 0);
});

test("cancelled and blocked login leave no persistent token or active listeners", async () => {
  const fixture = browserFixture(); const login = fixture.client.login();
  fixture.popup.closed = true; [...fixture.timers.values()][0]();
  await assert.rejects(login, /tamamlanmadı/); assert.equal(fixture.client.pending, false);
  assert.equal(fixture.listeners.size, 0); assert.equal(fixture.timers.size, 0);
  await assert.rejects(browserFixture(true).client.login(), /engellendi/);
});

test("GitHub errors are returned without accepting an invalid token", async () => {
  const fixture = browserFixture(); const login = fixture.client.login();
  fixture.message({ data: { type: "lecturenotes-github", requestId: fixture.requestId(), error: "Giriş iptal edildi." } });
  await assert.rejects(login, /Giriş iptal edildi/);
  assert.equal(fixture.listeners.size, 0);
});
