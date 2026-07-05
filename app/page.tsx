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
import { useCurrentRole } from "@/hooks/useCurrentRole";
import { useLongSpeechRecognition } from "@/hooks/useLongSpeechRecognition";
import { useReports } from "@/hooks/useReports";
import { useSettings } from "@/hooks/useSettings";
import { useTasks } from "@/hooks/useTasks";
import type { AppView } from "@/lib/page-types";
import { extractTasksFromText } from "@/services/ai/taskExtraction";
import { generateWeeklyReport } from "@/services/ai/weeklyReport";
import { clearAllData } from "@/services/storage/appStorage";
import { getTasks } from "@/services/storage/taskStorage";
import type {
  ApiProvider,
  DraftTask,
  ExtractionResult,
  Role,
  Task,
} from "@/types";
import { getCurrentWeekRange, getTodayISO } from "@/utils/date";

const manualCategories: Record<Role, string[]> = {
  intern: ["项目", "会议", "文档", "学习", "其他"],
  student: ["作业", "课程", "实验", "社团", "其他"],
};

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
  const [manualTitle, setManualTitle] = useState("");
  const [inputText, setInputText] = useState("");
  const [draftResult, setDraftResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingNotice, setRecordingNotice] = useState<string | null>(null);
  const [weeklyContent, setWeeklyContent] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isWeeklyReportSaved, setIsWeeklyReportSaved] = useState(false);
  const [weeklyReportNotice, setWeeklyReportNotice] = useState<string | null>(null);
  const {
    cancelRecording,
    elapsedSeconds: recordingElapsedSeconds,
    isRecording,
    startRecording,
    stopRecording,
  } = useLongSpeechRecognition({
    onError: setErrorMessage,
    onNotice: setRecordingNotice,
    onTranscript: setInputText,
  });

  const today = getTodayISO();
  const { start: weekStart, end: weekEnd } = useMemo(
    () => getCurrentWeekRange(),
    [],
  );

  function switchRole(nextRole: Role) {
    stopRecording();
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

    setIsExtracting(true);

    try {
      const result = await extractTasksFromText({
        text: inputText,
        role,
        settings,
      });
      setDraftResult(result);
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
        dueDate: today,
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

  function clearData() {
    if (window.confirm("确认清除所有本地数据？")) {
      clearAllData();
      window.location.reload();
    }
  }

  function cancelCurrentRecording() {
    cancelRecording();
    setInputText("");
    setDraftResult(null);
    setRecordingNotice(null);
    setErrorMessage(null);
  }

  if (!isReady) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 px-4 pb-24 pt-5">
      <header className="sticky top-0 z-10 -mx-4 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <RoleSwitcher role={role} onSwitchRole={switchRole} />
        </div>
      </header>

      <Toast message={errorMessage} />

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
          isExtracting={isExtracting}
          isRecording={isRecording}
          recordingElapsedSeconds={recordingElapsedSeconds}
          recordingNotice={recordingNotice}
          role={role}
          onCancelRecording={cancelCurrentRecording}
          onAddDraftTask={addDraftTask}
          onExtract={extractTasks}
          onInputTextChange={setInputText}
          onSaveSelectedDraftTasks={saveSelectedDraftTasks}
          onStartRecording={startRecording}
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
          role={role}
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
          settings={settings}
          onApiKeyChange={(apiKey) => updateSettings({ ...settings, apiKey })}
          onClearData={clearData}
          onExportData={exportAllData}
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
