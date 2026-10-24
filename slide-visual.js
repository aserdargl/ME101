(function (root) {
  const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  /** Uses original slide geometry when available; never invents a technical image. */
  function render(slide, slideIndex, totalSlides, week) {
    const original = slide.pptImageUrl || (!slide.sourceSlideEdited && slide.sourceSlideVisual);
    if (original) return `<div class="ppt-exact-frame ppt-source-frame" style="aspect-ratio:${escape(slide.sourceSlideRatio || "16/9")}"><img src="${escape(original)}" alt="${escape(slide.title)}"/></div>${slide.sourceWarnings?.length ? `<p class="ppt-import-warning">${slide.sourceWarnings.map(escape).join("<br/>")}</p>` : ""}`;
    const images = [...new Set(slide.extractedImages || [])];
    const bullets = slide.pptSummaryBullets || [];
    return `<div class="ppt-generated-visual"><header><small>${escape(slide.kicker || week)}</small><h3>${escape(slide.title)}</h3></header><div class="ppt-generated-body${images.length ? " has-images" : ""}"><ul>${bullets.map(text => `<li>${escape(text)}</li>`).join("")}</ul>${images.length ? `<div class="ppt-import-media">${images.map((src, index) => `<figure><img src="${escape(src)}" alt="${escape(slide.title)} — Görsel ${index + 1}"/></figure>`).join("")}</div>` : ""}</div><footer>${slideIndex + 1} / ${totalSlides}</footer></div>`;
  }

  root.SlideVisual = { render };
  if (typeof module !== "undefined") module.exports = { render };
})(typeof window !== "undefined" ? window : globalThis);
