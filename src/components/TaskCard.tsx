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

export function TaskCard({ task, showSourceQuote }: TaskCardProps) {
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
          <dd>{task.due || "—"}</dd>
        </div>
      </dl>
      {showSourceQuote && (
        <blockquote>
          <span>Wörtlicher Beleg</span>
          „{task.sourceQuote}“
        </blockquote>
      )}
    </article>
  );
}
