const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto, createHash } = require('node:crypto');

function fixture() {
  const bytes = Buffer.from('<!doctype html><button>Lesson</button>');
  const hash = createHash('sha256').update(bytes).digest('hex');
  const file = { id: 'week-file-' + 'a'.repeat(64), week: 2, name: '2.Week.html',
    path: `weeks/files/${hash}.html`, sha256: hash, size: bytes.length };
  const values = new Map([['preserved-user-note', 'original']]);
  const context = { URL, Date, TextDecoder, Uint8Array, File, crypto: webcrypto,
    location: { href: 'http://127.0.0.1:4999/' }, document: { getElementById: () => null },
    localStorage: { setItem: (key, value) => values.set(key, value) },
    fetch: async () => ({ ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      json: async () => ({ version: 1, files: [file] }) }) };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../weekly-files.js'), 'utf8'), context);
  return { api: context.WeeklyFiles, context, file, bytes, values };
}

test('weekly catalog is separate, numeric, and does not write user storage', async () => {
  const { api, values } = fixture();
  let changes = 0;
  await api.initialize(() => changes++);
  assert.equal(changes, 1);
  assert.equal(api.all()[0].week, '2. Hafta');
  assert.equal(api.all()[0].slides.length, 0);
  assert.deepEqual([...values], [['preserved-user-note', 'original']]);
});

test('invalid and duplicate paths are rejected before any lesson is applied', () => {
  const { api, file } = fixture();
  assert.throws(() => api.decode({ version: 1, files: [{ ...file, path: '../data/manifest.json' }] }));
  assert.throws(() => api.decode({ version: 1, files: [file, file] }));
  assert.throws(() => api.decode({ version: 2, files: [] }));
});

test('HTML opens as an isolated HTML slide only after verifying the original bytes', async () => {
  const { api, file, bytes } = fixture();
  const lecture = api.decode({ version: 1, files: [file] })[0];
  await api.load(lecture);
  assert.equal(lecture.slides[0].htmlDocument, bytes.toString());
  assert.equal(lecture.loaded, true);
  await api.load(lecture);
  assert.equal(lecture.slides.length, 1);
});

test('corrupt download never opens or overwrites a lesson', async () => {
  const { api, file } = fixture();
  const badHash = 'b'.repeat(64);
  const lecture = api.decode({ version: 1, files: [{ ...file, path: `weeks/files/${badHash}.html`, sha256: badHash }] })[0];
  await assert.rejects(api.load(lecture));
  assert.equal(lecture.loaded, false);
  assert.equal(lecture.slides.length, 0);
});
