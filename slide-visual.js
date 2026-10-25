(function (root) {
  const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  /** Image mode shows one complete slide; Web and PPT retain the original notes. */
  function contentVisibility(slide, mode) {
    const hasNotes = Boolean(String(slide.html || "").trim());
    if (slide.pdf) return { web: mode === "web" && hasNotes, ppt: true };
    const hasOriginal = Boolean(slide.pptImageUrl || (!slide.sourceSlideEdited && slide.sourceSlideVisual) || slide.pdf);
    const hasMedia = Array.isArray(slide.extractedImages) && slide.extractedImages.length > 0;
    if (mode === "image" || mode === "pdf") return { web: !hasOriginal && hasNotes, ppt: hasOriginal || !hasNotes };
    const visualMode = mode === "ppt";
    return { web: !visualMode || hasNotes, ppt: visualMode && (hasOriginal || hasMedia || !hasNotes) };
  }

  /** Uses original slide geometry when available; never invents a technical image. */
  function render(slide, slideIndex, totalSlides, week) {
    if (slide.pdf) return root.PdfSlides.render(slide);
    const original = slide.pptImageUrl || (!slide.sourceSlideEdited && slide.sourceSlideVisual);
    if (original) return `<div class="ppt-exact-frame ppt-source-frame" style="aspect-ratio:${escape(slide.sourceSlideRatio || "auto")}"><img src="${escape(original)}" alt="${escape(slide.title)}"/></div>${slide.sourceWarnings?.length ? `<p class="ppt-import-warning">${slide.sourceWarnings.map(escape).join("<br/>")}</p>` : ""}`;
    const images = [...new Set(slide.extractedImages || [])];
    const bullets = slide.pptSummaryBullets || [];
    return `<div class="ppt-generated-visual"><header><small>${escape(slide.kicker || week)}</small><h3>${escape(slide.title)}</h3></header><div class="ppt-generated-body${images.length ? " has-images" : ""}"><ul>${bullets.map(text => `<li>${escape(text)}</li>`).join("")}</ul>${images.length ? `<div class="ppt-import-media">${images.map((src, index) => `<figure><img src="${escape(src)}" alt="${escape(slide.title)} — Görsel ${index + 1}"/></figure>`).join("")}</div>` : ""}</div><footer>${slideIndex + 1} / ${totalSlides}</footer></div>`;
  }

  root.SlideVisual = { render, contentVisibility };
  if (typeof module !== "undefined") module.exports = { render, contentVisibility };
})(typeof window !== "undefined" ? window : globalThis);
