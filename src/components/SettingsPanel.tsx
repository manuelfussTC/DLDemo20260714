import type { LocalSettings } from "../types";

type SettingsPanelProps = {
  settings: LocalSettings;
  onChange: (settings: LocalSettings) => void;
};

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = (key: keyof LocalSettings, value: boolean) =>
    onChange({ ...settings, [key]: value });

  return (
    <details className="settings">
      <summary>Einstellungen <span>Nur lokal gespeichert</span></summary>
      <div className="settings__options">
        <label>
          <input
            type="checkbox"
            checked={settings.saveHistory}
            onChange={(event) => update("saveHistory", event.target.checked)}
          />
          Letzte Analysen im Browser speichern
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showSourceQuotes}
            onChange={(event) => update("showSourceQuotes", event.target.checked)}
          />
          Wörtliche Belege auf Karten anzeigen
        </label>
      </div>
    </details>
  );
}
