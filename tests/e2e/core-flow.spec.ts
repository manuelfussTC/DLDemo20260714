import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const sampleNote =
  "Lisa schickt das Angebot bis Freitag. Tom prüft heute die Zahlen. Danach entscheidet das Team über den Versand.";

type ExtractResponse = {
  tasks?: Array<{
    title: string;
    owner: string;
    due: string;
    dueAt: string;
    dueStatus: "missing" | "valid" | "overdue" | "invalid" | "ambiguous";
    dueWarning: string;
    priority: string;
    sourceQuote: string;
    dependsOn: string[];
    contextWarning: string;
  }>;
  error?: string;
};

test.describe("Kernpfad mit echtem OpenAI-Kontakt", () => {
  test.skip(!process.env.OPENAI_API_KEY, "OPENAI_API_KEY fehlt in der lokalen .env.");

  test("extrahiert Aufgaben aus einer Meeting-Notiz", async ({ page }, testInfo) => {
    const extractionResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/extract") && response.request().method() === "POST",
    );

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Was wurde besprochen?" })).toBeVisible();

    const textarea = page.getByPlaceholder("Füge hier deine Meeting-Notiz ein …");
    await textarea.fill(sampleNote);
    await expect(page.getByText(`${sampleNote.length} Zeichen`)).toBeVisible();

    await page.getByRole("button", { name: "Aufgaben extrahieren" }).click();

    const apiResponse = await extractionResponse;
    const responseBody = (await apiResponse.json()) as ExtractResponse;

    const testRecord = {
      test: testInfo.title,
      status: apiResponse.status(),
      input: {
        note: sampleNote,
        characterCount: sampleNote.length,
      },
      output: responseBody,
    };

    const serializedRecord = JSON.stringify(testRecord, null, 2);

    await testInfo.attach("kernpfad-daten.json", {
      body: serializedRecord,
      contentType: "application/json",
    });

    await writeFile(
      path.join(testInfo.outputDir, "kernpfad-daten.json"),
      serializedRecord,
      "utf8",
    );

    await expect(page.getByRole("button", { name: "Aufgaben extrahieren" })).toBeVisible({
      timeout: 90_000,
    });

    await expect(page.locator(".error-message")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Nächste Schritte im Blick" })).toBeVisible();

    const taskCards = page.locator(".task-card");
    await expect(taskCards.first()).toBeVisible();
    expect(await taskCards.count()).toBeGreaterThan(0);

    const taskTexts = await taskCards.allTextContents();
    expect(taskTexts.join(" ")).toMatch(/Lisa|Tom|Angebot|Zahlen/i);
  });

  test("validiert Fristen, erkennt angekündigte Aufgaben und bereinigt Sprache", async ({
    page,
  }, testInfo) => {
    const edgeCaseNote =
      "Lisa muss den Bericht bis heute 12:00 Uhr senden. Lukas geht morgen auf Geschäftsreise. Joyce muss bis Samstag, 32. Januar 2028 ins Kino gehen. Horst soll den Serverraum vorgestern und den Tag nach übermorgen fegen. Klara muss eine Kiste Radler trinken und dann das Leergut wegbringen. Horst muss bis morgen das Wort Schei und sse zusammenführen und kraftvoll ausführen.";
    const extractionResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/extract") &&
        response.request().method() === "POST",
    );

    await page.goto("/");
    await page
      .getByPlaceholder("Füge hier deine Meeting-Notiz ein …")
      .fill(edgeCaseNote);
    await page.getByRole("button", { name: "Aufgaben extrahieren" }).click();

    const apiResponse = await extractionResponse;
    const responseBody = (await apiResponse.json()) as ExtractResponse;
    const serializedRecord = JSON.stringify(
      {
        test: testInfo.title,
        status: apiResponse.status(),
        input: {
          note: edgeCaseNote,
          characterCount: edgeCaseNote.length,
        },
        output: responseBody,
      },
      null,
      2,
    );

    await testInfo.attach("edge-cases-daten.json", {
      body: serializedRecord,
      contentType: "application/json",
    });
    await writeFile(
      path.join(testInfo.outputDir, "edge-cases-daten.json"),
      serializedRecord,
      "utf8",
    );

    expect(apiResponse.status()).toBe(200);
    expect(responseBody.tasks?.length).toBeGreaterThanOrEqual(6);
    expect(responseBody.tasks?.some((task) => /Lukas/i.test(task.owner))).toBe(true);
    expect(responseBody.tasks?.some((task) => task.dueStatus === "overdue")).toBe(true);
    expect(responseBody.tasks?.some((task) => task.dueStatus === "invalid")).toBe(true);
    expect(responseBody.tasks?.some((task) => task.dueStatus === "ambiguous")).toBe(true);
    expect(
      responseBody.tasks?.some((task) => task.dependsOn.length > 0),
    ).toBe(true);
    expect(JSON.stringify(responseBody)).not.toMatch(/schei(?:ß|ss)e|schei\s+und\s+sse/iu);

    await expect(page.getByText("Ungültig", { exact: true })).toBeVisible();
    await expect(page.getByText("Mehrdeutig", { exact: true })).toBeVisible();
    await expect(page.getByText("[entfernt]", { exact: false }).first()).toBeVisible();
  });

  test("meldet eine unlogische Reihenfolge abhängiger Aufgaben", async ({
    page,
  }, testInfo) => {
    const contextNote =
      "Einkaufen bis 02.08. Rezepte planen bis 23.07. Kochen bis 15.07. Kochen setzt Einkaufen und Rezepte planen voraus.";
    const extractionResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/extract") &&
        response.request().method() === "POST",
    );

    await page.goto("/");
    await page
      .getByPlaceholder("Füge hier deine Meeting-Notiz ein …")
      .fill(contextNote);
    await page.getByRole("button", { name: "Aufgaben extrahieren" }).click();

    const apiResponse = await extractionResponse;
    const responseBody = (await apiResponse.json()) as ExtractResponse;
    const serializedRecord = JSON.stringify(
      {
        test: testInfo.title,
        status: apiResponse.status(),
        input: {
          note: contextNote,
          characterCount: contextNote.length,
        },
        output: responseBody,
      },
      null,
      2,
    );

    await testInfo.attach("kontext-daten.json", {
      body: serializedRecord,
      contentType: "application/json",
    });
    await writeFile(
      path.join(testInfo.outputDir, "kontext-daten.json"),
      serializedRecord,
      "utf8",
    );

    expect(apiResponse.status()).toBe(200);
    expect(
      responseBody.tasks?.some((task) =>
        task.contextWarning.includes("vorausgesetzten Aufgabe"),
      ),
    ).toBe(true);
    await expect(
      page.getByText(
        "Die Frist liegt vor der dafür vorausgesetzten Aufgabe.",
        { exact: true },
      ),
    ).toBeVisible();
  });
});
