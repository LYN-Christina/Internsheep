export type UserRole = "intern" | "student";
export type Role = UserRole;

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "done" | "dropped";
export type TaskSource = "voice" | "manual";

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  dueText?: string;
  dueTime?: string;
  uncertainReason?: string;
  note?: string;
  source: TaskSource;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface DraftTask {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  due: string;
  dueDate?: string;
  dueText?: string;
  dueTime?: string;
  uncertainReason?: string;
  selected: boolean;
}

export interface ExtractionResult {
  tasks: DraftTask[];
  summary: string;
  unextracted_note: string | null;
}
