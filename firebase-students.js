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
      } catch { report("Firebase bağlantısı kurulamadı. Öğrenci erişimi kapalı; mevcut yerel veriler korundu."); }
    })();
    return ready;
  }

  async function signIn(email, password, number, name) {
    await ready;
    if (!service) return unavailable();
    const result = await service.signIn(email, password, number, name);
    if (!result.ok) return result;
    const deadline = Date.now() + 10000;
    while (!service.accessResolved && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
    if (service.profile || service.isAdmin) return { ok: true };
    await service.signOut();
    return { ok: false, error: "Bu hesap için etkin ders kaydı bulunamadı veya kayıt doğrulanamadı. Öğretim üyesine başvurunuz." };
  }

  async function saveText(text, replaceAll) {
    const result = StudentRosterImport.parse(text);
    if (!result.ok) return result;
    if (!service) return unavailable();
    return service.saveRoster(result.students, replaceAll);
  }

  return {
    initialize, signIn, saveText,
    signInInstructor: async token => { await ready; return service ? service.signInInstructor(token) : unavailable(); },
    get profile() { return service?.profile || null; },
    get isAdmin() { return service?.isAdmin === true; },
    get roster() { return service?.isAdmin ? service.roster : []; },
    get applications() { return service?.isAdmin ? service.applications : []; },
    register: async (email, password, number, name) => { await ready; return service ? service.register(email, password, number, name) : unavailable(); },
    resetPassword: async email => { await ready; return service ? service.resetPassword(email) : unavailable(); },
    resendVerification: async () => service ? service.perform(() => service.adapter.resendVerification()) : unavailable(),
    signOut: async () => service ? service.signOut() : { ok: true },
    saveRoster: async students => service ? service.saveRoster(students) : unavailable(),
    removeStudent: async key => service ? service.removeStudent(key) : unavailable(),
    removeStudents: async keys => service ? service.removeStudents(keys) : unavailable(),
    updateStudent: async edit => service ? service.updateStudent(edit) : unavailable(),
    resetNumber: async no => service ? service.resetNumber(no) : unavailable(),
    reviewApplication: async (uid, action, no, name) => service ? service.reviewApplication(uid, action, no, name) : unavailable()
  };
})();
