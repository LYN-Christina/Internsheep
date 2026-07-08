import type { Role } from "@/types";

interface RoleSwitcherProps {
  role: Role;
  onSwitchRole: (role: Role) => void;
}

const roleLabels: Record<Role, string> = {
  intern: "实习生",
  student: "学生",
};

export function RoleSwitcher({ onSwitchRole, role }: RoleSwitcherProps) {
  const nextRole = role === "intern" ? "student" : "intern";

  return (
    <button
      className="rounded-md text-left"
      type="button"
      onClick={() => onSwitchRole(nextRole)}
    >
      <p className="text-[11px] text-[var(--muted-foreground)] sm:text-xs">
        当前角色
      </p>
      <h1 className="text-lg font-semibold leading-tight sm:text-xl">
        {roleLabels[role]}
      </h1>
      <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] sm:text-xs">
        点击切换到{roleLabels[nextRole]}
      </p>
    </button>
  );
}
