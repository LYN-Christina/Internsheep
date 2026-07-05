"use client";

import type { Settings, UserRole } from "@/types";

export function useCurrentRole(
  settings: Settings,
  updateSettings: (settings: Settings) => void,
) {
  const role = settings.currentRole;

  function switchRole(nextRole: UserRole) {
    updateSettings({ ...settings, currentRole: nextRole });
  }

  return {
    role,
    switchRole,
  };
}
