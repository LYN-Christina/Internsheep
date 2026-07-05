import type { UserRole } from "@/types/task";

export type WeeklyTemplateId =
  | "work-report"
  | "mentor-sync"
  | "self-review"
  | "workplace-weekly";

export interface Report {
  id: string;
  type: "weekly";
  templateId: WeeklyTemplateId;
  dateRange: { start: string; end: string };
  content: string;
  role: UserRole;
  createdAt: string;
}
