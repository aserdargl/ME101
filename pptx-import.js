/* OOXML package reader. Resolves actual parts, rather than slide-number guesses. */
(function (root) {
  const DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
  const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp", bmp: "image/bmp", tif: "image/tiff", tiff: "image/tiff", emf: "image/emf", wmf: "image/wmf" };
  const SUPPORTED = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"]);
  const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const elements = (node, name) => Array.from(node.getElementsByTagName("*")).filter(item => item.localName === name);
  const first = (node, name) => elements(node, name)[0];
  const children = node => Array.from(node.childNodes || []).filter(child => child.nodeType === 1);
  const number = (node, attr, fallback = 0) => node ? Number(node.getAttribute(attr) || fallback) : fallback;
  const reference = node => node.getAttributeNS(REL_NS, "embed") || node.getAttributeNS(REL_NS, "id") || node.getAttributeNS(REL_NS, "link") || Array.from(node.attributes || []).find(attr => ["embed", "id", "link"].includes(attr.localName) && attr.prefix)?.value;

  /** Resolves package-relative paths, including absolute OPC part names. */
  function resolvePart(base, target) {
    const path = target.startsWith("/") ? target.slice(1) : base.slice(0, base.lastIndexOf("/") + 1) + target;
    const parts = [];
    for (const part of decodeURIComponent(path).split("/")) {
      if (part === "..") parts.pop();
      else if (part && part !== ".") parts.push(part);
    }
    return parts.join("/");
  }

  class PptxPackage {
    constructor(zip, parser) { this.zip = zip; this.parser = parser; this.cache = new Map(); this.warnings = []; }

    async xml(path) {
      if (this.cache.has(path)) return this.cache.get(path);
      const entry = this.zip.file(path);
      if (!entry) return null;
      const xml = (await entry.async("text")).replace(/^\uFEFF/, "");
      const doc = this.parser.parseFromString(xml, "application/xml");
      if (elements(doc, "parsererror").length) throw new Error(`PPTX XML okunamadı: ${path}`);
      this.cache.set(path, doc);
      return doc;
    }

    async relations(path) {
      const split = path.lastIndexOf("/");
      const doc = await this.xml(`${path.slice(0, split)}/_rels/${path.slice(split + 1)}.rels`);
      return new Map(doc ? elements(doc, "Relationship").map(node => [node.getAttribute("Id"), {
        path: resolvePart(path, node.getAttribute("Target") || ""),
        type: node.getAttribute("Type") || "", external: node.getAttribute("TargetMode") === "External"
      }]) : []);
    }

    async image(part) {
      const entry = this.zip.file(part);
      if (!entry) { this.warnings.push(`Görsel dosyası bulunamadı: ${part}`); return null; }
      const ext = part.split(".").pop().toLowerCase();
      const data = `data:${MIME[ext] || "application/octet-stream"};base64,${await entry.async("base64")}`;
      if (!SUPPORTED.has(ext)) this.warnings.push(`${part}: ${ext.toUpperCase()} görseli tarayıcıda doğrudan gösterilemiyor.`);
      return { path: part, data, supported: SUPPORTED.has(ext) };
    }

    async part(path) {
      const doc = await this.xml(path);
      if (!doc) return null;
      const relations = await this.relations(path);
      const images = new Map();
      for (const blip of [...elements(doc, "blip"), ...elements(doc, "svgBlip")]) {
        const id = reference(blip);
        const relation = relations.get(id);
        if (relation?.external) this.warnings.push("Bağlantılı bir görsel PPTX dosyasının dışında; görseli PPTX içine gömerek yeniden yükleyin.");
        if (!relation || relation.external || images.has(id)) continue;
        const image = await this.image(relation.path);
        if (image) images.set(id, image);
      }
      return { doc, relations, images, path };
    }
  }

  function shapeBox(shape, inherited, unit = 1) {
    let transform = first(shape, "xfrm");
    if (!transform && inherited) transform = first(inherited, "xfrm");
    const offset = transform && first(transform, "off");
    const extent = transform && first(transform, "ext");
    return { x: number(offset, "x") * unit, y: number(offset, "y") * unit, w: number(extent, "cx") * unit, h: number(extent, "cy") * unit, transform };
  }

  function placeholder(shape, layout) {
    const ph = first(shape, "ph");
    if (!ph || !layout) return null;
    return elements(layout.doc, "sp").find(candidate => {
      const other = first(candidate, "ph");
      return other && (other.getAttribute("idx") || "0") === (ph.getAttribute("idx") || "0") &&
        (other.getAttribute("type") || "body") === (ph.getAttribute("type") || "body");
    });
  }

  function color(node, fallback = "#263440") {
    const rgb = node && first(node, "srgbClr");
    return rgb && /^[a-f\d]{6}$/i.test(rgb.getAttribute("val")) ? `#${rgb.getAttribute("val")}` : fallback;
  }

  function wrapText(text, maxChars) {
    const lines = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      if (line && line.length + word.length + 1 > maxChars) { lines.push(line); line = ""; }
      line += (line ? " " : "") + word;
    }
    if (line) lines.push(line);
    return lines;
  }

  function renderText(shape, box, unit) {
    const body = first(shape, "txBody");
    if (!body || !box.w || !box.h) return "";
    const paragraphs = elements(body, "p").filter(node => node.namespaceURI === DRAWING_NS || node.namespaceURI?.includes("drawingml"));
    const inset = Math.min(91440 * unit, box.w / 30);
    const rows = paragraphs.map(paragraph => {
      const text = elements(paragraph, "t").map(node => node.textContent).join("");
      const props = first(paragraph, "rPr") || first(paragraph, "defRPr");
      const font = number(props, "sz", 2000) * 127 * unit;
      return { lines: wrapText(text, Math.max(3, Math.floor((box.w - 2 * inset) / (font * .52)))), font, fill: color(props), bold: props?.getAttribute("b") === "1" };
    });
    const needed = rows.reduce((total, row) => total + Math.max(1, row.lines.length) * row.font * 1.22, 0);
    const scale = Math.min(1, (box.h - inset) / Math.max(1, needed));
    let y = box.y + inset;
    return rows.map(row => row.lines.map(line => {
      const size = row.font * scale;
      y += size * 1.2;
      return `<text x="${box.x + inset}" y="${y}" fill="${row.fill}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${row.bold ? 700 : 400}">${escape(line)}</text>`;
    }).join("")).join("");
  }

  function renderShape(shape, part, layout, state) {
    const name = shape.localName;
    if (name === "grpSp") {
      const xfrm = first(shape, "xfrm");
      const box = shapeBox(shape, null, state.unit);
      const childOffset = xfrm && first(xfrm, "chOff");
      const childExtent = xfrm && first(xfrm, "chExt");
      const sx = box.w / (number(childExtent, "cx") * state.unit || box.w || 1);
      const sy = box.h / (number(childExtent, "cy") * state.unit || box.h || 1);
      return `<g transform="translate(${box.x} ${box.y}) scale(${sx} ${sy}) translate(${-number(childOffset, "x") * state.unit} ${-number(childOffset, "y") * state.unit})">${children(shape).map(child => renderShape(child, part, layout, state)).join("")}</g>`;
    }
    if (!["pic", "sp", "cxnSp", "graphicFrame"].includes(name)) return "";
    if (state.inherited && first(shape, "ph")) return "";
    const box = shapeBox(shape, placeholder(shape, layout), state.unit);
    if (!box.w || !box.h) return "";
    let content = "";
    if (name === "pic") {
      const blips = [...elements(shape, "svgBlip"), ...elements(shape, "blip")];
      const image = blips.map(blip => part.images.get(reference(blip))).find(item => item?.supported);
      if (!image) return "";
      const crop = first(shape, "srcRect");
      const left = number(crop, "l") / 100000, right = number(crop, "r") / 100000;
      const top = number(crop, "t") / 100000, bottom = number(crop, "b") / 100000;
      const width = box.w / Math.max(.001, 1 - left - right), height = box.h / Math.max(.001, 1 - top - bottom);
      const clip = `image-${state.nextId++}`;
      content = `<defs><clipPath id="${clip}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"/></clipPath></defs><image href="${escape(image.data)}" x="${box.x - width * left}" y="${box.y - height * top}" width="${width}" height="${height}" preserveAspectRatio="none" clip-path="url(#${clip})"/>`;
    } else {
      const properties = children(shape).find(child => child.localName === "spPr");
      const fill = properties && children(properties).find(child => child.localName === "solidFill");
      const preset = properties && first(properties, "prstGeom")?.getAttribute("prst");
      if (fill) {
        content += preset === "ellipse"
          ? `<ellipse cx="${box.x + box.w / 2}" cy="${box.y + box.h / 2}" rx="${box.w / 2}" ry="${box.h / 2}" fill="${color(fill, "#e8eef2")}"/>`
          : `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="${color(fill, "#e8eef2")}"/>`;
      }
      const table = name === "graphicFrame" && first(shape, "tbl");
      content += table ? renderTable(table, box, state.unit) : renderText(shape, box, state.unit);
    }
    const angle = number(box.transform, "rot") / 60000;
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const flipX = box.transform?.getAttribute("flipH") === "1" ? -1 : 1;
    const flipY = box.transform?.getAttribute("flipV") === "1" ? -1 : 1;
    return `<g transform="translate(${cx} ${cy}) rotate(${angle}) scale(${flipX} ${flipY}) translate(${-cx} ${-cy})">${content}</g>`;
  }

  function renderTable(table, box, unit) {
    const columns = elements(table, "gridCol").map(col => number(col, "w") * unit);
    const rows = children(table).filter(row => row.localName === "tr");
    let y = box.y;
    return rows.map(row => {
      const height = number(row, "h", box.h / Math.max(1, rows.length) / unit) * unit;
      let x = box.x;
      const cells = children(row).filter(cell => cell.localName === "tc");
      const rendered = cells.map((cell, index) => {
        const width = columns[index] || box.w / Math.max(1, cells.length);
        const properties = first(cell, "tcPr");
        const fill = properties && first(properties, "solidFill");
        const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color(fill, "#ffffff")}" stroke="#c7cfd7" stroke-width="1"/>`;
        const text = renderText(cell, { x, y, w: width, h: height }, unit);
        x += width;
        return rect + text;
      }).join("");
      y += height;
      return rendered;
    }).join("");
  }

  function sourceVisual(parts, width, height) {
    const state = { nextId: 0, inherited: true, unit: 1280 / width };
    const canvasHeight = height * state.unit;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="${canvasHeight}" viewBox="0 0 1280 ${canvasHeight}">`;
    let background = "#ffffff";
    let backgroundImage = null;
    for (const part of parts) {
      const bg = first(part.doc, "bg");
      if (bg) {
        background = color(bg, background);
        const blip = first(bg, "blip");
        backgroundImage = blip ? part.images.get(reference(blip)) : null;
      }
    }
    svg += `<rect width="1280" height="${canvasHeight}" fill="${background}"/>`;
    if (backgroundImage?.supported) svg += `<image href="${escape(backgroundImage.data)}" width="1280" height="${canvasHeight}" preserveAspectRatio="none"/>`;
    parts.forEach((part, index) => {
      state.inherited = index < parts.length - 1;
      const tree = first(part.doc, "spTree");
      if (tree) svg += children(tree).map(shape => renderShape(shape, part, parts[parts.length - 2], state)).join("");
    });
    return svg + "</svg>";
  }

  /** Reads all embedded images and preserves source slide order and geometry. */
  async function parse(file, weekLabel, customTitle, dependencies = {}) {
    const zip = await (dependencies.JSZip || root.JSZip).loadAsync(file);
    const pkg = new PptxPackage(zip, dependencies.parser || new root.DOMParser());
    const presentation = await pkg.xml("ppt/presentation.xml");
    const relations = await pkg.relations("ppt/presentation.xml");
    let paths = presentation ? elements(presentation, "sldId").map(node => relations.get(reference(node))).filter(item => item && !item.external).map(item => item.path) : [];
    if (!paths.length) paths = Object.keys(zip.files).filter(path => /^ppt\/slides\/slide\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    if (!paths.length) throw new Error("PPTX dosyasında okunabilir slayt bulunamadı.");
    const size = presentation && first(presentation, "sldSz");
    const width = number(size, "cx", 12192000), height = number(size, "cy", 6858000);
    const slides = [];
    const yieldIntervalMs = 12;
    let lastYield = Date.now();
    for (const [index, path] of paths.entries()) {
      if (root.document && Date.now() - lastYield >= yieldIntervalMs) {
        await new Promise(resolve => setTimeout(resolve, 0));
        lastYield = Date.now();
      }
      const part = await pkg.part(path);
      if (!part) throw new Error(`Slayt dosyası bulunamadı: ${path}`);
      const layoutPath = [...part.relations.values()].find(item => item.type.endsWith("/slideLayout") && !item.external)?.path;
      const layout = layoutPath ? await pkg.part(layoutPath) : null;
      const masterPath = layout && [...layout.relations.values()].find(item => item.type.endsWith("/slideMaster") && !item.external)?.path;
      const master = masterPath ? await pkg.part(masterPath) : null;
      const parts = [master, layout, part].filter(Boolean);
      const images = [...new Map(parts.flatMap(item => [...item.images.values()]).map(image => [image.path, image])).values()];
      const lines = elements(part.doc, "p").map(p => elements(p, "t").map(t => t.textContent).join("").trim()).filter(Boolean);
      const title = lines[0] || `${customTitle || file.name || "Sunum"} — Slayt ${index + 1}`;
      const bullets = lines.slice(1);
      const usable = images.filter(image => image.supported);
      const media = usable.length ? `<div class="ppt-import-media">${usable.map((image, i) => `<figure><img src="${escape(image.data)}" alt="${escape(title)} — Görsel ${i + 1}" loading="lazy"/></figure>`).join("")}</div>` : "";
      if (elements(part.doc, "chart").length || elements(part.doc, "relIds").length) pkg.warnings.push(`${index + 1}. slaytta grafik veya SmartArt var; birebir görünüm için PowerPoint slayt görseli kullanılmalı.`);
      const svg = sourceVisual(parts, width, height);
      const unplacedText = elements(part.doc, "sp").some(shape => first(shape, "txBody") && first(shape, "t") && !shapeBox(shape, placeholder(shape, layout)).w);
      const visual = unplacedText || !/<(?:text|image|ellipse)\b/.test(svg) ? "" : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      slides.push({ kicker: `${weekLabel.toLocaleUpperCase("tr")} • BÖLÜM ${index + 1}`, title, pptSummaryBullets: bullets,
        defaultViewMode: "ppt", extractedImages: usable.map(image => image.data), sourceSlidePath: path, sourceSlideVisual: visual,
        sourceSlideRatio: `${width}/${height}`, sourceWarnings: [...new Set(pkg.warnings)],
        originalMedia: images.filter(image => !image.supported),
        html: `<div class="ppt-import-content">${bullets.length ? `<ul class="bullet-list">${bullets.map((line, i) => `<li class="fragment"><span class="bullet-marker">${String(i + 1).padStart(2, "0")}</span><div>${escape(line)}</div></li>`).join("")}</ul>` : ""}${media}${pkg.warnings.length ? `<p class="ppt-import-warning">${[...new Set(pkg.warnings)].map(escape).join("<br/>")}</p>` : ""}</div>` });
    }
    if (root.PptxDisplay) await root.PptxDisplay.prepareUpload(file, slides);
    return slides;
  }

  /** Adds recovered media without replacing existing notes or slide ordering. */
  function repairMedia(existingSlides, importedSlides) {
    let repaired = 0;
    const unmatched = [];
    for (const existing of existingSlides) {
      const candidates = importedSlides.filter(slide => existing.sourceSlidePath ? slide.sourceSlidePath === existing.sourceSlidePath : slide.title.trim() === String(existing.title).trim());
      if (candidates.length !== 1) { unmatched.push(existing.title); continue; }
      const imported = candidates[0];
      const recovered = imported.extractedImages || [];
      existing.extractedImages = [...new Set([...(existing.extractedImages || []).filter(url => !url.startsWith("blob:")), ...recovered])];
      existing.sourceSlideVisual = imported.sourceSlideVisual;
      existing.sourceSlideRatio = imported.sourceSlideRatio;
      existing.sourceSlidePath = imported.sourceSlidePath;
      existing.originalMedia = imported.originalMedia;
      let mediaIndex = 0;
      existing.html = String(existing.html || "").replace(/(<img\b[^>]*\bsrc=["'])blob:[^"']+(["'])/gi, (match, prefix, suffix) => recovered[mediaIndex] ? `${prefix}${escape(recovered[mediaIndex++])}${suffix}` : match);
      if (recovered.length && !String(existing.html).includes("ppt-import-media")) {
        const missing = recovered.filter(url => !String(existing.html).includes(url));
        existing.html = String(existing.html || "") + `<div class="ppt-import-media">${missing.map(url => `<figure><img src="${escape(url)}" alt="${escape(existing.title)}"/></figure>`).join("")}</div>`;
      }
      repaired += 1;
    }
    return { repaired, unmatched };
  }

  root.PptxImport = { parse, repairMedia, resolvePart };
  if (typeof module !== "undefined") module.exports = root.PptxImport;
})(typeof window !== "undefined" ? window : globalThis);
