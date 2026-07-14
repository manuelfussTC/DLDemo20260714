import assert from "node:assert/strict";
import test from "node:test";
import { hasNoteContent } from "../../shared/note.ts";

test("akzeptiert Notizen mit Text", () => {
  assert.equal(hasNoteContent("Lisa schickt das Angebot bis Freitag."), true);
});

test("lehnt leere und nur aus Leerzeichen bestehende Notizen ab", () => {
  assert.equal(hasNoteContent(""), false);
  assert.equal(hasNoteContent(" \n\t "), false);
});

test("akzeptiert eine Notiz mit mehr als 5000 Zeichen", () => {
  assert.equal(hasNoteContent("a".repeat(5001)), true);
});
