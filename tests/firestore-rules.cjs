const { test, before, after } = require("node:test");
const fs = require("node:fs");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, collection, setDoc, getDoc, getDocs, deleteDoc } = require("firebase/firestore");
let environment;
const record = { email: "student@example.test", no: "123", name: "Synthetic Student", enabled: true };

before(async () => {
  environment = await initializeTestEnvironment({ projectId: "demo-lecturenotes", firestore: {
    host: "127.0.0.1", port: 8088, rules: fs.readFileSync("firestore.rules", "utf8")
  } });
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "admins", "owner"), { role: "owner" });
    await setDoc(doc(context.firestore(), "students", record.email), record);
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
