import type { Task } from "./types";

type ExtractResponse = {
  tasks: Task[];
};

export async function extractTasks(note: string): Promise<Task[]> {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });

  const payload = (await response.json()) as ExtractResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Die Aufgaben konnten nicht extrahiert werden.");
  }

  return payload.tasks;
}
