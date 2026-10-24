/** Uses synthetic SDK events on localhost; never signs in to a live account. */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.route("**/firebase-config.js*", route => route.fulfill({ contentType: "text/javascript", body: "window.MEE101_FIREBASE_CONFIG={synthetic:true};" }));
    await page.addInitScript(() => {
      let user = null, onUser;
      window.qaSignIn = { signedOut: false, events: [] };
      Object.defineProperty(window, "createFirebaseStudentAdapter", {
        get: () => async () => {
          const sdk = {
            doc: (_, collection, id) => `${collection}/${id}`,
            onSnapshot(reference, _, next) {
              const cache = setTimeout(() => {
                window.qaSignIn.events.push(`cache:${reference}`);
                next({ metadata: { fromCache: true }, exists: () => false });
              }, 0);
              const server = setTimeout(() => {
                const application = reference.startsWith("applications/");
                const data = application ? { status: "approved", approvedNo: "00123", approvedName: "Synthetic Student" } : { enabled: true };
                window.qaSignIn.events.push(`server:${reference}`);
                next({ metadata: { fromCache: false }, exists: () => true, data: () => data });
              }, 250);
              return () => { clearTimeout(cache); clearTimeout(server); };
            }
          };
          const enrollment = window.createNumberEnrollment({ db: {}, sdk });
          return {
            start: async callback => { onUser = callback; await onUser(null); },
            getUser: () => user,
            isAdmin: async () => false,
            signIn: async () => {
              user = { uid: "synthetic", email: "synthetic@example.test", emailVerified: true };
              await onUser(user);
            },
            watchStudent: (_, next, error) => enrollment.watch(user, next, error),
            signOut: async () => { window.qaSignIn.signedOut = true; user = null; await onUser(null); },
            errorMessage: error => error.message
          };
        },
        set() {}
      });
    });
    await page.goto("http://127.0.0.1:4193/qa");
    await page.locator("#btn-student-toggle").click();
    await page.locator("#inp-student-email").fill("synthetic@example.test");
    await page.locator("#inp-student-password").fill("Synthetic-Only-123!");
    await page.locator("#btn-submit-student-login").click();
    await page.waitForFunction(() => window.FirebaseStudents.profile?.no === "00123");
    await page.waitForFunction(() => document.getElementById("student-login-backdrop").classList.contains("hidden"));
    const proof = await page.evaluate(() => ({ ...window.qaSignIn,
      profile: window.FirebaseStudents.profile,
      preserved: JSON.parse(localStorage.getItem("me101_all_lectures_v2"))[0].id === "qa-original" }));
    assert.equal(proof.signedOut, false);
    assert.equal(proof.profile.approvalStatus, "approved");
    assert.equal(proof.preserved, true);
    assert.ok(proof.events.includes("cache:applications/synthetic"));
    assert.ok(proof.events.includes("server:studentNumbers/00123"));
    assert.deepEqual(errors, []);
    process.stdout.write("Student sign-in passed with empty cache snapshots and delayed approved server records; original notes preserved.\n");
  } finally { await browser.close(); }
}

run().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
