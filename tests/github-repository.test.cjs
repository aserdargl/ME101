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

test("uploads run with bounded concurrency and a recreated repository resumes acknowledged parts", async () => {
  const server = fakeGitHub(), values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  let active = 0, maximum = 0, successful = 0, interrupted = true;
  const fetch = async (url, options) => {
    if (String(url).endsWith("/git/blobs")) {
      active += 1; maximum = Math.max(maximum, active);
      await new Promise(resolve => setTimeout(resolve, 15));
      active -= 1;
      if (interrupted && successful >= 2) throw new Error("Synthetic interrupted connection");
      successful += 1;
    }
    return server.fetch(url, options);
  };
  const options = { owner: "aserdargl", repository: "ME101", fetch, crypto: webcrypto, storage, baseUrl: "https://aserdargl.github.io/ME101/" };
  const lectures = [{ id: "resume", slides: Array.from({ length: 56 }, (_, index) => ({ image: "A".repeat(256 * 1024) + index })) }];
  const first = new GitHubLectureRepository(options);
  await first.login("synthetic");
  const current = await first.readCurrent();
  await assert.rejects(() => first.publish(lectures, current), /Synthetic interrupted/);
  assert.equal(maximum, 3);
  assert.equal(server.state.head, "commit-0");
  const acknowledged = successful;
  assert.equal(acknowledged, 2);
  interrupted = false;
  const resumed = new GitHubLectureRepository(options), progress = [];
  await resumed.login("synthetic");
  const manifest = await resumed.publish(lectures, await resumed.readCurrent(), event => progress.push(event));
  assert.equal(successful, manifest.parts + 1, "only missing parts and the manifest should be uploaded");
  assert.equal(progress.filter(event => event.stage === "upload").at(-1).completed, manifest.parts);
  assert.deepEqual((await resumed.readPublished()).lectures, lectures);
  assert.ok([...values.values()].every(value => !value.includes("synthetic")), "checkpoints contain no access token");
});

test("another tab reuses published unchanged parts while preserving prior snapshots", async () => {
  const server = fakeGitHub(), first = create(server);
  await first.login("synthetic");
  const lectures = [{ id: "reuse", slides: [{ image: "A".repeat(5 * 1024 * 1024), html: "Özgün notlar" }] }];
  const previous = await first.publish(lectures, await first.readCurrent());
  const second = create(server);
  await second.login("synthetic");
  lectures[0].slides[0].html += " · Yeni not";
  const count = server.state.requests.filter(request => request.path === "/git/blobs").length;
  const manifest = await second.publish(lectures, await second.readCurrent());
  assert.equal(server.state.requests.filter(request => request.path === "/git/blobs").length - count, 2, "only the changed part and new manifest need uploading");
  assert.equal(manifest.blobs[0], previous.blobs[0]);
  assert.deepEqual((await second.readPublished()).lectures, lectures);
});

test("a verified unchanged version skips content downloads and creates no new commit", async () => {
  const server = fakeGitHub(), repository = create(server);
  await repository.login("synthetic");
  const lectures = [{ id: "same", slides: [{ html: "Özgün not" }] }];
  const first = await repository.publish(lectures, await repository.readCurrent());
  const requestCount = server.state.requests.length;
  const current = await repository.readCurrent({ skipLecturesForVersion: first.id });
  assert.equal(current.lectures, null);
  assert.equal(server.state.requests.slice(requestCount).filter(request => request.path.startsWith("/contents/")).length, 1);
  const before = server.state.requests.length, head = server.state.head;
  const result = await repository.publish(lectures, current);
  assert.equal(result.id, first.id);
  assert.equal(server.state.requests.length, before);
  assert.equal(server.state.head, head);
});
