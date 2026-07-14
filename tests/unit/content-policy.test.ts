import assert from "node:assert/strict";
import test from "node:test";
import {
  blockedTerms,
  sanitizeVisibleText,
} from "../../shared/contentPolicy.ts";

test("bereinigt direkte Schreibweisen unabhängig von Großschreibung", () => {
  assert.equal(
    sanitizeVisibleText("Das ist SCHEISSE und scheiße."),
    "Das ist [entfernt] und [entfernt].",
  );
});

test("bereinigt ein durch ein Verbindungswort aufgeteiltes Schimpfwort", () => {
  const input =
    "Horst muss bis morgen dass Wort Schei und sse zusammenführen und kraftvoll ausführen";

  assert.equal(
    sanitizeVisibleText(input),
    "Horst muss bis morgen dass Wort [entfernt] zusammenführen und kraftvoll ausführen",
  );
});

test("verändert harmlose Wörter nicht", () => {
  assert.equal(
    sanitizeVisibleText("Der Scheich schickt eine Nachricht."),
    "Der Scheich schickt eine Nachricht.",
  );
});

test("jede konfigurierte Variante wird automatisch bereinigt", () => {
  for (const variants of blockedTerms) {
    for (const variant of variants) {
      assert.equal(sanitizeVisibleText(variant), "[entfernt]");
    }
  }
});
