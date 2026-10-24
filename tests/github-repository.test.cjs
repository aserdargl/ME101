const { test } = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { GitHubLectureRepository } = require("../github-repository.js");

function fakeGitHub() {
  const blobs = new Map([["original-html", "<h1>Mevcut site</h1>"]]);
  const trees = new Map([["tree-0", new Map([["index.html", "original-html"]])]]);
  const commits = new Map([["commit-0", { tree: { sha: "tree-0" }, parents: [] }]]);
  const state = { head: "commit-0", requests: [], owner: "aserdargl" };
  let sequence = 0;
  const response = (value, status = 200) => Response.json(value, { status });
  async function fetch(url, options = {}) {
    const parsed = new URL(url);
    const path = parsed.pathname.replace("/repos/aserdargl/ME101", "");
    const body = options.body ? JSON.parse(options.body) : null;
    state.requests.push({ path, method: options.method || "GET", body, headers: options.headers });
    if (parsed.hostname !== "api.github.com") {
      const file = trees.get(commits.get(state.head).tree.sha).get(parsed.pathname.replace(/^\/ME101\//, ""));
      return file ? new Response(blobs.get(file)) : response({}, 404);
    }
    if (path === "/user") return response({ login: state.owner });
    if (path === "") return response({ permissions: { push: true } });
    if (path === "/git/ref/heads/main") return response({ object: { sha: state.head } });
    if (path.startsWith("/contents/")) {
      const commit = commits.get(parsed.searchParams.get("ref"));
      const sha = trees.get(commit.tree.sha).get(path.slice("/contents/".length));
      return sha ? new Response(blobs.get(sha)) : response({}, 404);
    }
    if (path === "/git/blobs") { const sha = `blob-${++sequence}`; blobs.set(sha, body.content); return response({ sha }, 201); }
    if (path === "/git/trees") {
      assert.ok(body.base_tree, "source files must be preserved through base_tree");
      const tree = new Map(trees.get(body.base_tree));
      body.tree.forEach(entry => tree.set(entry.path, entry.sha));
      const sha = `tree-${++sequence}`; trees.set(sha, tree); return response({ sha }, 201);
    }
    if (path === "/git/commits") { const sha = `commit-${++sequence}`; commits.set(sha, { tree: { sha: body.tree }, parents: body.parents }); return response({ sha }, 201); }
    if (path.startsWith("/git/commits/")) return response(commits.get(path.split("/").pop()));
    if (path === "/git/refs/heads/main") {
      assert.equal(body.force, false, "never force-push over user notes");
      if (commits.get(body.sha).parents[0] !== state.head) return response({ message: "Not a fast forward" }, 422);
      state.head = body.sha; return response({ object: { sha: body.sha } });
    }
    throw Error(`Unexpected fixture endpoint ${path}`);
  }
  return { fetch, state, trees, commits, blobs };
}

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
  await repository.login("isolated-key"); repository.logout();
  assert.equal(repository.token, "");
});

test("chunk boundaries preserve Unicode data exactly", () => {
  const repository = create(fakeGitHub());
  const text = "a".repeat(512 * 1024 - 1) + "😀 Özgün not";
  const chunks = repository.chunks(text);
  assert.equal(chunks.map(chunk => new TextDecoder().decode(new TextEncoder().encode(chunk))).join(""), text);
});
