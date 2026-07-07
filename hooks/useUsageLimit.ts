"use client";

import { useEffect, useState } from "react";

import {
  canUseTaskExtraction,
  canUseWeeklyReport,
  getRemainingTaskExtractionCount,
  getRemainingWeeklyReportCount,
  getUsageRecord,
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

  function incrementWeeklyReport() {
    setUsageRecord(incrementWeeklyReportUsage());
  }

  return {
    canUseTaskExtraction: usageRecord ? canUseTaskExtraction(usageRecord) : true,
    canUseWeeklyReport: usageRecord ? canUseWeeklyReport(usageRecord) : true,
    incrementTaskExtraction,
    incrementWeeklyReport,
    refreshUsage,
    remainingTaskExtraction: usageRecord
      ? getRemainingTaskExtractionCount(usageRecord)
      : 2,
    remainingWeeklyReport: usageRecord ? getRemainingWeeklyReportCount(usageRecord) : 2,
    usageRecord,
  };
}
