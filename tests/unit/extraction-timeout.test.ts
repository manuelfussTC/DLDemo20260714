import assert from "node:assert/strict";
import test from "node:test";
import {
  ExtractionTimeoutError,
  withExtractionTimeout,
} from "../../server/timeout.ts";

test("liefert ein Ergebnis, wenn die Extraktion rechtzeitig antwortet", async () => {
  const result = await withExtractionTimeout(async () => "fertig", 50);

  assert.equal(result, "fertig");
});

test("bricht eine nicht antwortende Extraktion innerhalb des Limits ab", async () => {
  let wasAborted = false;

  await assert.rejects(
    withExtractionTimeout(
      (signal) =>
        new Promise<never>(() => {
          signal.addEventListener("abort", () => {
            wasAborted = true;
          });
        }),
      20,
    ),
    ExtractionTimeoutError,
  );

  assert.equal(wasAborted, true);
});
