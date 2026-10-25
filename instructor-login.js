(function (root) {
  const SESSION_KEY = "mee101_instructor_tab_session_v1";
  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
  /** Opens both permissions together and rolls back partial or cancelled sign-ins. */
  class InstructorSession {
    constructor({ publishing, students, storage = root.sessionStorage, now = Date.now }) {
      this.publishing = publishing;
      this.students = students;
      this.generation = 0;
      this.busy = false;
      this.storage = storage;
      this.now = now;
      this.restoring = null;
    }

    async login({ token, firebaseToken, email, password }) {
      if (this.busy) return { ok: false, error: "Önceki giriş tamamlanıyor. Yeniden deneyiniz." };
      this.busy = true;
      this.restoring = null;
      const generation = ++this.generation;
      try {
        if ((!email || !password) && (!token || !firebaseToken)) throw new Error("E-posta ve parolanızı giriniz.");
        const result = email ? await this.students.signInInstructorWithPassword(email, password) : await this.students.signInInstructor(firebaseToken);
        if (!result.ok) throw new Error(result.error);
        if (generation !== this.generation) throw new Error("Giriş iptal edildi.");
        if (email) await this.publishing.login();
        else await this.publishing.login(token);
        if (generation !== this.generation) throw new Error("Giriş iptal edildi.");
        if (this.students.isAdmin === false) throw new Error("Öğretim üyesi yetkisi artık etkin değil.");
        try {
          if (email) this.storage?.removeItem(SESSION_KEY);
          else this.storage?.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt: this.now() + SESSION_DURATION_MS }));
        }
        catch { /* Login remains available if browser tab storage is disabled. */ }
        return { ok: true };
      } catch (error) {
        await this.logout();
        return { ok: false, error: error.message || "Öğretim üyesi girişi tamamlanamadı." };
      } finally {
        this.busy = false;
      }
    }

    /** Restores only after Firebase has independently confirmed the current admin. */
    async restore() {
      if (this.students.isAdmin !== true || this.busy) return { ok: false };
      if (this.restoring) return this.restoring;
      this.restoring = this.restoreToken();
      return this.restoring;
    }

    async restoreToken() {
      const generation = this.generation;
      try {
        if (typeof this.students.signInInstructorWithPassword === "function") {
          await this.publishing.login();
          if (generation !== this.generation || !this.students.isAdmin) { this.publishing.logout(); return { ok: false }; }
          return { ok: true };
        }
        const saved = JSON.parse(this.storage?.getItem(SESSION_KEY) || "null");
        if (!saved || typeof saved.token !== "string" || !Number.isFinite(saved.expiresAt) || saved.expiresAt <= this.now()) {
          this.storage?.removeItem(SESSION_KEY);
          return { ok: false };
        }
        await this.publishing.login(saved.token);
        if (generation !== this.generation || !this.students.isAdmin) {
          this.publishing.logout();
          return { ok: false };
        }
        return { ok: true };
      } catch {
        this.publishing.logout();
        try { this.storage?.removeItem(SESSION_KEY); } catch { /* Storage may be blocked. */ }
        return { ok: false };
      }
    }

    async logout() {
      ++this.generation;
      this.restoring = null;
      try { this.storage?.removeItem(SESSION_KEY); } catch { /* Session still ends in memory. */ }
      this.publishing.logout();
      return this.students.signOut();
    }
  }

  /** Accepts login results only from the opened window, configured origin and nonce. */
  function createGitHubSignIn({ host, serviceUrl, onCredentials, onState }) {
    let pending;
    const cancel = () => {
      if (!pending) return;
      host.clearInterval(pending.timer);
      host.removeEventListener("message", pending.receive);
      pending.popup.close();
      pending = null;
      onState(false);
    };
    const start = () => {
      if (pending) return;
      const url = new URL("github/start", serviceUrl);
      const requestId = Array.from(host.crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
      url.searchParams.set("request_id", requestId);
      const popup = host.open(url.href, "lecturenotes-instructor");
      if (!popup) return onState(false, "Giriş penceresi açılamadı. Bu site için açılır pencerelere izin veriniz.");
      const attempt = { popup, processing: false, deadline: Date.now() + 600000 };
      attempt.receive = async event => {
        const data = event.data;
        if (pending !== attempt || attempt.processing || event.origin !== url.origin || event.source !== popup
          || data?.type !== "lecturenotes-github") return;
        if (data.requestId !== requestId && !(data.error && !data.requestId)) return;
        attempt.processing = true;
        if (data.error) { cancel(); return onState(false, data.error); }
        let result;
        try { result = await onCredentials(data); }
        catch { result = { ok: false, error: "Giriş tamamlanamadı. Yeniden deneyiniz." }; }
        if (pending !== attempt) return;
        cancel();
        onState(false, result.ok ? "" : result.error, result.ok);
      };
      attempt.timer = host.setInterval(() => {
        if (attempt.processing) return;
        if (popup.closed || Date.now() > attempt.deadline) {
          cancel();
          onState(false, "Giriş iptal edildi veya süresi doldu. Yeniden deneyebilirsiniz.");
        }
      }, 500);
      pending = attempt;
      host.addEventListener("message", attempt.receive);
      onState(true);
    };
    return { start, cancel, isProcessing: () => pending?.processing === true };
  }

  root.InstructorSession = InstructorSession;
  root.createGitHubSignIn = createGitHubSignIn;
  if (typeof module !== "undefined") module.exports = { InstructorSession, createGitHubSignIn };
})(typeof window !== "undefined" ? window : globalThis);
