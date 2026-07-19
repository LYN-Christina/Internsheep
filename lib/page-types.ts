import type {
  ApiProvider,
  DraftTask,
  ExtractionResult,
  Report,
  Role,
  Settings,
  Task,
} from "@/types";

export type AppView = "today" | "recording" | "growth" | "weekly" | "settings";

export interface TodayChecklistPageProps {
  role: Role;
  overdueTasks: Task[];
  todayDoneTasks: Task[];
  todayTasks: Task[];
  todayTodoTasks: Task[];
  manualTitle: string;
  onManualTitleChange: (value: string) => void;
  onAddManualTask: () => void;
  onGoRecording: () => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export interface RecordingNotesPageProps {
  role: Role;
  inputText: string;
  draftResult: ExtractionResult | null;
  isExtracting: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  autoTranscribedCount: number;
  currentTranscribingSegment: number | null;
  hasRecordedAudio: boolean;
  recordingMimeType: string | null;
  recordingElapsedSeconds: number;
  recordingNotice: string | null;
  isUsingUserApiKey: boolean;
  remainingAudioTranscription: number;
  remainingTaskExtraction: number;
  canClearInput: boolean;
  onClearInput: () => void;
  onAddDraftTask: () => void;
  onInputTextChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTranscribeAudio: () => void;
  onExtract: () => void;
  onUpdateDraft: (id: string, patch: Partial<DraftTask>) => void;
  onSaveSelectedDraftTasks: () => void;
}

export interface GrowthTrailPageProps {
  tasks: Task[];
  reports: Report[];
  tasksGroupedByDate: Record<string, Task[]>;
}

export interface WeeklyReportPageProps {
  role: Role;
  weekStart: string;
  weekEnd: string;
  weekTasks: Task[];
  weeklyContent: string;
  isGeneratingReport: boolean;
  isWeeklyReportSaved: boolean;
  isUsingUserApiKey: boolean;
  remainingWeeklyReport: number;
  weeklyReportNotice: string | null;
  onGenerateWeeklyReport: () => void;
  onWeeklyContentChange: (content: string) => void;
  onCopyWeeklyReport: () => void;
  onExportMarkdown: () => void;
  onSaveWeeklyReport: () => void;
}

export interface SettingsPageProps {
  settings: Settings;
  remainingAudioTranscription: number;
  remainingTaskExtraction: number;
  remainingWeeklyReport: number;
  onProviderChange: (provider: ApiProvider) => void;
  onApiKeyChange: (apiKey: string) => void;
  onToneChange: (tone: number) => void;
  onLengthChange: (length: number) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onClearData: () => void;
}
