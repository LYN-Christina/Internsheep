import type { Task } from "@/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidDateOnly(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

export function normalizeDueDate(value: unknown) {
  const date = normalizeNullableString(value);

  return date && isValidDateOnly(date) ? date : undefined;
}

export function normalizeDueTime(value: unknown) {
  const time = normalizeNullableString(value);

  return time && TIME_PATTERN.test(time) ? time : undefined;
}

export function normalizeDueDateFromAI(input: {
  dueDate?: unknown;
  dueText?: unknown;
  dueTime?: unknown;
  uncertainReason?: unknown;
}) {
  return {
    dueDate: normalizeDueDate(input.dueDate),
    dueText: normalizeNullableString(input.dueText),
    dueTime: normalizeDueTime(input.dueTime),
    uncertainReason: normalizeNullableString(input.uncertainReason),
  };
}

export function isOverdueTask(task: Pick<Task, "dueDate" | "status">, today: string) {
  return task.status === "todo" && Boolean(task.dueDate) && task.dueDate! < today;
}

export function formatDateForDisplay(date: string) {
  const [, month, day] = date.split("-");

  return `${Number(month)}月${Number(day)}日`;
}

export function formatDueDisplay(
  task: Pick<Task, "dueDate" | "dueText" | "dueTime">,
) {
  if (task.dueDate && task.dueTime) {
    return `截止 ${formatDateForDisplay(task.dueDate)} ${task.dueTime}`;
  }

  if (task.dueDate) {
    return `截止 ${formatDateForDisplay(task.dueDate)}`;
  }

  if (task.dueText) {
    return `截止 ${task.dueText}`;
  }

  return "未设置截止时间";
}
