import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageShell({
  children,
  eyebrow,
  title,
  description,
  action,
}: {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-[fade-in_0.45s_ease-out] flex-col gap-4">
      {title ? (
        <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[rgba(255,255,255,0.08)] p-5 shadow-[var(--shadow-card)] backdrop-blur-2xl">
          <div className="absolute -right-10 -top-12 size-36 rounded-full bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] blur-2xl" />
          <div className="absolute bottom-0 right-5 h-16 w-32 rounded-t-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--primary)_76%,transparent)]">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--foreground)]">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  {description}
                </p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </section>
      ) : null}
      {children}
    </div>
  );
}

export function GlassCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "glass-panel rounded-[var(--radius-lg)]",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  icon,
  kicker,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="flex size-9 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--primary)]">
              {icon}
            </span>
          ) : null}
          <div>
            {kicker ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--primary)_66%,transparent)]">
                {kicker}
              </p>
            ) : null}
            <h2 className="text-lg font-semibold leading-tight text-[var(--foreground)]">
              {title}
            </h2>
          </div>
        </div>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.08)] p-4 shadow-[0_12px_34px_rgba(10,7,33,0.18)]",
        className,
      )}
    >
      <p className="text-xs leading-4 text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-[11px] leading-4 text-[rgba(255,255,255,0.52)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function NoticeBanner({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "warning" | "danger" | "success";
  className?: string;
}) {
  const toneClass = {
    accent: "border-[color-mix(in_srgb,var(--primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--primary)_13%,transparent)]",
    danger: "border-[rgba(255,159,184,0.28)] bg-[rgba(255,159,184,0.12)]",
    default: "border-[var(--border)] bg-[rgba(255,255,255,0.07)]",
    success: "border-[rgba(168,240,210,0.28)] bg-[rgba(168,240,210,0.12)]",
    warning: "border-[rgba(245,210,140,0.3)] bg-[rgba(245,210,140,0.12)]",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border px-3.5 py-3 text-sm leading-6 text-[var(--muted-foreground)]",
        toneClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GlassInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[rgba(255,255,255,0.08)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[rgba(255,255,255,0.36)] focus:border-[var(--border-strong)] focus:bg-[rgba(255,255,255,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export function GlassTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.08)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none transition placeholder:text-[rgba(255,255,255,0.36)] focus:border-[var(--border-strong)] focus:bg-[rgba(255,255,255,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export function GlassSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[#261a52] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--border-strong)]",
        className,
      )}
      {...props}
    />
  );
}

export function CompanionMark() {
  return (
    <div className="relative size-16 shrink-0 overflow-visible">
      <div className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] blur-xl" />
      <img
        alt=""
        aria-hidden="true"
        className="relative size-16 object-contain drop-shadow-[0_14px_26px_rgba(8,5,28,0.32)]"
        src="/assets/sheep-star-cutout.png?v=2"
      />
    </div>
  );
}

export function ListLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.07)] px-4 py-3 text-left text-sm text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.11)]"
      type="button"
      onClick={onClick}
    >
      <span>{children}</span>
      <ChevronRight aria-hidden="true" className="size-4 text-[var(--muted-foreground)]" />
    </button>
  );
}
