"use client";

import { Download, Eye, EyeOff, RefreshCw, Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { SettingsPageProps } from "@/lib/page-types";
import { getProviderMeta } from "@/services/ai/providerRuntime";
import { testAIConnection } from "@/services/ai/testConnection";
import type { ApiProvider } from "@/types";

export function SettingsPageV2({
  onApiKeyChange,
  onClearData,
  onExportData,
  onLengthChange,
  onProviderChange,
  onToneChange,
  settings,
}: SettingsPageProps) {
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const hasApiKey = Boolean(settings.apiKey.trim());
  const providerMeta = getProviderMeta(settings.apiProvider);

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
      console.error("AI connection test failed", error);
      setConnectionError(
        error instanceof Error ? error.message : "连接测试失败，请稍后重试。",
      );
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

      <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
        模型服务商
        <select
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
          value={settings.apiProvider}
          onChange={(event) => onProviderChange(event.target.value as ApiProvider)}
        >
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="yunfeng">yun.feng.xx.kg</option>
          <option disabled value="anthropic">
            Anthropic（暂未支持）
          </option>
        </select>
      </label>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        当前配置：{providerMeta.baseURL} / {providerMeta.model}
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
          尚未配置 API Key。配置后才能使用 AI 提取任务和生成周报。
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
          API Key、任务和报告都只存储在当前浏览器 localStorage，不上传到产品服务器。录音转文字使用浏览器能力。
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
