/** Fits complete slide content within the space above the presentation controls. */
window.PresentationFit = (() => {
  const CONTROL_GAP = 12;
  const toolbar = document.getElementById("presentation-toolbar");
  const viewport = document.getElementById("slides-viewport");
  let scheduled = false;
  let observedContent;

  function fit() {
    scheduled = false;
    if (!document.body.classList.contains("presentation-mode")) return;
    const slide = document.querySelector(".slide.active-slide");
    const content = slide?.querySelector(".slide-content");
    if (!content) return;
    document.body.style.setProperty("--presentation-toolbar-height", `${toolbar.offsetHeight}px`);
    const style = getComputedStyle(slide);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingBottom = parseFloat(style.paddingBottom);
    const width = Math.max(1, slide.clientWidth - paddingLeft - parseFloat(style.paddingRight));
    content.style.setProperty("--presentation-content-width", `${width}px`);
    const controls = slide.querySelector(".slide-top-controls");
    const top = Math.max(parseFloat(style.paddingTop), controls.offsetTop + controls.offsetHeight + CONTROL_GAP);
    const height = Math.max(1, slide.clientHeight - top - paddingBottom);
    // HTML uses the complete available rectangle; only its inner page is scaled.
    content.style.setProperty("--presentation-html-height", `${height}px`);
    const naturalWidth = Math.max(width, content.scrollWidth);
    const naturalHeight = Math.max(1, content.scrollHeight, content.offsetHeight);
    const scale = Math.min(1, width / naturalWidth, height / naturalHeight);
    content.style.setProperty("--presentation-scale", String(scale));
    content.style.setProperty("--presentation-content-left", `${paddingLeft + (width - naturalWidth * scale) / 2}px`);
    content.style.setProperty("--presentation-content-top", `${top + (height - naturalHeight * scale) / 2}px`);
    if (observedContent !== content) {
      if (observedContent) resize.unobserve(observedContent);
      observedContent = content;
      resize.observe(content);
    }
  }

  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(fit); }
  }

  const resize = new ResizeObserver(schedule);
  resize.observe(toolbar);
  resize.observe(viewport);
  new MutationObserver(schedule).observe(document.getElementById("lecture-view"), {
    subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-view-mode"]
  });
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("load", schedule, true);
  document.addEventListener("fullscreenchange", schedule);
  window.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  document.fonts.ready.then(schedule);

  return { schedule };
})();
