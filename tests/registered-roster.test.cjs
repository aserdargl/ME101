const test = require("node:test");
const assert = require("node:assert/strict");
const { displayColumns, RegisteredRoster } = require("../registered-roster.js");
const { FirebaseStudentService } = require("../firebase-student-service.js");

test("display and column copy preserve leading zeroes, Turkish names and blank legacy cells", async () => {
  const students = [{ no: "00123", name: "Ahmet Serdar Güldibi" }, { email: "legacy@example.test", name: "Ayşe" }];
  const original = JSON.stringify(students);
  assert.deepEqual(displayColumns(students[0]), ["00123", "Ahmet Serdar", "Güldibi"]);
  const copied = [];
  const view = { students: () => students, clipboard: { writeText: async value => copied.push(value) }, feedback: {}, text: value => value };
  for (let column = 0; column < 3; column++) await RegisteredRoster.prototype.copy.call(view, column);
  assert.deepEqual(copied, ["00123\n", "Ahmet Serdar\nAyşe", "Güldibi\n"]);
  assert.equal(JSON.stringify(students), original);
});

test("cancelling roster deletion performs no write", async () => {
  await RegisteredRoster.prototype.delete.call({ busy: false, text: value => value, confirm: () => false, remove: () => assert.fail("Must not delete") }, [{ no: "001" }]);
});

test("selected deletion removes only selected number/email entries and de-duplicates keys", async () => {
  let records = [{ no: "001" }, { no: "002" }, { email: "legacy@example.test" }];
  const service = new FirebaseStudentService({ writeRoster: async (students, removals) => {
    assert.deepEqual(students, []);
    records = records.filter(student => !removals.some(removed => JSON.stringify(student) === JSON.stringify(removed)));
  } });
  service.isAdmin = true;
  assert.deepEqual(await service.removeStudents(["001", "legacy@example.test", "001"]), { ok: true, removed: 2 });
  assert.deepEqual(records, [{ no: "002" }]);
});

test("term cleanup handles more than one batch and reports partial failure without retrying", async () => {
  const writes = [];
  const service = new FirebaseStudentService({ writeRoster: async (_, removals) => writes.push(removals), errorMessage: () => "offline" });
  const keys = Array.from({ length: 903 }, (_, index) => String(index));
  assert.equal((await service.removeStudents(keys)).ok, false);
  assert.equal(writes.length, 0);
  service.isAdmin = true;
  assert.equal((await service.removeStudents(keys)).removed, 903);
  assert.deepEqual(writes.map(batch => batch.length), [450, 450, 3]);
  let attempts = 0;
  service.adapter.writeRoster = async () => { if (++attempts === 2) throw Error("offline"); };
  assert.deepEqual(await service.removeStudents(keys), { ok: false, error: "offline", removed: 450 });
  assert.equal(attempts, 2);
});

test("logout during a large deletion stops subsequent batches", async () => {
  const service = new FirebaseStudentService({ writeRoster: async () => { service.isAdmin = false; } });
  service.isAdmin = true;
  const result = await service.removeStudents(Array.from({ length: 451 }, (_, index) => String(index)));
  assert.equal(result.ok, false);
  assert.equal(result.removed, 450);
});
