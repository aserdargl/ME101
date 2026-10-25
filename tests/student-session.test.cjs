const { test } = require("node:test");
const assert = require("node:assert/strict");
const { StudentSession } = require("../student-session.js");
const KEY = "me101_active_student_no";

function storage(entries = []) {
  const values = new Map(entries);
  return { values, getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test("number entry retains leading zeroes across reload without an account or roster", () => {
  const store = storage();
  const session = new StudentSession(store, KEY);
  assert.deepEqual(session.signIn(" 001234 "), { ok: true, number: "001234" });
  assert.equal(new StudentSession(store, KEY).number, "001234");
  assert.equal(store.values.size, 1);
});

test("invalid input never changes an existing session", () => {
  const store = storage([[KEY, "00123"]]);
  const session = new StudentSession(store, KEY);
  for (const value of ["", " ", "abc", "1e5", "-123", "12.3", "1".repeat(33), "<script>"]) {
    assert.equal(session.signIn(value).ok, false);
    assert.equal(session.number, "00123");
    assert.equal(store.getItem(KEY), "00123");
  }
});

test("sign out preserves every other storage entry and does not restore on reload", () => {
  const store = storage([[KEY, "00123"], ["notes", "preserved"], ["ratings", "preserved"], ["instructor", "preserved"]]);
  const session = new StudentSession(store, KEY);
  assert.equal(session.signOut().ok, true);
  assert.equal(new StudentSession(store, KEY).number, null);
  assert.deepEqual([...store.values], [["notes", "preserved"], ["ratings", "preserved"], ["instructor", "preserved"]]);
});

test("old non-number identities grant no student entry and remain untouched", () => {
  const store = storage([[KEY, "old-uid"]]);
  assert.equal(new StudentSession(store, KEY).number, null);
  assert.equal(store.getItem(KEY), "old-uid");
});

test("storage failures permit page-only entry and report failed persistent sign out", () => {
  const unavailable = () => { throw new Error("Storage blocked"); };
  const session = new StudentSession({ getItem: unavailable, setItem: unavailable, removeItem: unavailable }, KEY);
  assert.equal(session.signIn("00123").ok, true);
  assert.equal(session.signOut().ok, false);
});
