const JSZip = require("jszip");
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const DRAW = "http://schemas.openxmlformats.org/drawingml/2006/main";
const PRESENTATION = "http://schemas.openxmlformats.org/presentationml/2006/main";
const relationships = entries => `<Relationships xmlns="${PACKAGE_REL}">${entries.map(([id, type, target]) => `<Relationship Id="${id}" Type="${REL}/${type}" Target="${target}"/>`).join("")}</Relationships>`;
const picture = (id, x) => `<p:pic><p:blipFill><d:blip link:embed="${id}"/></p:blipFill><p:spPr><d:xfrm><d:off x="${x}" y="1800000"/><d:ext cx="3000000" cy="2000000"/></d:xfrm></p:spPr></p:pic>`;

/** A nonsequential slide deck with prefixed relationships and multiple original images. */
async function fixture() {
  const zip = new JSZip();
  zip.file("ppt/presentation.xml", `<p:presentation xmlns:p="${PRESENTATION}" xmlns:link="${REL}"><p:sldIdLst><p:sldId link:id="rSeven"/><p:sldId link:id="rTwo"/></p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels", relationships([["rSeven", "slide", "slides/slide7.xml"], ["rTwo", "slide", "slides/slide2.xml"]]));
  zip.file("ppt/slides/slide7.xml", `<p:sld xmlns:p="${PRESENTATION}" xmlns:d="${DRAW}" xmlns:link="${REL}"><p:cSld><p:spTree><p:sp><p:spPr><d:xfrm><d:off x="300000" y="200000"/><d:ext cx="8000000" cy="1200000"/></d:xfrm></p:spPr><p:txBody><d:p><d:r><d:rPr sz="2400"/><d:t>Özgün Görseller</d:t></d:r></d:p><d:p><d:r><d:t>Tüm resimler ve Türkçe notlar korunur.</d:t></d:r></d:p></p:txBody></p:sp>${picture("red", 300000)}${picture("blue", 4000000)}</p:spTree></p:cSld></p:sld>`);
  zip.file("ppt/slides/_rels/slide7.xml.rels", relationships([["red", "image", "../media/red%20plot.svg"], ["blue", "image", "/ppt/other/blue.svg"]]));
  zip.file("ppt/slides/slide2.xml", `<p:sld xmlns:p="${PRESENTATION}" xmlns:d="${DRAW}" xmlns:link="${REL}"><p:cSld><p:spTree><p:sp><p:spPr><d:xfrm><d:off x="300000" y="200000"/><d:ext cx="8000000" cy="1200000"/></d:xfrm></p:spPr><p:txBody><d:p><d:r><d:t>İkinci Slayt</d:t></d:r></d:p></p:txBody></p:sp>${picture("blue2", 1000000)}</p:spTree></p:cSld></p:sld>`);
  zip.file("ppt/slides/_rels/slide2.xml.rels", relationships([["blue2", "image", "../media/blue.svg"]]));
  const artwork = (fill, text) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="${fill}"/><path d="M40 190h320M40 190V40M50 180l70-60 80 25 130-100" fill="none" stroke="white" stroke-width="5"/><text x="65" y="215" fill="white" font-size="17">${text}</text></svg>`;
  zip.file("ppt/media/red plot.svg", artwork("#a34e42", "ÖZGÜN DENEY VERİSİ A"));
  zip.file("ppt/other/blue.svg", artwork("#3f728c", "ÖZGÜN DENEY VERİSİ B"));
  zip.file("ppt/media/blue.svg", artwork("#397c64", "İKİNCİ SLAYT VERİSİ"));
  return zip.generateAsync({ type: "nodebuffer" });
}
module.exports = { fixture };

/** Office equation text and its image-filled fallback share one placeholder. */
async function mathFixture() {
  const zip = await JSZip.loadAsync(await fixture());
  const xml = await zip.file("ppt/slides/slide7.xml").async("string");
  const body = `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><mc:Choice Requires="a14"><p:sp><p:nvSpPr><p:cNvPr id="8" name="Equation content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><d:xfrm><d:off x="300000" y="1800000"/><d:ext cx="8000000" cy="4000000"/></d:xfrm></p:spPr><p:txBody><d:bodyPr/><d:lstStyle/><d:p><d:r><d:t>Complete equation explanation</d:t></d:r></d:p><d:p><a14:m><m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:f><m:num><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>y</m:t></m:r></m:e></m:acc></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f></m:oMath></a14:m></d:p><d:p><d:r><d:t>Last equation paragraph</d:t></d:r></d:p></p:txBody></p:sp></mc:Choice><mc:Fallback><p:sp><p:nvSpPr><p:cNvPr id="8" name="Equation content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><d:xfrm><d:off x="300000" y="1800000"/><d:ext cx="8000000" cy="4000000"/></d:xfrm><d:blipFill><d:blip link:embed="red"/><d:stretch><d:fillRect/></d:stretch></d:blipFill></p:spPr><p:txBody><d:bodyPr/><d:lstStyle/><d:p><d:r><d:rPr><d:noFill/></d:rPr><d:t> </d:t></d:r></d:p></p:txBody></p:sp></mc:Fallback></mc:AlternateContent>`;
  zip.file("ppt/slides/slide7.xml", xml.replace(/<p:pic>[\s\S]*<\/p:pic>/, body));
  return zip.generateAsync({ type: "nodebuffer" });
}
module.exports.mathFixture = mathFixture;
