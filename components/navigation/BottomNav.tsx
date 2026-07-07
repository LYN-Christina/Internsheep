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
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto grid max-w-4xl grid-cols-5 gap-1">
        {items.map(({ icon: Icon, label, view }) => (
          <button
            aria-current={currentView === view ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs ${
              currentView === view
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)]"
            }`}
            key={view}
            type="button"
            onClick={() => onChange(view)}
          >
            <Icon aria-hidden="true" className="size-4" />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
