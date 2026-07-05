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
