import {
  AIProviderError,
  callAIProvider,
  type ChatMessage,
} from "@/services/ai/providerRuntime";
import type {
  AIProvider,
  DraftTask,
  ExtractionResult,
  Role,
  Settings,
  TaskPriority,
} from "@/types";
import { normalizeDueDateFromAI } from "@/utils/dueDate";

const categoriesByRole: Record<Role, string[]> = {
  intern: ["项目", "会议", "文档", "学习", "其他"],
  student: ["作业", "课程", "实验", "社团", "其他"],
};

const priorities: TaskPriority[] = ["high", "medium", "low"];
const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function getChinaDateContext() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    weekday: "long",
    year: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    currentDate: `${values.year}-${values.month}-${values.day}`,
    currentWeekday: values.weekday || weekdays[now.getDay()],
  };
}

function parseJsonBlock(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);

  try {
    return JSON.parse(match ? match[1] : trimmed) as unknown;
  } catch {
    throw new AIProviderError(
      "AI 返回的内容不是合法 JSON，请重试。",
      "invalid-json",
    );
  }
}

function normalizePriority(priority: unknown): TaskPriority {
  return priorities.includes(priority as TaskPriority)
    ? (priority as TaskPriority)
    : "low";
}

function normalizeDraftTask(
  task: Record<string, unknown>,
  index: number,
  categories: string[],
): DraftTask {
  const fallbackCategory = categories.at(-1) ?? "其他";
  const category = String(task.category || fallbackCategory);
  const normalizedDue = normalizeDueDateFromAI({
    dueDate: task.dueDate,
    dueText: task.dueText ?? task.due,
    dueTime: task.dueTime,
    uncertainReason: task.uncertainReason,
  });
  const dueText = normalizedDue.dueText ?? String(task.due || "不确定");
  const defaultDueDate = getChinaDateContext().currentDate;

  return {
    category: categories.includes(category) ? category : fallbackCategory,
    due: dueText,
    dueDate: normalizedDue.dueDate ?? defaultDueDate,
    dueText: normalizedDue.dueText,
    dueTime: normalizedDue.dueTime,
    id: crypto.randomUUID(),
    priority: normalizePriority(task.priority),
    selected: true,
    title: String(task.title || `未命名任务${index + 1}`).trim().slice(0, 50),
    uncertainReason: normalizedDue.uncertainReason,
  };
}

export function buildExtractTasksMessages(params: {
  role: Role;
  text: string;
}): ChatMessage[] {
  const categories = categoriesByRole[params.role];
  const { currentDate, currentWeekday } = getChinaDateContext();

  return [
    {
      role: "system",
      content:
        "你是 InternSheep 的任务提取助手。你只能输出合法 JSON，不要输出 Markdown、解释或代码块。",
    },
    {
      role: "user",
      content: `用户角色：${params.role}
当前日期：${currentDate}
当前星期：${currentWeekday}
可用分类：${categories.join(" / ")}

请从以下内容中提取明确的待办事项：
"""
${params.text}
"""

输出必须是合法 JSON，格式如下：
{
  "tasks": [
    {
      "title": "任务标题，动词开头，简洁明确，不超过20字",
      "category": "分类",
      "priority": "high/medium/low",
      "dueText": "用户原话中的截止时间描述，例如 周一下午五点；没有则为 null",
      "dueDate": "YYYY-MM-DD；无法确定则为 null",
      "dueTime": "HH:mm；无法确定则为 null",
      "uncertainReason": "如果无法确定日期或时间，说明原因；可以确定则为 null"
    }
  ],
  "summary": "一句话描述今天输入的主要内容，不超过30字",
  "unextracted_note": "如果有提到但不够明确、没有提取为任务的内容，在此说明；没有则填 null"
}

提取规则：
- 只提取明确的待办事项
- 不提取已经完成的事情
- 任务标题尽量用动词开头
- 不确定的任务 priority 设为 low
- 根据当前日期和当前星期推算相对时间：今天、明天、后天、本周一、本周二、本周三、本周四、本周五、下周一、下周二、周一下午五点、星期四下午三点、明早、今晚、本周五下班前、下周交、月底前
- 当用户描述未来任务时，周几通常指接下来最近的对应星期；如果当天已经过了该时间，理解为下一次对应星期
- 如果用户说“周一下午五点交 PRD”，必须提取 dueDate 和 dueTime
- 如果用户只说“本周交”，dueDate 可以为 null，但 dueText 必须保留“本周”
- 如果用户只说“下周前”，dueDate 可以为 null，uncertainReason 写“缺少具体日期”
- 如果用户只说“下午五点”但没有说明哪天，可以 dueTime 为 "17:00"，dueDate 为 null
- 如果用户说“明天下午三点”，需要根据 currentDate 计算 dueDate
- dueDate 必须是 YYYY-MM-DD，dueTime 必须是 24 小时制 HH:mm
- 最多提取 8 个任务
- 不要输出 Markdown
- 不要输出解释文本`,
    },
  ];
}

export function parseExtractionResult(params: {
  content: string;
  role: Role;
}): ExtractionResult {
  const categories = categoriesByRole[params.role];
  const parsed = parseJsonBlock(params.content) as {
    tasks?: unknown;
    summary?: unknown;
    unextracted_note?: unknown;
  };

  if (!Array.isArray(parsed.tasks)) {
    throw new AIProviderError("AI 返回格式不正确，请重试。", "invalid-json");
  }

  const tasks = parsed.tasks
    .slice(0, 8)
    .filter((task): task is Record<string, unknown> => Boolean(task))
    .map((task, index) => normalizeDraftTask(task, index, categories))
    .filter((task) => task.title.trim());

  if (!tasks.length) {
    throw new AIProviderError(
      "没有提取到明确任务，你可以补充描述后重试，或手动添加任务。",
      "empty-tasks",
    );
  }

  return {
    summary: String(parsed.summary || "已提取任务草稿").slice(0, 80),
    tasks,
    unextracted_note:
      parsed.unextracted_note === null || parsed.unextracted_note === undefined
        ? null
        : String(parsed.unextracted_note),
  };
}

export async function extractTasksWithProvider(params: {
  apiKey: string;
  baseURL?: string;
  model?: string;
  provider: AIProvider;
  role: Role;
  text: string;
}) {
  const text = params.text.trim();

  if (!text) {
    throw new AIProviderError("请先输入或录制一段内容。", "provider");
  }

  const content = await callAIProvider({
    apiKey: params.apiKey,
    baseURL: params.baseURL,
    messages: buildExtractTasksMessages({ role: params.role, text }),
    model: params.model,
    provider: params.provider,
    responseFormat: "json_object",
  });

  return parseExtractionResult({ content, role: params.role });
}

export async function extractTasksFromText(params: {
  role: Role;
  settings: Settings;
  text: string;
}): Promise<ExtractionResult> {
  const text = params.text.trim();

  if (!text) {
    throw new AIProviderError("请先输入或录制一段内容。", "provider");
  }

  const response = await fetch("/api/ai/extract-tasks", {
    body: JSON.stringify({
      apiKey: params.settings.apiKey || undefined,
      mode: params.settings.apiKey.trim() ? "user-key" : "free",
      payload: {
        role: params.role,
        text,
      },
      provider: params.settings.apiProvider,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const data = (await response.json()) as
    | { result: ExtractionResult }
    | { error: { code: string; message: string; status?: number } };

  if (!response.ok || "error" in data) {
    throw new AIProviderError(
      "error" in data ? data.error.message : "AI 提取失败，请稍后重试。",
      "provider",
      "error" in data ? data.error.status : response.status,
      data,
    );
  }

  return data.result;
}
