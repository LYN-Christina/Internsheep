import {
  ClipboardList,
  FileText,
  Footprints,
  Mic,
  Settings2,
} from "lucide-react";

import type { AppView } from "@/lib/page-types";

interface BottomNavProps {
  currentView: AppView;
  onChange: (view: AppView) => void;
}

const items: Array<{
  view: AppView;
  label: string;
  icon: typeof ClipboardList;
}> = [
  { view: "today", label: "今日清单", icon: ClipboardList },
  { view: "recording", label: "录音纪要", icon: Mic },
  { view: "growth", label: "成长印记", icon: Footprints },
  { view: "weekly", label: "本周周报", icon: FileText },
  { view: "settings", label: "我的设置", icon: Settings2 },
];

export function BottomNav({ currentView, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-4xl grid-cols-5 gap-1 rounded-[28px] border border-[var(--border)] bg-[rgba(20,13,51,0.78)] p-1.5 shadow-[0_18px_60px_rgba(5,3,18,0.46)] backdrop-blur-2xl">
        {items.map(({ icon: Icon, label, view }) => {
          const active = currentView === view;

          return (
            <button
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] px-1 text-[10px] leading-tight transition active:scale-[0.98] ${
                active
                  ? "bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-[var(--primary)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_26%,transparent)]"
                  : "text-[rgba(255,255,255,0.48)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[rgba(255,255,255,0.78)]"
              }`}
              key={view}
              type="button"
              onClick={() => onChange(view)}
            >
              {active ? (
                <span className="absolute top-1 size-1 rounded-full bg-[var(--primary)] shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_80%,transparent)]" />
              ) : null}
              <Icon aria-hidden="true" className="size-4" />
              <span className="max-w-full truncate text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
