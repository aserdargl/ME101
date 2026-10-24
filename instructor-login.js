(function (root) {
  /** Opens both permissions together and rolls back partial or cancelled sign-ins. */
  class InstructorSession {
    constructor({ publishing, students }) {
      this.publishing = publishing;
      this.students = students;
      this.generation = 0;
      this.busy = false;
    }

    async login({ token, firebaseToken }) {
      if (this.busy) return { ok: false, error: "Önceki giriş tamamlanıyor. Yeniden deneyiniz." };
      this.busy = true;
      const generation = ++this.generation;
      try {
        if (!token || !firebaseToken) throw new Error("Giriş bilgileri eksik. Yeniden deneyiniz.");
        const result = await this.students.signInInstructor(firebaseToken);
        if (!result.ok) throw new Error(result.error);
        if (generation !== this.generation) throw new Error("Giriş iptal edildi.");
        await this.publishing.login(token);
        if (generation !== this.generation) throw new Error("Giriş iptal edildi.");
        if (this.students.isAdmin === false) throw new Error("Öğretim üyesi yetkisi artık etkin değil.");
        return { ok: true };
      } catch (error) {
        await this.logout();
        return { ok: false, error: error.message || "Öğretim üyesi girişi tamamlanamadı." };
      } finally {
        this.busy = false;
      }
    }

    async logout() {
      ++this.generation;
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
