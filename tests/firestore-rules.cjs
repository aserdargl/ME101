const { test, before, after } = require("node:test");
const fs = require("node:fs");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, collection, setDoc, getDoc, getDocs, deleteDoc, writeBatch, serverTimestamp } = require("firebase/firestore");
const assert = require("node:assert/strict");
let environment;
const record = { email: "student@example.test", no: "123", name: "Synthetic Student", enabled: true };

before(async () => {
  environment = await initializeTestEnvironment({ projectId: "demo-lecturenotes", firestore: {
    host: "127.0.0.1", port: 8088, rules: fs.readFileSync("firestore.rules", "utf8")
  } });
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "admins", "owner"), { role: "owner" });
    await setDoc(doc(context.firestore(), "students", record.email), record);
    for (const no of ["00123", "00456", "00789", "00999"]) await setDoc(doc(context.firestore(), "studentNumbers", no), {
      no, name: "Ahmet Yılmaz", nameKey: "ahmet yılmaz", enabled: true
    });
  });
});
after(async () => { await environment?.cleanup(); });
const user = (uid, email, verified = true) => environment.authenticatedContext(uid, { email, email_verified: verified }).firestore();

test("anonymous visitors cannot read or enumerate the private list", async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "students", record.email)));
  await assertFails(getDocs(collection(db, "students")));
});
test("a verified student can read only their own record and cannot edit it", async () => {
  const db = user("student", record.email);
  await assertSucceeds(getDoc(doc(db, "students", record.email)));
  await assertFails(getDoc(doc(db, "students", "other@example.test")));
  await assertFails(getDocs(collection(db, "students")));
  await assertFails(setDoc(doc(db, "students", record.email), { ...record, enabled: true }));
  await assertFails(setDoc(doc(db, "admins", "student"), { role: "owner" }));
});
test("unverified accounts cannot inspect records even when the email matches", async () => {
  await assertFails(getDoc(doc(user("unverified", record.email, false), "students", record.email)));
});
test("only a verified administrator may list, add, disable and remove students", async () => {
  const db = user("owner", "owner@example.test");
  await assertSucceeds(getDocs(collection(db, "students")));
  await assertSucceeds(setDoc(doc(db, "students", "other@example.test"), { ...record, email: "other@example.test" }));
  await assertSucceeds(setDoc(doc(db, "students", "other@example.test"), { ...record, email: "other@example.test", enabled: false }));
  await assertSucceeds(deleteDoc(doc(db, "students", "other@example.test")));
  await assertFails(setDoc(doc(db, "admins", "new-owner"), { role: "owner" }));
  await assertFails(setDoc(doc(db, "students", record.email), { ...record, password: "never store passwords here" }));
});

function enroll(db, uid, email, no, nameKey = "ahmet yılmaz") {
  const batch = writeBatch(db);
  batch.set(doc(db, "numberClaims", no), { uid });
  batch.set(doc(db, "enrollments", uid), { no, email, nameKey });
  return batch.commit();
}

test("number lists and names remain private even for signed-in but unenrolled accounts", async () => {
  const db = user("unenrolled", "new@example.test");
  await assertFails(getDoc(doc(db, "studentNumbers", "00123")));
  await assertFails(getDocs(collection(db, "studentNumbers")));
  await assertFails(getDocs(collection(db, "numberClaims")));
});

test("registration requests require an exact number/name match but reserve no number", async () => {
  const db = user("pending", "pending@example.test", false);
  const reference = doc(db, "registrationRequests", "pending");
  await assertFails(setDoc(reference, { no: "99999", nameKey: "ahmet yılmaz", email: "pending@example.test" }));
  await assertFails(setDoc(reference, { no: "00123", nameKey: "başka isim", email: "pending@example.test" }));
  await assertSucceeds(setDoc(reference, { no: "00123", nameKey: "ahmet yılmaz", email: "pending@example.test" }));
  await assertFails(enroll(db, "pending", "pending@example.test", "00123"));
});

test("verified enrollment is atomic, name-checked and bound to exactly one account", async () => {
  const db = user("first", "first@example.test");
  await assertFails(enroll(db, "first", "first@example.test", "00123", "wrong name"));
  await assertFails(setDoc(doc(db, "enrollments", "first"), { no: "00123", email: "first@example.test", nameKey: "ahmet yılmaz" }));
  await assertSucceeds(enroll(db, "first", "first@example.test", "00123"));
  await assertSucceeds(getDoc(doc(db, "studentNumbers", "00123")));
  await assertFails(enroll(user("second", "second@example.test"), "second", "second@example.test", "00123"));
  await assertFails(enroll(db, "first", "first@example.test", "00456"));
});

test("two simultaneous registrations cannot claim the same number", async () => {
  const results = await Promise.allSettled([
    enroll(user("race-a", "race-a@example.test"), "race-a", "race-a@example.test", "00789"),
    enroll(user("race-b", "race-b@example.test"), "race-b", "race-b@example.test", "00789")
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
});

test("only administrators can reset an existing number/account binding", async () => {
  const db = user("owner", "owner@example.test");
  await assertFails(deleteDoc(doc(user("first", "first@example.test"), "numberClaims", "00123")));
  const batch = writeBatch(db);
  batch.delete(doc(db, "numberClaims", "00123"));
  batch.delete(doc(db, "enrollments", "first"));
  await assertSucceeds(batch.commit());
  await assertSucceeds(enroll(user("replacement", "replacement@example.test"), "replacement", "replacement@example.test", "00123"));
});

test("mismatched applications may be submitted but cannot self-approve, change or delete decisions", async () => {
  const db = user("applicant", "applicant@example.test", false);
  const reference = doc(db, "applications", "applicant");
  const application = { no: "88888", name: "Unmatched Name", nameKey: "unmatched name", email: "applicant@example.test", status: "pending", createdAt: serverTimestamp() };
  await assertSucceeds(setDoc(reference, application));
  await assertSucceeds(getDoc(reference));
  await assertFails(setDoc(reference, { ...application, status: "approved" }));
  await assertFails(deleteDoc(reference));
  await assertFails(getDocs(collection(db, "applications")));
  await assertFails(getDoc(doc(user("other", "other@example.test"), "applications", "applicant")));
  await assertFails(setDoc(doc(user("owner", "owner@example.test"), "applications", "applicant"), { ...application, status: "approved" }));
});

test("rejected accounts and replacement UIDs for the same email cannot regain access", async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "applications", "rejected"), { status: "rejected", email: "rejected@example.test" });
    await setDoc(doc(context.firestore(), "rejectedEmails", "rejected@example.test"), { uid: "rejected" });
    await setDoc(doc(context.firestore(), "students", "rejected@example.test"), { ...record, email: "rejected@example.test" });
  });
  await assertSucceeds(getDoc(doc(user("rejected", "rejected@example.test"), "applications", "rejected")));
  await assertFails(getDoc(doc(user("rejected", "rejected@example.test"), "students", "rejected@example.test")));
  const db = user("replacement-rejected", "rejected@example.test");
  await assertFails(setDoc(doc(db, "applications", "replacement-rejected"), {
    no: "00999", name: "Name", nameKey: "name", email: "rejected@example.test", status: "pending", createdAt: serverTimestamp()
  }));
  await assertFails(enroll(db, "replacement-rejected", "rejected@example.test", "00999"));
});
