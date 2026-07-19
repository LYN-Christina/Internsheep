import {
  Archive,
  CalendarDays,
  Copy,
  Download,
  FileText,
  PackageOpen,
} from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import {
  GlassCard,
  MetricCard,
  NoticeBanner,
  PageShell,
  SectionHeader,
} from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import type { GrowthTrailPageProps } from "@/lib/page-types";
import type { Report, Task } from "@/types";
import { formatDueDisplay } from "@/utils/dueDate";

function GrowthSummaryCards({
  reports,
  tasks,
}: Pick<GrowthTrailPageProps, "reports" | "tasks">) {
  const days = new Set(tasks.map((task) => task.createdAt.slice(0, 10))).size;
  const completed = tasks.filter((task) => task.status === "done").length;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard label="累计记录天数" value={days} hint="陪你走过" />
      <MetricCard label="累计任务数" value={tasks.length} hint="被捕捉的小事" />
      <MetricCard label="已完成任务数" value={completed} hint="已经发光" />
      <MetricCard label="已生成周报数" value={reports.length} hint="阶段回望" />
    </section>
  );
}

function GrowthDayCard({ date, tasks }: { date: string; tasks: Task[] }) {
  const completed = tasks.filter((task) => task.status === "done").length;

  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.06)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">{date}</p>
        <p className="rounded-full bg-[rgba(255,255,255,0.08)] px-2 py-1 text-xs text-[var(--muted-foreground)]">
          {completed}/{tasks.length} 完成
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {tasks.slice(0, 4).map((task) => (
          <div className="min-w-0 border-l border-[var(--border)] pl-3" key={task.id}>
            <p className="truncate text-sm text-[var(--muted-foreground)]">
              {task.status === "done" ? "✓" : "·"} {task.title}
            </p>
            <p className="truncate text-xs text-[rgba(255,255,255,0.48)]">
              {formatDueDisplay(task)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function HistoryTaskSection({
  tasksGroupedByDate,
}: {
  tasksGroupedByDate: Record<string, Task[]>;
}) {
  const dates = Object.keys(tasksGroupedByDate).sort().reverse();

  return (
    <GlassCard>
      <SectionHeader
        icon={<CalendarDays aria-hidden="true" className="size-4" />}
        title="历史任务记录"
        description="按日期沉淀你的实习和学习轨迹。"
      />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dates.length ? (
          dates.map((date) => (
            <GrowthDayCard
              date={date}
              key={date}
              tasks={tasksGroupedByDate[date]}
            />
          ))
        ) : (
          <EmptyState
            description="保存今日任务后，这里会按日期沉淀你的记录。"
            title="还没有历史任务"
          />
        )}
      </div>
    </GlassCard>
  );
}

function exportReportMarkdown(report: Report) {
  const blob = new Blob([report.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `internsheep-weekly-${report.dateRange.start}-${report.dateRange.end}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportHistoryCard({ report }: { report: Report }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report.content);
      setNotice("已复制");
    } catch (error) {
      console.error("Copy report failed", error);
      setNotice("复制失败，请手动选择文本复制");
    }
  }

  function exportReport() {
    try {
      exportReportMarkdown(report);
      setNotice("Markdown 已导出");
    } catch (error) {
      console.error("Export report failed", error);
      setNotice("导出失败，请稍后重试");
    }
  }

  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.06)] p-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {report.dateRange.start} 至 {report.dateRange.end}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          角色：{report.role} · 创建：{new Date(report.createdAt).toLocaleString()}
        </p>
      </div>
      <p
        className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)] ${
          isExpanded ? "" : "line-clamp-4"
        }`}
      >
        {report.content}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => setIsExpanded((v) => !v)}>
          {isExpanded ? "收起" : "查看完整内容"}
        </Button>
        <Button type="button" variant="secondary" onClick={copyReport}>
          <Copy aria-hidden="true" className="size-4" />
          复制
        </Button>
        <Button type="button" variant="secondary" onClick={exportReport}>
          <Download aria-hidden="true" className="size-4" />
          导出 Markdown
        </Button>
        {notice ? <span className="text-xs text-[var(--muted-foreground)]">{notice}</span> : null}
      </div>
    </article>
  );
}

function HistoryReportSection({ reports }: Pick<GrowthTrailPageProps, "reports">) {
  return (
    <GlassCard>
      <SectionHeader
        icon={<FileText aria-hidden="true" className="size-4" />}
        title="历史周报"
        description="每一周的复盘都会保留在这里。"
      />
      <div className="mt-4 flex flex-col gap-3">
        {reports.length ? (
          reports.map((report) => <ReportHistoryCard key={report.id} report={report} />)
        ) : (
          <EmptyState
            description="在“本周周报”生成并保存后，历史报告会出现在这里。"
            title="还没有历史周报"
          />
        )}
      </div>
    </GlassCard>
  );
}

function InternshipSummaryPackCard() {
  return (
    <GlassCard className="border-dashed">
      <SectionHeader
        icon={<PackageOpen aria-hidden="true" className="size-4" />}
        title="实习结束总结包"
        description="汇总任务、周报和成长关键词，生成实习结束时的复盘材料。"
      />
      <NoticeBanner className="mt-4" tone="accent">
        即将上线
      </NoticeBanner>
    </GlassCard>
  );
}

export function GrowthTrailPageV2({
  reports,
  tasks,
  tasksGroupedByDate,
}: GrowthTrailPageProps) {
  return (
    <PageShell
      eyebrow="Growth archive"
      title="成长印记"
      description="这里不是普通历史记录，而是你的实习成长档案。"
      action={
        <span className="flex size-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.08)]">
          <Archive aria-hidden="true" className="size-5 text-[var(--primary)]" />
        </span>
      }
    >
      <GrowthSummaryCards reports={reports} tasks={tasks} />
      <HistoryTaskSection tasksGroupedByDate={tasksGroupedByDate} />
      <HistoryReportSection reports={reports} />
      <InternshipSummaryPackCard />
    </PageShell>
  );
}
