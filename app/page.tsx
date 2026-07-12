"use client";

import { useMemo, useState } from "react";

import { Toast } from "@/components/common/Toast";
import { BottomNav } from "@/components/navigation/BottomNav";
import { GrowthTrailPageV2 } from "@/components/pages/GrowthTrailPageV2";
import { RecordingNotesPageV2 } from "@/components/pages/RecordingNotesPageV2";
import { SettingsPageV2 } from "@/components/pages/SettingsPageV2";
import { TodayChecklistPageV2 } from "@/components/pages/TodayChecklistPageV2";
import { WeeklyReportPageV2 } from "@/components/pages/WeeklyReportPageV2";
import { RoleSwitcher } from "@/components/role/RoleSwitcher";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useCurrentRole } from "@/hooks/useCurrentRole";
import { useReports } from "@/hooks/useReports";
import { useSettings } from "@/hooks/useSettings";
import { useTasks } from "@/hooks/useTasks";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import type { AppView } from "@/lib/page-types";
import { extractTasksFromText } from "@/services/ai/taskExtraction";
import { generateWeeklyReport } from "@/services/ai/weeklyReport";
import { clearAllData } from "@/services/storage/appStorage";
import { saveReports } from "@/services/storage/reportStorage";
import { getTasks, saveTasks } from "@/services/storage/taskStorage";
import type {
  ApiProvider,
  DraftTask,
  ExtractionResult,
  Report,
  Role,
  Settings,
  Task,
} from "@/types";
import { getCurrentWeekRange, getTodayISO } from "@/utils/date";

const manualCategories: Record<Role, string[]> = {
  intern: ["项目", "会议", "文档", "学习", "其他"],
  student: ["作业", "课程", "实验", "社团", "其他"],
};
const MAX_AUDIO_UPLOAD_BYTES = 4 * 1024 * 1024;
const TRANSCRIBE_FALLBACK_ERROR =
  "语音转文字失败，你可以重试，或直接手动输入 / 粘贴会议内容。";

