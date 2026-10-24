(function (root) {
  const STRING_LENGTH = 32 * 1024;
  const PART_LENGTH = 4 * 1024 * 1024;
  const REFERENCE_LENGTH = 4096;

  /** Encodes bounded records, sharing repeated media without changing the document. */
  function* records(value, path = [], strings = new Map()) {
    if (typeof value === "string") {
      if (strings.has(value)) { yield { path, reference: strings.get(value) }; return; }
      const reference = value.length >= REFERENCE_LENGTH ? strings.size : undefined;
      if (reference !== undefined) strings.set(value, reference);
      if (!value.length) { yield { path, value }; return; }
      for (let start = 0; start < value.length; start += STRING_LENGTH) {
        yield { path, value: value.slice(start, start + STRING_LENGTH), append: start > 0,
          ...(start === 0 && reference !== undefined ? { id: reference } : {}) };
      }
    } else if (value && typeof value === "object") {
      yield { path, value: Array.isArray(value) ? [] : {} };
      for (const key of Object.keys(value)) {
        const item = value[key];
        if (item !== undefined && typeof item !== "function" && typeof item !== "symbol") yield* records(item, [...path, key], strings);
        else if (Array.isArray(value)) yield { path: [...path, key], value: null };
      }
    } else yield { path, value };
  }

  /** Each part is independently readable; the whole document never becomes one string. */
  function* parts(document) {
    let lines = [], length = 0;
    for (const record of records(document)) {
      const line = JSON.stringify(record);
      if (length + line.length + 1 > PART_LENGTH && lines.length) {
        yield lines.join("\n"); lines = []; length = 0;
      }
      lines.push(line); length += line.length + 1;
    }
    if (lines.length) yield lines.join("\n");
  }

  /** Reassembles verified parts while keeping large strings confined to their fields. */
  function decoder() {
    let document;
    const references = new Map();
    const get = path => path.reduce((value, key) => {
      if (!value || !Object.hasOwn(value, key)) throw new Error("Invalid lecture document reference");
      return value[key];
    }, document);
    return {
      add(text) {
        for (const line of text.split("\n")) {
          const record = JSON.parse(line);
          const { path } = record;
          if (!Array.isArray(path) || path.some(key => typeof key !== "string")) throw new Error("Invalid lecture document path");
          if (record.id !== undefined) references.set(record.id, path);
          let value = record.reference === undefined ? record.value : get(references.get(record.reference));
          if (record.append) value = get(path) + value;
          if (!path.length) document = value;
          else Object.defineProperty(get(path.slice(0, -1)), path.at(-1), { value, writable: true, enumerable: true, configurable: true });
        }
      },
      result: () => document
    };
  }

  root.LectureDocument = { parts, decoder, partLength: PART_LENGTH };
  if (typeof module !== "undefined") module.exports = root.LectureDocument;
})(typeof window !== "undefined" ? window : globalThis);
