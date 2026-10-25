const { test } = require("node:test");
const assert = require("node:assert/strict");
const { InstructorSession } = require("../instructor-login.js");

test("password login shares Firebase access with publishing and stores no password or GitHub credential", async () => {
  const values = new Map(), calls = [];
  const students = { isAdmin: false,
    async signInInstructorWithPassword(email, password) {
      assert.equal(email, "instructor@example.test"); assert.equal(password, "synthetic-password");
      this.isAdmin = true; calls.push("firebase"); return { ok: true };
    }, async signOut() { this.isAdmin = false; }
  };
  const session = new InstructorSession({ students,
    publishing: { async login(...args) { assert.equal(args.length, 0); calls.push("publishing"); }, logout() {} },
    storage: { setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  });
  assert.equal((await session.login({ email: "instructor@example.test", password: "synthetic-password" })).ok, true);
  assert.deepEqual(calls, ["firebase", "publishing"]);
  assert.equal(values.size, 0);
  assert.equal((await session.restore()).ok, true);
  await session.logout();
  assert.equal((await session.restore()).ok, false);
});

test("failed password login cannot grant publishing access", async () => {
  let opened = false;
  const session = new InstructorSession({
    students: { async signInInstructorWithPassword() { return { ok: false, error: "Invalid account" }; }, async signOut() {} },
    publishing: { async login() { opened = true; }, logout() {} }
  });
  assert.equal((await session.login({ email: "student@example.test", password: "wrong" })).error, "Invalid account");
  assert.equal(opened, false);
});
