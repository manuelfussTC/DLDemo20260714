import type { Priority } from "../types";

export type DueFilter = "all" | "with-due" | "without-due";

type TaskFiltersProps = {
  search: string;
  owner: string;
  priority: "all" | Priority;
  due: DueFilter;
  owners: string[];
  onSearchChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onPriorityChange: (value: "all" | Priority) => void;
  onDueChange: (value: DueFilter) => void;
};

export function TaskFilters({
  search,
  owner,
  priority,
  due,
  owners,
  onSearchChange,
  onOwnerChange,
  onPriorityChange,
  onDueChange,
}: TaskFiltersProps) {
  return (
    <section className="filters" aria-label="Aufgaben filtern">
      <label>
        Suche
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Aufgabe oder Beleg durchsuchen"
        />
      </label>
      <label>
        Person
        <select value={owner} onChange={(event) => onOwnerChange(event.target.value)}>
          <option value="all">Alle Personen</option>
          {owners.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Priorität
        <select
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value as "all" | Priority)}
        >
          <option value="all">Alle Prioritäten</option>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="low">Niedrig</option>
          <option value="unknown">Unklar</option>
        </select>
      </label>
      <label>
        Frist
        <select value={due} onChange={(event) => onDueChange(event.target.value as DueFilter)}>
          <option value="all">Alle Fristen</option>
          <option value="with-due">Mit Frist</option>
          <option value="without-due">Ohne Frist</option>
        </select>
      </label>
    </section>
  );
}
