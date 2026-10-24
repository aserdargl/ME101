/* Runs only against demo emulators and the local Rust Worker. */
const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const authBase = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const storeBase = "http://127.0.0.1:8088/v1/projects/demo-lecturenotes/databases/(default)/documents";
const tag = String(Date.now());
let owner, student;
async function auth(method, data, privileged = false) {
  const response = await fetch(`${authBase}/${method}?key=demo-key`, { method: "POST", headers: { "Content-Type": "application/json", ...(privileged ? { Authorization: "Bearer owner" } : {}) }, body: JSON.stringify(data) });
  assert.equal(response.status, 200); return response.json();
}
async function account(label) {
  const email = `${label}-${tag}@example.test`;
  const user = await auth("accounts:signUp", { email, password: "Synthetic-Only-Password123!", returnSecureToken: true });
  await auth("accounts:update", { localId: user.localId, emailVerified: true }, true);
  const login = await auth("accounts:signInWithPassword", { email, password: "Synthetic-Only-Password123!", returnSecureToken: true });
  return { uid: user.localId, email, token: login.idToken };
}
async function put(path, values) {
  const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === "boolean" ? { booleanValue: value } : { stringValue: value }]));
  const response = await fetch(`${storeBase}/${path}`, { method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
  assert.equal(response.status, 200);
}
async function read(path) {
  const response = await fetch(`${storeBase}/${path}`, { headers: { Authorization: "Bearer owner" } });
  if (response.status === 404) return null;
  assert.equal(response.status, 200);
  const doc = await response.json();
  return Object.fromEntries(Object.entries(doc.fields).map(([key, value]) => [key, value.stringValue ?? value.booleanValue]));
}
async function edit(body, token = owner.token) {
  const response = await fetch("http://127.0.0.1:8797/roster-update", { method: "POST", headers: { Origin: "http://127.0.0.1:4197", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  owner = await account("roster-admin"); student = await account("roster-student");
  await put(`admins/${owner.uid}`, { role: "owner" });
});

test("anonymous and student sessions cannot edit a roster", async () => {
  assert.equal((await edit({}, "")).status, 401);
  assert.equal((await edit({}, student.token)).status, 403);
});

test("unclaimed number move is atomic, explicit name parts survive, and stale edits fail", async () => {
  const no = `001${tag}`, next = `002${tag}`;
  const original = { no, name: "Ahmet Serdar Güldibi", nameKey: "ahmet serdar güldibi", enabled: false };
  await put(`studentNumbers/${no}`, original);
  const body = { original: { no, name: original.name, enabled: false }, no: next, firstName: "Ahmet Serdar", surname: "Güldibi Kaya" };
  const result = await edit(body); assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(await read(`studentNumbers/${no}`), null);
  assert.deepEqual(await read(`studentNumbers/${next}`), { no: next, name: "Ahmet Serdar Güldibi Kaya", nameKey: "ahmet serdar güldibi kaya", firstName: "Ahmet Serdar", surname: "Güldibi Kaya", enabled: false });
  assert.equal((await edit(body)).status, 409);
});

test("moving a claimed number preserves account, enrollment, approved application and email", async () => {
  const no = `003${tag}`, next = `004${tag}`;
  await put(`studentNumbers/${no}`, { no, name: "Ayşe Kaya", nameKey: "ayşe kaya", enabled: true });
  await put(`numberClaims/${no}`, { uid: student.uid });
  await put(`enrollments/${student.uid}`, { no, nameKey: "ayşe kaya", email: student.email });
  await put(`registrationRequests/${student.uid}`, { no, nameKey: "ayşe kaya", email: student.email });
  await put(`applications/${student.uid}`, { no, name: "Ayşe Kaya", approvedNo: no, approvedName: "Ayşe Kaya", email: student.email, status: "approved" });
  const result = await edit({ original: { no, name: "Ayşe Kaya", enabled: true }, no: next, firstName: "Ayşe", surname: "Ak" });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(await read(`numberClaims/${no}`), null);
  assert.equal((await read(`numberClaims/${next}`)).uid, student.uid);
  assert.deepEqual(await read(`enrollments/${student.uid}`), { no: next, nameKey: "ayşe ak", email: student.email });
  assert.equal((await read(`registrationRequests/${student.uid}`)).no, next);
  const application = await read(`applications/${student.uid}`);
  assert.equal(application.approvedNo, next); assert.equal(application.approvedName, "Ayşe Ak"); assert.equal(application.no, no);
  const user = await auth("accounts:lookup", { idToken: student.token }); assert.equal(user.users[0].localId, student.uid);
});

test("existing target numbers and stale claims never overwrite another student's data", async () => {
  const no = `005${tag}`, next = `006${tag}`;
  const original = { no, name: "Ali Kaya", enabled: true };
  await put(`studentNumbers/${no}`, { ...original, nameKey: "ali kaya" });
  await put(`studentNumbers/${next}`, { no: next, name: "Other Student", nameKey: "other student", enabled: true });
  const body = { original, no: next, firstName: "Ali", surname: "Ak" };
  assert.equal((await edit(body)).status, 409);
  assert.equal((await read(`studentNumbers/${no}`)).name, "Ali Kaya");
  assert.equal((await read(`studentNumbers/${next}`)).name, "Other Student");
  body.no = `007${tag}`;
  await put(`numberClaims/${body.no}`, { uid: "somebody-else" });
  assert.equal((await edit(body)).status, 409);
});

test("legacy email records can edit all columns while retaining disabled state and email identity", async () => {
  const original = { no: "009", name: "Legacy Student", enabled: false, email: `legacy-${tag}@example.test` };
  await put(`students/${original.email}`, original);
  const result = await edit({ original, no: "00010", firstName: "Özgün", surname: "İsim" });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.deepEqual(await read(`students/${original.email}`), { ...original, no: "00010", name: "Özgün İsim", firstName: "Özgün", surname: "İsim" });
});
