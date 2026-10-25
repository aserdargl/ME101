/** Official browser SDK handles password exchange and session-token refresh. */
window.createFirebaseStudentAdapter = async config => {
  const SDK = "https://www.gstatic.com/firebasejs/13.1.0";
  const [appSdk, authSdk, dbSdk] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`)
  ]);
  const app = appSdk.initializeApp(config, "mee101-students");
  const auth = authSdk.getAuth(app);
  const db = dbSdk.initializeFirestore(app, { localCache: dbSdk.memoryLocalCache() });
  if (window.MEE101_FIREBASE_EMULATORS && ["127.0.0.1", "localhost"].includes(location.hostname)) {
    authSdk.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    dbSdk.connectFirestoreEmulator(db, "127.0.0.1", 8088);
  }
  await authSdk.setPersistence(auth, authSdk.browserSessionPersistence);
  const reference = email => dbSdk.doc(db, "students", email);
  const enrollment = createNumberEnrollment({ db, sdk: dbSdk });
  return {
    getUser: () => auth.currentUser,
    async signInInstructorWithPassword(email, password) {
      const { user } = await authSdk.signInWithEmailAndPassword(auth, email, password);
      const registered = user.emailVerified && (await dbSdk.getDocFromServer(dbSdk.doc(db, "admins", user.uid))).exists();
      if (!registered) { await authSdk.signOut(auth); throw { code: "permission-denied" }; }
    },
    async signInInstructor(token) {
      const { user } = await authSdk.signInWithCustomToken(auth, token);
      const registered = (await dbSdk.getDocFromServer(dbSdk.doc(db, "admins", user.uid))).exists();
      if (!user.emailVerified || !registered) {
        await authSdk.signOut(auth);
        throw { code: "permission-denied" };
      }
    },
    async start(onUser) {
      authSdk.onAuthStateChanged(auth, onUser);
      await auth.authStateReady();
    },
    async isAdmin(uid) { return (await dbSdk.getDocFromServer(dbSdk.doc(db, "admins", uid))).exists(); },
    watchRoster: enrollment.watchRoster,
    watchApplications(onData, onError) {
      return dbSdk.onSnapshot(dbSdk.collection(db, "applications"), { includeMetadataChanges: true }, snapshot => {
        if (!snapshot.metadata.fromCache) onData(snapshot.docs.map(document => ({ ...document.data(), uid: document.id })));
      }, onError);
    },
    reviewApplication: createApprovalClient(auth),
    watchStudent(email, onData, onError) {
      return enrollment.watch(auth.currentUser, onData, onError);
    },
    async signIn(email, password, number, name) {
      const { user } = await authSdk.signInWithEmailAndPassword(auth, email, password);
      if (!user.emailVerified) throw { code: "auth/unverified-email" };
      const isAdmin = (await dbSdk.getDocFromServer(dbSdk.doc(db, "admins", user.uid))).exists();
      if (!isAdmin) await enrollment.complete(user, number, name);
    },
    async register(email, password, number, name) {
      let user, created = false;
      try {
        ({ user } = await authSdk.createUserWithEmailAndPassword(auth, email, password));
        created = true;
      } catch (error) {
        if (error.code !== "auth/email-already-in-use") throw error;
        ({ user } = await authSdk.signInWithEmailAndPassword(auth, email, password));
      }
      try { await enrollment.prepare(user, number, name); }
      catch (error) {
        if (created) { try { await authSdk.deleteUser(user); } catch { /* No enrollment or course permission was granted. */ } }
        await authSdk.signOut(auth);
        throw error;
      }
      await authSdk.sendEmailVerification(user, { url: new URL("./", location.href).href });
      await authSdk.signOut(auth);
    },
    async resetPassword(email) { await authSdk.sendPasswordResetEmail(auth, email); },
    async resendVerification() {
      if (!auth.currentUser) throw { code: "auth/sign-in-required" };
      await authSdk.sendEmailVerification(auth.currentUser, { url: new URL("./", location.href).href });
    },
    async writeRoster(students, removals) {
      const batch = dbSdk.writeBatch(db);
      const rosterRef = student => student.email ? reference(student.email) : dbSdk.doc(db, "studentNumbers", student.no);
      students.forEach(student => batch.set(rosterRef(student), student));
      removals.forEach(student => batch.delete(rosterRef(student)));
      await batch.commit();
    },
    resetNumber: enrollment.reset,
    updateStudent: createRosterEditClient(auth),
    signOut: () => authSdk.signOut(auth),
    errorMessage(error) {
      const messages = {
        "auth/invalid-credential": "E-posta veya parola hatalı. Yeniden deneyiniz.",
        "auth/invalid-login-credentials": "E-posta veya parola hatalı. Yeniden deneyiniz.",
        "auth/wrong-password": "E-posta veya parola hatalı. Yeniden deneyiniz.",
        "enrollment/mismatch": "Öğrenci numarası ve ad-soyad eşleşmedi, kayıt kapalı veya numara başka bir hesaba bağlı. Bilgilerinizi kontrol edin; gerekirse öğretim üyesine başvurun.",
        "enrollment/rejected": "Başvurunuz yönetici tarafından reddedildi. Erişiminiz kapatıldı.",
        "approval/unavailable": "Onay hizmeti henüz hazır değil veya yönetici oturumu kapalı.",
        "auth/unverified-email": "Önce e-postanızdaki doğrulama bağlantısını açınız; ardından tekrar giriş yapınız.",
        "auth/sign-in-required": "Önce e-posta ve parolanızla giriş yapmayı deneyiniz; ardından doğrulamayı yeniden gönderiniz.",
        "auth/email-already-in-use": "Hesap oluşturulamadı. Mevcut hesabınızla giriş yapın veya parolanızı sıfırlayın.",
        "auth/too-many-requests": "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyiniz.",
        "auth/weak-password": "Daha güçlü bir parola belirleyiniz.",
        "auth/network-request-failed": "Bağlantı kurulamadı. İnternet bağlantınızı kontrol ediniz.",
        "permission-denied": "Bu işlem için yetkiniz yok. Yönetici kaydınızı kontrol ediniz."
      };
      return (error.code === "approval/failed" && error.publicMessage) || messages[error.code] || "İşlem tamamlanamadı. E-posta, parola ve Firebase yapılandırmasını kontrol ediniz.";
    }
  };
};
