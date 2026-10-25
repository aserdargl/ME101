(function (root) {
  const SUPPORTED = /\.(pdf|html?|pptx)$/i;
  let lectures = [];
  const loading = new Map();

  /** Validates the dedicated catalog without merging it into stored user notes. */
  function decode(manifest) {
    if (manifest?.version !== 1 || !Array.isArray(manifest.files)) throw new Error("Hafta dosya listesi okunamadı.");
    const seen = new Set();
    return manifest.files.map(file => {
      if (!Number.isInteger(file.week) || file.week < 1 || typeof file.name !== "string"
        || !/^week-file-[a-f0-9]{64}$/.test(file.id) || seen.has(file.id)
        || !/^weeks\/files\/[a-f0-9]{64}\.(pdf|html?|pptx)$/.test(file.path)
        || !SUPPORTED.test(file.name) || !/^[a-f0-9]{64}$/.test(file.sha256)
        || file.path.split("/").pop().split(".")[0] !== file.sha256) throw new Error("Geçersiz hafta dosyası.");
      seen.add(file.id);
      const url = new URL(file.path, root.location.href).href;
      const isPdf = /\.pdf$/i.test(file.name);
      return { id: file.id, week: `${file.week}. Hafta`, title: file.name.split("/").pop().replace(SUPPORTED, ""),
        description: file.name, slides: [], managedWeek: true, loaded: false, file,
        ...(isPdf ? { pdfUrl: url, pdfFileName: file.name.split("/").pop() }
          : { pptxUrl: url, pptxFileName: file.name.split("/").pop() }) };
    });
  }

  async function initialize(onChange) {
    try {
      const response = await root.fetch(new URL(`weeks/manifest.json?v=${Date.now()}`, root.location.href), { cache: "no-store" });
      if (response.status === 404) return;
      if (!response.ok) throw new Error("Hafta listesi yüklenemedi.");
      lectures = decode(await response.json());
      onChange();
    } catch (error) {
      const status = root.document.getElementById("weekly-files-status");
      if (status) { status.textContent = error.message; status.hidden = false; }
    }
  }

  /** Loads and verifies a file only when opened; the manifest remains independent. */
  async function load(lecture) {
    if (lecture.loaded) return lecture;
    if (!loading.has(lecture.id)) loading.set(lecture.id, loadFile(lecture).finally(() => loading.delete(lecture.id)));
    return loading.get(lecture.id);
  }

  async function loadFile(lecture) {
    const url = lecture.pdfUrl || lecture.pptxUrl;
    const response = await root.fetch(url);
    if (!response.ok) throw new Error("Ders dosyası henüz hazır değil. Sayfayı yenileyip tekrar deneyin.");
    const bytes = await response.arrayBuffer();
    const digest = await root.crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    if (hash !== lecture.file.sha256) throw new Error("Ders dosyasının bütünlüğü doğrulanamadı.");
    let slides;
    if (lecture.pdfUrl) {
      slides = await root.PdfSlides.parse(new File([bytes], lecture.pdfFileName, { type: "application/pdf" }), lecture.week, lecture.title);
      slides.forEach(slide => { slide.pdf.source = url; });
    } else if (/\.html?$/i.test(lecture.file.name)) {
      slides = [{ title: lecture.title, kicker: lecture.week, html: "", htmlDocument: new TextDecoder().decode(bytes), defaultViewMode: "web" }];
    } else {
      slides = [{ title: lecture.title, kicker: lecture.week, defaultViewMode: "web",
        html: '<p class="lead">PowerPoint dosyasını üstteki PPTX düğmesiyle indirebilirsiniz. Tarayıcıda slaytları görüntülemek için aynı sunumun PDF kopyasını da klasöre ekleyin.</p>' }];
    }
    lecture.slides = slides;
    lecture.loaded = true;
    return lecture;
  }

  root.WeeklyFiles = { initialize, decode, load, all: () => lectures, find: id => lectures.find(lecture => lecture.id === id) };
  if (typeof module !== "undefined") module.exports = root.WeeklyFiles;
})(typeof window !== "undefined" ? window : globalThis);
