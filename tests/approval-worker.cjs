/* Runs exclusively against the demo Firebase emulators and the local Rust Worker. */
const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const authBase = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const storeBase = "http://127.0.0.1:8088/v1/projects/demo-lecturenotes/databases/(default)/documents";
const workerBase = "http://127.0.0.1:8787";
const origin = "http://127.0.0.1:4197";
const studentNo = String(Date.now());
let owner, applicant, rejected, duplicate, protectedUser, retry;

async function auth(path, body, privileged = false) {
  const response = await fetch(`${authBase}/${path}?key=demo-key`, { method: "POST",
    headers: { "Content-Type": "application/json", ...(privileged ? { Authorization: "Bearer owner" } : {}) }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
async function account(label) {
  const email = `${label}-${Date.now()}@example.test`;
  const created = await auth("accounts:signUp", { email, password: "Synthetic-Test-Only-123!", returnSecureToken: true });
  assert.equal(created.status, 200);
  const uid = created.data.localId;
  await auth("accounts:update", { localId: uid, emailVerified: true }, true);
  const signed = await auth("accounts:signInWithPassword", { email, password: "Synthetic-Test-Only-123!", returnSecureToken: true });
  return { uid, email, token: signed.data.idToken };
}
async function put(path, data) {
  const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => [key,
    typeof value === "boolean" ? { booleanValue: value } : { stringValue: value }]));
  const response = await fetch(`${storeBase}/${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer owner" }, body: JSON.stringify({ fields }) });
  assert.equal(response.status, 200);
}
async function read(path) {
  const response = await fetch(`${storeBase}/${path}`, { headers: { Authorization: "Bearer owner" } });
  return { status: response.status, data: await response.json() };
}
async function review(user, target, action, extras = {}, requestOrigin = origin) {
  const response = await fetch(`${workerBase}/review`, { method: "POST", headers: {
    Origin: requestOrigin, "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${user.token}` } : {})
  }, body: JSON.stringify({ uid: target.uid, action, ...extras }) });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  owner = await account("review-owner"); applicant = await account("review-approved"); rejected = await account("review-rejected");
  duplicate = await account("review-duplicate"); protectedUser = await account("review-protected"); retry = await account("review-retry");
  await put(`admins/${owner.uid}`, { role: "owner" });
  await put(`admins/${protectedUser.uid}`, { role: "owner" });
  for (const user of [applicant, rejected, duplicate, protectedUser]) await put(`applications/${user.uid}`, {
    no: studentNo, name: "Synthetic Applicant", nameKey: "synthetic applicant", email: user.email, status: "pending"
  });
  await put(`applications/${retry.uid}`, { no: "007777", name: "Retry Applicant", nameKey: "retry applicant", email: retry.email, status: "rejected", deletionStatus: "pending" });
});

test("the real Rust Worker rejects anonymous, non-admin, forged and cross-origin decisions", async () => {
  assert.equal((await fetch(`${workerBase}/health`)).status, 200);
  assert.equal((await review(null, applicant, "approve")).status, 401);
  assert.equal((await review(applicant, applicant, "approve")).status, 403);
  assert.equal((await review({ token: "forged" }, applicant, "approve")).status, 401);
  const response = await fetch(`${workerBase}/review`, { method: "POST", headers: { Origin: "https://untrusted.example", "Content-Type": "application/json" }, body: "{}" });
  assert.equal(response.status, 403);
});
test("administrator accounts cannot be deleted through the review API", async () => {
  assert.equal((await review(owner, protectedUser, "reject")).status, 409);
  assert.equal((await review(owner, owner, "reject")).status, 404);
});
test("approval atomically finalizes the application and prevents duplicate number takeover", async () => {
  const result = await review(owner, applicant, "approve");
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal((await read(`applications/${applicant.uid}`)).data.fields.status.stringValue, "approved");
  assert.equal((await read(`numberClaims/${studentNo}`)).data.fields.uid.stringValue, applicant.uid);
  assert.equal((await read(`enrollments/${applicant.uid}`)).status, 200);
  assert.equal((await review(owner, duplicate, "approve")).status, 409);
  assert.equal((await review(owner, applicant, "reject")).status, 409);
});
test("rejection blocks access before deleting the Firebase Authentication account", async () => {
  const result = await review(owner, rejected, "reject");
  assert.equal(result.status, 200, JSON.stringify(result.data));
  const application = (await read(`applications/${rejected.uid}`)).data.fields;
  assert.equal(application.status.stringValue, "rejected");
  assert.equal(application.deletionStatus.stringValue, "deleted");
  assert.equal((await read(`rejectedEmails/${rejected.email}`)).status, 200);
  const lookup = await auth("accounts:lookup", { idToken: rejected.token });
  assert.notEqual(lookup.status, 200);
});
test("scheduled retry completes an interrupted deletion without a browser session", async () => {
  const response = await fetch(`${workerBase}/__scheduled?cron=${encodeURIComponent("*/10 * * * *")}`);
  assert.equal(response.status, 200);
  const deadline = Date.now() + 5000;
  let status;
  do {
    status = (await read(`applications/${retry.uid}`)).data.fields.deletionStatus.stringValue;
    if (status === "deleted") break;
    await new Promise(resolve => setTimeout(resolve, 50));
  } while (Date.now() < deadline);
  assert.equal(status, "deleted");
});
