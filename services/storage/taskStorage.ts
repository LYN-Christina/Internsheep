import { readJson, writeJson } from "@/services/storage/jsonStorage";
import { getTaskStorageKey } from "@/services/storage/storageKeys";
import type { Task, UserRole } from "@/types";
import {
  getCurrentWeekRange,
  getTodayISO,
  isSameDay,
  isWithinRange,
} from "@/utils/date";
import { isOverdueTask } from "@/utils/dueDate";

export function getTasks(role: UserRole) {
  return readJson<Task[]>(getTaskStorageKey(role), []);
}

export function saveTasks(role: UserRole, tasks: Task[]) {
  writeJson(getTaskStorageKey(role), tasks);
}

export function addTask(role: UserRole, task: Task) {
  saveTasks(role, [task, ...getTasks(role)]);
}

export function updateTask(
  role: UserRole,
  taskId: string,
  updates: Partial<Task>,
) {
  const now = new Date().toISOString();
  const nextTasks = getTasks(role).map((task) =>
    task.id === taskId ? { ...task, ...updates, updatedAt: now } : task,
  );

  saveTasks(role, nextTasks);
}

export function deleteTask(role: UserRole, taskId: string) {
  saveTasks(
    role,
    getTasks(role).filter((task) => task.id !== taskId),
  );
}

export function getTodayTasks(role: UserRole) {
  const today = getTodayISO();

  return getTasks(role).filter((task) =>
    task.dueDate
      ? isSameDay(task.dueDate, today)
      : isSameDay(task.createdAt, today),
  );
}

export function getOverdueTasks(role: UserRole) {
  const today = getTodayISO();

  return getTasks(role).filter(
    (task) => isOverdueTask(task, today),
  );
}

export function getTodayTodoTasks(role: UserRole) {
  const today = getTodayISO();

  return getTasks(role).filter(
    (task) => task.status === "todo" && (task.dueDate ?? task.createdAt.slice(0, 10)) === today,
  );
}

export function getTodayDoneTasks(role: UserRole) {
  const today = getTodayISO();

  return getTasks(role).filter(
    (task) => task.status === "done" && (task.dueDate ?? task.createdAt.slice(0, 10)) === today,
  );
}

export function getCurrentWeekTasks(role: UserRole) {
  const { start, end } = getCurrentWeekRange();

  return getTasks(role).filter((task) =>
    isWithinRange(task.createdAt.slice(0, 10), start, end),
  );
}

export function getTasksGroupedByDate(role: UserRole) {
  return getTasks(role).reduce<Record<string, Task[]>>((groups, task) => {
    const date = task.createdAt.slice(0, 10);
    groups[date] = groups[date] ? [...groups[date], task] : [task];
    return groups;
  }, {});
}