interface BackupData {
  settings?: Partial<Settings>;
  tasks?: Partial<Record<Role, Task[]>>;
  reports?: Report[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBackupData(value: unknown): BackupData {
  if (!isRecord(value)) {
    throw new Error("导入文件格式不正确，请选择 Internsheep 导出的 JSON 文件。");
  }

  const settings = isRecord(value.settings)
    ? (value.settings as Partial<Settings>)
    : undefined;
  const tasks = isRecord(value.tasks)
    ? {
        intern: Array.isArray(value.tasks.intern)
          ? (value.tasks.intern as Task[])
          : undefined,
        student: Array.isArray(value.tasks.student)
          ? (value.tasks.student as Task[])
          : undefined,
      }
    : undefined;
  const reports = Array.isArray(value.reports)
    ? (value.reports as Report[])
    : undefined;

  if (!settings && !tasks && !reports) {
    throw new Error("导入文件中没有可恢复的数据。");
  }

  return { reports, settings, tasks };
}

function mergeById<T extends { id: string }>(currentItems: T[], importedItems: T[]) {
  const currentIds = new Set(currentItems.map((item) => item.id));
  const newItems = importedItems.filter((item) => !currentIds.has(item.id));

  return [...currentItems, ...newItems];
}

export default function HomePage() {
  const [view, setView] = useState<AppView>("today");
  const { isReady, settings, updateSettings } = useSettings();
  const { role, switchRole: switchCurrentRole } = useCurrentRole(
    settings,
    updateSettings,
  );
  const {
    currentWeekTasks,
    deleteTask,
    overdueTasks,
    replaceTasks,
    tasks,
    tasksGroupedByDate,
    todayDoneTasks,
    todayTasks,
    todayTodoTasks,
    updateTask,
    addTask,
  } = useTasks(role, isReady);
  const { reports, saveReport } = useReports(isReady);
  const {
    canUseAudioTranscription,
    canUseTaskExtraction,
    canUseWeeklyReport,
    incrementAudioTranscription,
    incrementTaskExtraction,
    incrementWeeklyReport,
    remainingAudioTranscription,
    remainingTaskExtraction,
    remainingWeeklyReport,
  } = useUsageLimit(isReady);
  const [manualTitle, setManualTitle] = useState("");
  const [inputText, setInputText] = useState("");
  const [draftResult, setDraftResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingNotice, setRecordingNotice] = useState<string | null>(null);
  const [weeklyContent, setWeeklyContent] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isWeeklyReportSaved, setIsWeeklyReportSaved] = useState(false);
  const [weeklyReportNotice, setWeeklyReportNotice] = useState<string | null>(null);
  const {
    audioBlob,
    cancelRecording,
    elapsedSeconds: recordingElapsedSeconds,
    isRecording,
    mimeType: recordingMimeType,
    startRecording,
    stopRecording,
  } = useAudioRecorder({
    onError: setErrorMessage,
    onNotice: setRecordingNotice,
  });

  const today = getTodayISO();
  const isUsingUserApiKey = Boolean(settings.apiKey.trim());
  const { start: weekStart, end: weekEnd } = useMemo(
    () => getCurrentWeekRange(),
    [],
  );

  function switchRole(nextRole: Role) {
    void stopRecording();
    switchCurrentRole(nextRole);
    setDraftResult(null);
    setInputText("");
    setManualTitle("");
  }

  function addManualTask() {
    const title = manualTitle.trim();

    if (!title) {
      setErrorMessage("输入任务标题后再添加。");
      return;
    }

    const now = new Date().toISOString();
    addTask({
      id: crypto.randomUUID(),
      title,
      category: manualCategories[role][0],
      priority: "medium",
      status: "todo",
      dueDate: today,
      source: "manual",
      role,
      createdAt: now,
      updatedAt: now,
    });
    setManualTitle("");
    setErrorMessage(null);
  }

  async function extractTasks() {
    setErrorMessage(null);

    if (!inputText.trim()) {
      setErrorMessage("先输入或录一段内容。");
      return;
    }

    if (!isUsingUserApiKey && !canUseTaskExtraction) {
      setErrorMessage(
        "今日免费 AI 提取次数已用完。你可以在「我的设置」中配置自己的 API Key 后继续使用。",
      );
      return;
    }

    setIsExtracting(true);

    try {
      const result = await extractTasksFromText({
        text: inputText,
        role,
        settings,
      });
      setDraftResult(result);
      if (!isUsingUserApiKey) {
        incrementTaskExtraction();
      }
    } catch (error) {
      console.error("Extract tasks failed", error);
      setErrorMessage(
        error instanceof Error ? error.message : "任务提取失败，请稍后重试。",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function updateDraft(id: string, patch: Partial<DraftTask>) {
    if (!draftResult) {
      return;
    }

    setDraftResult({
      ...draftResult,
      tasks: draftResult.tasks.map((task) =>
        task.id === id ? { ...task, ...patch } : task,
      ),
    });
  }

  function addDraftTask() {
    const nextTask: DraftTask = {
      category: manualCategories[role][0],
      due: "不确定",
      dueDate: today,
      id: crypto.randomUUID(),
      priority: "low",
      selected: true,
      title: "补充任务",
    };

    setDraftResult((current) => ({
      summary: current?.summary ?? "手动补充任务草稿",
      tasks: [...(current?.tasks ?? []), nextTask],
      unextracted_note: current?.unextracted_note ?? null,
    }));
  }

  function saveSelectedDraftTasks() {
    if (!draftResult) {
      return;
    }

    const now = new Date().toISOString();
    const newTasks = draftResult.tasks
      .filter((task) => task.selected)
      .filter((task) => task.title.trim())
      .map<Task>((task) => ({
        id: crypto.randomUUID(),
        title: task.title.trim(),
        category: task.category,
        priority: task.priority,
        status: "todo",
        dueDate: task.dueDate,
        dueText: task.dueText,
        dueTime: task.dueTime,
        uncertainReason: task.uncertainReason,
        source: inputText.trim() ? "voice" : "manual",
        role,
        createdAt: now,
        updatedAt: now,
      }));

    if (!newTasks.length) {
      setErrorMessage("请至少勾选一个任务后再保存到今日清单。");
      return;
    }

    replaceTasks([...newTasks, ...tasks]);
    setDraftResult(null);
    setView("today");
  }

  async function handleGenerateWeeklyReport() {
    setErrorMessage(null);
    setWeeklyReportNotice(null);

    if (!currentWeekTasks.length) {
      setErrorMessage("本周还没有任务记录，先去录音纪要或今日清单添加一些内容吧。");
      return;
    }

    if (!isUsingUserApiKey && !canUseWeeklyReport) {
      setErrorMessage(
        "本周免费周报生成次数已用完。你可以在「我的设置」中配置自己的 API Key 后继续使用。",
      );
      return;
    }

    setIsGeneratingReport(true);

    try {
      const content = await generateWeeklyReport({
        apiKey: settings.apiKey,
        apiProvider: settings.apiProvider,
        endDate: weekEnd,
        lengthValue: settings.reportStyle.length,
        role,
        startDate: weekStart,
        tasks: currentWeekTasks,
        toneValue: settings.reportStyle.tone,
      });
      setWeeklyContent(content);
      setIsWeeklyReportSaved(false);
      setWeeklyReportNotice("周报草稿已生成，可以继续编辑。");
      if (!isUsingUserApiKey) {
        incrementWeeklyReport();
      }
    } catch (error) {
      console.error("Generate weekly report failed", error);
      setErrorMessage(
        error instanceof Error ? error.message : "周报生成失败，请稍后重试。",
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }

  function copyWeeklyReport() {
    navigator.clipboard
      .writeText(weeklyContent)
      .then(() => setWeeklyReportNotice("周报已复制。"))
      .catch((error) => {
        console.error("Copy weekly report failed", error);
        setErrorMessage("复制失败，请手动选择文本复制。");
      });
  }

  function exportMarkdown() {
    try {
      const blob = new Blob([weeklyContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `internsheep-weekly-${weekStart}-${weekEnd}.md`;
      link.click();
      URL.revokeObjectURL(url);
      setWeeklyReportNotice("Markdown 已导出。");
    } catch (error) {
      console.error("Export weekly report failed", error);
      setErrorMessage("导出 Markdown 失败，请稍后重试。");
    }
  }

  function saveWeeklyReport() {
    const content = weeklyContent.trim();

    if (!content) {
      setErrorMessage("请先生成或填写周报内容后再保存。");
      return;
    }

    saveReport({
      id: crypto.randomUUID(),
      type: "weekly",
      templateId: "workplace-weekly",
      dateRange: { start: weekStart, end: weekEnd },
      content,
      role,
      createdAt: new Date().toISOString(),
    });
    setIsWeeklyReportSaved(true);
    setWeeklyReportNotice("周报已保存到成长印记。");
  }

  function exportAllData() {
    const data = {
      settings,
      tasks: {
        intern: getTasks("intern"),
        student: getTasks("student"),
      },
      reports,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `internsheep-data-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importAllData(file: File) {
    setErrorMessage(null);

    try {
      const raw = await file.text();
      const backup = parseBackupData(JSON.parse(raw) as unknown);
      const shouldImport = window.confirm(
        "导入会合并任务和周报，不会覆盖当前浏览器中的已有数据、设置或 API Key。建议先导出当前数据备份，确认继续导入吗？",
      );

      if (!shouldImport) {
        return;
      }

      if (backup.tasks?.intern) {
        saveTasks("intern", mergeById(getTasks("intern"), backup.tasks.intern));
      }

      if (backup.tasks?.student) {
        saveTasks("student", mergeById(getTasks("student"), backup.tasks.student));
      }

      if (backup.reports) {
        saveReports(mergeById(reports, backup.reports));
      }

      window.alert("数据已合并导入，将刷新页面加载最新内容。");
      window.location.reload();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "导入失败，请确认文件是 Internsheep 导出的 JSON。",
      );
    }
  }

  function clearData() {
    if (window.confirm("确认清除所有本地数据？")) {
      clearAllData();
      window.location.reload();
    }
  }

  function cancelCurrentRecording() {
    cancelRecording();
    setDraftResult(null);
    setRecordingNotice(null);
    setErrorMessage(null);
  }

  async function stopCurrentRecording() {
    const blob = await stopRecording();

    if (blob) {
      setRecordingNotice("音频已录制。你可以点击“转写录音”，也可以继续手动输入或粘贴会议内容。");
    }
  }

  function getAudioFileName(mimeType: string | null) {
    if (mimeType?.includes("mp4")) {
      return "recording.mp4";
    }

    if (mimeType?.includes("mpeg")) {
      return "recording.mp3";
    }

    if (mimeType?.includes("wav")) {
      return "recording.wav";
    }

    if (mimeType?.includes("ogg")) {
      return "recording.ogg";
    }

    return "recording.webm";
  }

  function getTranscribeErrorMessage(params: {
    code?: string;
    message?: string;
    status?: number;
  }) {
    if (params.status === 413 || params.code === "audio-too-large") {
      return "录音文件较大，建议缩短录音或分段记录。";
    }

    if (!params.message) {
      return TRANSCRIBE_FALLBACK_ERROR;
    }

    if (
      params.code === "asr-not-configured" ||
      params.code === "tencent-not-configured" ||
      params.message.includes("暂未配置") ||
      params.message.includes("未配置完整")
    ) {
      return "语音转文字服务暂未配置，请使用手动输入。";
    }

    if (params.code === "tencent-auth-failed") {
      return "语音转文字服务鉴权失败，请联系开发者检查腾讯云密钥。";
    }

    if (params.code === "tencent-unsupported-format") {
      return "当前录音格式暂不支持转写，请尝试换用手机自带浏览器或使用手动输入。";
    }

    if (
      params.code === "tencent-bad-config" ||
      params.code === "tencent-unsupported-type"
    ) {
      return "语音转文字参数配置有误，请联系开发者检查腾讯云配置。";
    }

    return TRANSCRIBE_FALLBACK_ERROR;
  }

  async function transcribeRecordedAudio() {
    setErrorMessage(null);

    if (!audioBlob) {
      setErrorMessage("请先录制一段音频后再转写。");
      return;
    }

    if (audioBlob.size > MAX_AUDIO_UPLOAD_BYTES) {
      setErrorMessage(
        "录音文件过大，可能超过部署平台上传限制。建议长会议分段记录，或先手动输入会议内容。",
      );
      setRecordingNotice("音频仍已保留。你可以取消后重新分段录音，或直接手动输入。");
      return;
    }

    if (!canUseAudioTranscription) {
      setErrorMessage("今日免费语音转文字次数已用完。你可以直接手动输入或粘贴会议内容。");
      setRecordingNotice("音频仍已保留。你可以明天继续转写，或直接手动输入 / 粘贴会议内容。");
      return;
    }

    setIsTranscribing(true);
    setRecordingNotice("正在转写录音，请稍等…");

    try {
      const formData = new FormData();
      formData.append(
        "audio",
        audioBlob,
        getAudioFileName(recordingMimeType ?? audioBlob.type),
      );

      const response = await fetch("/api/ai/transcribe-audio", {
        body: formData,
        method: "POST",
      });
      const data = (await response.json()) as
        | { text: string }
        | { error?: { code?: string; message?: string } };

      if (!response.ok || !("text" in data)) {
        const transcribeError = "error" in data ? data.error : undefined;

        throw new Error(
          getTranscribeErrorMessage({
            code: transcribeError?.code,
            message: transcribeError?.message,
            status: response.status,
          }),
        );
      }

      setInputText((currentText) => {
        const current = currentText.trimEnd();
        const next = data.text.trim();

        return current ? `${current}\n${next}` : next;
      });
      incrementAudioTranscription();
      setRecordingNotice("录音已转写到文本框，你可以继续编辑后再提取任务。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : TRANSCRIBE_FALLBACK_ERROR,
      );
      setRecordingNotice("转写失败，音频仍已保留。你可以重试，或直接手动输入 / 粘贴会议内容。");
    } finally {
      setIsTranscribing(false);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-3 px-3 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-3 sm:gap-5 sm:px-4 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pt-5">
      <header className="sticky top-0 z-10 -mx-3 border-b border-[var(--border)] bg-[var(--background)]/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <RoleSwitcher role={role} onSwitchRole={switchRole} />
        </div>
      </header>

      <Toast message={errorMessage} />

      <section className="rounded-lg border border-[var(--border)] bg-white p-3 text-xs leading-relaxed text-[var(--muted-foreground)] sm:p-4 sm:text-sm">
        <p className="font-medium text-[var(--foreground)]">Internsheep 测试版</p>
        <p className="mt-1">
          当前为公开测试版本。数据仅保存在当前浏览器，请勿输入公司机密、个人隐私、患者信息等敏感内容。
        </p>
      </section>

      {view === "today" ? (
        <TodayChecklistPageV2
          manualTitle={manualTitle}
          overdueTasks={overdueTasks}
          role={role}
          todayDoneTasks={todayDoneTasks}
          todayTasks={todayTasks}
          todayTodoTasks={todayTodoTasks}
          onAddManualTask={addManualTask}
          onDeleteTask={deleteTask}
          onGoRecording={() => setView("recording")}
          onManualTitleChange={setManualTitle}
          onUpdateTask={updateTask}
        />
      ) : null}

      {view === "recording" ? (
        <RecordingNotesPageV2
          draftResult={draftResult}
          inputText={inputText}
          hasRecordedAudio={Boolean(audioBlob)}
          isExtracting={isExtracting}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          isUsingUserApiKey={isUsingUserApiKey}
          recordingMimeType={recordingMimeType}
          recordingElapsedSeconds={recordingElapsedSeconds}
          recordingNotice={recordingNotice}
          remainingAudioTranscription={remainingAudioTranscription}
          remainingTaskExtraction={remainingTaskExtraction}
          role={role}
          onCancelRecording={cancelCurrentRecording}
          onAddDraftTask={addDraftTask}
          onExtract={extractTasks}
          onInputTextChange={setInputText}
          onSaveSelectedDraftTasks={saveSelectedDraftTasks}
          onStartRecording={startRecording}
          onStopRecording={stopCurrentRecording}
          onTranscribeAudio={transcribeRecordedAudio}
          onUpdateDraft={updateDraft}
        />
      ) : null}

      {view === "growth" ? (
        <GrowthTrailPageV2
          reports={reports}
          tasks={tasks}
          tasksGroupedByDate={tasksGroupedByDate}
        />
      ) : null}

      {view === "weekly" ? (
        <WeeklyReportPageV2
          isGeneratingReport={isGeneratingReport}
          isWeeklyReportSaved={isWeeklyReportSaved}
          isUsingUserApiKey={isUsingUserApiKey}
          role={role}
          remainingWeeklyReport={remainingWeeklyReport}
          weekEnd={weekEnd}
          weekStart={weekStart}
          weeklyReportNotice={weeklyReportNotice}
          weeklyContent={weeklyContent}
          weekTasks={currentWeekTasks}
          onCopyWeeklyReport={copyWeeklyReport}
          onExportMarkdown={exportMarkdown}
          onGenerateWeeklyReport={handleGenerateWeeklyReport}
          onSaveWeeklyReport={saveWeeklyReport}
          onWeeklyContentChange={setWeeklyContent}
        />
      ) : null}

      {view === "settings" ? (
        <SettingsPageV2
          remainingAudioTranscription={remainingAudioTranscription}
          remainingTaskExtraction={remainingTaskExtraction}
          remainingWeeklyReport={remainingWeeklyReport}
          settings={settings}
          onApiKeyChange={(apiKey) => updateSettings({ ...settings, apiKey })}
          onClearData={clearData}
          onExportData={exportAllData}
          onImportData={importAllData}
          onLengthChange={(length) =>
            updateSettings({
              ...settings,
              reportStyle: { ...settings.reportStyle, length },
            })
          }
          onProviderChange={(apiProvider: ApiProvider) =>
            updateSettings({ ...settings, apiProvider })
          }
          onToneChange={(tone) =>
            updateSettings({
              ...settings,
              reportStyle: { ...settings.reportStyle, tone },
            })
          }
        />
      ) : null}

      <BottomNav currentView={view} onChange={setView} />
    </main>
  );
}
