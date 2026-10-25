(function (root) {
  const emailPattern = /^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/;
  const normalizeEmail = value => String(value || "").trim().toLowerCase();
  const failure = error => ({ ok: false, error });
  const numbers = typeof module !== "undefined" ? require("./student-numbers.js") : root.StudentNumbers;

  /** Validates complete imports before making any remote change. */
  function parseRoster(text) {
    return numbers.parse(text);
  }

  /** Coordinates access through an injected Firebase adapter; local admin flags grant no rights. */
  class FirebaseStudentService {
    constructor(adapter, onChange = () => {}) {
      this.adapter = adapter;
      this.onChange = onChange;
      this.profile = null;
      this.isAdmin = false;
      this.roster = [];
      this.applications = [];
      this.generation = 0;
      this.accessResolved = false;
      this.unsubscribe = () => {};
      this.appliedUser = null;
      this.userUpdate = null;
    }

    async start() {
      await this.adapter.start(user => this.applyUser(user));
    }

    /** Shares the SDK callback's verification with the explicit sign-in completion. */
    applyUser(user) {
      if (user && user === this.appliedUser && this.userUpdate) return this.userUpdate;
      this.appliedUser = user;
      this.userUpdate = this.resolveUser(user);
      return this.userUpdate;
    }

    async resolveUser(user) {
      const generation = ++this.generation;
      this.unsubscribe();
      this.profile = null;
      this.isAdmin = false;
      this.roster = [];
      this.applications = [];
      this.accessResolved = false;
      this.onChange(this);
      if (!user?.emailVerified) { this.accessResolved = true; this.onChange(this); return; }
      try {
        const isAdmin = await this.adapter.isAdmin(user.uid);
        if (generation !== this.generation) return;
        this.isAdmin = isAdmin;
        if (isAdmin) {
          this.accessResolved = true;
          const stopRoster = this.adapter.watchRoster(students => {
            if (generation !== this.generation) return;
            this.roster = students;
            this.onChange(this);
          }, () => this.invalidate(generation));
          const stopApplications = this.adapter.watchApplications(applications => {
            if (generation !== this.generation) return;
            this.applications = applications;
            this.onChange(this);
          }, () => this.invalidate(generation));
          this.unsubscribe = () => { stopRoster(); stopApplications(); };
        } else {
          this.unsubscribe = this.adapter.watchStudent(normalizeEmail(user.email), (student, { pending = false } = {}) => {
            if (generation !== this.generation) return;
            this.profile = student?.enabled === true ? student : null;
            this.accessResolved = !pending;
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
      this.applications = [];
      this.accessResolved = true;
      this.onChange(this);
    }

    async signIn(email, password, number, name) {
      const result = await this.perform(() => this.adapter.signIn(normalizeEmail(email), password, number, name));
      if (result.ok) await this.applyUser(this.adapter.getUser());
      return result;
    }

    async register(email, password, number, name) {
      if (!emailPattern.test(normalizeEmail(email))) return failure("Geçerli bir e-posta giriniz.");
      if (password.length < 12) return failure("En az 12 karakterli bir parola belirleyiniz.");
      if (!numbers.normalize(number) || !numbers.nameKey(name)) return failure("Öğrenci numaranızı ve ad-soyadınızı giriniz.");
      return this.perform(() => this.adapter.register(normalizeEmail(email), password, number, name));
    }

    /** Never creates enrollment or roster entries when signing in an instructor. */
    async signInInstructorWithPassword(email, password) {
      const result = await this.perform(() => this.adapter.signInInstructorWithPassword(normalizeEmail(email), password));
      if (!result.ok) return result;
      await this.applyUser(this.adapter.getUser());
      if (this.isAdmin) return { ok: true };
      await this.signOut();
      return failure("Öğretim üyesi yetkisi doğrulanamadı.");
    }

    /** Never creates enrollment or roster entries when signing in an instructor. */
    async signInInstructor(token) {
      const result = await this.perform(() => this.adapter.signInInstructor(token));
      if (!result.ok) return result;
      await this.applyUser(this.adapter.getUser());
      if (this.isAdmin) return { ok: true };
      await this.signOut();
      return failure("Öğretim üyesi yetkisi doğrulanamadı.");
    }

    async resetPassword(email) {
      if (!emailPattern.test(normalizeEmail(email))) return failure("E-posta adresinizi giriniz.");
      return this.perform(() => this.adapter.resetPassword(normalizeEmail(email)));
    }

    async saveRoster(students, replaceAll = false) {
      if (!this.isAdmin) return failure("Ortak listeyi değiştirmek için öğretim üyesi girişi yapınız.");
      const key = student => student.email || student.no;
      const incoming = new Map(students.map(student => [key(student), student]));
      const removals = replaceAll ? this.roster.filter(student => !student.email && !incoming.has(key(student))) : [];
      if (students.length + removals.length > 450) return failure("Tek işlemde en fazla 450 kayıt değiştirilebilir. Listeyi daha küçük parçalarla ekleyiniz.");
      return this.perform(() => this.adapter.writeRoster(students, removals));
    }

    async removeStudent(key) {
      return this.removeStudents([key]);
    }

    /** Removes only the explicitly selected roster records in bounded batches. */
    async removeStudents(keys) {
      const BATCH_SIZE = 450;
      const selected = [...new Set(keys)];
      let removed = 0;
      for (let start = 0; start < selected.length; start += BATCH_SIZE) {
        if (!this.isAdmin) return { ...failure("Öğretim üyesi girişi gerekli."), removed };
        const records = selected.slice(start, start + BATCH_SIZE).map(key => key.includes("@") ? { email: key } : { no: key });
        const result = await this.perform(() => this.adapter.writeRoster([], records));
        if (!result.ok) return { ...result, removed };
        removed += records.length;
      }
      return this.isAdmin ? { ok: true, removed } : failure("Öğretim üyesi girişi gerekli.");
    }

    /** Updates one existing record without enabling it or overwriting a stale edit. */
    async updateStudent(edit) {
      if (!this.isAdmin) return failure("Öğretim üyesi girişi gerekli.");
      const name = `${edit.firstName.trim()} ${edit.surname.trim()}`.trim();
      if (!numbers.normalize(edit.no) || !edit.firstName.trim() || name.length > 200) return failure("Geçerli öğrenci numarası ve isim gerekli (ad-soyad en fazla 200 karakter).");
      const key = student => student.email || student.no;
      if (this.roster.some(student => key(student) !== key(edit.original) && student.no === edit.no.trim())) return failure("Bu öğrenci numarası listede zaten var.");
      try {
        const result = await this.adapter.updateStudent(edit);
        if (result.ok && this.isAdmin) {
          this.roster = this.roster.map(student => key(student) === key(edit.original) ? result.student : student);
          this.onChange(this);
        }
        return result;
      } catch (error) { return failure(this.adapter.errorMessage(error)); }
    }

    async resetNumber(no) {
      if (!this.isAdmin) return failure("Öğretim üyesi girişi gerekli.");
      return this.perform(() => this.adapter.resetNumber(no));
    }

    async reviewApplication(uid, action, no, name) {
      if (!this.isAdmin) return failure("Öğretim üyesi girişi gerekli.");
      try { return { ...await this.adapter.reviewApplication(uid, action, no, name), ok: true }; }
      catch (error) { return failure(this.adapter.errorMessage(error)); }
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
