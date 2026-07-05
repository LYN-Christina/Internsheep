"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getReports,
  saveReport as saveReportToStorage,
} from "@/services/storage/reportStorage";
import type { Report } from "@/types";

export function useReports(isReady: boolean) {
  const [reports, setReports] = useState<Report[]>([]);

  const refreshReports = useCallback(() => {
    setReports(getReports());
  }, []);

  useEffect(() => {
    if (isReady) {
      queueMicrotask(refreshReports);
    }
  }, [isReady, refreshReports]);

  function saveReport(report: Report) {
    saveReportToStorage(report);
    refreshReports();
  }

  return {
    reports,
    refreshReports,
    saveReport,
  };
}
