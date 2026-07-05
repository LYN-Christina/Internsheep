import { Check, Mic, MicOff, Plus, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatRecordingTime } from "@/hooks/useLongSpeechRecognition";
import type { RecordingNotesPageProps } from "@/lib/page-types";
import type { TaskPriority } from "@/types";

const categoriesByRole = {
  intern: ["项目", "会议", "文档", "学习", "其他"],
  student: ["作业", "课程", "实验", "社团", "其他"],
};

export function RecordingNotesPageV2({
  draftResult,
  inputText,
  isExtracting,
  isRecording,
  onAddDraftTask,
  onCancelRecording,
  onExtract,
  onInputTextChange,
  onSaveSelectedDraftTasks,
  onStartRecording,
  onUpdateDraft,
  recordingElapsedSeconds,
  recordingNotice,
  role,
}: RecordingNotesPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          录音会先转成文字，你也可以直接粘贴会议内容或任务安排。
        </p>
        <h2 className="mt-1 text-2xl font-semibold">录音纪要</h2>
        <textarea
          className="mt-3 min-h-40 w-full rounded-md border border-[var(--border)] p-3 text-sm"
          placeholder="转录文本会显示在这里，也可以直接输入今天的任务、会议内容或待办。"
          value={inputText}
          onChange={(event) => onInputTextChange(event.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onStartRecording}>
            {isRecording ? (
              <MicOff aria-hidden="true" className="size-4" />
            ) : (
              <Mic aria-hidden="true" className="size-4" />
            )}
            {isRecording ? "录音中" : "开始录音"}
          </Button>
          <Button
            disabled={!isRecording}
            type="button"
            variant="secondary"
            onClick={onStartRecording}
          >
            停止录音
          </Button>
          <Button
            disabled={!isRecording && !inputText}
            type="button"
            variant="ghost"
            onClick={onCancelRecording}
          >
            取消
          </Button>
          <Button disabled={isExtracting} type="button" onClick={onExtract}>
            <RefreshCw
              aria-hidden="true"
              className={isExtracting ? "size-4 animate-spin" : "size-4"}
            />
            {isExtracting ? "提取中" : "提取任务"}
          </Button>
        </div>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          录音时长 {formatRecordingTime(recordingElapsedSeconds)} / 30:00
        </p>
        {recordingNotice ? (
          <p className="mt-3 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
            {recordingNotice}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">AI 提取草稿</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              AI 只生成草稿，你确认后才会保存到今日清单。
            </p>
          </div>
          {draftResult ? (
            <Button size="sm" type="button" onClick={onSaveSelectedDraftTasks}>
              <Check aria-hidden="true" className="size-4" />
              保存到今日清单
            </Button>
          ) : null}
        </div>

        {draftResult ? (
          <div className="mt-3 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">提取摘要</p>
            <p className="mt-1">{draftResult.summary}</p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3">
          {draftResult?.tasks.length ? (
            <>
              {draftResult.tasks.map((task) => (
                <article
                  className="rounded-md border border-[var(--border)] p-3"
                  key={task.id}
                >
                  <div className="flex items-center gap-2">
                    <input
                      checked={task.selected}
                      type="checkbox"
                      onChange={(event) =>
                        onUpdateDraft(task.id, { selected: event.target.checked })
                      }
                    />
                    <input
                      className="min-w-0 flex-1 rounded border border-[var(--border)] px-2 py-1 text-sm"
                      value={task.title}
                      onChange={(event) =>
                        onUpdateDraft(task.id, { title: event.target.value })
                      }
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      className="h-9 rounded border border-[var(--border)] px-2 text-sm"
                      value={task.category}
                      onChange={(event) =>
                        onUpdateDraft(task.id, { category: event.target.value })
                      }
                    >
                      {categoriesByRole[role].map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-9 rounded border border-[var(--border)] px-2 text-sm"
                      value={task.priority}
                      onChange={(event) =>
                        onUpdateDraft(task.id, {
                          priority: event.target.value as TaskPriority,
                        })
                      }
                    >
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                </article>
              ))}
              <Button type="button" variant="secondary" onClick={onAddDraftTask}>
                <Plus aria-hidden="true" className="size-4" />
                添加遗漏任务
              </Button>
            </>
          ) : (
            <EmptyState
              description="录音或输入文字后点击“提取任务”，这里会展示可编辑草稿。"
              title="还没有提取结果"
            />
          )}
        </div>
        {draftResult?.unextracted_note ? (
          <p className="mt-3 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
            未提取说明：{draftResult.unextracted_note}
          </p>
        ) : null}
      </section>
    </div>
  );
}
