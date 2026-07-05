import { readJson, removeStorageItem, writeJson } from "@/services/storage/jsonStorage";
import { storageKeys } from "@/services/storage/storageKeys";
import type { Report } from "@/types";

export function getReports() {
  return readJson<Report[]>(storageKeys.reports, []);
}

export function saveReports(reports: Report[]) {
  writeJson(storageKeys.reports, reports);
}

export function saveReport(report: Report) {
  saveReports([report, ...getReports()]);
}

export function deleteReport(reportId: string) {
  saveReports(getReports().filter((report) => report.id !== reportId));
}

export function clearReports() {
  removeStorageItem(storageKeys.reports);
}
