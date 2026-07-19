import {
  CalendarClock,
  Check,
  ClipboardList,
  Plus,
  Radio,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import {
  CompanionMark,
  GlassCard,
  GlassInput,
  MetricCard,
  NoticeBanner,
  PageShell,
  SectionHeader,
} from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import type { TodayChecklistPageProps } from "@/lib/page-types";
import type { Task } from "@/types";
import { getTodayISO } from "@/utils/date";
import { formatDueDisplay } from "@/utils/dueDate";

const roleDescriptions = {
  intern: "记录实习任务，晚上回看今天完成了什么。",
  student: "整理学习任务，把课程、作业和项目分开处理。",
};

const priorityLabels = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

function formatOriginalDate(date?: string) {
  if (!date) {
    return "未设置日期";
  }

  const today = getTodayISO();
  const current = new Date(`${today}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);
  const diffDays = Math.round(
    (current.getTime() - target.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 1) {
    return "昨天";
  }

  if (diffDays === 2) {
    return "前天";
  }

  return date;
}

function TaskCard({
  task,
  variant = "default",
  onContinueToday,
  onDeleteTask,
  onUpdateTask,
}: {
  task: Task;
  variant?: "default" | "overdue" | "done";
  onContinueToday?: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
}) {
  const isDone = task.status === "done";

  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.065)] p-3 shadow-[0_10px_26px_rgba(8,5,28,0.18)]">
      <div className="flex items-start gap-3">
        <button
          aria-label={isDone ? "标记为待办" : "标记为完成"}
          className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border transition ${
            isDone
              ? "border-[rgba(168,240,210,0.6)] bg-[rgba(168,240,210,0.18)] text-[var(--success)]"
              : "border-[var(--border-strong)] bg-[rgba(255,255,255,0.06)] text-transparent"
          }`}
          type="button"
          onClick={() =>
            onUpdateTask(task.id, {
              status: isDone ? "todo" : "done",
            })
          }
        >
          <Check aria-hidden="true" className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          {variant === "overdue" ? (
            <p className="mb-1 text-xs text-[var(--warning)]">
              原日期：{formatOriginalDate(task.dueDate)}
            </p>
          ) : null}
          <input
            className={`w-full rounded-[10px] border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold leading-6 text-[var(--foreground)] outline-none transition focus:border-[var(--border)] focus:bg-[rgba(255,255,255,0.08)] ${
              isDone ? "text-[var(--muted-foreground)] line-through" : ""
            }`}
            value={task.title}
            onChange={(event) => onUpdateTask(task.id, { title: event.target.value })}
          />
          <div className="mt-1 flex flex-wrap gap-1.5 px-1 text-[11px] text-[var(--muted-foreground)]">
            <span className="rounded-full bg-[rgba(255,255,255,0.07)] px-2 py-1">
              {task.category}
            </span>
            <span className="rounded-full bg-[rgba(255,255,255,0.07)] px-2 py-1">
              {priorityLabels[task.priority]}
            </span>
            <span className="rounded-full bg-[rgba(255,255,255,0.07)] px-2 py-1">
              {formatDueDisplay(task)}
            </span>
          </div>
        </div>
        <Button
          aria-label="删除任务"
          className="size-9 shrink-0 text-[var(--muted-foreground)]"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => onDeleteTask(task.id)}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {variant === "overdue" ? (
        <div className="mt-3 flex flex-wrap gap-2 pl-9">
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => onUpdateTask(task.id, { status: "done" })}
          >
            <Check aria-hidden="true" className="size-4" />
            完成
          </Button>
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => onContinueToday?.(task)}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            今天继续
          </Button>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => onUpdateTask(task.id, { status: "dropped" })}
          >
            放弃
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function TodayChecklistPageV2({
  manualTitle,
  onAddManualTask,
  onDeleteTask,
  onGoRecording,
  onManualTitleChange,
  onUpdateTask,
  overdueTasks,
  role,
  todayDoneTasks,
  todayTasks,
  todayTodoTasks,
}: TodayChecklistPageProps) {
  function continueToday(task: Task) {
    onUpdateTask(task.id, {
      dueDate: getTodayISO(),
      dueText: "今天继续",
      dueTime: undefined,
      uncertainReason: undefined,
      note: task.note ? `${task.note}\n从较早日期顺延。` : "从较早日期顺延。",
    });
  }

  return (
    <PageShell
      eyebrow="Today dashboard"
      title="今日清单"
      description={roleDescriptions[role]}
      action={<CompanionMark />}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard label="今日任务" value={todayTasks.length} hint="星图节点" />
        <MetricCard label="待办" value={todayTodoTasks.length} hint="等你认领" />
        <MetricCard label="已完成" value={todayDoneTasks.length} hint="微光沉淀" />
      </div>

      <GlassCard>
        <SectionHeader
          icon={<Plus aria-hidden="true" className="size-4" />}
          title="手动添加任务"
          description="先写下一件明确的小事，之后可以在清单里继续编辑。"
        />
        <div className="mt-4 flex items-center gap-2">
          <GlassInput
            className="min-w-0 flex-1"
            id="manual-task"
            placeholder="例如：整理竞品分析初稿"
            value={manualTitle}
            onChange={(event) => onManualTitleChange(event.target.value)}
          />
          <Button className="min-h-11 shrink-0 px-5" type="button" onClick={onAddManualTask}>
            <Plus aria-hidden="true" className="size-4" />
            添加
          </Button>
        </div>
      </GlassCard>

      <Button className="min-h-12 w-full" type="button" variant="secondary" onClick={onGoRecording}>
        <Radio aria-hidden="true" className="size-4" />
        去录音纪要，让 AI 帮我拆任务
      </Button>

      {overdueTasks.length ? (
        <GlassCard>
          <SectionHeader
            icon={<CalendarClock aria-hidden="true" className="size-4" />}
            title="逾期未完成"
            description="之前的小任务还在星图边缘，可以继续推进，也可以温柔放下。"
          />
          <div className="mt-4 flex flex-col gap-2">
            {overdueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant="overdue"
                onContinueToday={continueToday}
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
              />
            ))}
          </div>
        </GlassCard>
      ) : null}

      <GlassCard>
        <SectionHeader
          icon={<ClipboardList aria-hidden="true" className="size-4" />}
          title="今日待办"
        />
        <div className="mt-4 flex flex-col gap-2">
          {todayTodoTasks.length ? (
            todayTodoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
              />
            ))
          ) : (
            <EmptyState
              action={
                <Button type="button" variant="secondary" onClick={onGoRecording}>
                  去录音或输入
                </Button>
              }
              description="可以手动添加，也可以去录音纪要里让 AI 帮你提取。"
              title="今天还没有待办"
            />
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="今日已完成" />
        <div className="mt-4 flex flex-col gap-2">
          {todayDoneTasks.length ? (
            todayDoneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant="done"
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
              />
            ))
          ) : (
            <NoticeBanner>完成任务后，它们会出现在这里，像今晚多出来的几颗星。</NoticeBanner>
          )}
        </div>
      </GlassCard>
    </PageShell>
  );
}
