const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { FirebaseStudentService } = require("../firebase-student-service.js");

function fixture() {
  const host = {}, listeners = new Map();
  vm.runInNewContext(fs.readFileSync(require.resolve("../firebase-enrollment.js"), "utf8"), { window: host });
  const sdk = {
    doc: (_, collection, id) => `${collection}/${id}`,
    onSnapshot(reference, _, next, error) {
      const subscription = { next, error };
      listeners.set(reference, subscription);
      return () => { if (listeners.get(reference) === subscription) listeners.delete(reference); };
    }
  };
  const enrollment = host.createNumberEnrollment({ db: {}, sdk });
  const user = { uid: "synthetic", email: "student@example.test", emailVerified: true };
  const service = new FirebaseStudentService({ isAdmin: async () => false,
    watchStudent: (_, next, error) => enrollment.watch(user, next, error) });
  const emit = (reference, data, fromCache = false) => listeners.get(reference).next({
    metadata: { fromCache }, exists: () => data !== null, data: () => data
  });
  const pending = () => { assert.equal(service.profile, null); assert.equal(service.accessResolved, false); };
  return { service, user, emit, pending, listeners };
}

test("approved student waits for server application and roster instead of rejecting empty cache", async () => {
  const { service, user, emit, pending } = fixture();
  await service.applyUser(user);
  emit("applications/synthetic", null, true); pending();
  emit("applications/synthetic", { status: "approved", approvedNo: "001", approvedName: "Approved Student" });
  emit("studentNumbers/001", null, true); pending();
  emit("studentNumbers/001", { enabled: true });
  assert.equal(service.profile.no, "001");
  assert.equal(service.profile.approvalStatus, "approved");
  assert.equal(service.accessResolved, true);
  emit("studentNumbers/001", { enabled: false });
  assert.equal(service.profile, null);
  assert.equal(service.accessResolved, true);
});

test("number enrollment waits through each cache snapshot and grants only active server records", async () => {
  const { service, user, emit, pending } = fixture();
  await service.applyUser(user);
  emit("applications/synthetic", null);
  emit("enrollments/synthetic", null, true); pending();
  emit("enrollments/synthetic", { no: "002" });
  emit("studentNumbers/002", { no: "002", enabled: true }, true); pending();
  emit("studentNumbers/002", { no: "002", enabled: true });
  assert.equal(service.profile.no, "002");
  emit("studentNumbers/002", null);
  assert.equal(service.profile, null);
  assert.equal(service.accessResolved, true);
});

test("legacy enrollment waits for server; a confirmed missing record resolves denied", async () => {
  const { service, user, emit, pending } = fixture();
  await service.applyUser(user);
  emit("applications/synthetic", null);
  emit("enrollments/synthetic", null);
  emit("students/student@example.test", null, true); pending();
  emit("students/student@example.test", { no: "003", enabled: true });
  assert.equal(service.profile.no, "003");
  emit("students/student@example.test", null);
  assert.equal(service.profile, null);
  assert.equal(service.accessResolved, true);
});

test("pending, rejected and failed server checks preserve the existing access policy", async () => {
  const { service, user, emit, listeners } = fixture();
  await service.applyUser(user);
  emit("applications/synthetic", { no: "004", name: "Pending Student", status: "pending" });
  assert.equal(service.profile.approvalStatus, "pending");
  emit("applications/synthetic", { status: "rejected" });
  assert.equal(service.profile, null);
  assert.equal(service.accessResolved, true);
  listeners.get("applications/synthetic").error(new Error("denied"));
  assert.equal(service.profile, null);
  assert.equal(service.accessResolved, true);
});

test("the public bridge exposes instructor access without student account creation or sign-in", async () => {
  const { service } = fixture();
  service.adapter.start = async () => {};
  const host = { MEE101_FIREBASE_CONFIG: {}, createFirebaseStudentAdapter: async () => service.adapter,
    FirebaseStudentService, StudentRosterImport: {} };
  const context = { window: host, ...host, document: { getElementById: () => ({}) }, setTimeout, Date };
  vm.runInNewContext(fs.readFileSync(require.resolve("../firebase-students.js"), "utf8"), context);
  await host.FirebaseStudents.initialize(() => {});
  assert.equal(host.FirebaseStudents.signIn, undefined);
  assert.equal(host.FirebaseStudents.register, undefined);
  assert.equal(host.FirebaseStudents.resendVerification, undefined);
  assert.equal(typeof host.FirebaseStudents.signInInstructorWithPassword, "function");
  assert.equal(typeof host.FirebaseStudents.resetPassword, "function");
});
