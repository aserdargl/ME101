(function (root) {
  const repository = new GitHubLectureRepository({ owner: "aserdargl", repository: "ME101" });
  const SYNC_KEY = "mee101_github_fingerprint_v1";
  let getLectures, applyLectures;
  let authenticated = false;
  let localAdmin = false;
  let synchronized = false;
  let version = null;
  let publishing = false;
  let pendingSave = false;
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
    button.textContent = !authenticated ? "GitHub’a Bağlan" : root.DrivePublishing?.enabled()
      ? synchronized ? "Dersleri Yayımla" : "Yerel Dersleri Drive’a Aktar"
      : synchronized ? "GitHub’a Yayımla" : "Yerel Notları GitHub’a Aktar";
  }

  /** Conflicting versions become separate lessons, keeping every original note. */
  async function mergePreservingNotes(remote, local) {
    const merged = structuredClone(remote);
    for (const lecture of local) {
      const existing = remote.find(item => item.id === lecture.id);
      if (!existing) merged.push(structuredClone(lecture));
      else if (await repository.documentDigest(existing) !== await repository.documentDigest(lecture)) merged.push({ ...structuredClone(lecture), id: `local-${crypto.randomUUID()}`, title: `${lecture.title} (Bu tarayıcıdaki kopya)` });
    }
    return merged;
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
    return visit(structuredClone(lectures));
  }

  async function publish(explicit = false) {
    if (!authenticated) return message("GitHub’a yayımlamak için öğretim üyesi girişi yapın.", true);
    if (publishing) { pendingSave = true; return; }
    if (!explicit && !synchronized) return;
    publishing = true;
    showProgress();
    message("Dersler GitHub’a kaydediliyor…");
    try {
      let lectures = await portableDocument(getLectures());
      await LectureStorage.save(lectures);
      message("GitHub’daki mevcut kayıt kontrol ediliyor…");
      const current = await repository.readCurrent({ skipLecturesForVersion: synchronized ? version : null });
      if ((current.manifest?.id || null) !== version && !explicit) throw new Error("GitHub’da başka bir cihazdan yeni kayıt var. Yerel notlar korundu; ‘Yerel Notları GitHub’a Aktar’ ile birleştirin.");
      if (explicit && current.lectures && (!synchronized || current.manifest.id !== version)) lectures = await mergePreservingNotes(current.lectures, lectures);
      if (root.DrivePublishing?.enabled()) {
        message("Derslerin bağımsız Drive yedeği hazırlanıyor…");
        lectures = (await root.DrivePublishing.prepare(lectures, progress)).lectures;
      }
      const manifest = await repository.publish(lectures, current, progress);
      version = manifest.id;
      synchronized = !pendingSave;
      if (!pendingSave) {
        await applyLectures(lectures);
        await LectureStorage.save(lectures);
        rememberDigest(manifest.digest);
      }
      message(pendingSave ? "Önceki kayıt GitHub’a gönderildi; yeni yerel notlar da korundu. Aktar düğmesiyle birleştirin." : root.DrivePublishing?.enabled()
        ? "Drive dosyaları ve yedek kaydedildi · Ders listesi GitHub yayını tamamlandığında güncellenecek."
        : "GitHub’a kaydedildi · Pages yayını tamamlandığında tüm cihazlarda görünecek.");
      showProgress(100);
    } catch (error) {
      synchronized = false;
      const bar = document.getElementById("cloud-transfer-progress");
      showProgress(bar?.value || 0);
      const reason = error.name === "TimeoutError" ? "GitHub yanıtı zaman aşımına uğradı." : error.name === "TypeError" ? "GitHub bağlantısı kesildi." : error.message;
      message(`${reason} · Yerel notlar korunuyor. Yeniden aktarırken tamamlanan parçalar kullanılacak.`, true);
    }
    finally { publishing = false; pendingSave = false; button.disabled = false; }
  }

  async function initialize(options) {
    getLectures = options.getLectures;
    applyLectures = options.applyLectures;
    button.addEventListener("click", () => authenticated ? publish(true) : options.onLoginRequired());
    document.getElementById("btn-drive-connect")?.addEventListener("click", async () => {
      try { await root.DrivePublishing.connect(); message("Drive bağlantısı hazır · Dersleri ve yedeği kaydetmek için Yayımla düğmesini kullanın."); }
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
    login: async key => { await repository.login(key); authenticated = true; message("GitHub girişi başarılı · Mevcut notları Aktar düğmesiyle yayımlayabilirsiniz."); return true; },
    isAuthenticated: () => authenticated,
    publish: () => publish(true),
    setLocalAdmin: enabled => { localAdmin = enabled; message(status.textContent); },
    markChanged: () => { if (publishing) pendingSave = true; },
    save: () => {
      if (publishing) { pendingSave = true; return; }
      message(authenticated ? "Yerel yedek kaydedildi · Değişiklikleri tüm cihazlara açmak için GitHub’a Yayımla düğmesini kullanın." : "Yerel notlar korundu · Tüm cihazlara açmak için GitHub’a bağlanıp yayımlayın.");
    },
    logout: () => { authenticated = false; repository.logout(); root.DrivePublishing?.logout(); message("GitHub düzenleme oturumu kapatıldı."); },
    changePassword: async () => { throw new Error("Erişim anahtarınızı GitHub hesap ayarlarından yönetebilirsiniz."); }
  };
})(window);
