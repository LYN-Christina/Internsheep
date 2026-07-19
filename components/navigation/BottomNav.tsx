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
  labelLines: [string, string];
  icon: typeof ClipboardList;
}> = [
  { view: "today", labelLines: ["今日", "清单"], icon: ClipboardList },
  { view: "recording", labelLines: ["录音", "纪要"], icon: Mic },
  { view: "growth", labelLines: ["成长", "印记"], icon: Footprints },
  { view: "weekly", labelLines: ["本周", "周报"], icon: FileText },
  { view: "settings", labelLines: ["我的", "设置"], icon: Settings2 },
];

export function BottomNav({ currentView, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] sm:px-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-4xl grid-cols-5 gap-1 rounded-[26px] border border-[var(--border)] bg-[rgba(20,13,51,0.82)] p-1.5 shadow-[0_18px_60px_rgba(5,3,18,0.46)] backdrop-blur-2xl">
        {items.map(({ icon: Icon, labelLines, view }) => {
          const active = currentView === view;

          return (
            <button
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[3.75rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[20px] px-0.5 text-[11px] leading-[1.05] transition active:scale-[0.98] sm:min-h-16 sm:gap-1 sm:text-xs ${
                active
                  ? "bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                  : "text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[rgba(255,255,255,0.78)]"
              }`}
              key={view}
              type="button"
              onClick={() => onChange(view)}
            >
              {active ? (
                <span className="absolute top-1 size-1 rounded-full bg-[var(--primary)] shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_80%,transparent)]" />
              ) : null}
              <Icon aria-hidden="true" className="size-[18px] sm:size-5" />
              <span className="flex flex-col items-center whitespace-nowrap text-center font-medium">
                <span>{labelLines[0]}</span>
                <span>{labelLines[1]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
