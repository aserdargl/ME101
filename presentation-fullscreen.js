/** Keeps native and embedded-browser presentation controls in sync. */
window.PresentationFullscreen = (() => {
  let button;
  let notice;
  let pending = false;
  const fallbackClass = "presentation-expanded";
  const nativeElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const expanded = () => document.body.classList.contains(fallbackClass);

  function synchronize() {
    if (nativeElement()) {
      document.body.classList.remove(fallbackClass);
      notice.hidden = true;
    }
    const active = Boolean(nativeElement()) || expanded();
    button.textContent = expanded() ? "Geniş Görünümden Çık" : active ? "Tam Ekrandan Çık" : "Tam Ekran";
    button.title = `${button.textContent} (F)`;
    button.setAttribute("aria-pressed", String(active));
    window.dispatchEvent(new Event("resize"));
  }

  function expandInPage() {
    if (!document.body.classList.contains("presentation-mode")) return;
    document.body.classList.add(fallbackClass);
    notice.hidden = false;
    synchronize();
  }

  /** Exits both browser fullscreen and the in-page alternative. */
  async function exit() {
    document.body.classList.remove(fallbackClass);
    notice.hidden = true;
    try {
      const leave = document.fullscreenElement ? document.exitFullscreen : document.webkitExitFullscreen;
      if (nativeElement() && leave) await leave.call(document);
    } finally {
      synchronize();
    }
  }

  /** Requests fullscreen directly within the user's click or key gesture. */
  async function toggle() {
    if (pending) return;
    pending = true;
    try {
      if (nativeElement() || expanded()) return await exit();
      const root = document.documentElement;
      const request = root.requestFullscreen || root.webkitRequestFullscreen;
      if (!request) return expandInPage();
      await request.call(root);
      synchronize();
    } catch {
      expandInPage();
    } finally {
      pending = false;
    }
  }

  /** Binds the existing toolbar without reading or changing stored lessons. */
  function initialize(control) {
    button = control;
    notice = document.createElement("div");
    notice.className = "presentation-fullscreen-notice";
    notice.setAttribute("role", "status");
    notice.hidden = true;
    const message = document.createElement("span");
    message.textContent = "Tarayıcı tam ekrana izin vermedi. Geniş görünüm açıldı.";
    const link = document.createElement("a");
    link.textContent = "Ayrı sekmede aç";
    link.href = window.location.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    notice.append(message, " ", link);
    document.body.appendChild(notice);
    button.addEventListener("click", toggle);
    document.addEventListener("fullscreenchange", synchronize);
    document.addEventListener("webkitfullscreenchange", synchronize);
    synchronize();
  }

  return { initialize, exit };
})();
