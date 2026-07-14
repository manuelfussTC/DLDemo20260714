type DashboardProps = {
  total: number;
  withDueDate: number;
  highPriority: number;
};

export function Dashboard({ total, withDueDate, highPriority }: DashboardProps) {
  return (
    <section className="dashboard" aria-label="Übersicht">
      <article className="metric-card">
        <span>Erkannte Aufgaben</span>
        <strong>{total}</strong>
        <small>aus der aktuellen Analyse</small>
      </article>
      <article className="metric-card">
        <span>Offene Fristen</span>
        <strong>{withDueDate}</strong>
        <small>mit konkreter Zeitangabe</small>
      </article>
      <article className="metric-card accent">
        <span>Hohe Priorität</span>
        <strong>{highPriority}</strong>
        <small>braucht zuerst Aufmerksamkeit</small>
      </article>
    </section>
  );
}
