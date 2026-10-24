const { test } = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { GitHubLectureRepository } = require("../github-repository.js");

const { fakeGitHub } = require("./github-fixture.cjs");

const create = server => new GitHubLectureRepository({ owner: "aserdargl", repository: "ME101", fetch: server.fetch, crypto: webcrypto, baseUrl: "https://aserdargl.github.io/ME101/" });

test("atomic publication preserves the site, publishes all notes, and retains prior snapshots", async () => {
  const server = fakeGitHub(), repository = create(server);
  assert.equal((await repository.readPublished()).manifest, null);
  await repository.login("isolated-test-key");
  const original = [{ id: "user", title: "Kendi notum", custom: { important: true }, slides: [{ html: "<p>Özgün açıklama</p>", extractedImages: ["data:image/png;base64,AA"] }] }];
  const first = await repository.publish(original, await repository.readCurrent());
  assert.deepEqual((await repository.readPublished()).lectures, original);
  const changed = structuredClone(original); changed[0].slides[0].html += "<p>Yeni not</p>";
  await repository.publish(changed, await repository.readCurrent());
  const latestTree = server.trees.get(server.commits.get(server.state.head).tree.sha);
  assert.equal(server.blobs.get(latestTree.get("index.html")), "<h1>Mevcut site</h1>");
  assert.ok(latestTree.has(`data/snapshots/${first.id}/0.txt`));
  assert.deepEqual((await repository.readPublished()).lectures, changed);
  assert.ok(server.state.requests.filter(request => request.path.startsWith("/git/")).every(request => request.headers.Authorization === "Bearer isolated-test-key"));
});

test("concurrent changes reject an outdated push without replacing published notes", async () => {
  const server = fakeGitHub(), repository = create(server);
  await repository.login("isolated-test-key");
  const stale = await repository.readCurrent();
  await repository.publish([{ id: "newer", title: "Diğer cihaz", slides: [] }], stale);
  await assert.rejects(() => repository.publish([{ id: "old", title: "Eski kopya", slides: [] }], stale), /daha yeni değişiklik/);
  assert.equal((await repository.readPublished()).lectures[0].id, "newer");
});

test("only the owner can connect and access keys are cleared on logout or rejection", async () => {
  const server = fakeGitHub(), repository = create(server);
  server.state.owner = "someone-else";
  await assert.rejects(() => repository.login("isolated-key"), /yalnızca depo sahibinin/);
  assert.equal(repository.token, "");
  server.state.owner = "aserdargl";
  server.state.canPush = false;
  await assert.rejects(() => repository.login("read-only-key"), /yayımlama izni/);
  assert.equal(repository.token, "");
  server.state.canPush = true;
  await repository.login("isolated-key"); repository.logout();
  assert.equal(repository.token, "");
});

test("chunk boundaries preserve Unicode data exactly", () => {
  const repository = create(fakeGitHub());
  const text = "a".repeat(512 * 1024 - 1) + "😀 Özgün not";
  const chunks = repository.chunks(text);
  assert.equal(chunks.map(chunk => new TextDecoder().decode(new TextEncoder().encode(chunk))).join(""), text);
});

test("legacy published snapshots remain readable", async () => {
  const repository = create(fakeGitHub());
  const original = [{ id: "legacy", slides: [{ html: "Eski notlar 😀" }] }];
  const text = JSON.stringify(original);
  const manifest = { id: webcrypto.randomUUID(), parts: 1, digest: await repository.digest(text) };
  assert.deepEqual((await repository.decode(manifest, async () => text)).lectures, original);
});

test("corrupt document parts fail verification before any notes are applied", async () => {
  const server = fakeGitHub(), repository = create(server);
  await repository.login("isolated-test-key");
  const manifest = await repository.publish([{ id: "user", slides: [{ html: "Korunacak not" }] }], await repository.readCurrent());
  const tree = server.trees.get(server.commits.get(server.state.head).tree.sha);
  server.blobs.set(tree.get(`data/snapshots/${manifest.id}/0.txt`), "corrupted");
  await assert.rejects(() => repository.readPublished(), /bütünlüğü/);
});
