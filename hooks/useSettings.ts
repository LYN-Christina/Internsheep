"use client";

import { useEffect, useState } from "react";

import {
  defaultSettings,
  getSettings,
  saveSettings,
} from "@/services/storage/settingsStorage";
import type { Settings } from "@/types";

export function useSettings() {
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    queueMicrotask(() => {
      setSettings(getSettings());
      setIsReady(true);
    });
  }, []);

  function updateSettings(nextSettings: Settings) {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }

  return {
    isReady,
    settings,
    updateSettings,
  };
}
