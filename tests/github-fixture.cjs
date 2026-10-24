/* In-memory GitHub only; no network or user data. */
const assert = require("node:assert/strict");
function fakeGitHub() {
  const blobs = new Map([["original-html", "<h1>Mevcut site</h1>"]]);
  const trees = new Map([["tree-0", new Map([["index.html", "original-html"]])]]);
  const commits = new Map([["commit-0", { tree: { sha: "tree-0" }, parents: [] }]]);
  const state = { head: "commit-0", requests: [], owner: "aserdargl", canPush: true };
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
    if (path === "") return response({ permissions: { push: state.canPush } });
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
module.exports = { fakeGitHub };
