(function (root) {
  const numbers = typeof module !== "undefined" ? require("./student-numbers.js") : root.StudentNumbers;

  /** Stores a self-declared student number; it never grants instructor permissions. */
  class StudentSession {
    constructor(storage, key) {
      this.storage = storage;
      this.key = key;
      this.number = null;
      try { this.number = numbers.normalize(storage.getItem(key)); } catch { /* Entry still works without storage. */ }
    }

    /** Accepts any valid student number without an account or roster lookup. */
    signIn(value) {
      const number = numbers.normalize(value);
      if (!number) return { ok: false, error: "Geçerli bir öğrenci numarası giriniz (yalnızca rakam, en fazla 32 hane)." };
      this.number = number;
      try { this.storage.setItem(this.key, number); } catch { /* Keep this page's session active. */ }
      return { ok: true, number };
    }

    /** Ends only the student's session, preserving notes, ratings and instructor access. */
    signOut() {
      try { this.storage.removeItem(this.key); } catch {
        return { ok: false, error: "Oturum kapatılamadı. Tarayıcı depolama izinlerini kontrol ediniz." };
      }
      this.number = null;
      return { ok: true };
    }
  }

  root.StudentSession = StudentSession;
  if (typeof module !== "undefined") module.exports = { StudentSession };
})(typeof window !== "undefined" ? window : globalThis);
