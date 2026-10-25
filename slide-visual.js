(function (root) {
  const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  /** Keeps complete notes visible alongside an original slide in PPT mode. */
  function contentVisibility(slide, mode) {
    const hasNotes = Boolean(String(slide.html || "").trim());
    const hasOriginal = Boolean(slide.pptImageUrl || (!slide.sourceSlideEdited && slide.sourceSlideVisual) || root.PptxDisplay?.visualFor(slide));
    const hasMedia = Array.isArray(slide.extractedImages) && slide.extractedImages.length > 0;
    const visualMode = mode === "ppt" || mode === "image";
    return { web: !visualMode || hasNotes, ppt: visualMode && (hasOriginal || hasMedia || !hasNotes) };
  }

  /** Uses original slide geometry when available; never invents a technical image. */
  function render(slide, slideIndex, totalSlides, week) {
    const native = root.PptxDisplay?.visualFor(slide);
    if (native && !slide.pptImageUrl) return `<div class="ppt-native-frame ppt-source-frame" style="aspect-ratio:${escape(native.ratio)}" data-pptx-render="${escape(native.token)}" role="img" aria-label="${escape(slide.title)}">Slayt yükleniyor…</div>`;
    const original = slide.pptImageUrl || (!slide.sourceSlideEdited && slide.sourceSlideVisual);
    if (original) return `<div class="ppt-exact-frame ppt-source-frame" style="aspect-ratio:${escape(slide.sourceSlideRatio || "auto")}"><img src="${escape(original)}" alt="${escape(slide.title)}"/></div>${slide.sourceWarnings?.length ? `<p class="ppt-import-warning">${slide.sourceWarnings.map(escape).join("<br/>")}</p>` : ""}`;
    const images = [...new Set(slide.extractedImages || [])];
    const bullets = slide.pptSummaryBullets || [];
    return `<div class="ppt-generated-visual"><header><small>${escape(slide.kicker || week)}</small><h3>${escape(slide.title)}</h3></header><div class="ppt-generated-body${images.length ? " has-images" : ""}"><ul>${bullets.map(text => `<li>${escape(text)}</li>`).join("")}</ul>${images.length ? `<div class="ppt-import-media">${images.map((src, index) => `<figure><img src="${escape(src)}" alt="${escape(slide.title)} — Görsel ${index + 1}"/></figure>`).join("")}</div>` : ""}</div><footer>${slideIndex + 1} / ${totalSlides}</footer></div>`;
  }

  root.SlideVisual = { render, contentVisibility };
  if (typeof module !== "undefined") module.exports = { render, contentVisibility };
})(typeof window !== "undefined" ? window : globalThis);
