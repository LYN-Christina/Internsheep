import type { UserRole } from "@/types/task";

export type AIProvider = "openai" | "anthropic" | "deepseek" | "yunfeng";
export type ApiProvider = AIProvider;

export interface Settings {
  apiProvider: AIProvider;
  apiKey: string;
  currentRole: UserRole;
  freeTrialUsed: {
    extractTasks: number;
    weeklyReport: number;
  };
  reportStyle: {
    tone: number;
    length: number;
  };
}

export interface UsageRecord {
  taskExtraction: {
    date: string;
    count: number;
  };
  weeklyReport: {
    weekStart: string;
    count: number;
  };
}
