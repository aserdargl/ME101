(function (root) {
  const STRING_LENGTH = 32 * 1024;
  const PART_LENGTH = 4 * 1024 * 1024;
  const REFERENCE_LENGTH = 4096;
  const COMPRESSION_SAMPLE_LENGTH = 16 * 1024;
  const MIN_COMPRESSION_RATIO = 0.9;
  const LEGACY_JSON_LENGTH = 2 * 1024 * 1024;

  /** Avoids allocating a huge JSON string for the small localStorage fallback. */
  function legacyJson(value, limit = LEGACY_JSON_LENGTH) {
    const pending = [value];
    let length = 0;
    const seen = new WeakSet();
    while (pending.length) {
      const item = pending.pop();
      if (typeof item === "string") length += item.length + 2;
      else if (item && typeof item === "object") {
        if (seen.has(item)) return null;
        seen.add(item);
        const keys = Object.keys(item);
        length += keys.reduce((sum, key) => sum + key.length + 4, 2);
        for (const key of keys) pending.push(item[key]);
      } else length += 5;
      if (length > limit) return null;
    }
    const json = JSON.stringify(value);
    return json.length <= limit ? json : null;
  }

  /** Copies editable containers while sharing immutable media strings. */
  function snapshot(value, seen = new WeakMap()) {
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return seen.get(value);
    const kind = Object.prototype.toString.call(value);
    if (kind !== "[object Object]" && kind !== "[object Array]") return structuredClone(value);
    const copy = Array.isArray(value) ? new Array(value.length) : {};
    seen.set(value, copy);
    for (const key of Object.keys(value)) {
      Object.defineProperty(copy, key, { value: snapshot(value[key], seen), enumerable: true, writable: true, configurable: true });
    }
    return copy;
  }

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

  /** Losslessly reduces upload bytes; older browsers retain the plain part format. */
  async function pack(text) {
    if (!root.CompressionStream || !root.DecompressionStream) return { content: text, encoding: "plain" };
    if (text.length > COMPRESSION_SAMPLE_LENGTH * 4) {
      const middle = Math.floor(text.length / 2);
      const sample = text.slice(0, COMPRESSION_SAMPLE_LENGTH) + text.slice(middle, middle + COMPRESSION_SAMPLE_LENGTH) + text.slice(-COMPRESSION_SAMPLE_LENGTH);
      const compressed = await gzip(sample);
      if (Math.ceil(compressed.length / 3) * 4 >= sample.length * MIN_COMPRESSION_RATIO) return { content: text, encoding: "plain" };
    }
    const bytes = await gzip(text);
    const segments = [];
    for (let start = 0; start < bytes.length; start += STRING_LENGTH) segments.push(String.fromCharCode(...bytes.subarray(start, start + STRING_LENGTH)));
    const content = root.btoa(segments.join(""));
    return content.length < text.length ? { content, encoding: "gzip" } : { content: text, encoding: "plain" };
  }

  async function gzip(text) {
    const stream = new Blob([text]).stream().pipeThrough(new root.CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unpack(text, encoding = "plain") {
    if (encoding === "plain") return text;
    if (encoding !== "gzip" || !root.DecompressionStream) throw new Error("Bu ders kaydı için güncel bir tarayıcı gerekiyor.");
    const bytes = Uint8Array.from(root.atob(text), character => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new root.DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  root.LectureDocument = { snapshot, legacyJson, parts, decoder, pack, unpack, partLength: PART_LENGTH };
  if (typeof module !== "undefined") module.exports = root.LectureDocument;
})(typeof window !== "undefined" ? window : globalThis);
