/* Reads the uploaded PPTX for display; never rewrites lecture notes or settings. */
window.PptxDisplay = (() => {
  const MAX_CACHED_DECKS = 2;
  const bindings = new WeakMap();
  const targets = new Map();
  const decks = new Map();
  const sources = new Map();
  const mounted = new Map();
  let library;
  let scheduled = false;

  function renderer() {
    library ||= import("./vendor/pptx-renderer/renderer-1.4.0.js?v=office-math-1");
    return library;
  }

  async function load(input) {
    const bytes = typeof input.arrayBuffer === "function" ? await input.arrayBuffer() : input;
    const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), byte => byte.toString(16).padStart(2, "0")).join("");
    if (!decks.has(fingerprint)) {
      const promise = renderer().then(async api => {
        const files = await api.parseZipLazyMedia(bytes, api.RECOMMENDED_ZIP_LIMITS);
        return api.buildPresentation(files, { lazySlides: true });
      });
      decks.set(fingerprint, promise);
      promise.catch(() => decks.delete(fingerprint));
      while (decks.size > MAX_CACHED_DECKS) decks.delete(decks.keys().next().value);
    }
    return { fingerprint, presentation: await decks.get(fingerprint) };
  }

  function bind(slides, deck) {
    const paths = new Map(deck.presentation.slides.map((slide, index) => [slide.slidePath, index]));
    const titles = deck.presentation.slides.map(slide => {
      const xml = new DOMParser().parseFromString(slide.sourceXml || "<slide/>", "application/xml");
      const paragraphs = Array.from(xml.getElementsByTagName("*")).filter(node => node.localName === "p");
      return paragraphs.map(paragraph => Array.from(paragraph.getElementsByTagName("*")).filter(node => node.localName === "t").map(node => node.textContent).join("").trim()).find(Boolean) || "";
    });
    for (const slide of slides) {
      let index = paths.get(slide.sourceSlidePath);
      const title = String(slide.title || "").trim();
      if (!slide.sourceSlidePath && title && titles.filter(item => item === title).length === 1 &&
          slides.filter(item => String(item.title || "").trim() === title).length === 1) index = titles.indexOf(title);
      if (index === undefined || slide.pptImageUrl) continue;
      const token = bindings.get(slide) || crypto.randomUUID();
      bindings.set(slide, token);
      targets.set(token, { fingerprint: deck.fingerprint, index, width: deck.presentation.width, height: deck.presentation.height });
    }
  }

  /** Prepares any uploaded deck without generating or publishing slide images. */
  async function prepareUpload(file, slides) {
    if (!slides.some(slide => !slide.pptImageUrl)) return;
    bind(slides, await load(file));
  }

  /** Reopens the saved original deck while retaining every existing note verbatim. */
  async function prepareLecture(lecture) {
    if (!lecture.pptxUrl || !lecture.slides.some(slide => !slide.pptImageUrl)) return false;
    try {
      if (!sources.has(lecture.pptxUrl)) {
        const pending = fetch(lecture.pptxUrl).then(response => {
          if (!response.ok) throw new Error("Özgün PPTX okunamadı.");
          return response.arrayBuffer();
        }).then(load);
        sources.set(lecture.pptxUrl, pending);
        pending.catch(() => sources.delete(lecture.pptxUrl));
        while (sources.size > MAX_CACHED_DECKS) sources.delete(sources.keys().next().value);
      }
      const deck = await sources.get(lecture.pptxUrl);
      if (!decks.has(deck.fingerprint)) decks.set(deck.fingerprint, Promise.resolve(deck.presentation));
      bind(lecture.slides, deck);
      return true;
    } catch { return false; }
  }

  /** Returns a temporary UI target; it is never included in saved slide HTML. */
  function visualFor(slide) {
    const token = bindings.get(slide);
    const target = targets.get(token);
    return target ? { token, ratio: `${target.width}/${target.height}` } : null;
  }

  const resize = new ResizeObserver(entries => entries.forEach(({ target }) => fit(target)));
  function fit(host) {
    const state = mounted.get(host);
    if (!state) return;
    const { width, height } = state.presentation;
    const scale = Math.min(host.clientWidth / width, host.clientHeight / height);
    Object.assign(state.handle.element.style, { position: "absolute", transformOrigin: "top left", transform: `scale(${scale})`,
      left: `${(host.clientWidth - width * scale) / 2}px`, top: `${(host.clientHeight - height * scale) / 2}px` });
  }

  async function mount(host) {
    if (mounted.has(host) || host.dataset.mounting) return;
    const target = targets.get(host.dataset.pptxRender);
    if (!target || !decks.has(target.fingerprint)) return;
    host.dataset.mounting = "true";
    try {
      const [api, presentation] = await Promise.all([renderer(), decks.get(target.fingerprint)]);
      if (!host.isConnected) return;
      const handle = api.renderSlide(presentation, presentation.slides[target.index], { externalMedia: "block", pdfjs: false });
      const shadow = host.attachShadow({ mode: "open" });
      host.textContent = "";
      shadow.append(handle.element);
      mounted.set(host, { handle, presentation });
      resize.observe(host);
      fit(host);
      await handle.ready;
      fit(host);
      host.dataset.rendered = "true";
    } catch {
      host.textContent = "Slayt görüntülenemedi. Özgün PPTX’i indirerek açabilirsiniz.";
    } finally { delete host.dataset.mounting; }
  }

  const visibility = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) mount(entry.target);
  }), { rootMargin: "160px" });
  const observed = new WeakSet();
  function scan() {
    scheduled = false;
    mounted.forEach(({ handle }, host) => {
      if (!host.isConnected) { handle.dispose(); resize.unobserve(host); visibility.unobserve(host); mounted.delete(host); }
    });
    document.querySelectorAll("[data-pptx-render]").forEach(host => {
      if (!observed.has(host)) { observed.add(host); visibility.observe(host); }
    });
  }
  new MutationObserver(() => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(scan); }
  }).observe(document.body, { childList: true, subtree: true });

  return { prepareUpload, prepareLecture, visualFor };
})();
