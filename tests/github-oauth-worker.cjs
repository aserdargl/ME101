/* Runs solely against wrangler --env test; no requests go to real GitHub. */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createHash } = require("node:crypto");
const worker = "http://127.0.0.1:8787";
const fixture = { challenge: "", calls: 0 };
let server;

before(async () => {
  server = http.createServer(async (req, res) => {
    fixture.calls++;
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/login/oauth/access_token") {
      let body = ""; for await (const chunk of req) body += chunk;
      const data = JSON.parse(body);
      assert.equal(data.client_secret, "synthetic-only");
      assert.equal(data.repository_id, "1431606275");
      assert.equal(createHash("sha256").update(data.code_verifier).digest("base64url"), fixture.challenge);
      return res.end(JSON.stringify({ access_token: `ghu_${data.code}` }));
    }
    if (req.url === "/user") return res.end(JSON.stringify({ login: req.headers.authorization === "Bearer ghu_other" ? "someone-else" : "aserdargl" }));
    if (req.url === "/repos/aserdargl/ME101") return res.end(JSON.stringify({ permissions: { push: req.headers.authorization !== "Bearer ghu_readonly" } }));
    res.writeHead(404); res.end("{}");
  });
  await new Promise(resolve => server.listen(4198, "127.0.0.1", resolve));
});
after(() => new Promise(resolve => server.close(resolve)));

async function start() {
  const response = await fetch(`${worker}/github/start?request_id=${"c".repeat(64)}`, { redirect: "manual" });
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location"));
  fixture.challenge = location.searchParams.get("code_challenge");
  assert.equal(location.searchParams.get("code_challenge_method"), "S256");
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  return { state: location.searchParams.get("state"), cookie: cookie.split(";")[0] };
}
async function callback(proof, code, state = proof.state) {
  return fetch(`${worker}/github/callback?state=${state}&code=${code}`, { headers: { Cookie: proof.cookie } });
}
test("Rust OAuth handler exchanges the PKCE proof and returns only the selected owner's token to the exact origin", async () => {
  const response = await callback(await start(), "synthetic"); const html = await response.text();
  assert.equal(response.status, 200); assert.match(html, /ghu_synthetic/);
  assert.ok(html.includes("c".repeat(64))); assert.ok(html.includes('http://127.0.0.1:4197'));
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});
test("mismatched browser state cannot reach GitHub's token exchange", async () => {
  const proof = await start(); const before = fixture.calls;
  const html = await (await callback(proof, "synthetic", "d".repeat(64))).text();
  assert.ok(!html.includes("ghu_")); assert.equal(fixture.calls, before);
});
test("other accounts and repositories without write permission never receive a token", async () => {
  for (const code of ["other", "readonly"]) {
    const html = await (await callback(await start(), code)).text();
    assert.ok(!html.includes(`ghu_${code}`)); assert.match(html, /GitHub girişi tamamlanamadı/);
  }
});
