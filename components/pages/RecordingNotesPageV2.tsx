import { Check, Mic, MicOff, Plus, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatRecordingTime } from "@/hooks/useAudioRecorder";
import type { RecordingNotesPageProps } from "@/lib/page-types";
import type { TaskPriority } from "@/types";
import { shouldConvertToTencentWav } from "@/utils/audioTranscode";

const categoriesByRole = {
  intern: ["项目", "会议", "文档", "学习", "其他"],
  student: ["作业", "课程", "实验", "社团", "其他"],
};

export function RecordingNotesPageV2({
  canClearInput,
  draftResult,
  inputText,
  isExtracting,
  isRecording,
  isTranscribing,
  isUsingUserApiKey,
  hasRecordedAudio,
  onAddDraftTask,
  onClearInput,
  onExtract,
  onInputTextChange,
  onSaveSelectedDraftTasks,
  onStartRecording,
  onStopRecording,
  onTranscribeAudio,
  onUpdateDraft,
  recordingMimeType,
  recordingElapsedSeconds,
  recordingNotice,
  remainingAudioTranscription,
  remainingTaskExtraction,
  role,
}: RecordingNotesPageProps) {
  const usageMessage = isUsingUserApiKey
    ? `当前使用自用 API Key，AI 提取不占用免费额度。语音转文字今日还可用 ${remainingAudioTranscription} 次。`
    : `免费体验：语音转文字今日还可用 ${remainingAudioTranscription} 次；AI 提取今日还可用 ${remainingTaskExtraction} 次。`;
  const needsFormatConversion = recordingMimeType
    ? shouldConvertToTencentWav(recordingMimeType)
    : false;
  const isWebmRecording = recordingMimeType?.includes("webm") ?? false;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <section className="rounded-lg border border-[var(--border)] bg-white p-3 sm:p-4">
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
          录音会先保存为音频，停止后再转成文字。测试版单次最长支持 10 分钟，长会议建议分段记录。
        </p>
        <h2 className="mt-1 text-xl font-semibold sm:text-2xl">录音纪要</h2>
        <p className="mt-2 rounded-md bg-[var(--muted)] p-2.5 text-xs leading-relaxed text-[var(--muted-foreground)] sm:p-3 sm:text-sm">
          如果转写失败，也可以直接手动输入或粘贴会议内容。
        </p>
        <textarea
          className="mt-3 min-h-36 w-full rounded-md border border-[var(--border)] p-3 text-sm sm:min-h-40"
          placeholder="转录文本会显示在这里，也可以直接输入今天的任务、会议内容或待办。"
          value={inputText}
          onChange={(event) => onInputTextChange(event.target.value)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            disabled={isRecording || isTranscribing}
            type="button"
            variant="secondary"
            onClick={onStartRecording}
          >
            <Mic aria-hidden="true" className="size-4" />
            开始录音
          </Button>
          <Button
            disabled={!isRecording}
            type="button"
            variant="secondary"
            onClick={onStopRecording}
          >
            <MicOff aria-hidden="true" className="size-4" />
            停止录音
          </Button>
          <Button
            disabled={!canClearInput}
            type="button"
            variant="ghost"
            onClick={onClearInput}
          >
            <span className="sm:hidden">清空</span>
            <span className="hidden sm:inline">清空输入</span>
          </Button>
          <Button
            disabled={!hasRecordedAudio || isRecording || isTranscribing}
            type="button"
            variant="secondary"
            onClick={onTranscribeAudio}
          >
            <RefreshCw
              aria-hidden="true"
              className={isTranscribing ? "size-4 animate-spin" : "size-4"}
            />
            {isTranscribing ? "转写中" : "转写录音"}
          </Button>
          <Button className="col-span-2 sm:col-span-1" disabled={isExtracting} type="button" onClick={onExtract}>
            <RefreshCw
              aria-hidden="true"
              className={isExtracting ? "size-4 animate-spin" : "size-4"}
            />
            {isExtracting ? "提取中" : "提取任务"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-[var(--muted-foreground)] sm:text-sm">
          录音时长 {formatRecordingTime(recordingElapsedSeconds)} / 10:00
        </p>
        {hasRecordedAudio ? (
          <p className="mt-2 text-xs text-[var(--muted-foreground)] sm:text-sm">
            音频已录制{recordingMimeType ? `（${recordingMimeType}）` : ""}，可点击“转写录音”。长会议建议分段记录。
            {needsFormatConversion
              ? " 当前格式会在转写前转换为 WAV，转换后文件会变大，建议按 1-2 分钟分段。"
              : ""}
            {isWebmRecording
              ? " 当前格式可能不被腾讯云极速识别支持，转写失败时请改用手动输入或换手机自带浏览器。"
              : ""}
          </p>
        ) : null}
        {isTranscribing ? (
          <p className="mt-2 text-xs text-[var(--muted-foreground)] sm:text-sm">
            正在转写录音，请稍等…
          </p>
        ) : null}
        <p className="mt-3 rounded-md bg-[var(--muted)] p-2.5 text-xs leading-relaxed text-[var(--muted-foreground)] sm:p-3 sm:text-sm">
          {usageMessage}
        </p>
        {recordingNotice ? (
          <p className="mt-3 rounded-md bg-[var(--muted)] p-2.5 text-xs leading-relaxed text-[var(--muted-foreground)] sm:p-3 sm:text-sm">
            {recordingNotice}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">AI 提取草稿</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
              AI 只生成草稿，你确认后才会保存到今日清单。
            </p>
          </div>
          {draftResult ? (
            <Button className="w-full sm:w-auto" size="sm" type="button" onClick={onSaveSelectedDraftTasks}>
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
                  className="rounded-md border border-[var(--border)] p-2.5 sm:p-3"
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
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                      <span>截止时间</span>
                      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(5.75rem,0.75fr)] gap-2">
                        <input
                          aria-label="截止日期"
                          className="h-9 min-w-0 rounded border border-[var(--border)] px-2 text-sm text-[var(--foreground)]"
                          type="date"
                          value={task.dueDate ?? ""}
                          onChange={(event) =>
                            onUpdateDraft(task.id, {
                              dueDate: event.target.value || undefined,
                            })
                          }
                        />
                        <input
                          aria-label="截止时间"
                          className="h-9 min-w-0 rounded border border-[var(--border)] px-2 text-sm text-[var(--foreground)]"
                          type="time"
                          value={task.dueTime ?? ""}
                          onChange={(event) =>
                            onUpdateDraft(task.id, {
                              dueTime: event.target.value || undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                    <label className="flex flex-col gap-1 text-[11px] text-[var(--muted-foreground)]">
                      原始时间描述
                      <input
                        className="h-9 rounded border border-[var(--border)] px-2 text-sm text-[var(--foreground)]"
                        placeholder="例如 周一下午5点"
                        value={task.dueText ?? ""}
                        onChange={(event) =>
                          onUpdateDraft(task.id, {
                            due: event.target.value || "不确定",
                            dueText: event.target.value || undefined,
                          })
                        }
                      />
                    </label>
                  </div>
                  {task.dueDate || task.dueTime || task.dueText ? (
                    task.uncertainReason ? (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted-foreground)] opacity-80">
                        时间识别提示：{task.uncertainReason}
                      </p>
                    ) : null
                  ) : (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted-foreground)] opacity-80">
                      未识别到明确截止时间，可手动补充。
                    </p>
                  )}
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
