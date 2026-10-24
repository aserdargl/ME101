const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalize, nameKey, parse } = require("../student-numbers.js");

test("Excel/CSV imports retain leading zeroes, names and de-duplicate matching entries", () => {
  assert.deepEqual(parse("001234\tAhmet Yılmaz\r\n567890;Ayşe Kaya\n001234;AHMET YILMAZ").students, [
    { no: "001234", name: "AHMET YILMAZ", nameKey: "ahmet yılmaz", enabled: true },
    { no: "567890", name: "Ayşe Kaya", nameKey: "ayşe kaya", enabled: true }
  ]);
});

test("malformed or spreadsheet-converted numbers reject the complete import", () => {
  for (const value of ["Student Number", "12345\n2.026E+7", "123.0", "-123", ""]) assert.equal(parse(value).ok, false);
  assert.equal(normalize("000123"), "000123");
  assert.equal(normalize("1".repeat(33)), null);
  assert.equal(parse("123;Ahmet Yılmaz\n123;Başka İsim").ok, false);
  assert.equal(nameKey("  İSMAİL   IŞIK  "), "ismail ışık");
});
