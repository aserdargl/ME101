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
    });
    return database;
  }

  async function documentFingerprint(lectures) {
    const hashes = [];
    for (const part of root.LectureDocument.parts(lectures)) hashes.push(await fingerprint(part));
    return fingerprint(JSON.stringify(hashes));
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
      const digest = await documentFingerprint(snapshot);
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        const store = transaction.objectStore(STORE);
        const record = { savedAt: new Date().toISOString(), lectures: snapshot, legacyFingerprint };
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
      let legacyText;
      try { legacyText = localStorage.getItem(LEGACY_KEY); } catch { return record.lectures; }
      if (!legacyText || await fingerprint(legacyText) === record.legacyFingerprint || legacyText === JSON.stringify(record.lectures)) return record.lectures;
      let legacy;
      try { legacy = JSON.parse(legacyText); } catch { return record.lectures; }
      if (!Array.isArray(legacy)) return record.lectures;
      const merged = structuredClone(record.lectures);
      for (const lecture of legacy) {
        const existing = record.lectures.find(item => item.id === lecture.id);
        if (!existing) merged.push(lecture);
        else if (JSON.stringify(existing) !== JSON.stringify(lecture)) merged.push({ ...lecture, id: `legacy-${crypto.randomUUID()}`, title: `${lecture.title} (Diğer yerel kayıt)` });
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
