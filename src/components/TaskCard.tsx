import type { Task } from "../types";

type TaskCardProps = {
  task: Task;
  showSourceQuote: boolean;
};

const priorityLabel = {
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
  unknown: "Unklar",
};

const dueStatusLabel = {
  missing: "",
  valid: "Gültig",
  overdue: "Überfällig",
  invalid: "Ungültig",
  ambiguous: "Mehrdeutig",
};

export function TaskCard({ task, showSourceQuote }: TaskCardProps) {
  const warning = task.dueWarning || task.contextWarning;

  return (
    <article className="task-card">
      <div className="task-card__heading">
        <span className={`priority priority--${task.priority}`}>
          {priorityLabel[task.priority]}
        </span>
        <span className="task-owner">{task.owner || "Nicht zugeordnet"}</span>
      </div>
      <h3>{task.title}</h3>
      <dl className="task-meta">
        <div>
          <dt>Verantwortlich</dt>
          <dd>{task.owner || "—"}</dd>
        </div>
        <div>
          <dt>Frist</dt>
          <dd>
            {task.due || "—"}
            {task.dueStatus !== "missing" && (
              <span className={`due-status due-status--${task.dueStatus}`}>
                {dueStatusLabel[task.dueStatus]}
              </span>
            )}
          </dd>
        </div>
      </dl>
      {task.dependsOn.length > 0 && (
        <p className="task-dependency">
          Voraussetzung: {task.dependsOn.join(", ")}
        </p>
      )}
      {warning && (
        <p className="task-warning" role="status">
          {warning}
        </p>
      )}
      {showSourceQuote && (
        <blockquote>
          <span>Bereinigter Beleg</span>
          „{task.sourceQuote}“
        </blockquote>
      )}
    </article>
  );
}
