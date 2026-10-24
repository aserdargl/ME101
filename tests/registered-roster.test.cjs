const test = require("node:test");
const assert = require("node:assert/strict");
const { displayColumns, RegisteredRoster, visibleStudents } = require("../registered-roster.js");
const { FirebaseStudentService } = require("../firebase-student-service.js");

test("roster search handles Turkish characters, multiple words, IDs and legacy email without mutations", () => {
  const students = [{ no: "00123", name: "Ahmet Serdar Güldibi" }, { no: "2", firstName: "Işıl", surname: "Öztürk Kaya" }, { email: "old@example.test", name: "Ayşe" }];
  const before = JSON.stringify(students);
  for (const query of ["serdar guldibi", "00123", "GÜLDİBİ ahmet"]) assert.deepEqual(visibleStudents(students, query), [students[0]]);
  assert.deepEqual(visibleStudents(students, "ISIL ozturk"), [students[1]]);
  assert.deepEqual(visibleStudents(students, "old@"), [students[2]]);
  assert.deepEqual(visibleStudents(students, "missing"), []);
  assert.deepEqual(visibleStudents(students, "   "), students);
  assert.equal(JSON.stringify(students), before);
});

test("all sort directions respect numeric IDs, Turkish names and explicit compound surnames", () => {
  const students = [{ no: "010", firstName: "Zeynep", surname: "Ak Kaya" }, { no: "002", name: "Çağla Öztürk" }, { no: "1", name: "Cem Şen" }];
  const before = JSON.stringify(students);
  for (const [order, expected] of [["0:asc", [2, 1, 0]], ["1:asc", [2, 1, 0]], ["2:asc", [0, 1, 2]]]) {
    assert.deepEqual(visibleStudents(students, "", order), expected.map(index => students[index]));
    assert.deepEqual(visibleStudents(students, "", order.replace("asc", "desc")), expected.toReversed().map(index => students[index]));
  }
  assert.deepEqual(visibleStudents(students, "kaya", "1:asc"), [students[0]]);
  assert.equal(JSON.stringify(students), before);
});

test("display and column copy preserve leading zeroes, Turkish names and blank legacy cells", async () => {
  const students = [{ no: "00123", name: "Ahmet Serdar Güldibi" }, { email: "legacy@example.test", name: "Ayşe" }];
  const original = JSON.stringify(students);
  assert.deepEqual(displayColumns(students[0]), ["00123", "Ahmet Serdar", "Güldibi"]);
  const copied = [];
  const view = { visibleStudents: () => students, clipboard: { writeText: async value => copied.push(value) }, feedback: {}, text: value => value };
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

test("explicit first names and compound surnames survive display without changing stored full names", () => {
  const student = { no: "001", name: "Ahmet Serdar Güldibi Kaya", firstName: "Ahmet Serdar", surname: "Güldibi Kaya" };
  assert.deepEqual(displayColumns(student), ["001", "Ahmet Serdar", "Güldibi Kaya"]);
});

test("row updates preserve unrelated and disabled records and refuse duplicate numbers before writing", async () => {
  let calls = 0;
  const original = { no: "001", name: "Ali Kaya", enabled: false };
  const other = { no: "002", name: "Other Student", enabled: true };
  const edited = { ...original, no: "003", name: "Ali Ak", firstName: "Ali", surname: "Ak" };
  const service = new FirebaseStudentService({ updateStudent: async () => { calls++; return { ok: true, student: edited }; } });
  service.roster = [original, other];
  const edit = { original, no: "003", firstName: "Ali", surname: "Ak" };
  assert.equal((await service.updateStudent(edit)).ok, false);
  service.isAdmin = true;
  assert.equal((await service.updateStudent({ ...edit, no: "002" })).ok, false);
  assert.equal(calls, 0);
  assert.equal((await service.updateStudent(edit)).ok, true);
  assert.deepEqual(service.roster, [edited, other]);
  assert.deepEqual(original, { no: "001", name: "Ali Kaya", enabled: false });
});

test("failed edits leave the saved roster and row draft intact", async () => {
  const original = { no: "001", name: "Ali Kaya", enabled: true };
  const service = new FirebaseStudentService({ updateStudent: async () => ({ ok: false, error: "conflict" }) });
  service.isAdmin = true; service.roster = [original];
  const drafts = new Map([["001", { original, values: ["001", "Ali", "Ak"] }]]);
  const view = { drafts, busy: false, selected: new Set(), text: value => value, render() {}, changed() {}, feedback: {}, save: edit => service.updateStudent(edit) };
  await RegisteredRoster.prototype.saveStudent.call(view, "001");
  assert.deepEqual(service.roster, [original]);
  assert.equal(drafts.get("001").values[2], "Ak");
  assert.equal(view.busy, false);
  assert.equal(view.feedback.textContent, "conflict");
});
