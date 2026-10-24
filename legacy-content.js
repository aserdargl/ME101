/* Identifies only unchanged bundled samples; browser storage is never cleared. */
(function (root) {
  const sampleHashes = new Set(["32bc93c38c17931c2b12fc5840d003ea807f47d2b1a0c11d1d114c79d03499be","9378c83722027a80436cdade6411d2f9fe39b2a907e1b302a46a749f0315d9ca","634fe003d9e04fb7ed97963bb539c24054e849769e2781837e6ab2fe65b189fb","95b364ee521c48dfcfdabf002b790db4faca60b34d3f7f827fc4f03b2661a0a2"]);

  /** Omits known bundled lessons while retaining every edited or uploaded record. */
  async function userLectures(lectures) {
    const checks = await Promise.all(lectures.map(async lecture => {
      const bytes = new TextEncoder().encode(JSON.stringify(lecture));
      const digest = await root.crypto.subtle.digest("SHA-256", bytes);
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      return !sampleHashes.has(hash);
    }));
    return lectures.filter((lecture, index) => checks[index]);
  }

  root.LegacyContent = { userLectures };
  if (typeof module !== "undefined") module.exports = root.LegacyContent;
})(typeof window !== "undefined" ? window : globalThis);
