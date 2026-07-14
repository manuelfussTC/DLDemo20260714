import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { z } from "zod";
import {
  ExtractionError,
  ExtractionTimedOutError,
  extractTasks,
} from "./extractor.js";
import { extractRateLimit } from "./rateLimit.js";
import { emptyNoteError, hasNoteContent } from "../shared/note.js";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDirectory = path.join(rootDirectory, "dist");
const port = Number(process.env.PORT) || 5173;
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use(express.json({ limit: "20kb" }));

app.post("/api/extract", extractRateLimit, async (request, response) => {
  const payload = z
    .object({
      note: z.string().refine(hasNoteContent, { message: emptyNoteError }),
    })
    .safeParse(request.body);

  if (!payload.success) {
    const error = payload.error.issues.some((issue) => issue.message === emptyNoteError)
      ? emptyNoteError
      : "Bitte sende eine Notiz als Text.";
    response.status(400).json({ error });
    return;
  }

  try {
    const extraction = await extractTasks(payload.data.note);
    response.json(extraction);
  } catch (error) {
    const message =
      error instanceof ExtractionError
        ? error.message
        : "Die Aufgaben konnten gerade nicht extrahiert werden.";
    response.status(error instanceof ExtractionTimedOutError ? 504 : 502).json({ error: message });
  }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Dieser API-Endpunkt existiert nicht." });
});

const jsonErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (error.type === "entity.too.large") {
    response.status(413).json({ error: "Die Notiz darf höchstens 20 KB groß sein." });
    return;
  }

  if (error.type === "entity.parse.failed") {
    response.status(400).json({ error: "Ungültiges JSON." });
    return;
  }

  next(error);
};

app.use(jsonErrorHandler);

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(
      express.static(clientDirectory, {
        dotfiles: "deny",
        index: false,
      }),
    );

    app.use((_request, response) => {
      response.sendFile(path.join(clientDirectory, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      root: rootDirectory,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, "127.0.0.1");
}

void startServer();
