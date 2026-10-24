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

  function rememberDigest(digest) {
    try { localStorage.setItem(SYNC_KEY, digest); } catch { /* Optional sync metadata; content is backed up independently. */ }
  }

  function message(text, error = false) {
    status.textContent = text;
    document.getElementById("cloud-status").classList.toggle("cloud-error", error);
    button.classList.toggle("hidden", !authenticated && !localAdmin);
    button.disabled = publishing;
    button.textContent = !authenticated ? "GitHub’a Bağlan" : synchronized ? "GitHub’a Yayımla" : "Yerel Notları GitHub’a Aktar";
  }

  /** Conflicting versions become separate lessons, keeping every original note. */
  function mergePreservingNotes(remote, local) {
    const merged = structuredClone(remote);
    for (const lecture of local) {
      const existing = remote.find(item => item.id === lecture.id);
      if (!existing) merged.push(structuredClone(lecture));
      else if (JSON.stringify(existing) !== JSON.stringify(lecture)) merged.push({ ...structuredClone(lecture), id: `local-${crypto.randomUUID()}`, title: `${lecture.title} (Bu tarayıcıdaki kopya)` });
    }
    return merged;
  }

  async function portableDocument(lectures) {
    let text = JSON.stringify(lectures);
    const addresses = [...new Set(text.match(/blob:[^\s"'<>\\)]+/g) || [])];
    for (const address of addresses) {
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
      text = text.split(address).join(replacement);
    }
    return JSON.parse(text);
  }

  async function publish(explicit = false) {
    if (!authenticated) return message("GitHub’a yayımlamak için öğretim üyesi girişi yapın.", true);
    if (publishing) { pendingSave = true; return; }
    if (!explicit && !synchronized) return;
    publishing = true;
    message("Dersler GitHub’a kaydediliyor…");
    try {
      let lectures = await portableDocument(getLectures());
      const current = await repository.readCurrent();
      if ((current.manifest?.id || null) !== version && !explicit) throw new Error("GitHub’da başka bir cihazdan yeni kayıt var. Yerel notlar korundu; ‘Yerel Notları GitHub’a Aktar’ ile birleştirin.");
      if (explicit && current.lectures && (!synchronized || current.manifest.id !== version)) lectures = mergePreservingNotes(current.lectures, lectures);
      const manifest = await repository.publish(lectures, current);
      version = manifest.id;
      synchronized = !pendingSave;
      if (!pendingSave) {
        await applyLectures(lectures);
        await LectureStorage.save(lectures);
        rememberDigest(manifest.digest);
      }
      message(pendingSave ? "Önceki kayıt GitHub’a gönderildi; yeni yerel notlar da korundu. Aktar düğmesiyle birleştirin." : "GitHub’a kaydedildi · Pages yayını tamamlandığında tüm cihazlarda görünecek.");
    } catch (error) {
      synchronized = false;
      if (error.status === 401) { authenticated = false; repository.logout(); }
      message(error.message, true);
    }
    finally { publishing = false; pendingSave = false; button.disabled = false; }
  }

  async function initialize(options) {
    getLectures = options.getLectures;
    applyLectures = options.applyLectures;
    const loginModal = document.getElementById("github-login-backdrop");
    const openLogin = () => { loginModal.classList.remove("hidden"); document.getElementById("btn-connect-github").focus(); };
    button.addEventListener("click", () => authenticated ? publish(true) : openLogin());
    document.getElementById("btn-open-github-login").addEventListener("click", openLogin);
    document.getElementById("btn-close-github-login").addEventListener("click", () => { loginModal.classList.add("hidden"); });
    document.getElementById("btn-connect-github").addEventListener("click", async () => {
      const feedback = document.getElementById("github-login-feedback");
      const connect = document.getElementById("btn-connect-github");
      const client = new GitHubOAuthClient({ serverUrl: root.MEE101_APPROVAL_URL });
      connect.disabled = true;
      feedback.textContent = "GitHub hesabınızla giriş penceresi açılıyor…";
      try {
        await repository.login(await client.login());
        authenticated = true;
        loginModal.classList.add("hidden");
        document.getElementById("admin-login-backdrop").classList.add("hidden");
        options.onAuthenticated();
        message("GitHub bağlantısı hazır · Notlarınızı ‘Aktar’ düğmesiyle yayımlayabilirsiniz.");
      } catch (error) { feedback.textContent = error.message; }
      finally { connect.disabled = false; }
    });
    root.addEventListener("lecture-storage-status", event => message(event.detail, true));
    if (root.MEE101_GITHUB_ENABLED === false) { message("Ayrı test ortamı · GitHub kayıtlarına bağlantı yok."); return; }
    try {
      const remote = await repository.readPublished();
      version = remote.manifest?.id || null;
      const localHash = await repository.digest(JSON.stringify(getLectures()));
      synchronized = Boolean(remote.manifest && (remote.manifest.digest === localHash || localStorage.getItem(SYNC_KEY) === localHash));
      if (remote.lectures && (!options.hasLocalData || synchronized)) {
        await applyLectures(remote.lectures);
        synchronized = true;
        if (await LectureStorage.save(remote.lectures)) rememberDigest(remote.manifest.digest);
        message("GitHub ortak ders kaydı · Tüm cihazlardan erişilebilir.");
      } else message(options.hasLocalData ? "Bu tarayıcıdaki notlar korunuyor · GitHub’a henüz aktarılmadı." : "GitHub’da ortak ders kaydı henüz yayımlanmadı.");
    } catch { message("GitHub kaydı okunamadı; bu tarayıcıdaki dersler ve notlar gösteriliyor.", true); }
  }

  root.LecturePublishing = { configured: root.MEE101_GITHUB_ENABLED !== false, initialize,
    login: async key => { await repository.login(key); authenticated = true; message("GitHub girişi başarılı · Mevcut notları Aktar düğmesiyle yayımlayabilirsiniz."); return true; },
    isAuthenticated: () => authenticated,
    publish: () => publish(true),
    setLocalAdmin: enabled => { localAdmin = enabled; message(status.textContent); },
    save: () => message(authenticated ? "Yerel yedek kaydedildi · Değişiklikleri tüm cihazlara açmak için GitHub’a Yayımla düğmesini kullanın." : "Yerel notlar korundu · Tüm cihazlara açmak için GitHub’a bağlanıp yayımlayın."),
    logout: () => { authenticated = false; repository.logout(); message("GitHub düzenleme oturumu kapatıldı."); },
    changePassword: async () => { throw new Error("Erişim anahtarınızı GitHub hesap ayarlarından yönetebilirsiniz."); }
  };
})(window);
