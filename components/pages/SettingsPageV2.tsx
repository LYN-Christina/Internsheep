"use client";

import { Download, Eye, EyeOff, RefreshCw, Settings2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import {
  GlassCard,
  GlassInput,
  GlassSelect,
  MetricCard,
  NoticeBanner,
  PageShell,
  SectionHeader,
} from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import type { SettingsPageProps } from "@/lib/page-types";
import {
  AIProviderError,
  getProviderMeta,
} from "@/services/ai/providerRuntime";
import { testAIConnection } from "@/services/ai/testConnection";
import type { ApiProvider } from "@/types";

export function SettingsPageV2({
  onApiKeyChange,
  onClearData,
  onExportData,
  onImportData,
  onLengthChange,
  onProviderChange,
  onToneChange,
  remainingAudioTranscription,
  remainingTaskExtraction,
  remainingWeeklyReport,
  settings,
}: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const hasApiKey = Boolean(settings.apiKey.trim());
  const visibleProvider =
    settings.apiProvider === "openai-compatible" || settings.apiProvider === "yunfeng"
      ? "deepseek"
      : settings.apiProvider;
  const providerMeta = getProviderMeta(visibleProvider);
  const currentMode = hasApiKey ? "自用 API Key" : "免费体验";

  function getConnectionErrorMessage(error: unknown) {
    if (error instanceof AIProviderError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "连接测试失败，请稍后重试。";
  }

  async function handleTestConnection() {
    setConnectionMessage(null);
    setConnectionError(null);
    setIsTestingConnection(true);

    try {
      const message = await testAIConnection({
        apiKey: settings.apiKey,
        provider: visibleProvider,
      });
      setConnectionMessage(message);
    } catch (error) {
      setConnectionError(getConnectionErrorMessage(error));
    } finally {
      setIsTestingConnection(false);
    }
  }

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onImportData(file);
    }

    event.target.value = "";
  }

  return (
    <PageShell
      eyebrow="Settings center"
      title="我的设置"
      description="把模型、周报偏好和本地数据管理收在一个安静的设置中心。"
      action={
        <span className="flex size-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.08)]">
          <Settings2 aria-hidden="true" className="size-5 text-[var(--primary)]" />
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard label="语音转文字" value={remainingAudioTranscription} hint="今日剩余" />
        <MetricCard label="AI 提取任务" value={remainingTaskExtraction} hint="今日剩余" />
        <MetricCard label="本周周报" value={remainingWeeklyReport} hint="本周剩余" />
      </div>

      <GlassCard>
        <SectionHeader
          title="模型服务"
          description={`当前模式：${currentMode}。免费体验会通过服务端代理完成，自用 API Key 会优先使用你的配置。`}
        />
        <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-[var(--foreground)]">
          模型服务商
          <GlassSelect
            value={visibleProvider}
            onChange={(event) => onProviderChange(event.target.value as ApiProvider)}
          >
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="anthropic">Anthropic</option>
          </GlassSelect>
        </label>
        <NoticeBanner className="mt-3">
          当前配置：{providerMeta.baseURL} / {providerMeta.model}
        </NoticeBanner>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          title="API Key"
          description="仅保存在当前浏览器 localStorage。配置后不受免费次数限制。"
        />
        <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-[var(--foreground)]">
          API Key 输入
          <div className="flex gap-2">
            <GlassInput
              className="min-w-0 flex-1"
              placeholder="仅保存在本机 localStorage"
              type={isApiKeyVisible ? "text" : "password"}
              value={settings.apiKey}
              onChange={(event) => onApiKeyChange(event.target.value)}
            />
            <Button
              aria-label={isApiKeyVisible ? "隐藏 API Key" : "显示 API Key"}
              size="icon"
              type="button"
              variant="secondary"
              onClick={() => setIsApiKeyVisible((visible) => !visible)}
            >
              {isApiKeyVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </Button>
          </div>
        </label>
        {!hasApiKey ? (
          <NoticeBanner className="mt-3" tone="accent">
            尚未配置 API Key。你仍可使用免费体验额度；配置后会优先使用自己的 API Key。
          </NoticeBanner>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            disabled={isTestingConnection || !hasApiKey || !providerMeta.supported}
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
          >
            <RefreshCw
              aria-hidden="true"
              className={isTestingConnection ? "size-4 animate-spin" : "size-4"}
            />
            {isTestingConnection ? "测试中" : "测试连接"}
          </Button>
          {connectionMessage ? (
            <span className="text-sm text-[var(--success)]">{connectionMessage}</span>
          ) : null}
          {connectionError ? (
            <span className="text-sm text-[var(--danger)]">{connectionError}</span>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="周报偏好" description="用两个滑杆调节输出语气和长度。" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--foreground)]">
            周报语气：{settings.reportStyle.tone}
            <input
              className="accent-[#e7d6ee]"
              max="100"
              min="0"
              type="range"
              value={settings.reportStyle.tone}
              onChange={(event) => onToneChange(Number(event.target.value))}
            />
            <span className="text-xs font-normal text-[var(--muted-foreground)]">
              数值越高，语气越积极完整。
            </span>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--foreground)]">
            周报长度：{settings.reportStyle.length}
            <input
              className="accent-[#e7d6ee]"
              max="100"
              min="0"
              type="range"
              value={settings.reportStyle.length}
              onChange={(event) => onLengthChange(Number(event.target.value))}
            />
            <span className="text-xs font-normal text-[var(--muted-foreground)]">
              数值越高，内容越详细。
            </span>
          </label>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="隐私与数据" description="任务、报告和自用 Key 都只存储在当前浏览器。" />
        <NoticeBanner className="mt-4">
          调用 AI 时，自用 API Key 只会发送到本站后端 API route 代理请求，不会写入前端代码或 GitHub。录音转文字会在停止录音后上传音频到服务端 ASR 处理。
        </NoticeBanner>
        <NoticeBanner className="mt-3">
          清除浏览器缓存可能导致数据丢失，换设备后数据不会自动同步。建议定期导出数据或导出 Markdown 备份重要周报。
        </NoticeBanner>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onExportData}>
            <Download aria-hidden="true" className="size-4" />
            导出我的数据
          </Button>
          <input
            ref={fileInputRef}
            accept="application/json,.json"
            className="hidden"
            type="file"
            onChange={handleImportFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload aria-hidden="true" className="size-4" />
            导入我的数据
          </Button>
          <Button type="button" variant="danger" onClick={onClearData}>
            清除所有数据
          </Button>
        </div>
      </GlassCard>
    </PageShell>
  );
}
