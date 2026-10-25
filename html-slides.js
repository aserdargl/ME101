(function (root) {
  const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const STARTER = `<!doctype html>
<html lang="tr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Etkileşimli örnek</title>
<style>
  body { margin: 0; padding: 24px; font: 18px system-ui; color: #243447; }
  button { padding: 10px 18px; cursor: pointer; }
</style>
<h1>Etkileşimli örnek</h1>
<button id="calculate">Hesapla</button>
<p id="result">Sonuç burada görünecek.</p>
<script>
  document.getElementById("calculate").addEventListener("click", () => {
    document.getElementById("result").textContent = "Sonuç: " + (6 * 7);
  });
</script>
</html>`;

  /** A dedicated field keeps executable pages separate from existing lecture notes. */
  function isHtmlSlide(slide) { return typeof slide?.htmlDocument === "string"; }

  function create(week) {
    return { title: "HTML Sayfası", kicker: week, defaultViewMode: "web", html: "", htmlDocument: STARTER, pptSummaryBullets: [] };
  }

  /** Imports the complete document verbatim so embedded styles and scripts survive saves. */
  async function fromFile(file, week) {
    if (!/\.html?$/i.test(file.name)) return { ok: false, error: "Bir .html veya .htm dosyası seçin." };
    let source;
    try { source = await file.text(); }
    catch { return { ok: false, error: "HTML dosyası okunamadı. Dosyayı yeniden seçin." }; }
    if (!source.trim()) return { ok: false, error: "Seçilen HTML dosyası boş." };
    return { ok: true, slide: { ...create(week), title: file.name.replace(/\.html?$/i, ""), htmlDocument: source } };
  }

  /** Runs inside the isolated frame and fits the page without changing saved HTML. */
  function fitDocument() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", fitDocument, { once: true });
      return;
    }
    let pending = false;
    function measure(body) {
      body.style.transform = "none";
      const origin = body.getBoundingClientRect();
      const children = [...body.children].filter(child => child.getBoundingClientRect().width && child.getBoundingClientRect().height);
      const hasText = [...body.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (children.length === 1 && !hasText) {
        const child = children[0];
        const rect = child.getBoundingClientRect();
        return { origin, left: rect.left, top: rect.top,
          width: Math.max(1, child.offsetWidth, child.scrollWidth), height: Math.max(1, child.offsetHeight, child.scrollHeight) };
      }
      const style = getComputedStyle(body);
      return { origin, left: 0, top: 0,
        width: Math.max(1, body.scrollWidth, body.offsetWidth) + parseFloat(style.marginLeft) + parseFloat(style.marginRight),
        height: Math.max(1, body.scrollHeight, body.offsetHeight) + parseFloat(style.marginTop) + parseFloat(style.marginBottom) };
    }
    function fit() {
      pending = false;
      const body = document.body;
      if (!body || !innerWidth || !innerHeight) return;
      const bounds = measure(body);
      const scale = Math.min(innerWidth / bounds.width, innerHeight / bounds.height);
      const left = (innerWidth - bounds.width * scale) / 2 - bounds.origin.left - (bounds.left - bounds.origin.left) * scale;
      const top = (innerHeight - bounds.height * scale) / 2 - bounds.origin.top - (bounds.top - bounds.origin.top) * scale;
      body.style.transformOrigin = "top left";
      body.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
      document.documentElement.style.overflow = "hidden";
    }
    function schedule() {
      if (!pending) { pending = true; requestAnimationFrame(fit); }
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    for (const child of document.body.children) resize.observe(child);
    document.addEventListener("load", schedule, true);
    window.addEventListener("resize", schedule);
    document.fonts.ready.then(schedule);
    schedule();
  }

  function fittedSource(source) {
    return `${source}<script>(${fitDocument.toString()})();<\/script>`;
  }

  /** Scripts run in an opaque-origin frame without access to portal storage or controls. */
  function render(slide) {
    return `<div class="html-slide-frame interactive-zone"><iframe sandbox="allow-scripts" referrerpolicy="no-referrer" title="${escape(slide.title || "HTML")}" srcdoc="${escape(fittedSource(slide.htmlDocument))}"></iframe></div>`;
  }

  function thumbnail(slide) {
    return `<div class="html-slide-thumbnail"><strong>&lt;/&gt; HTML</strong><span>${escape(slide.title)}</span></div>`;
  }

  /** Reuses a running preview while unrelated title fields change. */
  function preview(stage, source, title) {
    const frame = stage.querySelector(".html-slide-frame iframe");
    if (frame && frame.srcdoc === fittedSource(source)) { frame.title = title; return; }
    stage.innerHTML = render({ htmlDocument: source, title });
  }

  root.HtmlSlides = { isHtmlSlide, create, fromFile, render, thumbnail, preview };
  if (typeof module !== "undefined") module.exports = root.HtmlSlides;
})(typeof window !== "undefined" ? window : globalThis);
