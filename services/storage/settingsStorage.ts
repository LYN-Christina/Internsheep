import { readJson, removeStorageItem, writeJson } from "@/services/storage/jsonStorage";
import { storageKeys } from "@/services/storage/storageKeys";
import type { AIProvider, Settings, UserRole } from "@/types";

export const defaultSettings: Settings = {
  apiProvider: "openai",
  apiKey: "",
  currentRole: "intern",
  freeTrialUsed: {
    extractTasks: 0,
    weeklyReport: 0,
  },
  reportStyle: {
    tone: 35,
    length: 45,
  },
};

export function getSettings() {
  const settings = readJson<Settings>(storageKeys.settings, defaultSettings);
  const currentRole = readJson<UserRole>(
    storageKeys.currentRole,
    settings.currentRole,
  );
  const apiProvider: AIProvider =
    settings.apiProvider === "openai-compatible" || settings.apiProvider === "yunfeng"
      ? "deepseek"
      : settings.apiProvider;

  return { ...defaultSettings, ...settings, apiProvider, currentRole };
}

export function saveSettings(settings: Settings) {
  writeJson(storageKeys.settings, settings);
  writeJson(storageKeys.currentRole, settings.currentRole);
}

export function saveCurrentRole(role: UserRole) {
  saveSettings({ ...getSettings(), currentRole: role });
}

export function clearSettings() {
  removeStorageItem(storageKeys.settings);
  removeStorageItem(storageKeys.currentRole);
}
