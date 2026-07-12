import { AIProviderError } from "@/services/ai/providerRuntime";
import type { AIProvider } from "@/types";

export type AIMode = "free" | "user-key";

export interface AIRequestEnvelope<TPayload> {
  apiKey?: string;
  mode?: AIMode;
  payload?: TPayload;
  provider?: AIProvider;
}

interface ResolvedAIConfig<TPayload> {
  apiKey: string;
  baseURL?: string;
  mode: AIMode;
  model?: string;
  payload: TPayload;
  provider: AIProvider;
}

function isAIProvider(value: string | undefined): value is AIProvider {
  return (
    value === "openai" ||
    value === "deepseek" ||
    value === "openai-compatible" ||
    value === "yunfeng" ||
    value === "anthropic"
  );
}

function getDefaultProvider() {
  const provider = process.env.AI_DEFAULT_PROVIDER;

  if (isAIProvider(provider)) {
    return provider;
  }

  if (process.env.DEEPSEEK_API_KEY?.trim()) {
    return "deepseek";
  }

  return "openai";
}

export function resolveAIRequest<TPayload>(
  envelope: AIRequestEnvelope<TPayload>,
  fallbackPayload: TPayload,
): ResolvedAIConfig<TPayload> {
  const mode = envelope.mode ?? (envelope.apiKey?.trim() ? "user-key" : "free");
  const payload = envelope.payload ?? fallbackPayload;

  if (mode === "user-key") {
    if (!envelope.apiKey?.trim()) {
      throw new AIProviderError(
        "用户 API Key 未配置，请在「我的设置」中填写后重试。",
        "missing-api-key",
      );
    }

    return {
      apiKey: envelope.apiKey,
      mode,
      payload,
      provider: envelope.provider ?? "openai",
    };
  }

  const provider = getDefaultProvider();
  const apiKey =
    process.env.AI_DEFAULT_API_KEY ||
    (provider === "deepseek" ? process.env.DEEPSEEK_API_KEY : undefined);
  const model =
    process.env.AI_DEFAULT_MODEL ||
    (provider === "deepseek" ? process.env.DEEPSEEK_MODEL : undefined);
  const baseURL =
    process.env.AI_DEFAULT_BASE_URL ||
    (provider === "deepseek" ? process.env.DEEPSEEK_BASE_URL : undefined);

  if (!apiKey?.trim()) {
    throw new AIProviderError(
      "免费体验暂不可用，请配置自己的 API Key。",
      "free-unavailable",
      503,
    );
  }

  return {
    apiKey,
    baseURL,
    mode,
    model,
    payload,
    provider,
  };
}
