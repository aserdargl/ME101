/** Keeps original PDF bytes and stable page references; never exports page images. */
window.PdfSlides = (() => {
  const MAX_DOCUMENTS = 2;
  const MAX_RENDER_PIXELS = 4000000;
  const documents = new Map();
  const sources = new Map();
  const tokens = new Map();
  const parsing = new Set();
  const active = new Map();
  let nextToken = 0;
  let library;

  async function api() {
    library ||= import("./vendor/pdfjs/pdf.mjs").then(pdf => {
      pdf.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.mjs", location.href).href;
      return pdf;
    });
    return library;
  }

  async function open(source) {
    if (!documents.has(source)) {
      const pending = (async () => {
        const pdf = await api();
        const response = await fetch(source);
        if (!response.ok) throw new Error("PDF dosyası okunamadı.");
        return pdf.getDocument({ data: new Uint8Array(await response.arrayBuffer()),
          cMapUrl: new URL("./vendor/pdfjs/cmaps/", location.href).href, cMapPacked: true,
          standardFontDataUrl: new URL("./vendor/pdfjs/standard_fonts/", location.href).href,
          wasmUrl: new URL("./vendor/pdfjs/wasm/", location.href).href,
          isEvalSupported: false }).promise;
      })();
      documents.set(source, pending);
      pending.catch(() => { if (documents.get(source) === pending) documents.delete(source); });
    }
    const pending = documents.get(source);
    documents.delete(source);
    documents.set(source, pending);
    return pending;
  }

  function releaseUnusedDocuments() {
    const used = new Set([...parsing, ...[...active.values()].map(state => state.source)]);
    for (const [source, pending] of documents) {
      if (documents.size <= MAX_DOCUMENTS) break;
      if (!used.has(source)) {
        documents.delete(source);
        pending.then(pdf => pdf.destroy()).catch(() => {});
      }
    }
  }

  /** Imports immutable page references; repeated sources share one stored string. */
  async function parse(file, week, title) {
    if (!/\.pdf$/i.test(file.name || "")) throw new Error("Lütfen PDF dosyası seçin.");
    if (new TextDecoder().decode(await file.slice(0, 1024).arrayBuffer()).indexOf("%PDF-") < 0) {
      throw new Error("Seçilen dosya geçerli bir PDF değil.");
    }
    const source = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("PDF dosyası okunamadı."));
      reader.readAsDataURL(file);
    });
    parsing.add(source);
    try {
      const pdf = await open(source);
      const slides = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        const { width, height } = page.getViewport({ scale: 1 });
        slides.push({ title: `${title || file.name.replace(/\.pdf$/i, "")} — ${number}`,
          kicker: week, defaultViewMode: "pdf", html: "", pptSummaryBullets: [],
          pdf: { source, page: number, width, height, fileName: file.name } });
      }
      return slides;
    } catch (error) {
      throw new Error(error.name === "PasswordException" ? "Parola korumalı PDF yerine parolasız bir kopya yükleyin." : "PDF açılamadı. Dosyayı kontrol edin.");
    } finally { parsing.delete(source); releaseUnusedDocuments(); }
  }

  function render(slide) {
    const { source, page, width, height } = slide.pdf;
    if (!sources.has(source)) {
      const token = String(++nextToken);
      sources.set(source, token);
      tokens.set(token, source);
    }
    const token = sources.get(source);
    return `<div class="pdf-page ppt-source-frame" style="aspect-ratio:${Number(width) || 16}/${Number(height) || 9}" data-pdf-source="${token}" data-pdf-page="${Number(page)}" role="img" aria-label="PDF · ${Number(page)}"><span role="status">PDF yükleniyor…</span></div>`;
  }

  async function paint(host, state) {
    if (state.busy || !host.isConnected || !host.clientWidth) return;
    state.busy = true;
    try {
      const pdfDocument = await open(state.source);
      const page = await pdfDocument.getPage(Number(host.dataset.pdfPage));
      if (!host.isConnected || active.get(host) !== state) return;
      const natural = page.getViewport({ scale: 1 });
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const scale = Math.min(host.clientWidth * density / natural.width,
        Math.sqrt(MAX_RENDER_PIXELS / (natural.width * natural.height)));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      state.task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      await state.task.promise;
      if (!host.isConnected || active.get(host) !== state) return;
      host.replaceChildren(canvas);
      host.dataset.pdfReady = "true";
      window.PresentationFit?.schedule();
    } catch (error) {
      if (error.name !== "RenderingCancelledException" && host.isConnected) {
        host.dataset.pdfError = error.message;
        host.textContent = "PDF görüntülenemedi. Dersi yeniden açarak tekrar deneyin.";
      }
    } finally { state.busy = false; state.task = null; }
  }

  const resize = new ResizeObserver(entries => entries.forEach(({ target }) => {
    const state = active.get(target);
    if (state) paint(target, state);
  }));
  const visibility = new IntersectionObserver(entries => entries.forEach(entry => {
    const host = entry.target;
    if (entry.isIntersecting && !active.has(host)) {
      const state = { source: tokens.get(host.dataset.pdfSource) };
      active.set(host, state);
      resize.observe(host);
      paint(host, state);
    } else if (!entry.isIntersecting && active.has(host)) {
      active.get(host).task?.cancel();
      active.delete(host);
      resize.unobserve(host);
      host.replaceChildren();
      delete host.dataset.pdfReady;
      releaseUnusedDocuments();
    }
  }), { rootMargin: "160px" });
  const observed = new WeakSet();
  let scheduled = false;
  function scan() {
    scheduled = false;
    for (const [host, state] of active) {
      if (!host.isConnected) { state.task?.cancel(); active.delete(host); resize.unobserve(host); visibility.unobserve(host); }
    }
    const connected = new Set();
    document.querySelectorAll("[data-pdf-source]").forEach(host => {
      connected.add(host.dataset.pdfSource);
      if (!observed.has(host)) { observed.add(host); visibility.observe(host); }
    });
    for (const [token, source] of tokens) {
      if (!connected.has(token)) { tokens.delete(token); sources.delete(source); }
    }
    releaseUnusedDocuments();
  }
  new MutationObserver(() => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(scan); }
  }).observe(document.body, { childList: true, subtree: true });
  return { parse, render };
})();
