import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-md bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
