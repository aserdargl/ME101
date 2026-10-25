(function (root) {
  const repository = new InstructorLectureRepository({ owner: "aserdargl", repository: "ME101",
    serviceUrl: root.MEE101_APPROVAL_URL || root.location?.origin, getIdToken: () => root.FirebaseStudents.getIdToken(false) });
  const SYNC_KEY = "mee101_github_fingerprint_v1";
  let getLectures, applyLectures;
  let authenticated = false;
  let localAdmin = false;
  let synchronized = false;
  let version = null;
  let publishing = false;
  let pendingSave = false;
  let queuedSave = false;
  let activePublication = null;
  const status = document.getElementById("cloud-status-text");
  const button = document.getElementById("btn-cloud-publish");

  function showProgress(value = null) {
    const bar = document.getElementById("cloud-transfer-progress");
    if (!bar?.setAttribute) return;
    document.getElementById("cloud-transfer-meter").hidden = false;
    if (value === null) bar.removeAttribute("value");
    else bar.value = value;
    document.getElementById("cloud-transfer-percent").textContent = value === null ? "…" : `${value}%`;
  }

  function progress({ stage, completed, total }) {
    const measured = ["upload", "drive-upload", "drive-assets", "drive-backup"].includes(stage);
    showProgress(measured && total ? Math.floor(completed / total * 100) : null);
    if (stage === "drive-backup") return message(`Drive yedeği kaydediliyor · ${completed}/${total} parça`);
    if (stage === "drive-assets") return message(`Drive ders dosyaları kaydediliyor · ${completed}/${total} dosya`);
    if (stage === "drive-upload") return message(`Drive’a yükleniyor · %${Math.floor(completed / total * 100)}`);
    if (stage === "prepare") message(`Aktarım hazırlanıyor · ${completed} parça hazır`);
    else if (stage === "upload") message(`GitHub’a aktarılıyor · ${completed}/${total} parça · %${Math.floor(completed / total * 100)}`);
    else message("Aktarım tamamlandı · GitHub kaydı kesinleştiriliyor…");
  }

  function rememberDigest(digest) {
    try { localStorage.setItem(SYNC_KEY, digest); } catch { /* Optional sync metadata; content is backed up independently. */ }
  }

  function message(text, error = false) {
    status.textContent = text;
    document.getElementById("cloud-status").classList.toggle("cloud-error", error);
    button.classList.toggle("hidden", !authenticated && !localAdmin);
    document.getElementById("btn-drive-connect")?.classList.toggle("hidden", !root.DrivePublishing?.enabled() || !authenticated);
    button.disabled = publishing;
    button.textContent = !authenticated ? "Hoca Girişi" : "Yayımla";
  }

  async function portableDocument(lectures) {
    const replacements = new Map();
    async function readAddress(address) {
      if (replacements.has(address)) return replacements.get(address);
      let response;
      try { response = await fetch(address); } catch { throw new Error("Eski bir geçici görselin veya dosyanın süresi dolmuş. Özgün PPTX/görseli yeniden seçerek onarın; notlarınız korunuyor."); }
      if (!response.ok) throw new Error("Geçici dosya okunamadı. Özgün dosyayı yeniden seçin.");
      const blob = await response.blob();
      const replacement = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Dosya okunamadı."));
        reader.readAsDataURL(blob);
      });
      replacements.set(address, replacement);
      return replacement;
    }
    async function visit(value) {
      if (typeof value === "string") {
        const pattern = /blob:[^\s"'<>\\)]+/g;
        for (const match of value.matchAll(pattern)) await readAddress(match[0]);
        return value.replace(pattern, address => replacements.get(address));
      }
      if (value && typeof value === "object") {
        for (const key of Object.keys(value)) value[key] = await visit(value[key]);
      }
      return value;
    }
    return visit(root.LectureDocument.snapshot(lectures));
  }

  /** Serializes completed saves; a failed transfer waits for a new save or retry. */
  function publish(explicit = false) {
    if (root.MEE101_GITHUB_ENABLED === false) return Promise.resolve(false);
    if (activePublication) {
      pendingSave = true;
      queuedSave = true;
      return activePublication;
    }
    activePublication = drainPublications(explicit);
    return activePublication;
  }

  async function drainPublications(explicit) {
    try {
      do {
        queuedSave = false;
        if (!await publishOnce(explicit)) break;
      } while (queuedSave && authenticated);
    } finally { activePublication = null; queuedSave = false; }
  }

  async function publishOnce(explicit) {
    if (!authenticated) return message("GitHub’a yayımlamak için öğretim üyesi girişi yapın.", true);
    if (!explicit && !synchronized) return;
    publishing = true;
    showProgress();
    message("Dersler GitHub’a kaydediliyor…");
    try {
      let lectures = await portableDocument(getLectures());
      const backedUpLectures = lectures;
      const backedUp = await LectureStorage.save(lectures);
      message("GitHub’daki mevcut kayıt kontrol ediliyor…");
      const current = await repository.readCurrent({ skipLecturesForVersion: synchronized ? version : null });
      if ((current.manifest?.id || null) !== version) throw new Error("Başka bir cihazdan yeni yayın var. Güncel yayını ayrı sekmede inceleyip bu sayfayı yenileyin; yerel değişiklikleriniz korundu.");
      let driveBackupError = null;
      let drivePrepared = false;
      if (root.DrivePublishing?.enabled()) {
        message("Derslerin bağımsız Drive yedeği hazırlanıyor…");
        try {
          lectures = (await root.DrivePublishing.prepare(lectures, progress)).lectures;
          drivePrepared = true;
        } catch (error) {
          driveBackupError = error.message;
          message("Drive yedeği alınamadı · Özgün ders dosyaları GitHub’a yayımlanıyor…");
        }
      }
      const manifest = await repository.publish(lectures, current, progress);
      version = manifest.id;
      synchronized = !pendingSave;
      if (!pendingSave) {
        const saved = (backedUp && lectures === backedUpLectures) || await LectureStorage.save(lectures);
        if (!pendingSave) {
          await applyLectures(lectures);
          if (saved && !pendingSave) rememberDigest(manifest.digest);
        }
      }
      message(pendingSave ? "Önceki kayıt yayımlandı · Yeni kaydedilen değişiklikler sırayla otomatik yayımlanıyor." : driveBackupError
        ? `GitHub’a kaydedildi · Drive yedeği alınamadı: ${driveBackupError} · Pages yayını tamamlandığında tüm cihazlarda görünecek.` : drivePrepared
        ? "Drive dosyaları ve yedek kaydedildi · Ders listesi GitHub yayını tamamlandığında güncellenecek."
        : "GitHub’a kaydedildi · Pages yayını tamamlandığında tüm cihazlarda görünecek.");
      showProgress(100);
      return true;
    } catch (error) {
      synchronized = false;
      const bar = document.getElementById("cloud-transfer-progress");
      showProgress(bar?.value || 0);
      const reason = error.name === "TimeoutError" ? "GitHub yanıtı zaman aşımına uğradı." : error.name === "TypeError" ? "GitHub bağlantısı kesildi." : error.message;
      message(`${reason} · Yerel notlar korunuyor. Yeniden aktarırken tamamlanan parçalar kullanılacak.`, true);
      return false;
    }
    finally { publishing = false; pendingSave = false; button.disabled = false; }
  }

  async function initialize(options) {
    getLectures = options.getLectures;
    applyLectures = options.applyLectures;
    button.addEventListener("click", () => authenticated ? publish(true) : options.onLoginRequired());
    document.getElementById("btn-drive-connect")?.addEventListener("click", async () => {
      try { await root.DrivePublishing.connect(); message("Drive bağlantısı hazır · Sonraki kayıtlar otomatik yayımlanır."); }
      catch (error) { message(error.message, true); }
    });
    root.addEventListener("lecture-storage-status", event => message(event.detail, true));
    root.addEventListener("beforeunload", event => {
      if (publishing) { event.preventDefault(); event.returnValue = ""; }
    });
    if (root.MEE101_GITHUB_ENABLED === false) { message("Ayrı test ortamı · GitHub kayıtlarına bağlantı yok."); return; }
    try {
      const remote = await repository.readPublished();
      version = remote.manifest?.id || null;
      const localHash = remote.manifest ? await repository.documentDigest(getLectures()) : null;
      const currentEncoding = remote.manifest?.format === 2 && remote.manifest.partLength === root.LectureDocument?.partLength;
      const remoteHash = currentEncoding ? remote.manifest.digest : remote.lectures ? await repository.documentDigest(remote.lectures) : null;
      synchronized = Boolean(remote.manifest && (remoteHash === localHash || localStorage.getItem(SYNC_KEY) === localHash));
      if (remote.lectures && (!options.hasLocalData || synchronized)) {
        await applyLectures(remote.lectures);
        synchronized = true;
        if (await LectureStorage.save(remote.lectures)) rememberDigest(remoteHash);
        message("GitHub ortak ders kaydı · Tüm cihazlardan erişilebilir.");
      } else message(options.hasLocalData ? "Bu tarayıcıdaki notlar korunuyor · GitHub’a henüz aktarılmadı." : "GitHub’da ortak ders kaydı henüz yayımlanmadı.");
    } catch { message("GitHub kaydı okunamadı; bu tarayıcıdaki dersler ve notlar gösteriliyor.", true); }
  }

  root.LecturePublishing = { configured: root.MEE101_GITHUB_ENABLED !== false, initialize,
    login: async () => { await repository.login(); authenticated = true; message("Hoca oturumu açık · Kaydedilen değişiklikler otomatik yayımlanır."); return true; },
    isAuthenticated: () => authenticated,
    publish: () => publish(true),
    setLocalAdmin: enabled => { localAdmin = enabled; message(status.textContent); },
    markChanged: () => { if (publishing) pendingSave = true; },
    save: () => {
      if (authenticated) return publish(true);
      message("Yerel notlar korundu · Otomatik yayımlamak için öğretim üyesi girişi yapın.");
    },
    logout: () => { authenticated = false; repository.logout(); root.DrivePublishing?.logout(); message("Hoca oturumu kapatıldı · Yerel notlarınız korundu."); },
    changePassword: async () => { throw new Error("Erişim anahtarınızı GitHub hesap ayarlarından yönetebilirsiniz."); }
  };
})(window);
