"use client";

import { Download, Eye, EyeOff, RefreshCw, Settings2 } from "lucide-react";
import { useState } from "react";

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
  onLengthChange,
  onProviderChange,
  onToneChange,
  remainingTaskExtraction,
  remainingWeeklyReport,
  settings,
}: SettingsPageProps) {
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const hasApiKey = Boolean(settings.apiKey.trim());
  const providerMeta = getProviderMeta(settings.apiProvider);
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
        provider: settings.apiProvider,
      });
      setConnectionMessage(message);
    } catch (error) {
      setConnectionError(getConnectionErrorMessage(error));
    } finally {
      setIsTestingConnection(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-2">
        <Settings2 aria-hidden="true" className="size-5" />
        <h1 className="text-2xl font-semibold">我的设置</h1>
      </div>

      <div className="mt-4 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
        <p className="font-medium text-[var(--foreground)]">
          当前模式：{currentMode}
        </p>
        <p className="mt-1">
          你可以直接使用免费体验额度，也可以配置自己的 API Key 解除次数限制。
        </p>
        <p className="mt-1">
          如果你使用免费体验额度，AI 请求将通过服务端代理完成；如果你配置自己的 API Key，将优先使用你的 Key。
        </p>
        <p className="mt-1">
          免费体验额度：录音纪要每天 2 次，今日剩余 {remainingTaskExtraction} 次；本周周报每周 2 次，本周剩余 {remainingWeeklyReport} 次。
        </p>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
        模型服务商
        <select
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
          value={settings.apiProvider}
          onChange={(event) => onProviderChange(event.target.value as ApiProvider)}
        >
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="openai-compatible">OpenAI-compatible</option>
          <option value="yunfeng">FengAPI（兼容旧配置）</option>
          <option disabled value="anthropic">
            Anthropic（暂未支持）
          </option>
        </select>
      </label>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        当前配置：{providerMeta.baseURL} / {providerMeta.model}
      </p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        模型名必须填写第三方平台支持的精确名称；如果测试连接提示模型不可用，请在部署环境中检查 AI_DEFAULT_MODEL。
      </p>

      <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
        API Key
        <div className="flex gap-2">
          <input
            className="h-10 min-w-0 flex-1 rounded-md border border-[var(--border)] px-3 text-sm"
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
        <p className="mt-2 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
          尚未配置 API Key。你仍可使用免费体验额度；配置后会优先使用自己的 API Key，且不受免费次数限制。
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
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
          <span className="text-sm text-green-700">{connectionMessage}</span>
        ) : null}
        {connectionError ? (
          <span className="text-sm text-red-700">{connectionError}</span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          周报语气：{settings.reportStyle.tone}
          <input
            max="100"
            min="0"
            type="range"
            value={settings.reportStyle.tone}
            onChange={(event) => onToneChange(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          周报长度：{settings.reportStyle.length}
          <input
            max="100"
            min="0"
            type="range"
            value={settings.reportStyle.length}
            onChange={(event) => onLengthChange(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="mt-4 rounded-md bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
        <p className="font-medium text-[var(--foreground)]">隐私说明</p>
        <p className="mt-1">
          自用 API Key、任务和报告都只存储在当前浏览器 localStorage。调用 AI 时，自用 API Key 只会发送到本站后端 API route 代理请求，不会写入前端代码或 GitHub。录音转文字会在停止录音后上传音频到服务端 ASR 处理。
        </p>
        <p className="mt-1">
          清除浏览器缓存可能导致数据丢失，换设备后数据不会自动同步。建议定期导出数据或导出 Markdown 备份重要周报。
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onExportData}>
          <Download aria-hidden="true" className="size-4" />
          导出我的数据
        </Button>
        <Button type="button" variant="danger" onClick={onClearData}>
          清除所有数据
        </Button>
      </div>
    </section>
  );
}
