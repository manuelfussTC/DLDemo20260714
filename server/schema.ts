import { z } from "zod";
import { sanitizeVisibleText } from "../shared/contentPolicy.js";
import { dueStatuses, normalizeDeadline } from "./deadlines.js";

export const priorities = ["low", "medium", "high", "unknown"] as const;

const modelExtractionSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      owner: z.string(),
      due: z.string(),
      priority: z.enum(priorities),
      sourceQuote: z.string().min(1),
      dependsOn: z.array(z.string()),
    }),
  ),
});

export const extractionSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      owner: z.string(),
      due: z.string(),
      dueAt: z.string(),
      dueStatus: z.enum(dueStatuses),
      dueWarning: z.string(),
      priority: z.enum(priorities),
      sourceQuote: z.string().min(1),
      dependsOn: z.array(z.string()),
      contextWarning: z.string(),
    }),
  ),
});

export type Extraction = z.infer<typeof extractionSchema>;

function normalizedActionTitle(value: string): string {
  return value
    .toLocaleLowerCase("de-DE")
    .replace(/\b(?:am\s+|den\s+)?tag\s+nach\s+übermorgen\b/giu, " ")
    .replace(/\b(?:vorgestern|gestern|heute|morgen|übermorgen)\b/giu, " ")
    .replace(/\b(?:am|bis|zum)\b/giu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          owner: { type: "string" },
          due: { type: "string" },
          priority: { type: "string", enum: priorities },
          sourceQuote: { type: "string" },
          dependsOn: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["title", "owner", "due", "priority", "sourceQuote", "dependsOn"],
      },
    },
  },
  required: ["tasks"],
} as const;

export function validateExtraction(
  value: unknown,
  referenceDate = new Date(),
): Extraction {
  const result = modelExtractionSchema.safeParse(value);

  if (!result.success) {
    throw new Error("Das Modell hat kein gültiges Aufgabenformat geliefert.");
  }

  const consolidatedTasks = result.data.tasks.reduce<
    Array<z.infer<typeof modelExtractionSchema>["tasks"][number]>
  >((tasks, task) => {
    const duplicate = tasks.find(
      (candidate) =>
        normalizedActionTitle(candidate.title) ===
          normalizedActionTitle(task.title) &&
        candidate.owner.toLocaleLowerCase("de-DE") ===
          task.owner.toLocaleLowerCase("de-DE") &&
        candidate.sourceQuote === task.sourceQuote,
    );

    if (!duplicate) {
      tasks.push({ ...task });
      return tasks;
    }

    if (task.due && !duplicate.due.includes(task.due)) {
      duplicate.due = duplicate.due
        ? `${duplicate.due} und ${task.due}`
        : task.due;
    }
    duplicate.dependsOn = [
      ...new Set([...duplicate.dependsOn, ...task.dependsOn]),
    ];
    return tasks;
  }, []);

  const tasks = consolidatedTasks.map((task) => {
    const due = sanitizeVisibleText(task.due);

    return {
      title: sanitizeVisibleText(task.title),
      owner: sanitizeVisibleText(task.owner),
      due,
      ...normalizeDeadline(due, referenceDate),
      priority: task.priority,
      sourceQuote: sanitizeVisibleText(task.sourceQuote),
      dependsOn: task.dependsOn.map(sanitizeVisibleText),
      contextWarning: "",
    };
  });

  for (const task of tasks) {
    if (!task.dependsOn.length) {
      continue;
    }

    const dependencies = tasks.filter(
      (candidate) =>
        candidate !== task &&
        task.dependsOn.some(
          (dependencyTitle) =>
            candidate.title.toLocaleLowerCase("de-DE") ===
            dependencyTitle.toLocaleLowerCase("de-DE"),
        ),
    );

    if (
      task.dueAt &&
      dependencies.some(
        (dependency) =>
          dependency.dueAt &&
          new Date(task.dueAt).getTime() <
            new Date(dependency.dueAt).getTime(),
      )
    ) {
      task.contextWarning =
        "Die Frist liegt vor der dafür vorausgesetzten Aufgabe.";
    }
  }

  return { tasks };
}
