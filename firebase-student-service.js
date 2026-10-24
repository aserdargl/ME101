(function (root) {
  const emailPattern = /^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/;
  const normalizeEmail = value => String(value || "").trim().toLowerCase();
  const failure = error => ({ ok: false, error });

  /** Validates complete imports before making any remote change. */
  function parseRoster(text) {
    const students = new Map();
    const lines = String(text).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    for (const [index, line] of lines.entries()) {
      const [address, no = "", ...name] = line.split(/[;\t,]/).map(value => value.trim());
      const email = normalizeEmail(address);
      const student = { email, no, name: name.join(" "), enabled: true };
      if (!emailPattern.test(email) || email.length > 254 || no.length > 80 || student.name.length > 200) {
        return failure(`${index + 1}. satır geçersiz. Biçim: e-posta;öğrenci numarası;ad soyad`);
      }
      students.set(email, student);
    }
    if (!students.size) return failure("En az bir öğrenci e-postası giriniz.");
    return { ok: true, students: [...students.values()] };
  }

  /** Coordinates access through an injected Firebase adapter; local admin flags grant no rights. */
  class FirebaseStudentService {
    constructor(adapter, onChange = () => {}) {
      this.adapter = adapter;
      this.onChange = onChange;
      this.profile = null;
      this.isAdmin = false;
      this.roster = [];
      this.generation = 0;
      this.accessResolved = false;
      this.unsubscribe = () => {};
    }

    async start() {
      await this.adapter.start(user => this.applyUser(user));
    }

    async applyUser(user) {
      const generation = ++this.generation;
      this.unsubscribe();
      this.profile = null;
      this.isAdmin = false;
      this.roster = [];
      this.accessResolved = false;
      this.onChange(this);
      if (!user?.emailVerified) { this.accessResolved = true; return; }
      try {
        const isAdmin = await this.adapter.isAdmin(user.uid);
        if (generation !== this.generation) return;
        this.isAdmin = isAdmin;
        if (isAdmin) {
          this.accessResolved = true;
          this.unsubscribe = this.adapter.watchRoster(students => {
            if (generation !== this.generation) return;
            this.roster = students;
            this.onChange(this);
          }, () => this.invalidate(generation));
        } else {
          this.unsubscribe = this.adapter.watchStudent(normalizeEmail(user.email), student => {
            if (generation !== this.generation) return;
            this.profile = student?.enabled === true ? student : null;
            this.accessResolved = true;
            this.onChange(this);
          }, () => this.invalidate(generation));
        }
        this.onChange(this);
      } catch { this.invalidate(generation); }
    }

    invalidate(generation) {
      if (generation !== this.generation) return;
      this.profile = null;
      this.isAdmin = false;
      this.roster = [];
      this.accessResolved = true;
      this.onChange(this);
    }

    async signIn(email, password) {
      return this.perform(() => this.adapter.signIn(normalizeEmail(email), password));
    }

    async register(email, password) {
      if (!emailPattern.test(normalizeEmail(email))) return failure("Geçerli bir e-posta giriniz.");
      if (password.length < 12) return failure("En az 12 karakterli bir parola belirleyiniz.");
      return this.perform(() => this.adapter.register(normalizeEmail(email), password));
    }

    async resetPassword(email) {
      if (!emailPattern.test(normalizeEmail(email))) return failure("E-posta adresinizi giriniz.");
      return this.perform(() => this.adapter.resetPassword(normalizeEmail(email)));
    }

    async saveRoster(students, replaceAll = false) {
      if (!this.isAdmin) return failure("Ortak listeyi değiştirmek için yetkili Firebase hesabıyla giriş yapınız.");
      const incoming = new Map(students.map(student => [student.email, student]));
      const removals = replaceAll ? this.roster.filter(student => !incoming.has(student.email)) : [];
      if (students.length + removals.length > 450) return failure("Tek işlemde en fazla 450 kayıt değiştirilebilir. Listeyi daha küçük parçalarla ekleyiniz.");
      return this.perform(() => this.adapter.writeRoster(students, removals));
    }

    async removeStudent(email) {
      if (!this.isAdmin) return failure("Firebase yönetici girişi gerekli.");
      return this.perform(() => this.adapter.writeRoster([], [{ email }]));
    }

    async perform(action) {
      try { await action(); return { ok: true }; }
      catch (error) { return failure(this.adapter.errorMessage(error)); }
    }

    async signOut() {
      await this.applyUser(null);
      return this.perform(() => this.adapter.signOut());
    }
  }

  root.FirebaseStudentService = FirebaseStudentService;
  root.StudentRosterImport = { parse: parseRoster };
  if (typeof module !== "undefined") module.exports = { FirebaseStudentService, parseRoster };
})(typeof window !== "undefined" ? window : globalThis);
