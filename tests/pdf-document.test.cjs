const { test } = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { GitHubLectureRepository } = require("../github-repository.js");
const { fakeGitHub } = require("./github-fixture.cjs");
const { pdfFixture } = require("./pdf-fixture.cjs");
const { GoogleDriveStorage } = require("../google-drive-storage.js");

test("GitHub round trip preserves original PDF bytes, mixed slide order, notes and legacy content", async () => {
  const source = "data:application/pdf;base64," + pdfFixture().toString("base64");
  const page = number => ({ title: `Page ${number}`, html: "", pdf: { source, page: number, width: 960, height: 540, fileName: "Synthetic.pdf" } });
  const lectures = [
    { id: "legacy", custom: { keep: true }, pptxUrl: "pptx/original.pptx", slides: [{ html: "<p>Original notes</p>", pptImageUrl: "original.png" }] },
    { id: "pdf", pdfUrl: source, pdfFileName: "Synthetic.pdf", slides: [page(1), { title: "Extra", html: "<p>Araya eklenen açıklama</p>", htmlDocument: "<button>Calculate</button><script>document.title=42</script>" }, page(2)] }
  ];
  const server = fakeGitHub();
  const repository = new GitHubLectureRepository({ owner: "aserdargl", repository: "ME101", fetch: server.fetch,
    crypto: webcrypto, baseUrl: "https://aserdargl.github.io/ME101/" });
  await repository.login("synthetic-only-key");
  await repository.publish(lectures, await repository.readCurrent());
  const restored = (await repository.readPublished()).lectures;
  assert.deepEqual(restored, lectures);
  assert.deepEqual(Buffer.from(restored[1].slides[2].pdf.source.split(",")[1], "base64"), pdfFixture());
});

test("PDF sources remain on GitHub when the optional existing backup integration is connected", async () => {
  const source = "data:application/pdf;base64," + Buffer.alloc(40000).toString("base64");
  const lectures = [{ pdfUrl: source, slides: [{ pdf: { source, page: 1 } }] }];
  const storage = new GoogleDriveStorage({ baseUrl: "https://synthetic.invalid/", getIdToken: async () => "unused",
    fetch: async () => { throw new Error("PDF must not be externalized"); } });
  assert.equal(await storage.externalize(lectures), lectures);
});
