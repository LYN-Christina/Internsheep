import { Copy, Download, FileText, RefreshCw, Save } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import type { WeeklyReportPageProps } from "@/lib/page-types";

export function WeeklyReportPageV2({
  isGeneratingReport,
  isWeeklyReportSaved,
  isUsingUserApiKey,
  onCopyWeeklyReport,
  onExportMarkdown,
  onGenerateWeeklyReport,
  onSaveWeeklyReport,
  onWeeklyContentChange,
  role,
  remainingWeeklyReport,
  weekEnd,
  weekStart,
  weeklyContent,
  weeklyReportNotice,
  weekTasks,
}: WeeklyReportPageProps) {
  const completed = weekTasks.filter((task) => task.status === "done").length;
  const unfinished = weekTasks.length - completed;
  const usageMessage = isUsingUserApiKey
    ? "当前使用自用 API Key，不占用免费体验额度。"
    : remainingWeeklyReport > 0
      ? `免费体验：本周还可生成周报 ${remainingWeeklyReport} 次。`
      : "本周免费周报生成次数已用完。你可以在「我的设置」中配置自己的 API Key 后继续使用。";

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">本周周报</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {weekStart} 至 {weekEnd} · 当前角色：{role}
          </p>
        </div>
        <FileText aria-hidden="true" className="size-5" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-[var(--muted)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">本周任务</p>
          <p className="mt-1 text-2xl font-semibold">{weekTasks.length}</p>
        </div>
        <div className="rounded-md bg-[var(--muted)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">已完成</p>
          <p className="mt-1 text-2xl font-semibold">{completed}</p>
        </div>
        <div className="rounded-md bg-[var(--muted)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">未完成</p>
          <p className="mt-1 text-2xl font-semibold">{unfinished}</p>
        </div>
      </div>

      <p className="mt-4 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
        {usageMessage}
      </p>

      {weekTasks.length ? null : (
        <div className="mt-4">
          <EmptyState
            description="本周还没有任务记录，先去录音纪要或今日清单添加一些内容吧。"
            title="暂无可生成周报的任务"
          />
        </div>
      )}

      <Button
        className="mt-4"
        disabled={isGeneratingReport || !weekTasks.length}
        type="button"
        onClick={onGenerateWeeklyReport}
      >
        <RefreshCw
          aria-hidden="true"
          className={isGeneratingReport ? "size-4 animate-spin" : "size-4"}
        />
        {isGeneratingReport ? "生成中" : "生成本周周报"}
      </Button>

      {weeklyReportNotice ? (
        <p className="mt-3 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
          {weeklyReportNotice}
        </p>
      ) : null}

      <textarea
        className="mt-4 min-h-80 w-full rounded-md border border-[var(--border)] p-3 text-sm"
        placeholder="生成后的周报会出现在这里，也可以直接编辑后保存。"
        value={weeklyContent}
        onChange={(event) => onWeeklyContentChange(event.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={!weeklyContent}
          type="button"
          variant="secondary"
          onClick={onCopyWeeklyReport}
        >
          <Copy aria-hidden="true" className="size-4" />
          复制周报
        </Button>
        <Button
          disabled={!weeklyContent}
          type="button"
          variant="secondary"
          onClick={onExportMarkdown}
        >
          <Download aria-hidden="true" className="size-4" />
          导出 Markdown
        </Button>
        <Button
          disabled={!weeklyContent || isWeeklyReportSaved}
          type="button"
          onClick={onSaveWeeklyReport}
        >
          <Save aria-hidden="true" className="size-4" />
          {isWeeklyReportSaved ? "已保存" : "保存到成长印记"}
        </Button>
      </div>
    </section>
  );
}
