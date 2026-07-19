import { Copy, Download, FileText, RefreshCw, Save } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import {
  GlassCard,
  GlassTextarea,
  MetricCard,
  NoticeBanner,
  PageShell,
  SectionHeader,
} from "@/components/ui/app-shell";
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
      : "本周免费周报生成次数已用完。你可以在“我的设置”中配置自己的 API Key 后继续使用。";

  return (
    <PageShell
      eyebrow="Weekly report"
      title="本周周报"
      description={`${weekStart} 至 ${weekEnd} · 当前角色：${role}`}
      action={
        <span className="flex size-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.08)]">
          <FileText aria-hidden="true" className="size-5 text-[var(--primary)]" />
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard label="本周任务" value={weekTasks.length} />
        <MetricCard label="已完成" value={completed} />
        <MetricCard label="未完成" value={unfinished} />
      </div>

      <GlassCard>
        <SectionHeader
          title="可生成周报的任务"
          description="周报会使用当前角色、本周任务和完成状态生成，你仍然可以在下方继续编辑。"
          action={
            <Button
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
          }
        />
        <NoticeBanner className="mt-4">{usageMessage}</NoticeBanner>

        {weekTasks.length ? (
          <div className="mt-4 grid gap-2">
            {weekTasks.slice(0, 5).map((task) => (
              <div
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[rgba(255,255,255,0.055)] px-3 py-2 text-sm text-[var(--muted-foreground)]"
                key={task.id}
              >
                <span className="text-[var(--foreground)]">{task.title}</span>
                <span className="ml-2 text-xs text-[rgba(255,255,255,0.46)]">
                  {task.status === "done" ? "已完成" : "未完成"}
                </span>
              </div>
            ))}
            {weekTasks.length > 5 ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                还有 {weekTasks.length - 5} 条任务会一起参与生成。
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              description="本周还没有任务记录，先去录音纪要或今日清单添加一些内容吧。"
              title="暂无可生成周报的任务"
            />
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <SectionHeader
          title="周报内容编辑区"
          description="生成后的内容会出现在这里，也可以直接书写、修改后保存。"
        />
        {weeklyReportNotice ? (
          <NoticeBanner className="mt-4" tone="success">
            {weeklyReportNotice}
          </NoticeBanner>
        ) : null}
        <GlassTextarea
          className="mt-4 min-h-96 bg-[rgba(12,8,38,0.28)] text-[15px] leading-7"
          placeholder="生成后的周报会出现在这里，也可以直接编辑后保存。"
          value={weeklyContent}
          onChange={(event) => onWeeklyContentChange(event.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-2">
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
      </GlassCard>
    </PageShell>
  );
}
