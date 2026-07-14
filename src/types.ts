export type Priority = "low" | "medium" | "high" | "unknown";

export type Task = {
  title: string;
  owner: string;
  due: string;
  priority: Priority;
  sourceQuote: string;
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
