const { test } = require("node:test");
const assert = require("node:assert/strict");
const { FirebaseStudentService, parseRoster } = require("../firebase-student-service.js");

test("roster imports validate every row before sending names or numbers anywhere", () => {
  assert.equal(parseRoster("20261001 - Local Name").ok, false);
  assert.equal(parseRoster("valid@example.test;1;Student\ninvalid").ok, false);
  const result = parseRoster("Student@Example.Test;123;Özgün İsim");
  assert.deepEqual(result.students, [{ email: "student@example.test", no: "123", name: "Özgün İsim", enabled: true }]);
});

test("unverified accounts never read the private roster", async () => {
  const service = new FirebaseStudentService({ isAdmin() { throw Error("Must not run"); } });
  await service.applyUser({ email: "student@example.test", emailVerified: false });
  assert.equal(service.profile, null);
  assert.equal(service.isAdmin, false);
});

test("student access is revoked when another device disables the shared record", async () => {
  let onRecord;
  const service = new FirebaseStudentService({
    isAdmin: async () => false,
    watchStudent(email, callback) { assert.equal(email, "student@example.test"); onRecord = callback; return () => {}; }
  });
  await service.applyUser({ uid: "student", email: "Student@Example.Test", emailVerified: true });
  onRecord({ email: "student@example.test", no: "123", enabled: true });
  assert.equal(service.profile.no, "123");
  onRecord({ email: "student@example.test", no: "123", enabled: false });
  assert.equal(service.profile, null);
  assert.equal((await service.saveRoster([])).ok, false);
});

test("a late response cannot restore access after logout or account change", async () => {
  let resolveRole;
  const service = new FirebaseStudentService({ isAdmin: () => new Promise(resolve => { resolveRole = resolve; }) });
  const pending = service.applyUser({ uid: "old", emailVerified: true });
  await service.applyUser(null);
  resolveRole(true);
  await pending;
  assert.equal(service.isAdmin, false);
  assert.equal(service.profile, null);
});

test("append preserves other students; replacement is explicit and atomic", async () => {
  const writes = [];
  const service = new FirebaseStudentService({ writeRoster: async (...args) => writes.push(args) });
  service.isAdmin = true;
  service.roster = [{ email: "keep@example.test" }];
  await service.saveRoster([{ email: "new@example.test" }]);
  assert.deepEqual(writes[0][1], []);
  await service.saveRoster([{ email: "new@example.test" }], true);
  assert.deepEqual(writes[1][1], [{ email: "keep@example.test" }]);
});
