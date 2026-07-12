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
      {[
        ["累计记录天数", days],
        ["累计任务数", tasks.length],
        ["已完成任务数", completed],
        ["已生成周报数", reports.length],
      ].map(([label, value]) => (
        <div
          className="rounded-lg border border-[var(--border)] bg-white p-4"
          key={label}
        >
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </section>
  );
}

function GrowthDayCard({ date, tasks }: { date: string; tasks: Task[] }) {
  const completed = tasks.filter((task) => task.status === "done").length;

  return (
    <article className="rounded-md border border-[var(--border)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{date}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {completed}/{tasks.length} 完成
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {tasks.slice(0, 4).map((task) => (
          <div className="min-w-0" key={task.id}>
            <p className="truncate text-sm text-[var(--muted-foreground)]">
              {task.status === "done" ? "✓" : "·"} {task.title}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
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
    <section className="rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-2">
        <CalendarDays aria-hidden="true" className="size-5" />
        <h2 className="text-base font-semibold">历史任务记录</h2>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            description="保存今日任务后，这里会按日期沉淀你的实习记录。"
            title="还没有历史任务"
          />
        )}
      </div>
    </section>
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
    <article className="rounded-md border border-[var(--border)] p-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {report.dateRange.start} 至 {report.dateRange.end}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          角色：{report.role} · 创建：{new Date(report.createdAt).toLocaleString()}
        </p>
      </div>
      <p
        className={`mt-2 whitespace-pre-wrap text-sm text-[var(--muted-foreground)] ${
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
        {notice ? (
          <span className="text-xs text-[var(--muted-foreground)]">{notice}</span>
        ) : null}
      </div>
    </article>
  );
}

function HistoryReportSection({ reports }: Pick<GrowthTrailPageProps, "reports">) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-2">
        <FileText aria-hidden="true" className="size-5" />
        <h2 className="text-base font-semibold">历史周报</h2>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {reports.length ? (
          reports.map((report) => (
            <ReportHistoryCard key={report.id} report={report} />
          ))
        ) : (
          <EmptyState
            description="在“本周周报”生成并保存后，历史报告会出现在这里。"
            title="还没有历史周报"
          />
        )}
      </div>
    </section>
  );
}

function InternshipSummaryPackCard() {
  return (
    <section className="rounded-lg border border-dashed border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-2">
        <PackageOpen aria-hidden="true" className="size-5" />
        <h2 className="text-base font-semibold">实习结束总结包</h2>
      </div>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        汇总任务、周报和成长关键词，生成实习结束时的复盘材料。
      </p>
      <span className="mt-3 inline-flex rounded-md bg-[var(--muted)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
        即将上线
      </span>
    </section>
  );
}

export function GrowthTrailPageV2({
  reports,
  tasks,
  tasksGroupedByDate,
}: GrowthTrailPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="flex items-center gap-2">
          <Archive aria-hidden="true" className="size-5" />
          <h1 className="text-2xl font-semibold">成长印记</h1>
        </div>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          这里不是普通历史记录，而是你的实习成长档案。
        </p>
      </section>
      <GrowthSummaryCards reports={reports} tasks={tasks} />
      <HistoryTaskSection tasksGroupedByDate={tasksGroupedByDate} />
      <HistoryReportSection reports={reports} />
      <InternshipSummaryPackCard />
    </div>
  );
}
