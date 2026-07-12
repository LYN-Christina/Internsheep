import { readJson, writeJson } from "@/services/storage/jsonStorage";
import { storageKeys } from "@/services/storage/storageKeys";
import type { UsageRecord } from "@/types";
import { getCurrentWeekRange, getTodayISO } from "@/utils/date";

export const TASK_EXTRACTION_DAILY_LIMIT = 2;
export const AUDIO_TRANSCRIPTION_DAILY_LIMIT = 2;
export const WEEKLY_REPORT_WEEKLY_LIMIT = 2;

function getDefaultUsageRecord(): UsageRecord {
  return {
    taskExtraction: {
      date: getTodayISO(),
      count: 0,
    },
    audioTranscription: {
      date: getTodayISO(),
      count: 0,
    },
    weeklyReport: {
      weekStart: getCurrentWeekRange().start,
      count: 0,
    },
  };
}

// localStorage limits are only suitable for small-scale testing; they cannot
// prevent users from clearing browser storage to reset free usage.
export function getUsageRecord() {
  return resetUsageIfNeeded(readJson<UsageRecord>(storageKeys.usage, getDefaultUsageRecord()));
}

export function saveUsageRecord(record: UsageRecord) {
  writeJson(storageKeys.usage, record);
}

export function resetUsageIfNeeded(record = readJson<UsageRecord>(storageKeys.usage, getDefaultUsageRecord())) {
  const today = getTodayISO();
  const weekStart = getCurrentWeekRange().start;
  const nextRecord: UsageRecord = {
    taskExtraction:
      record.taskExtraction?.date === today
        ? record.taskExtraction
        : { date: today, count: 0 },
    audioTranscription:
      record.audioTranscription?.date === today
        ? record.audioTranscription
        : { date: today, count: 0 },
    weeklyReport:
      record.weeklyReport?.weekStart === weekStart
        ? record.weeklyReport
        : { weekStart, count: 0 },
  };

  saveUsageRecord(nextRecord);
  return nextRecord;
}

export function getRemainingTaskExtractionCount(record = getUsageRecord()) {
  return Math.max(0, TASK_EXTRACTION_DAILY_LIMIT - record.taskExtraction.count);
}

export function getRemainingAudioTranscriptionCount(record = getUsageRecord()) {
  return Math.max(
    0,
    AUDIO_TRANSCRIPTION_DAILY_LIMIT - record.audioTranscription.count,
  );
}

export function getRemainingWeeklyReportCount(record = getUsageRecord()) {
  return Math.max(0, WEEKLY_REPORT_WEEKLY_LIMIT - record.weeklyReport.count);
}

export function canUseTaskExtraction(record = getUsageRecord()) {
  return getRemainingTaskExtractionCount(record) > 0;
}

export function canUseAudioTranscription(record = getUsageRecord()) {
  return getRemainingAudioTranscriptionCount(record) > 0;
}

export function canUseWeeklyReport(record = getUsageRecord()) {
  return getRemainingWeeklyReportCount(record) > 0;
}

export function incrementTaskExtractionUsage() {
  const record = getUsageRecord();
  const nextRecord: UsageRecord = {
    ...record,
    taskExtraction: {
      ...record.taskExtraction,
      count: record.taskExtraction.count + 1,
    },
  };

  saveUsageRecord(nextRecord);
  return nextRecord;
}

export function incrementAudioTranscriptionUsage() {
  const record = getUsageRecord();
  const nextRecord: UsageRecord = {
    ...record,
    audioTranscription: {
      ...record.audioTranscription,
      count: record.audioTranscription.count + 1,
    },
  };

  saveUsageRecord(nextRecord);
  return nextRecord;
}

export function incrementWeeklyReportUsage() {
  const record = getUsageRecord();
  const nextRecord: UsageRecord = {
    ...record,
    weeklyReport: {
      ...record.weeklyReport,
      count: record.weeklyReport.count + 1,
    },
  };

  saveUsageRecord(nextRecord);
  return nextRecord;
}
