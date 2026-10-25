/** Localizes rendered interface nodes without touching course models or form values. */
(function () {
  const translations = window.PORTAL_ENGLISH;
  const originals = new WeakMap();
  const attributes = ["title", "placeholder", "aria-label"];
  const protectedContent = [
    "script", "style", "[contenteditable]", "[data-language-toggle]",
    ".slide-kicker", ".slide > h2", ".slide-content > h2",
    ".slide-body-web", ".slide-body-ppt", ".edit-thumb-preview", ".edit-thumb-title",
    ".edit-live-preview-stage",
    ".roster-item", "[data-roster-value]"
  ].join(",");
  let language = "en";

  function english(text) {
    if (Object.hasOwn(translations, text)) return translations[text];
    const patterns = [
      [/^(.+) · HTML eklendi\. Kalıcı olması için Değişiklikleri Kaydet düğmesine basın\.$/, "$1 · HTML inserted. Select Save Changes to keep it."],
      [/^Drive yedeği kaydediliyor · (\d+)\/(\d+) parça$/, "Saving Drive backup · $1/$2 parts"],
      [/^Drive ders dosyaları kaydediliyor · (\d+)\/(\d+) dosya$/, "Saving lesson files to Drive · $1/$2 files"],
      [/^Drive’a yükleniyor · %(\d+)$/, "Uploading to Drive · $1%"],
      [/^Aktarım hazırlanıyor · (\d+) parça hazır$/, "Preparing transfer · $1 parts ready"],
      [/^GitHub’a aktarılıyor · (\d+)\/(\d+) parça · %(\d+)$/, "Transferring to GitHub · $1/$2 parts · $3%"],
      [/^(.+) · Yerel notlar korunuyor\. Yeniden aktarırken tamamlanan parçalar kullanılacak\.$/, (_, reason) => `${english(reason)} · Local notes are preserved. Retry Transfer to reuse completed parts.`],
      [/^(\d+)\.\s*Hafta$/i, "Week $1"],
      [/^(\d+)\.\s*Hafta:\s*(.+)$/i, (_, week, title) => `Week ${week}: ${english(title)}`],
      [/^1 Slayt$/, "1 Slide"], [/^(\d+) Slayt$/, "$1 Slides"], [/^(\d+)\. Slayt$/, "Slide $1"],
      [/^Slayt (\d+) \/ (\d+)$/, "Slide $1 / $2"],
      [/^Adım (\d+)\/(\d+)$/, "Step $1/$2"],
      [/^Seçili: Slayt (\d+) \/ (\d+)$/, "Selected: Slide $1 / $2"],
      [/^(.+) — Dersi ve Slaytları Düzenle$/, "$1 — Edit Lesson and Slides"],
      [/^(\d+) ders gösteriliyor\.$/, "$1 lessons shown."],
      [/^(\d+) Yıldız Ver$/, "Rate $1 Stars"],
      [/^\+ (\d+) ile (\d+) Arasına:$/, "+ Insert Between $1 and $2:"],
      [/^Simülasyon \((.+)\)$/, "Simulation ($1)"],
      [/^Teknik Simülasyon Slaytı \((.+)\)$/, "Technical Simulation Slide ($1)"],
      [/^(\d+) oy$/, "$1 votes"],
      [/^\((\d+) oy( • Sizin: (\d+)★)?\)$/, (_, count, vote, score) => `(${count} votes${vote ? ` • Yours: ${score}★` : ""})`]
    ];
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(text)) return text.replace(pattern, replacement);
    }
    return text;
  }

  function localize(owner, key, current, write) {
    const records = originals.get(owner) || {};
    let record = records[key];
    if (!record || current !== record.rendered) record = { source: current };
    const trimmed = record.source.trim();
    const translated = language === "en" ? english(trimmed) : trimmed;
    record.rendered = record.source.replace(trimmed, () => translated);
    records[key] = record;
    originals.set(owner, records);
    if (current !== record.rendered) write(record.rendered);
  }

  function translateNode(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element || element.closest(protectedContent)) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) localize(node, "text", node.textContent, value => { node.textContent = value; });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    for (const name of attributes) {
      if (node.hasAttribute(name)) localize(node, name, node.getAttribute(name), value => node.setAttribute(name, value));
    }
    if (node.tagName === "TEXTAREA") return;
    for (const child of node.childNodes) translateNode(child);
  }

  /** Searches both displayed and original text without changing the stored lesson. */
  function searchText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const source = originals.get(node)?.text?.source || node.textContent;
      return `${source} ${english(source.trim())}`;
    }
    return Array.from(node.childNodes, searchText).join(" ");
  }

  /** Changes the display language; no persistence or lecture-writing APIs are used. */
  function setLanguage(next) {
    language = next === "tr" ? "tr" : "en";
    document.documentElement.lang = language;
    translateNode(document.body);
    if (typeof window.filterCatalog === "function") window.filterCatalog();
    // The title is interface metadata, separate from all stored lesson titles.
    const title = "MEE 101 — Makine Mühendisliğine Giriş | Ders Portalı";
    document.title = language === "en" ? english(title) : title;
    document.querySelectorAll("[data-language-toggle]").forEach(button => {
      button.querySelector("span").textContent = language.toUpperCase();
      const action = language === "en" ? "Switch to Turkish" : "İngilizceye geç";
      button.setAttribute("aria-label", action);
      button.title = action;
      button.querySelectorAll("[data-language-flag]").forEach(flag => {
        flag.toggleAttribute("hidden", flag.dataset.languageFlag !== language);
      });
    });
  }

  const observer = new MutationObserver(records => {
    const pending = new Set();
    for (const record of records) {
      if (record.type === "childList") record.addedNodes.forEach(node => pending.add(node));
      else pending.add(record.target);
    }
    pending.forEach(node => {
      // An added parent already covers its descendants in this mutation batch.
      let parent = node.parentNode;
      while (parent && !pending.has(parent)) parent = parent.parentNode;
      if (!parent) translateNode(node);
    });
  });
  document.querySelectorAll("[data-language-toggle]").forEach(button => {
    button.addEventListener("click", () => setLanguage(language === "en" ? "tr" : "en"));
  });
  setLanguage("en");
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  window.PortalLanguage = { setLanguage, searchText, text: text => language === "en" ? english(text) : text };
})();
