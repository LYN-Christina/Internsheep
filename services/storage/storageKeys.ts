import type { UserRole } from "@/types/task";

export const storageKeys = {
  settings: "internsheep:settings",
  currentRole: "internsheep:role",
  internTasks: "internsheep:tasks:intern",
  studentTasks: "internsheep:tasks:student",
  reports: "internsheep:reports",
  usage: "internsheep:usage",
} as const;

export function getTaskStorageKey(role: UserRole) {
  return role === "intern" ? storageKeys.internTasks : storageKeys.studentTasks;
}

export function getAllStorageKeys() {
  return Object.values(storageKeys);
}
