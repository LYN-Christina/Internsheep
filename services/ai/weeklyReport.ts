import {
  AIProviderError,
  callAIProvider,
  type ChatMessage,
} from "@/services/ai/providerRuntime";
import type { AIProvider, Task, UserRole } from "@/types";

export interface GenerateWeeklyReportInput {
  role: UserRole;
  startDate: string;
  endDate: string;
  tasks: Task[];
  toneValue: number;
  lengthValue: number;
  apiProvider: AIProvider;
  apiKey: string;
  model?: string;
}

function buildWeeklyReportMessages(input: GenerateWeeklyReportInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "你是一个实习生助手，帮助用户生成本周工作报告。输出纯文本，不要输出 JSON，不要输出 Markdown 代码块。",
    },
    {
      role: "user",
      content: `用户角色：${input.role}
报告日期范围：${input.startDate} 至 ${input.endDate}
语气偏好：0=非常正式，100=非常轻松，当前值=${input.toneValue}
长度偏好：0=非常简洁，100=非常详细，当前值=${input.lengthValue}
本周任务记录：
${JSON.stringify(input.tasks, null, 2)}

请按以下模板生成纯文本周报：

【本周工作总结】${input.startDate} 至 ${input.endDate}

一、本周完成事项
{本周已完成任务列表}

二、进行中事项
{本周未完成任务列表}

三、遇到的问题与解决方案
{问题与解决摘要}

四、下周计划
{下周预期任务}

五、本周收获
{成长关键词与简要说明}

生成要求：
- 语气自然，不要堆砌空话套话；
- 已完成任务用肯定语气；
- 未完成任务客观描述；
- 本周收获要具体，从任务内容中提炼真实成长点；
- 输出纯文本；
- 不要输出 JSON；
- 不要输出 Markdown 代码块；
- 如果任务信息不足，可以提示用户补充，但不要生成空话。`,
    },
  ];
}

export async function generateWeeklyReportWithProvider(
  input: GenerateWeeklyReportInput,
) {
  if (!input.tasks.length) {
    throw new AIProviderError(
      "本周还没有任务记录，先去录音纪要或今日清单添加一些内容吧。",
      "empty-tasks",
    );
  }

  const content = await callAIProvider({
    apiKey: input.apiKey,
    messages: buildWeeklyReportMessages(input),
    model: input.model,
    provider: input.apiProvider,
  });

  return content.trim();
}

export async function generateWeeklyReport(input: GenerateWeeklyReportInput) {
  if (!input.tasks.length) {
    throw new AIProviderError(
      "本周还没有任务记录，先去录音纪要或今日清单添加一些内容吧。",
      "empty-tasks",
    );
  }

  const response = await fetch("/api/ai/generate-weekly-report", {
    body: JSON.stringify({
      apiKey: input.apiKey || undefined,
      mode: input.apiKey.trim() ? "user-key" : "free",
      payload: {
        endDate: input.endDate,
        lengthValue: input.lengthValue,
        role: input.role,
        startDate: input.startDate,
        tasks: input.tasks,
        toneValue: input.toneValue,
      },
      provider: input.apiProvider,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const data = (await response.json()) as
    | { content: string }
    | { error: { code: string; message: string; status?: number } };

  if (!response.ok || "error" in data) {
    throw new AIProviderError(
      "error" in data ? data.error.message : "周报生成失败，请稍后重试。",
      "provider",
      "error" in data ? data.error.status : response.status,
      data,
    );
  }

  if (!data.content.trim()) {
    throw new AIProviderError("AI 返回内容为空，请稍后重试。", "empty-content");
  }

  return data.content;
}
