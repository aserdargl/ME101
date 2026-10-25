/** Synthetic PDF bytes with separated title and illustration, never real course data. */
function pdfFixture(pages = 2) {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const kids = [];
  for (let i = 0; i < pages; i++) {
    const page = objects.length + 1;
    kids.push(`${page} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 960 540] /Resources << /Font << /F1 3 0 R >> >> /Contents ${page + 1} 0 R >>`);
    const drawing = `q 0.1 0.3 0.6 rg 50 50 860 300 re f Q\nBT /F1 36 Tf 50 470 Td (PDF page ${i + 1} - original title) Tj ET\n`;
    objects.push(`<< /Length ${drawing.length} >>\nstream\n${drawing}endstream`);
  }
  objects[1] = `<< /Type /Pages /Count ${pages} /Kids [${kids.join(" ")}] >>`;
  let text = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((value, i) => { offsets.push(text.length); text += `${i + 1} 0 obj\n${value}\nendobj\n`; });
  const start = text.length;
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  text += offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(text);
}
module.exports = { pdfFixture };
