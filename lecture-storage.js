(function (root) {
  const DATABASE = "mee101-notes-v1";
  const STORE = "lecture-snapshots";
  let database;
  let pending = 0;
  let saveQueue = Promise.resolve();
  let warning = "";
  const LEGACY_KEY = "me101_all_lectures_v2";
  const report = message => root.dispatchEvent(new CustomEvent("lecture-storage-status", { detail: message }));
  const fingerprint = async text => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text || "")))).map(byte => byte.toString(16).padStart(2, "0")).join("");

  function open() {
    if (database) return database;
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(error => { database = undefined; throw error; });
    return database;
  }

  async function documentFingerprint(lectures) {
    return partsFingerprint(root.LectureDocument.parts(lectures));
  }

  async function partsFingerprint(parts) {
    const hashes = [];
    for (const part of parts) hashes.push(await fingerprint(part));
    return fingerprint(JSON.stringify(hashes));
  }

  /** Reads both original snapshots and compact, reference-preserving documents. */
  function readRecord(record) {
    if (Array.isArray(record.lectures)) return record.lectures;
    if (record.format !== 2 || !Array.isArray(record.parts)) throw new Error("Invalid local lecture record");
    const decoder = root.LectureDocument.decoder();
    for (const part of record.parts) decoder.add(part);
    const lectures = decoder.result();
    if (!Array.isArray(lectures)) throw new Error("Invalid local lecture document");
    return lectures;
  }

  /** Keeps one recovery copy per distinct document; all earlier backups remain intact. */
  async function save(lectures) {
    pending += 1;
    const previous = saveQueue;
    let release;
    saveQueue = new Promise(resolve => { release = resolve; });
    try {
      const snapshot = root.LectureDocument.snapshot(lectures);
      let legacyText = "";
      try { legacyText = localStorage.getItem(LEGACY_KEY) || ""; } catch { /* IndexedDB remains independent. */ }
      await previous;
      const db = await open();
      const legacyFingerprint = await fingerprint(legacyText);
      const parts = Array.from(root.LectureDocument.parts(snapshot));
      const digest = await partsFingerprint(parts);
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        const store = transaction.objectStore(STORE);
        const record = { savedAt: new Date().toISOString(), format: 2, parts, legacyFingerprint };
        const backupKey = `backup-sha256-${digest}`;
        const request = store.getKey(backupKey);
        request.onsuccess = () => {
          if (request.result === undefined) store.put(record, backupKey);
          store.put(record, "current");
        };
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      return true;
    } catch {
      report("Yerel yedek kaydedilemedi. Bu sayfayı kapatmadan ders verisini dışa aktarın veya GitHub’a yayımlayın.");
      return false;
    } finally { await previous; pending -= 1; release(); }
  }

  /** Reads saved data without removing or rewriting legacy browser records. */
  async function load() {
    try {
      const db = await open();
      const record = await new Promise((resolve, reject) => {
        const request = db.transaction(STORE).objectStore(STORE).get("current");
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      if (!record) return null;
      const lectures = readRecord(record);
      let legacyText;
      try { legacyText = localStorage.getItem(LEGACY_KEY); } catch { return lectures; }
      if (!legacyText || await fingerprint(legacyText) === record.legacyFingerprint) return lectures;
      let legacy;
      try { legacy = JSON.parse(legacyText); } catch { return lectures; }
      if (!Array.isArray(legacy)) return lectures;
      if (await documentFingerprint(legacy) === await documentFingerprint(lectures)) return lectures;
      const merged = root.LectureDocument.snapshot(lectures);
      for (const lecture of legacy) {
        const existing = lectures.find(item => item.id === lecture.id);
        if (!existing) merged.push(lecture);
        else if (await documentFingerprint(existing) !== await documentFingerprint(lecture)) merged.push({ ...lecture, id: `legacy-${crypto.randomUUID()}`, title: `${lecture.title} (Diğer yerel kayıt)` });
      }
      warning = "Bu tarayıcıda farklı iki yerel kayıt bulundu; her iki sürüm de korundu. ‘Diğer yerel kayıt’ derslerini inceleyebilirsiniz.";
      return merged;
    } catch { return null; }
  }

  root.addEventListener("beforeunload", event => {
    if (pending > 0) { event.preventDefault(); event.returnValue = ""; }
  });
  root.LectureStorage = { save, load, get warning() { return warning; } };
})(window);
