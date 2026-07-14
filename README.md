# Notiz → Aufgaben

Ein bewusst noch nicht fertiger Produktprototyp: Aus einer Meeting-Notiz werden belegbare Aufgaben, verantwortliche Personen, Fristen und Prioritäten.

Die Anwendung ist als lokale v0 gedacht. Sie hat keine Datenbank, kein Login und keine serverseitige Historie.

## Funktionen

- Extrahiert Aufgaben aus einer Meeting-Notiz über einen geschützten Server-Endpunkt.
- Zeigt pro Aufgabe Aufgabe, verantwortliche Person, Frist, Priorität und ein wörtliches Zitat aus der Eingabe.
- Bietet Kennzahlen für erkannte Aufgaben, Fristen und hohe Prioritäten.
- Enthält Suche sowie Filter nach Person, Priorität und Frist.
- Speichert die letzten sechs Analysen und lokale Einstellungen im Browser (`localStorage`).
- Exportiert die aktuell gefilterten Aufgaben als CSV.
- Enthält Dark Mode und drei auswählbare Beispielnotizen.

## Technischer Aufbau

```text
Browser (React + Vite)
  └── POST /api/extract
        └── Express-Server
              └── OpenAI Responses API
```

Das Frontend kennt keinen Provider-Key. Es spricht ausschließlich mit `/api/extract`.

Im Entwicklungsmodus stellt Express die Vite-Middleware bereit. Nach `npm run build` liefert derselbe Express-Server den Inhalt aus `dist/` statisch aus.

| Bereich | Ort |
| --- | --- |
| React-Oberfläche und lokaler Browser-Zustand | `src/` |
| Browser-API-Client | `src/api.ts` |
| Express-Server und API-Endpunkt | `server/index.ts` |
| Modellaufruf und Sicherheitsanweisung | `server/extractor.ts` |
| JSON-Schema und Laufzeitvalidierung | `server/schema.ts` |
| Einfaches IP-basiertes Rate-Limit | `server/rateLimit.ts` |

## Voraussetzungen

- Eine aktuelle Node.js-LTS-Version
- Ein OpenAI-API-Key mit Zugriff auf das gewählte Modell

## Lokal starten

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. Die lokale Konfiguration anlegen:

   ```bash
   cp .env.example .env
   ```

3. In `.env` Werte setzen:

   ```dotenv
   OPENAI_API_KEY=
   OPENAI_MODEL=
   ```

   `OPENAI_MODEL` ist optional. Ohne Angabe nutzt der Server sein Standardmodell.

4. Entwicklungsserver starten:

   ```bash
   npm run dev
   ```

   Die Anwendung ist anschließend unter `http://127.0.0.1:5173` erreichbar, sofern der Port frei ist.

## Produktionsbuild

```bash
npm run build
npm start
```

`npm run build` prüft TypeScript und erzeugt das Vite-Bundle in `dist/`. `npm start` startet Express im Produktionsmodus und liefert dieses Bundle statisch aus.

## API

### `POST /api/extract`

Request:

```json
{
  "note": "Lisa schickt das Angebot bis Freitag. Tom prüft heute die Zahlen."
}
```

Response:

```json
{
  "tasks": [
    {
      "title": "Angebot schicken",
      "owner": "Lisa",
      "due": "Freitag",
      "priority": "unknown",
      "sourceQuote": "Lisa schickt das Angebot bis Freitag."
    }
  ]
}
```

Das Modell wird mit einem strikten JSON-Schema auf dieses Format festgelegt. Die Antwort wird anschließend mit Zod erneut validiert, bevor sie den Browser erreicht.

## Sicherheit

- `.env` und weitere lokale Env-Dateien sind über `.gitignore` ausgeschlossen; `.env.example` enthält ausschließlich leere Platzhalter.
- Der Key wird nur als `process.env.OPENAI_API_KEY` im Server gelesen.
- Der Browser erhält weder den Key noch Fehlerdetails des Providers.
- Der Request-Body ist auf 20 KB begrenzt.
- Der Endpunkt ist mit einem einfachen Rate-Limit pro IP geschützt.
- Es gibt keine CORS-Freigabe für fremde Domains.
- Die Notiz wird als untrusted content behandelt: Anweisungen innerhalb der Notiz dürfen die Modellanweisung nicht verändern.
- Requests an das Modell werden mit `store: false` gesendet.

## Bewusste Grenzen der v0

Dieser Prototyp implementiert den Happy Path. Nicht ausgebaut sind unter anderem:

- Sonderfälle für leere oder sehr lange Eingaben
- Präzise Interpretation unklarer Fristen
- Vollständige Barrierefreiheit, mobile Optimierung und UI-Feinschliff
- Automatisierte Tests
- Deployment, Monitoring, Datenbank und Authentifizierung

## Git-Konvention

Diese initiale Version darf als Referenz geklont werden. Zukünftige `git push`-Operationen erfolgen ausschließlich nach ausdrücklicher Bestätigung durch den Nutzer. Sensible Daten, insbesondere Keys und lokale Env-Dateien, werden niemals versioniert.
