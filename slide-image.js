/* Creates display-only PNGs; lecture content and uploaded files remain untouched. */
window.SlideImage = (() => {
  const MAX_WIDTH = 1920;

  async function embedResource(url) {
    return dataUrl(await (await fetch(url)).blob());
  }

  function dataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function cloneVisual(source) {
    if (source.nodeType !== Node.ELEMENT_NODE) return source.cloneNode();
    if (source.tagName === "CANVAS") {
      const image = new Image();
      image.src = source.toDataURL("image/png");
      image.style.cssText = source.style.cssText;
      return image;
    }
    const clone = source.cloneNode(false);
    const style = getComputedStyle(source);
    for (const property of style) {
      let value = style.getPropertyValue(property);
      const resources = [...value.matchAll(/url\(["']?(blob:[^"')]+)["']?\)/g)];
      for (const match of resources) value = value.replace(match[1], await embedResource(match[1]));
      clone.style.setProperty(property, value);
    }
    if (source instanceof HTMLImageElement) {
      await source.decode();
      clone.src = await embedResource(source.currentSrc || source.src);
      clone.removeAttribute("srcset");
    }
    for (const attribute of source.attributes) {
      if (attribute.value.startsWith("blob:")) clone.setAttributeNS(attribute.namespaceURI, attribute.name, await embedResource(attribute.value));
    }
    for (const child of source.childNodes) clone.append(await cloneVisual(child));
    return clone;
  }

  /** Captures a mounted PPT slide at its native ratio, independently of viewport size. */
  async function capture(element, width, height) {
    await document.fonts.ready;
    const clone = await cloneVisual(element);
    Object.assign(clone.style, { transform: "none", position: "relative", left: "0", top: "0" });
    const markup = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
    const image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(MAX_WIDTH, Math.ceil(width * 2));
    canvas.height = Math.round(canvas.width * height / width);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  /** Leaves the existing PPT rendering visible if image conversion is unavailable. */
  async function replace(host, state) {
    if (state.image || host.dataset.imagePending) return;
    host.dataset.imagePending = "true";
    try {
      const src = await capture(state.handle.element, state.presentation.width, state.presentation.height);
      if (!host.isConnected || host.dataset.displayMode !== "image") return;
      const image = new Image();
      image.alt = host.getAttribute("aria-label") || "Slayt";
      image.src = src;
      Object.assign(image.style, { width: "100%", height: "100%", objectFit: "contain" });
      state.handle.element.style.visibility = "hidden";
      host.shadowRoot.append(image);
      state.image = image;
      host.dataset.imageReady = "true";
    } catch {
      host.dataset.imageError = "true";
      host.title = "Resim oluşturulamadı; özgün slayt görünümü gösteriliyor.";
    } finally { delete host.dataset.imagePending; }
  }

  function setMode(host, state, mode) {
    host.dataset.displayMode = mode;
    if (state.image) state.image.hidden = mode !== "image";
    state.handle.element.style.visibility = mode === "image" && state.image ? "hidden" : "visible";
    if (mode === "image") replace(host, state);
  }

  return { capture, setMode };
})();
