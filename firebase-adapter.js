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
  return {
    async start(onUser) {
      authSdk.onAuthStateChanged(auth, onUser);
      await auth.authStateReady();
    },
    async isAdmin(uid) { return (await dbSdk.getDocFromServer(dbSdk.doc(db, "admins", uid))).exists(); },
    watchRoster(onData, onError) {
      return dbSdk.onSnapshot(dbSdk.collection(db, "students"), { includeMetadataChanges: true }, snapshot => {
        if (!snapshot.metadata.fromCache) onData(snapshot.docs.map(document => document.data()));
      }, onError);
    },
    watchStudent(email, onData, onError) {
      return dbSdk.onSnapshot(reference(email), { includeMetadataChanges: true }, snapshot => {
        // Never grant access based on an offline or previously cached record.
        onData(!snapshot.metadata.fromCache && snapshot.exists() ? snapshot.data() : null);
      }, onError);
    },
    async signIn(email, password) {
      const { user } = await authSdk.signInWithEmailAndPassword(auth, email, password);
      if (!user.emailVerified) throw { code: "auth/unverified-email" };
    },
    async register(email, password) {
      const { user } = await authSdk.createUserWithEmailAndPassword(auth, email, password);
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
      students.forEach(student => batch.set(reference(student.email), student));
      removals.forEach(student => batch.delete(reference(student.email)));
      await batch.commit();
    },
    signOut: () => authSdk.signOut(auth),
    errorMessage(error) {
      const messages = {
        "auth/unverified-email": "Önce e-postanızdaki doğrulama bağlantısını açınız; ardından tekrar giriş yapınız.",
        "auth/sign-in-required": "Önce e-posta ve parolanızla giriş yapmayı deneyiniz; ardından doğrulamayı yeniden gönderiniz.",
        "auth/email-already-in-use": "Hesap oluşturulamadı. Mevcut hesabınızla giriş yapın veya parolanızı sıfırlayın.",
        "auth/too-many-requests": "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyiniz.",
        "auth/weak-password": "Daha güçlü bir parola belirleyiniz.",
        "auth/network-request-failed": "Bağlantı kurulamadı. İnternet bağlantınızı kontrol ediniz.",
        "permission-denied": "Bu işlem için yetkiniz yok. Yönetici kaydınızı kontrol ediniz."
      };
      return messages[error.code] || "İşlem tamamlanamadı. E-posta, parola ve Firebase yapılandırmasını kontrol ediniz.";
    }
  };
};
