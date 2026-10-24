const { test } = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { InstructorSession, createGitHubSignIn } = require("../instructor-login.js");
const { FirebaseStudentService } = require("../firebase-student-service.js");

function sessionFixture(failure) {
  const state = { publishing: false, students: false, calls: [] };
  const session = new InstructorSession({
    publishing: {
      async login(token) { assert.equal(token, "github-secret"); state.publishing = true; state.calls.push("github"); },
      logout() { state.publishing = false; }
    },
    students: {
      async signInInstructor(token) {
        assert.equal(token, "firebase-secret"); state.calls.push("firebase");
        state.students = !failure;
        return failure ? { ok: false, error: "Admin revoked" } : { ok: true };
      },
      async signOut() { state.students = false; }
    }
  });
  return { state, session };
}

test("one sign-in grants both permissions and one logout closes both", async () => {
  const { state, session } = sessionFixture();
  assert.deepEqual(await session.login({ token: "github-secret", firebaseToken: "firebase-secret" }), { ok: true });
  assert.deepEqual(state.calls, ["firebase", "github"]);
  assert.equal(state.publishing && state.students, true);
  await session.logout();
  assert.equal(state.publishing || state.students, false);
});

test("incomplete or failed Firebase authorization leaves no publishing session", async () => {
  for (const credentials of [{ token: "github-secret" }, { token: "github-secret", firebaseToken: "firebase-secret" }]) {
    const { state, session } = sessionFixture(true);
    assert.equal((await session.login(credentials)).ok, false);
    assert.equal(state.publishing || state.students, false);
  }
});

test("logout during slow sign-in cannot resurrect either permission", async () => {
  let release;
  let publishing = false, students = false;
  const session = new InstructorSession({
    publishing: { async login() { publishing = true; }, logout() { publishing = false; } },
    students: {
      async signInInstructor() { await new Promise(resolve => { release = resolve; }); students = true; return { ok: true }; },
      async signOut() { students = false; }
    }
  });
  const pending = session.login({ token: "a", firebaseToken: "b" });
  await new Promise(resolve => setImmediate(resolve));
  await session.logout();
  assert.equal((await session.login({ token: "c", firebaseToken: "d" })).ok, false);
  release();
  assert.equal((await pending).ok, false);
  assert.equal(publishing || students, false);
});

test("a rejected GitHub permission also closes the Firebase session", async () => {
  let students = false;
  const session = new InstructorSession({
    publishing: { async login() { throw Error("No repository write permission"); }, logout() {} },
    students: {
      async signInInstructor() { students = true; return { ok: true }; },
      async signOut() { students = false; }
    }
  });
  assert.equal((await session.login({ token: "a", firebaseToken: "b" })).ok, false);
  assert.equal(students, false);
});

test("instructor sign-in reuses the admin without touching students, applications or enrollments", async () => {
  const roster = [{ no: "00123", name: "Preserved Student", enabled: true }];
  const applications = [{ uid: "pending", status: "pending" }];
  const before = JSON.stringify({ roster, applications });
  const service = new FirebaseStudentService({
    async signInInstructor() {},
    getUser: () => ({ uid: "existing-admin", emailVerified: true }),
    isAdmin: async () => true,
    watchRoster(callback) { callback(roster); return () => {}; },
    watchApplications(callback) { callback(applications); return () => {}; },
    signOut: async () => {},
    errorMessage: error => error.message
  });
  assert.equal((await service.signInInstructor("custom-token")).ok, true);
  assert.equal(service.isAdmin, true);
  assert.equal(JSON.stringify({ roster, applications }), before);
  await service.signOut();
  assert.equal(JSON.stringify({ roster, applications }), before);
});

test("popup accepts only its own origin, window and request nonce and never writes credentials to storage", async () => {
  let listener, tick, opened;
  const popup = { closed: false, close() { this.closed = true; } };
  const host = {
    crypto: webcrypto,
    open(url) { opened = new URL(url); return popup; },
    addEventListener(type, callback) { listener = callback; },
    removeEventListener() { listener = null; },
    setInterval(callback) { tick = callback; return 1; },
    clearInterval() {},
    localStorage: { setItem() { throw Error("Credentials must stay in memory"); } },
    sessionStorage: { setItem() { throw Error("Credentials must stay in memory"); } }
  };
  const accepted = [], states = [];
  const flow = createGitHubSignIn({ host, serviceUrl: "https://worker.example/", onCredentials: async data => { accepted.push(data); return { ok: true }; }, onState: (...state) => states.push(state) });
  flow.start();
  const data = { type: "lecturenotes-github", requestId: opened.searchParams.get("request_id"), token: "secret", firebaseToken: "secret" };
  assert.match(data.requestId, /^[a-f0-9]{64}$/);
  for (const event of [
    { origin: "https://evil.example", source: popup, data },
    { origin: opened.origin, source: {}, data },
    { origin: opened.origin, source: popup, data: { ...data, requestId: "wrong" } }
  ]) await listener(event);
  assert.equal(accepted.length, 0);
  await listener({ origin: opened.origin, source: popup, data });
  assert.equal(accepted.length, 1);
  assert.equal(listener, null);
  assert.equal(popup.closed, true);
  assert.deepEqual(states.at(-1), [false, "", true]);
  assert.equal(typeof tick, "function");
});
