import { Check, CalendarClock, Plus, Radio, RotateCcw, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
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
  return (
    <article
      className={`rounded-md border p-2.5 sm:p-3 ${
        variant === "overdue"
          ? "border-orange-200 bg-orange-50/60"
          : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <input
          checked={task.status === "done"}
          className="mt-2 size-4 shrink-0"
          type="checkbox"
          onChange={(event) =>
            onUpdateTask(task.id, {
              status: event.target.checked ? "done" : "todo",
            })
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {variant === "overdue" ? (
                <p className="mb-0.5 text-xs text-orange-700">
                  原日期：{formatOriginalDate(task.dueDate)}
                </p>
              ) : null}
              <input
                className={`w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium leading-6 focus:border-[var(--border)] ${
                  task.status === "done"
                    ? "line-through text-[var(--muted-foreground)]"
                    : ""
                }`}
                value={task.title}
                onChange={(event) => onUpdateTask(task.id, { title: event.target.value })}
              />
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
          <div className="mt-0.5 px-1">
            <p className="text-xs leading-5 text-[var(--muted-foreground)]">
              {task.category} · {priorityLabels[task.priority]}
            </p>
            <p className="text-xs leading-5 text-[var(--muted-foreground)]">
              {formatDueDisplay(task)}
            </p>
          </div>
        </div>
      </div>
      {variant === "overdue" ? (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-6 sm:mt-3 sm:gap-2">
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
              variant="secondary"
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
    <div className="flex flex-col gap-3 sm:gap-4">
      <section className="rounded-lg border border-[var(--border)] bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
              {roleDescriptions[role]}
            </p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">今日清单</h2>
          </div>
          <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={onGoRecording}>
            <Radio aria-hidden="true" className="size-4" />
            去录音纪要
          </Button>
        </div>
        <p className="mt-3 rounded-md bg-[var(--muted)] px-3 py-2 text-xs text-[var(--muted-foreground)] sm:hidden">
          今日任务 {todayTasks.length} · 待办 {todayTodoTasks.length} · 已完成{" "}
          {todayDoneTasks.length}
        </p>
        <div className="mt-4 hidden grid-cols-3 gap-3 sm:grid">
          <div className="rounded-md bg-[var(--muted)] p-3">
            <p className="text-xs text-[var(--muted-foreground)]">今日任务</p>
            <p className="mt-1 text-2xl font-semibold">{todayTasks.length}</p>
          </div>
          <div className="rounded-md bg-[var(--muted)] p-3">
            <p className="text-xs text-[var(--muted-foreground)]">待办</p>
            <p className="mt-1 text-2xl font-semibold">{todayTodoTasks.length}</p>
          </div>
          <div className="rounded-md bg-[var(--muted)] p-3">
            <p className="text-xs text-[var(--muted-foreground)]">已完成</p>
            <p className="mt-1 text-2xl font-semibold">{todayDoneTasks.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-3 sm:p-4">
        <label className="text-sm font-medium" htmlFor="manual-task">
          手动添加任务
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="h-10 min-w-0 flex-1 rounded-md border border-[var(--border)] px-3 text-sm"
            id="manual-task"
            placeholder="例如：整理竞品分析初稿"
            value={manualTitle}
            onChange={(event) => onManualTitleChange(event.target.value)}
          />
          <Button className="min-h-10" type="button" onClick={onAddManualTask}>
            <Plus aria-hidden="true" className="size-4" />
            添加
          </Button>
        </div>
      </section>

      {overdueTasks.length ? (
        <section className="rounded-lg border border-orange-200 bg-orange-50/40 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <CalendarClock aria-hidden="true" className="size-5 text-orange-700" />
            <h3 className="text-base font-semibold">逾期未完成</h3>
          </div>
          <p className="mt-1 text-sm text-orange-800">
            还有一些之前的任务没有收尾，可以继续完成或标记为放弃。
          </p>
          <div className="mt-3 flex flex-col gap-2">
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
        </section>
      ) : null}

      <section className="rounded-lg border border-[var(--border)] bg-white p-3 sm:p-4">
        <h3 className="text-base font-semibold">今日待办</h3>
        <div className="mt-3 flex flex-col gap-2">
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
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-3 sm:p-4">
        <h3 className="text-base font-semibold">今日已完成</h3>
        <div className="mt-3 flex flex-col gap-2">
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
            <p className="text-sm text-[var(--muted-foreground)]">
              完成任务后会出现在这里。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
