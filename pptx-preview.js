/** Parses the selected upload once and displays it without writing lecture data. */
window.PptxPreview = (() => {
  let cached;
  let generation = 0;
  let slideIndex = 0;
  const stage = document.getElementById("import-preview-stage");
  const status = document.getElementById("import-preview-status");
  const previous = document.getElementById("btn-import-preview-prev");
  const next = document.getElementById("btn-import-preview-next");
  const field = id => document.getElementById(id).value.trim();

  function slidesFor(file, week, title) {
    if (!cached || cached.file !== file || cached.week !== week || cached.title !== title) {
      cached = { file, week, title, promise: PptxImport.parse(file, week, title) };
    }
    return cached.promise;
  }

  function render(slides) {
    stage.innerHTML = SlideVisual.render(slides[slideIndex], slideIndex, slides.length, field("imp-week"));
    status.textContent = `${slideIndex + 1} / ${slides.length}`;
    previous.disabled = slideIndex === 0;
    next.disabled = slideIndex === slides.length - 1;
  }

  async function prepare(file) {
    const current = ++generation;
    slideIndex = 0;
    previous.disabled = next.disabled = true;
    status.textContent = "PPTX Çözümleniyor...";
    stage.replaceChildren();
    try {
      const slides = await slidesFor(file, field("imp-week") || "Ders", field("imp-title"));
      if (current !== generation) return;
      if (!slides.length) throw new Error("Dosyada slayt bulunamadı.");
      render(slides);
    } catch (error) {
      if (current === generation) status.textContent = `Hata: ${error.message}`;
    }
  }

  async function move(offset) {
    if (!cached) return;
    const current = generation;
    const slides = await cached.promise;
    if (current !== generation) return;
    slideIndex = Math.max(0, Math.min(slides.length - 1, slideIndex + offset));
    render(slides);
  }

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  return {
    prepare,
    async getSlides(file, week, title) {
      return structuredClone(await slidesFor(file, week, title));
    },
    clear() {
      generation += 1;
      cached = null;
      stage.replaceChildren();
      status.textContent = "PPTX seçtiğinizde önizleme burada görünür.";
      previous.disabled = next.disabled = true;
    }
  };
})();
