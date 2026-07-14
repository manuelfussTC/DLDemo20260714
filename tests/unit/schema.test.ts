import assert from "node:assert/strict";
import test from "node:test";
import { validateExtraction } from "../../server/schema.ts";

const referenceDate = new Date("2026-07-14T18:29:00.000Z");

test("bereinigt alle sichtbaren Modellfelder und normalisiert die Frist", () => {
  const result = validateExtraction(
    {
      tasks: [
        {
          title: "Wort Scheisse zusammenführen",
          owner: "Horst",
          due: "morgen",
          priority: "unknown",
          sourceQuote:
            "Horst muss bis morgen dass Wort Schei und sse zusammenführen und kraftvoll ausführen",
          dependsOn: [],
        },
      ],
    },
    referenceDate,
  );

  assert.equal(result.tasks[0].title, "Wort [entfernt] zusammenführen");
  assert.equal(
    result.tasks[0].sourceQuote,
    "Horst muss bis morgen dass Wort [entfernt] zusammenführen und kraftvoll ausführen",
  );
  assert.equal(result.tasks[0].dueStatus, "valid");
  assert.equal(result.tasks[0].dueAt, "2026-07-15T21:59:59.000Z");
});

test("meldet eine Frist vor der vorausgesetzten Aufgabe als Kontextfehler", () => {
  const result = validateExtraction(
    {
      tasks: [
        {
          title: "Rezepte planen",
          owner: "",
          due: "23.07.",
          priority: "unknown",
          sourceQuote: "Rezepte planen 23.07.",
          dependsOn: [],
        },
        {
          title: "Kochen",
          owner: "",
          due: "15.07.",
          priority: "unknown",
          sourceQuote: "vorher Kochen 15.07.",
          dependsOn: ["Rezepte planen"],
        },
      ],
    },
    referenceDate,
  );

  assert.equal(
    result.tasks[1].contextWarning,
    "Die Frist liegt vor der dafür vorausgesetzten Aufgabe.",
  );
});

test("führt Modelldubletten zusammen und erkennt widersprüchliche Fristen", () => {
  const sharedTask = {
    owner: "Horst",
    priority: "unknown",
    sourceQuote:
      "Horst soll den Serverraum vorgestern und den Tag nach übermorgen fegen.",
    dependsOn: [],
  };
  const result = validateExtraction(
    {
      tasks: [
        {
          ...sharedTask,
          title: "Den Serverraum vorgestern fegen",
          due: "vorgestern",
        },
        {
          ...sharedTask,
          title: "Den Serverraum am Tag nach übermorgen fegen",
          due: "den Tag nach übermorgen",
        },
      ],
    },
    referenceDate,
  );

  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].dueStatus, "ambiguous");
  assert.equal(
    result.tasks[0].dueWarning,
    "Die Frist enthält widersprüchliche Zeitangaben.",
  );
});

test("weist Modellantworten ohne Pflichtfelder zurück", () => {
  assert.throws(
    () =>
      validateExtraction({
        tasks: [{ title: "Unvollständig" }],
      }),
    /kein gültiges Aufgabenformat/,
  );
});
