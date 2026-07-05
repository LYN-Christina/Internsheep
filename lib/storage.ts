"use client";

export { clearAllData } from "@/services/storage/appStorage";
export {
  defaultSettings,
  getSettings,
  saveCurrentRole,
  saveSettings,
} from "@/services/storage/settingsStorage";
export {
  addTask,
  deleteTask,
  getCurrentWeekTasks,
  getTasks,
  getTasksGroupedByDate,
  getTodayTasks,
  saveTasks,
  updateTask,
} from "@/services/storage/taskStorage";
export {
  clearReports,
  deleteReport,
  getReports,
  saveReport,
  saveReports,
} from "@/services/storage/reportStorage";
