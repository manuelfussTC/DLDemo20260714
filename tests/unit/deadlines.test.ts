import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDeadline } from "../../server/deadlines.ts";

const referenceDate = new Date("2026-07-14T18:29:00.000Z");

test("markiert eine bereits verstrichene Uhrzeit von heute als überfällig", () => {
  assert.deepEqual(normalizeDeadline("bis heute 12:00 Uhr", referenceDate), {
    dueAt: "2026-07-14T10:00:00.000Z",
    dueStatus: "overdue",
    dueWarning: "Diese Frist ist bereits verstrichen.",
  });
});

test("lehnt unmögliche Kalenderdaten deterministisch ab", () => {
  assert.deepEqual(
    normalizeDeadline("Samstag, 32. Januar 2028", referenceDate),
    {
      dueAt: "",
      dueStatus: "invalid",
      dueWarning: "Die Frist enthält kein gültiges Kalenderdatum.",
    },
  );
});

test("markiert widersprüchliche relative Fristen als mehrdeutig", () => {
  assert.deepEqual(
    normalizeDeadline("vorgestern und den Tag nach übermorgen", referenceDate),
    {
      dueAt: "",
      dueStatus: "ambiguous",
      dueWarning: "Die Frist enthält widersprüchliche Zeitangaben.",
    },
  );
});

test("normalisiert ein zukünftiges numerisches Datum in Europe/Berlin", () => {
  assert.deepEqual(normalizeDeadline("02.08.", referenceDate), {
    dueAt: "2026-08-02T21:59:59.000Z",
    dueStatus: "valid",
    dueWarning: "",
  });
});
