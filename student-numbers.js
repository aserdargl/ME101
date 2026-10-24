(function (root) {
  const MAX_NUMBER_LENGTH = 32;
  const MAX_NAME_LENGTH = 200;
  const nameKey = value => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");

  /** Keeps leading zeroes intact and rejects spreadsheet-rounded or scientific values. */
  function normalize(value) {
    const number = String(value || "").trim();
    return /^\d+$/.test(number) && number.length <= MAX_NUMBER_LENGTH ? number : null;
  }

  /** Parses number and full-name columns pasted from Excel or loaded from CSV/TXT. */
  function parse(text) {
    const values = String(text || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const numbers = new Map();
    for (const [index, value] of values.entries()) {
      const [rawNo, ...parts] = value.split(/[\t;,]/).map(part => part.trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"'));
      const no = normalize(rawNo);
      const name = parts.join(" ").trim().replace(/\s+/g, " ");
      if (!no || !name || name.length > MAX_NAME_LENGTH) return { ok: false, error: `${index + 1}. satır geçersiz. Biçim: öğrenci numarası;ad soyad (başlık satırı olmadan).` };
      if (numbers.has(no) && numbers.get(no).nameKey !== nameKey(name)) return { ok: false, error: `${no} numarası birden fazla farklı isimle yazılmış. Listeyi kontrol ediniz.` };
      numbers.set(no, { no, name, nameKey: nameKey(name), enabled: true });
    }
    return numbers.size ? { ok: true, students: [...numbers.values()] } : { ok: false, error: "En az bir öğrenci numarası giriniz." };
  }

  root.StudentNumbers = { normalize, nameKey, parse };
  if (typeof module !== "undefined") module.exports = { normalize, nameKey, parse };
})(typeof window !== "undefined" ? window : globalThis);
