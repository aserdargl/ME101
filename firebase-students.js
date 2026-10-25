/** Connects the private access service to the existing compact portal controls. */
window.FirebaseStudents = (() => {
  let service;
  let ready;
  const status = () => document.getElementById("roster-sync-status");
  const report = text => { status().textContent = text; };
  const unavailable = () => ({ ok: false, error: "Firebase bağlantısı henüz yapılandırılmadı. Öğretim üyesine başvurunuz." });

  async function initialize(onChange) {
    if (ready) return ready;
    ready = (async () => {
      if (!window.MEE101_FIREBASE_CONFIG) { report(unavailable().error); return; }
      try {
        const adapter = await createFirebaseStudentAdapter(window.MEE101_FIREBASE_CONFIG);
        service = new FirebaseStudentService(adapter, state => {
          report(state.isAdmin ? "Öğretim üyesi oturumu · Gizli öğrenci listesi bağlantısı etkin." : "Öğrencileri yönetmek için öğretim üyesi girişi yapınız.");
          onChange(state);
        });
        await service.start();
      } catch { report("Öğretim üyesi bağlantısı kurulamadı; mevcut yerel veriler korundu."); }
    })();
    return ready;
  }

  async function saveText(text, replaceAll) {
    const result = StudentRosterImport.parse(text);
    if (!result.ok) return result;
    if (!service) return unavailable();
    return service.saveRoster(result.students, replaceAll);
  }

  return {
    initialize, saveText,
    signInInstructorWithPassword: async (email, password) => { await ready; return service ? service.signInInstructorWithPassword(email, password) : unavailable(); },
    getIdToken: async (forceRefresh = true) => {
      await ready;
      if (!service?.isAdmin) throw new Error("Öğretim üyesi girişi gerekli.");
      return service.adapter.getUser().getIdToken(forceRefresh);
    },
    signInInstructor: async token => { await ready; return service ? service.signInInstructor(token) : unavailable(); },
    get isAdmin() { return service?.isAdmin === true; },
    /** Returns the signed-in instructor identity without changing the account. */
    get instructorName() {
      if (!service?.isAdmin) return "";
      const user = service.adapter.getUser();
      return user?.displayName?.trim() || user?.email || "";
    },
    get roster() { return service?.isAdmin ? service.roster : []; },
    get applications() { return service?.isAdmin ? service.applications : []; },
    resetPassword: async email => { await ready; return service ? service.resetPassword(email) : unavailable(); },
    signOut: async () => service ? service.signOut() : { ok: true },
    saveRoster: async students => service ? service.saveRoster(students) : unavailable(),
    removeStudent: async key => service ? service.removeStudent(key) : unavailable(),
    removeStudents: async keys => service ? service.removeStudents(keys) : unavailable(),
    updateStudent: async edit => service ? service.updateStudent(edit) : unavailable(),
    resetNumber: async no => service ? service.resetNumber(no) : unavailable(),
    reviewApplication: async (uid, action, no, name) => service ? service.reviewApplication(uid, action, no, name) : unavailable()
  };
})();
