import { FormEvent, useEffect, useMemo, useState } from "react";
import { extractTasks } from "./api";
import { Dashboard } from "./components/Dashboard";
import { SettingsPanel } from "./components/SettingsPanel";
import { TaskCard } from "./components/TaskCard";
import { type DueFilter, TaskFilters } from "./components/TaskFilters";
import { examples } from "./examples";
import type { Analysis, LocalSettings, Priority, Task } from "./types";

const historyKey = "notiz-aufgaben:history";
const settingsKey = "notiz-aufgaben:settings";

const defaultSettings: LocalSettings = {
  darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  saveHistory: true,
  showSourceQuotes: true,
};

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createAnalysis(note: string, tasks: Task[]): Analysis {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    note,
    tasks,
  };
}

function downloadCsv(tasks: Task[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [
    ["Aufgabe", "Verantwortlich", "Frist", "Priorität", "Wörtlicher Beleg"],
    ...tasks.map((task) => [
      task.title,
      task.owner,
      task.due,
      task.priority,
      task.sourceQuote,
    ]),
  ];
  const csv = rows.map((row) => row.map(escape).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "notiz-aufgaben.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [settings, setSettings] = useState(() =>
    readStoredValue(settingsKey, defaultSettings),
  );
  const [history, setHistory] = useState<Analysis[]>(() =>
    readStoredValue(historyKey, []),
  );
  const [activeAnalysis, setActiveAnalysis] = useState<Analysis | null>(null);
  const [note, setNote] = useState(examples[0].note);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [due, setDue] = useState<DueFilter>("all");

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.darkMode ? "dark" : "light";
  }, [settings]);

  const tasks = activeAnalysis?.tasks ?? [];
  const owners = useMemo(
    () => [...new Set(tasks.map((task) => task.owner).filter(Boolean))].sort(),
    [tasks],
  );
  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const haystack = `${task.title} ${task.owner} ${task.sourceQuote}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesOwner = owner === "all" || task.owner === owner;
        const matchesPriority = priority === "all" || task.priority === priority;
        const matchesDue =
          due === "all" ||
          (due === "with-due" && Boolean(task.due)) ||
          (due === "without-due" && !task.due);
        return matchesSearch && matchesOwner && matchesPriority && matchesDue;
      }),
    [tasks, search, owner, priority, due],
  );

  async function handleExtract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsExtracting(true);
    setError("");

    try {
      const result = await extractTasks(note);
      const analysis = createAnalysis(note, result);
      setActiveAnalysis(analysis);

      if (settings.saveHistory) {
        setHistory((current) => {
          const next = [analysis, ...current].slice(0, 6);
          localStorage.setItem(historyKey, JSON.stringify(next));
          return next;
        });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Etwas ist schiefgelaufen.");
    } finally {
      setIsExtracting(false);
    }
  }

  function loadHistoryItem(analysis: Analysis) {
    setNote(analysis.note);
    setActiveAnalysis(analysis);
    setError("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span>n→a</span>
          <strong>Notiz → Aufgaben</strong>
        </a>
        <div className="topbar-actions">
          <a
            className="repository-link"
            href="https://github.com/manuelfussTC/DLDemo20260714"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setSettings((current) => ({ ...current, darkMode: !current.darkMode }))}
          >
            {settings.darkMode ? "☀ Heller Modus" : "◐ Dunkler Modus"}
          </button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Meeting-Nachbereitung, v0</p>
        <h1>Aus Gesprächsnotizen<br />werden nächste Schritte.</h1>
        <p>Füge eine Notiz ein. Der Prototyp sucht belegbare Aufgaben, Personen und Fristen heraus.</p>
      </section>

      <section className="workspace">
        <form className="note-form" onSubmit={handleExtract}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">1. Ursprungsnotiz</p>
              <h2>Was wurde besprochen?</h2>
            </div>
            <span className="character-count">{note.length} Zeichen</span>
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Füge hier deine Meeting-Notiz ein …"
          />
          <div className="example-row">
            <span>Beispiele:</span>
            {examples.map((example) => (
              <button key={example.label} type="button" onClick={() => setNote(example.note)}>
                {example.label}
              </button>
            ))}
          </div>
          <button className="primary-action" type="submit" disabled={isExtracting}>
            {isExtracting ? "Extrahiere Aufgaben …" : "Aufgaben extrahieren"}
            <span>→</span>
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>

        <aside className="side-panel">
          <div>
            <p className="eyebrow">Verlauf</p>
            <h2>Letzte Analysen</h2>
          </div>
          {history.length ? (
            <ul className="history-list">
              {history.map((analysis) => (
                <li key={analysis.id}>
                  <button type="button" onClick={() => loadHistoryItem(analysis)}>
                    <span>{analysis.note.slice(0, 52)}{analysis.note.length > 52 ? "…" : ""}</span>
                    <small>{analysis.tasks.length} Aufgaben · {new Date(analysis.createdAt).toLocaleDateString("de-DE")}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-copy">Deine letzten sechs Analysen erscheinen nur in diesem Browser.</p>
          )}
          <SettingsPanel settings={settings} onChange={setSettings} />
        </aside>
      </section>

      <section className="results">
        <div className="results-heading">
          <div>
            <p className="eyebrow">2. Extrahierte Aufgaben</p>
            <h2>{activeAnalysis ? "Nächste Schritte im Blick" : "Bereit für die erste Analyse"}</h2>
          </div>
          {tasks.length > 0 && (
            <button className="export-button" type="button" onClick={() => downloadCsv(filteredTasks)}>
              CSV exportieren
            </button>
          )}
        </div>

        {activeAnalysis ? (
          <>
            <Dashboard
              total={tasks.length}
              withDueDate={tasks.filter((task) => task.due).length}
              highPriority={tasks.filter((task) => task.priority === "high").length}
            />
            <TaskFilters
              search={search}
              owner={owner}
              priority={priority}
              due={due}
              owners={owners}
              onSearchChange={setSearch}
              onOwnerChange={setOwner}
              onPriorityChange={setPriority}
              onDueChange={setDue}
            />
            <div className="results-count">{filteredTasks.length} von {tasks.length} Aufgaben sichtbar</div>
            {filteredTasks.length ? (
              <div className="task-grid">
                {filteredTasks.map((task, index) => (
                  <TaskCard
                    key={`${task.title}-${index}`}
                    task={task}
                    showSourceQuote={settings.showSourceQuotes}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-state">Für diese Filter gibt es keine passenden Aufgaben.</p>
            )}
          </>
        ) : (
          <div className="empty-state">
            <span>✦</span>
            Nach der Extraktion erscheinen hier Aufgaben mit wörtlichen Belegen aus deiner Notiz.
          </div>
        )}
      </section>
    </main>
  );
}
