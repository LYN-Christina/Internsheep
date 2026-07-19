import { Check, Mic, MicOff, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import {
  GlassCard,
  GlassInput,
  GlassSelect,
  GlassTextarea,
  MetricCard,
  NoticeBanner,
  PageShell,
  SectionHeader,
} from "@/components/ui/app-shell";
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
  autoTranscribedCount,
  canClearInput,
  currentTranscribingSegment,
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
    ? `当前使用自用 API Key，AI 提取不占用免费额度。手动补转今日还可用 ${remainingAudioTranscription} 次。`
    : `免费体验：手动补转今日还可用 ${remainingAudioTranscription} 次，AI 提取今日还可用 ${remainingTaskExtraction} 次。`;
  const needsFormatConversion = recordingMimeType
    ? shouldConvertToTencentWav(recordingMimeType)
    : false;
  const isWebmRecording = recordingMimeType?.includes("webm") ?? false;

  return (
    <PageShell
      eyebrow="Voice memo"
      title="录音纪要"
      description="把会议、站会和灵感先收进夜空里，再由 AI 提取成可编辑的任务草稿。"
    >
      <GlassCard className="relative overflow-hidden">
        <div className="absolute left-1/2 top-8 size-52 -translate-x-1/2 rounded-full bg-[rgba(231,214,238,0.1)] blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <div
            className={`relative flex size-44 items-center justify-center rounded-full border border-[rgba(231,214,238,0.22)] bg-[radial-gradient(circle,rgba(231,214,238,0.22),rgba(255,255,255,0.05)_58%,rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(8,5,28,0.42)] ${
              isRecording ? "animate-[soft-pulse_2.4s_ease-in-out_infinite]" : ""
            }`}
          >
            <div className="absolute inset-4 rounded-full border border-dashed border-[rgba(231,214,238,0.26)]" />
            <button
              aria-label={isRecording ? "停止录音" : "开始录音"}
              className="relative flex size-24 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_44px_rgba(231,214,238,0.32)] transition active:scale-95 disabled:opacity-50"
              disabled={isTranscribing}
              type="button"
              onClick={isRecording ? onStopRecording : onStartRecording}
            >
              {isRecording ? (
                <MicOff aria-hidden="true" className="size-9" />
              ) : (
                <Mic aria-hidden="true" className="size-9" />
              )}
            </button>
          </div>
          <p className="mt-4 text-4xl font-semibold tracking-normal text-[var(--foreground)]">
            {formatRecordingTime(recordingElapsedSeconds)}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {isRecording
              ? currentTranscribingSegment
                ? `正在转写第 ${currentTranscribingSegment} 段...`
                : "正在录音，系统会每 30 秒自动转写一段。"
              : autoTranscribedCount > 0
                ? `已自动转写 ${autoTranscribedCount} 段。`
                : "单次最长 5 分钟，长会议建议分段记录。"}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            disabled={isRecording || isTranscribing}
            type="button"
            variant="secondary"
            onClick={onStartRecording}
          >
            <Mic aria-hidden="true" className="size-4" />
            开始
          </Button>
          <Button
            disabled={!isRecording}
            type="button"
            variant="secondary"
            onClick={onStopRecording}
          >
            <MicOff aria-hidden="true" className="size-4" />
            停止
          </Button>
          <Button disabled={!canClearInput} type="button" variant="ghost" onClick={onClearInput}>
            <Trash2 aria-hidden="true" className="size-4" />
            清空
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
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          title="转录文本"
          description="你可以直接编辑，也可以粘贴会议记录，再提取任务草稿。"
          action={
            <Button disabled={isExtracting} type="button" onClick={onExtract}>
              <RefreshCw
                aria-hidden="true"
                className={isExtracting ? "size-4 animate-spin" : "size-4"}
              />
              {isExtracting ? "提取中" : "提取任务"}
            </Button>
          }
        />
        <GlassTextarea
          className="mt-4 min-h-44"
          placeholder="转录文本会显示在这里，也可以直接输入今天的任务、会议内容或待办。"
          value={inputText}
          onChange={(event) => onInputTextChange(event.target.value)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetricCard label="录音时长" value={formatRecordingTime(recordingElapsedSeconds)} />
          <MetricCard label="自动转写" value={`${autoTranscribedCount} 段`} />
        </div>
        <NoticeBanner className="mt-3">{usageMessage}</NoticeBanner>
        {hasRecordedAudio ? (
          <NoticeBanner className="mt-3" tone="accent">
            音频已录制{recordingMimeType ? `：${recordingMimeType}` : ""}，可点击“转写录音”补转或重试。
            {needsFormatConversion
              ? " 当前格式会在转写前转换为 WAV，建议按 1-2 分钟分段。"
              : ""}
            {isWebmRecording ? " 当前 WebM 格式会先转换后再提交识别。" : ""}
          </NoticeBanner>
        ) : null}
        {recordingNotice ? (
          <NoticeBanner className="mt-3" tone="success">
            {recordingNotice}
          </NoticeBanner>
        ) : null}
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Sparkles aria-hidden="true" className="size-4" />}
          title="AI 提取草稿"
          description="AI 只生成草稿。你确认、编辑、勾选后，才会保存到今日清单。"
          action={
            draftResult ? (
              <Button size="sm" type="button" onClick={onSaveSelectedDraftTasks}>
                <Check aria-hidden="true" className="size-4" />
                保存到今日清单
              </Button>
            ) : null
          }
        />

        {draftResult ? (
          <NoticeBanner className="mt-4" tone="accent">
            <p className="font-semibold text-[var(--foreground)]">提取摘要</p>
            <p className="mt-1">{draftResult.summary}</p>
          </NoticeBanner>
        ) : null}

        <div className="mt-4 flex flex-col gap-3">
          {draftResult?.tasks.length ? (
            <>
              {draftResult.tasks.map((task) => (
                <article
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.06)] p-3"
                  key={task.id}
                >
                  <div className="flex items-center gap-2">
                    <input
                      checked={task.selected}
                      className="size-4 accent-[#e7d6ee]"
                      type="checkbox"
                      onChange={(event) =>
                        onUpdateDraft(task.id, { selected: event.target.checked })
                      }
                    />
                    <GlassInput
                      className="h-10"
                      value={task.title}
                      onChange={(event) =>
                        onUpdateDraft(task.id, { title: event.target.value })
                      }
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <GlassSelect
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
                    </GlassSelect>
                    <GlassSelect
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
                    </GlassSelect>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div>
                      <p className="mb-1 text-xs text-[var(--muted-foreground)]">
                        截止时间
                      </p>
                      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(5.75rem,0.75fr)] gap-2">
                        <GlassInput
                          aria-label="截止日期"
                          type="date"
                          value={task.dueDate ?? ""}
                          onChange={(event) =>
                            onUpdateDraft(task.id, {
                              dueDate: event.target.value || undefined,
                            })
                          }
                        />
                        <GlassInput
                          aria-label="截止时间"
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
                    <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                      原始时间描述
                      <GlassInput
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
                      <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                        时间识别提示：{task.uncertainReason}
                      </p>
                    ) : null
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
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
          <NoticeBanner className="mt-3">未提取说明：{draftResult.unextracted_note}</NoticeBanner>
        ) : null}
      </GlassCard>
    </PageShell>
  );
}
