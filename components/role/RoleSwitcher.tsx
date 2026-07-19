import type { Role } from "@/types";

interface RoleSwitcherProps {
  role: Role;
  onSwitchRole: (role: Role) => void;
}

const roles: Array<{ value: Role; label: string }> = [
  { value: "intern", label: "实习生" },
  { value: "student", label: "学生" },
];

export function RoleSwitcher({ onSwitchRole, role }: RoleSwitcherProps) {
  return (
    <div
      aria-label="当前角色"
      className="relative grid h-10 w-[9rem] shrink-0 grid-cols-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[rgba(255,255,255,0.08)] p-1 shadow-[0_10px_28px_rgba(10,7,33,0.18)] backdrop-blur-xl sm:h-11 sm:w-[9.75rem]"
      role="tablist"
    >
      <span
        className={`absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-[var(--radius-pill)] bg-[var(--primary)] shadow-[0_10px_28px_color-mix(in_srgb,var(--primary)_20%,transparent)] transition-transform duration-300 ease-out ${
          role === "student" ? "translate-x-[calc(100%+0.25rem)]" : "translate-x-0"
        }`}
      />
      {roles.map((item) => {
        const active = role === item.value;

        return (
          <button
            aria-selected={active}
            className={`relative z-10 flex h-full min-w-0 items-center justify-center rounded-[var(--radius-pill)] px-1 text-[12px] font-semibold leading-none transition-colors sm:px-2 sm:text-xs ${
              active
                ? "text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            key={item.value}
            role="tab"
            type="button"
            onClick={() => onSwitchRole(item.value)}
          >
            <span className="block whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
