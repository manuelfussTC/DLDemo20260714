export type Priority = "low" | "medium" | "high" | "unknown";
export type DueStatus =
  | "missing"
  | "valid"
  | "overdue"
  | "invalid"
  | "ambiguous";

export type Task = {
  title: string;
  owner: string;
  due: string;
  dueAt: string;
  dueStatus: DueStatus;
  dueWarning: string;
  priority: Priority;
  sourceQuote: string;
  dependsOn: string[];
  contextWarning: string;
};

export type Analysis = {
  id: string;
  createdAt: string;
  note: string;
  tasks: Task[];
};

export type LocalSettings = {
  darkMode: boolean;
  saveHistory: boolean;
  showSourceQuotes: boolean;
};
