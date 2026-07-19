import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.06)] p-4 text-sm text-[var(--muted-foreground)]">
      <p className="font-semibold text-[var(--foreground)]">{title}</p>
      {description ? <p className="mt-1 leading-6">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
