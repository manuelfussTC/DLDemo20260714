import { z } from "zod";

export const priorities = ["low", "medium", "high", "unknown"] as const;

export const extractionSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      owner: z.string(),
      due: z.string(),
      priority: z.enum(priorities),
      sourceQuote: z.string().min(1),
    }),
  ),
});

export type Extraction = z.infer<typeof extractionSchema>;

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
        },
        required: ["title", "owner", "due", "priority", "sourceQuote"],
      },
    },
  },
  required: ["tasks"],
} as const;

export function validateExtraction(value: unknown): Extraction {
  const result = extractionSchema.safeParse(value);

  if (!result.success) {
    throw new Error("Das Modell hat kein gültiges Aufgabenformat geliefert.");
  }

  return result.data;
}
