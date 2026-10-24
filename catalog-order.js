(function (root) {
  const weekNumber = label => {
    const match = String(label || "").match(/\d+/);
    return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
  };

  /** Orders numbered weeks numerically while preserving ties and unnumbered entries. */
  function compareWeeks(first, second) {
    const a = weekNumber(first);
    const b = weekNumber(second);
    return a === b ? 0 : a < b ? -1 : 1;
  }

  root.CatalogOrder = { compareWeeks };
  if (typeof module !== "undefined") module.exports = { compareWeeks };
})(typeof window !== "undefined" ? window : globalThis);
