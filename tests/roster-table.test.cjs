const test = require("node:test");
const assert = require("node:assert/strict");
global.StudentNumbers = require("../student-numbers.js");
const { RosterTable } = require("../roster-table.js");

function fixture(values = ["", "", ""]) {
  const fields = values.map(value => ({ value, selectionStart: 0, addEventListener() {} }));
  const table = new RosterTable({ getElementById: id => fields[["inp-roster-numbers", "inp-roster-names", "inp-roster-surnames"].indexOf(id)] });
  return { fields, table };
}

test("independent columns preserve zeroes, multiple first names and blank row alignment", () => {
  const { table, fields } = fixture(["001\n002", "Ahmet Serdar\nAyşe", "Güldibi\nKaya"]);
  assert.deepEqual(StudentNumbers.parse(table.read()).students.map(({ no, name }) => ({ no, name })), [
    { no: "001", name: "Ahmet Serdar Güldibi" }, { no: "002", name: "Ayşe Kaya" }
  ]);
  fields[0].value = "001\n\n002";
  assert.equal(StudentNumbers.parse(table.read()).ok, false);
});

test("file load retains legacy full names and invalid import preserves the draft", () => {
  const { table } = fixture();
  assert.equal(table.load('001;Ahmet Serdar Güldibi\n002;Ayşe;Kaya').ok, true);
  const draft = table.read();
  assert.equal(StudentNumbers.parse(draft).students[0].name, "Ahmet Serdar Güldibi");
  assert.equal(table.load("bad number;Name").ok, false);
  assert.equal(table.read(), draft);
});

test("spreadsheet paste distributes cells at the selected row without erasing other rows", () => {
  const { table, fields } = fixture(["001\n002", "Ali\nVeli", "Kaya\nYılmaz"]);
  fields[0].selectionStart = 4;
  let prevented = false;
  table.paste({ clipboardData: { getData: () => "003\tAyşe\tGül\r\n004\tMehmet Ali\tAk\r\n" }, preventDefault() { prevented = true; } }, 0);
  assert.equal(prevented, true);
  assert.equal(fields[0].value, "001\n003\n004");
  assert.equal(fields[1].value, "Ali\nAyşe\nMehmet Ali");
  assert.equal(fields[2].value, "Kaya\nGül\nAk");
  assert.equal(StudentNumbers.parse(table.read()).students.length, 3);
});

test("ordinary single-column paste remains native and excess columns preserve the draft", () => {
  const { table } = fixture(["001", "Ali", "Kaya"]);
  table.paste({ clipboardData: { getData: () => "002\n003" }, preventDefault() { assert.fail(); } }, 0);
  const original = table.read();
  global.alert = () => {};
  table.paste({ clipboardData: { getData: () => "a\tb\tc\td" }, preventDefault() {} }, 0);
  assert.equal(table.read(), original);
});
