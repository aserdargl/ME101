/** Private number/name matching and atomic one-number/one-account enrollment. */
window.createNumberEnrollment = ({ db, sdk }) => {
  const ref = (collection, id) => sdk.doc(db, collection, id);
  const emailOf = user => user.email.trim().toLowerCase();
  const mismatch = () => ({ code: "enrollment/mismatch" });

  async function prepare(user, number, name) {
    const no = StudentNumbers.normalize(number);
    const key = StudentNumbers.nameKey(name);
    if (!no || !key) throw mismatch();
    const existing = await sdk.getDocFromServer(ref("applications", user.uid));
    if (existing.exists()) {
      if (existing.data().status === "rejected") throw { code: "enrollment/rejected" };
      return;
    }
    try {
      await sdk.setDoc(ref("registrationRequests", user.uid), { no, nameKey: key, email: emailOf(user) });
    } catch (error) {
      if (error.code === "permission-denied") {
        await sdk.setDoc(ref("applications", user.uid), { no, name: name.trim().replace(/\s+/g, " "), nameKey: key,
          email: emailOf(user), status: "pending", createdAt: sdk.serverTimestamp() });
        return;
      }
      throw error;
    }
  }

  async function complete(user, number, name) {
    const application = await sdk.getDocFromServer(ref("applications", user.uid));
    if (application.exists()) {
      if (application.data().status === "rejected") throw { code: "enrollment/rejected" };
      return;
    }
    if ((await sdk.getDocFromServer(ref("enrollments", user.uid))).exists()) return;
    if (number || name) {
      await prepare(user, number, name);
      if ((await sdk.getDocFromServer(ref("applications", user.uid))).exists()) return;
    }
    const request = await sdk.getDocFromServer(ref("registrationRequests", user.uid));
    if (!request.exists()) return;
    const data = request.data();
    const batch = sdk.writeBatch(db);
    batch.set(ref("numberClaims", data.no), { uid: user.uid });
    batch.set(ref("enrollments", user.uid), { no: data.no, nameKey: data.nameKey, email: emailOf(user) });
    try { await batch.commit(); }
    catch (error) {
      if (error.code === "permission-denied") throw mismatch();
      throw error;
    }
  }

  function watchExisting(user, onData, onError) {
    let stopNumber = () => {};
    let closed = false;
    const stopEnrollment = sdk.onSnapshot(ref("enrollments", user.uid), { includeMetadataChanges: true }, snapshot => {
      stopNumber();
      if (snapshot.metadata.fromCache) { onData(null, { pending: true }); return; }
      if (!snapshot.exists()) {
        stopNumber = sdk.onSnapshot(ref("students", emailOf(user)), { includeMetadataChanges: true }, legacy => {
          if (!closed) onData(!legacy.metadata.fromCache && legacy.exists() ? legacy.data() : null, { pending: legacy.metadata.fromCache });
        }, onError);
        return;
      }
      const enrollment = snapshot.data();
      stopNumber = sdk.onSnapshot(ref("studentNumbers", enrollment.no), { includeMetadataChanges: true }, roster => {
        if (closed) return;
        const student = !roster.metadata.fromCache && roster.exists() ? roster.data() : null;
        onData(student ? { ...student, email: emailOf(user) } : null, { pending: roster.metadata.fromCache });
      }, onError);
    }, onError);
    return () => { closed = true; stopNumber(); stopEnrollment(); };
  }

  function watch(user, onData, onError) {
    let stopExisting = () => {};
    const stopApplication = sdk.onSnapshot(ref("applications", user.uid), { includeMetadataChanges: true }, snapshot => {
      stopExisting();
      if (snapshot.metadata.fromCache) { onData(null, { pending: true }); return; }
      if (!snapshot.exists()) { stopExisting = watchExisting(user, onData, onError); return; }
      const application = snapshot.data();
      if (application.status === "rejected") { onData(null); return; }
      const profile = { no: application.approvedNo || application.no, name: application.approvedName || application.name,
        email: emailOf(user), enabled: true, approvalStatus: application.status, accessKey: user.uid };
      if (application.status === "pending") { onData(profile); return; }
      if (application.status !== "approved") { onData(null); return; }
      stopExisting = sdk.onSnapshot(ref("studentNumbers", profile.no), { includeMetadataChanges: true }, roster => {
        onData(!roster.metadata.fromCache && roster.exists() && roster.data().enabled === true ? profile : null, { pending: roster.metadata.fromCache });
      }, onError);
    }, onError);
    return () => { stopApplication(); stopExisting(); };
  }

  function watchRoster(onData, onError) {
    let numbers = [], emails = [], numbersReady = false, emailsReady = false;
    const emit = () => { if (numbersReady && emailsReady) onData([...numbers, ...emails]); };
    const stopNumbers = sdk.onSnapshot(sdk.collection(db, "studentNumbers"), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache) return;
      numbers = snapshot.docs.map(document => document.data()); numbersReady = true; emit();
    }, onError);
    const stopEmails = sdk.onSnapshot(sdk.collection(db, "students"), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache) return;
      emails = snapshot.docs.map(document => document.data()); emailsReady = true; emit();
    }, onError);
    return () => { stopNumbers(); stopEmails(); };
  }

  async function reset(no) {
    const claim = await sdk.getDocFromServer(ref("numberClaims", no));
    if (!claim.exists()) return;
    const batch = sdk.writeBatch(db);
    const uid = claim.data().uid;
    batch.delete(ref("numberClaims", no));
    batch.delete(ref("enrollments", uid));
    batch.delete(ref("registrationRequests", uid));
    await batch.commit();
  }

  return { prepare, complete, watch, watchRoster, reset };
};
