const { test } = require("node:test");
const assert = require("node:assert/strict");
const { compareWeeks } = require("../catalog-order.js");

test("weeks use numeric ascending order without mutating stored lecture order", () => {
  const lectures = ["6. Hafta", "1. Hafta", "10. Hafta", "2. Hafta", "Giriş"];
  const original = [...lectures];
  assert.deepEqual([...lectures].sort(compareWeeks), ["1. Hafta", "2. Hafta", "6. Hafta", "10. Hafta", "Giriş"]);
  assert.deepEqual(lectures, original);
  assert.equal(compareWeeks("Hafta 6", "6. Hafta"), 0);
  assert.equal(compareWeeks("Giriş", undefined), 0);
});
