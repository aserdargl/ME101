/** Keeps catalog search and content totals in sync with the rendered lectures. */
function updateCatalogOverview() {
  const cards = Array.from(document.querySelectorAll(".lecture-card"));
  const slideCount = cards.reduce((total, card) => {
    return total + (Number.parseInt(card.querySelector(".slide-count-tag").textContent, 10) || 0);
  }, 0);
  document.getElementById("catalog-lecture-count").textContent = cards.length;
  document.getElementById("catalog-slide-count").textContent = slideCount;
  filterCatalog();
}

/** Filters visible lessons without changing stored course or student data. */
function filterCatalog() {
  const query = normalizeCatalogSearch(document.getElementById("lecture-search").value.trim());
  const cards = Array.from(document.querySelectorAll(".lecture-card"));
  let visibleCount = 0;
  cards.forEach((card) => {
    const text = [".week-tag", ".lecture-title-wrap h4", ".lecture-desc-wrap p"]
      .map((selector) => {
        const element = card.querySelector(selector);
        return window.PortalLanguage?.searchText(element) || element.textContent;
      }).join(" ");
    const matches = normalizeCatalogSearch(text).includes(query);
    card.classList.toggle("hidden", !matches);
    if (matches) visibleCount += 1;
  });
  document.getElementById("catalog-empty").classList.toggle("hidden", visibleCount > 0);
  document.getElementById("catalog-search-status").textContent = `${visibleCount} ders gösteriliyor.`;
}

/** Accepts English and Turkish queries regardless of the active display language. */
function normalizeCatalogSearch(text) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/ı/g, "i");
}

document.getElementById("lecture-search").addEventListener("input", filterCatalog);
document.getElementById("catalog-search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  filterCatalog();
});
