/** Real adapter/service with synthetic SDK responses; never touches live accounts. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const { FirebaseStudentService } = require('../firebase-student-service.js');

async function fixture({ registered = true, verified = true, delayMs = 100 } = {}) {
  const state = { roleReads: 0, rosterStarts: 0, signOuts: 0 };
  const auth = { currentUser: null, authStateReady: async () => {} };
  let observer = () => {};
  const user = { uid: 'synthetic-admin', email: 'qa@example.test', emailVerified: verified };
  const authSdk = {
    getAuth: () => auth, setPersistence: async () => {},
    onAuthStateChanged: (_, callback) => { observer = callback; callback(null); },
    signInWithEmailAndPassword: async () => {
      auth.currentUser = user;
      observer(user);
      return { user };
    },
    signOut: async () => { state.signOuts++; auth.currentUser = null; observer(null); }
  };
  const dbSdk = {
    memoryLocalCache: () => ({}), initializeFirestore: () => ({}),
    doc: (_, collection, id) => `${collection}/${id}`,
    async getDocFromServer() {
      state.roleReads++;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return { exists: () => registered };
    },
    collection: (_, name) => name, onSnapshot: () => () => {}
  };
  const host = {};
  const context = { window: host, location: { hostname: 'localhost' },
    createNumberEnrollment: () => ({ watchRoster: () => { state.rosterStarts++; return () => {}; } }),
    createApprovalClient: () => ({}), createRosterEditClient: () => ({}),
    loadSdk: async url => url.endsWith('firebase-app.js') ? { initializeApp: () => ({}) }
      : url.endsWith('firebase-auth.js') ? authSdk : dbSdk };
  const source = fs.readFileSync(require.resolve('../firebase-adapter.js'), 'utf8').replace(/\bimport\(/g, 'loadSdk(');
  vm.runInNewContext(source, context);
  const service = new FirebaseStudentService(await host.createFirebaseStudentAdapter({}));
  await service.start();
  return { service, state, user };
}

test('instructor login verifies the role once and starts one set of listeners', async () => {
  const { service, state } = await fixture();
  const start = performance.now();
  assert.equal((await service.signInInstructorWithPassword('qa@example.test', 'synthetic')).ok, true);
  console.info(JSON.stringify({ loginMs: Math.round(performance.now() - start), ...state }));
  if (process.env.LOGIN_BASELINE !== '1') {
    assert.equal(state.roleReads, 1);
    assert.equal(state.rosterStarts, 1);
  }
  assert.equal(service.isAdmin, true);
  await service.signOut();
  assert.equal(service.isAdmin, false);
});

test('missing administrator and unverified email still deny instructor access', async () => {
  for (const options of [{ registered: false }, { verified: false }]) {
    const { service } = await fixture(options);
    assert.equal((await service.signInInstructorWithPassword('qa@example.test', 'synthetic')).ok, false);
    assert.equal(service.isAdmin, false);
  }
});

test('logout while the role check is pending cannot restore instructor access', async () => {
  const { service } = await fixture();
  const login = service.signInInstructorWithPassword('qa@example.test', 'synthetic');
  await new Promise(resolve => setImmediate(resolve));
  await service.signOut();
  assert.equal((await login).ok, false);
  assert.equal(service.isAdmin, false);
});
