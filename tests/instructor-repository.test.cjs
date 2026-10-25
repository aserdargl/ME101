const { test } = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { InstructorLectureRepository } = require("../instructor-repository.js");

function fixture() {
  const calls = [], stored = new Map();
  let manifest = null, version = "a".repeat(40);
  const repository = new InstructorLectureRepository({ owner: "aserdargl", repository: "ME101",
    serviceUrl: "https://publisher.example/", baseUrl: "https://aserdargl.github.io/ME101/", crypto: webcrypto,
    getIdToken: async () => "firebase-session-only",
    async fetch(address, options = {}) {
      const url = new URL(address);
      if (url.hostname === "raw.githubusercontent.com") {
        const part = Number(url.pathname.split("/").pop().split(".")[0]);
        return new Response(stored.get(manifest.shas[part]));
      }
      assert.equal(url.hostname, "publisher.example");
      assert.equal(options.headers.Authorization, "Bearer firebase-session-only");
      const body = JSON.parse(options.body);
      calls.push({ operation: url.pathname, body });
      if (url.pathname.endsWith("session")) return Response.json({ ok: true });
      if (url.pathname.endsWith("current")) return Response.json({ head: version, manifest });
      if (url.pathname.endsWith("blob")) {
        const sha = String(stored.size + 1).padStart(40, "0"); stored.set(sha, body.content);
        return Response.json({ sha });
      }
      if (body.head !== version) return Response.json({ error: "Newer changes preserved" }, { status: 409 });
      manifest = { ...body, parts: body.parts.length, shas: body.parts, blobs: body.parts };
      version = "b".repeat(40);
      return Response.json({ ...manifest, commit: version });
    }
  });
  return { repository, calls };
}

test("email session publishes and reads Unicode notes without any browser GitHub credential", async () => {
  const { repository, calls } = fixture();
  await repository.login();
  const notes = [{ id: "original", custom: { preserved: true }, slides: [{ html: "Özgün not 😀", image: "data:image/png;base64,AA" }] }];
  const before = JSON.stringify(notes);
  const current = await repository.readCurrent();
  await repository.publish(notes, current);
  assert.deepEqual((await repository.readCurrent()).lectures, notes);
  assert.equal(JSON.stringify(notes), before);
  assert.equal(repository.token, "");
  assert.ok(calls.every(call => !JSON.stringify(call.body).includes("firebase-session-only")));
  await assert.rejects(repository.publish([{ id: "stale" }], current), /Newer changes preserved/);
  assert.deepEqual((await repository.readCurrent()).lectures, notes);
  repository.logout();
  await assert.rejects(repository.publish(notes, current), /öğretim üyesi girişi/);
});

test("logout during session verification cannot reconnect publishing", async () => {
  let release;
  const repository = new InstructorLectureRepository({ serviceUrl: "https://publisher.example/", crypto: webcrypto,
    getIdToken: () => new Promise(resolve => { release = resolve; }), fetch: () => { throw Error("Must not send after logout"); } });
  const pending = repository.login();
  repository.logout(); release("revoked-session");
  await assert.rejects(pending, /oturumu kapandı/);
  assert.equal(repository.connected, false);
});
