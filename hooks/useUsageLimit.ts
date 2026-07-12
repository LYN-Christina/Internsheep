"use client";

import { useEffect, useState } from "react";

import {
  canUseAudioTranscription,
  canUseTaskExtraction,
  canUseWeeklyReport,
  getRemainingAudioTranscriptionCount,
  getRemainingTaskExtractionCount,
  getRemainingWeeklyReportCount,
  getUsageRecord,
  incrementAudioTranscriptionUsage,
  incrementTaskExtractionUsage,
  incrementWeeklyReportUsage,
  resetUsageIfNeeded,
} from "@/services/storage/usageStorage";
import type { UsageRecord } from "@/types";

export function useUsageLimit(isReady: boolean) {
  const [usageRecord, setUsageRecord] = useState<UsageRecord | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    queueMicrotask(() => {
      setUsageRecord(resetUsageIfNeeded());
    });
  }, [isReady]);

  function refreshUsage() {
    setUsageRecord(getUsageRecord());
  }

  function incrementTaskExtraction() {
    setUsageRecord(incrementTaskExtractionUsage());
  }

  function incrementAudioTranscription() {
    setUsageRecord(incrementAudioTranscriptionUsage());
  }

  function incrementWeeklyReport() {
    setUsageRecord(incrementWeeklyReportUsage());
  }

  return {
    canUseAudioTranscription: usageRecord
      ? canUseAudioTranscription(usageRecord)
      : true,
    canUseTaskExtraction: usageRecord ? canUseTaskExtraction(usageRecord) : true,
    canUseWeeklyReport: usageRecord ? canUseWeeklyReport(usageRecord) : true,
    incrementAudioTranscription,
    incrementTaskExtraction,
    incrementWeeklyReport,
    refreshUsage,
    remainingAudioTranscription: usageRecord
      ? getRemainingAudioTranscriptionCount(usageRecord)
      : 2,
    remainingTaskExtraction: usageRecord
      ? getRemainingTaskExtractionCount(usageRecord)
      : 2,
    remainingWeeklyReport: usageRecord ? getRemainingWeeklyReportCount(usageRecord) : 2,
    usageRecord,
  };
}
