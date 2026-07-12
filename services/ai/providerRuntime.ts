import type { AIProvider } from "@/types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AIErrorCode =
  | "missing-api-key"
  | "free-unavailable"
  | "invalid-api-key"
  | "permission-or-quota"
  | "bad-request"
  | "server-error"
  | "cors"
  | "network"
  | "timeout"
  | "unsupported-provider"
  | "provider"
  | "model-unavailable"
  | "unparseable-response"
  | "invalid-json"
  | "empty-content"
  | "empty-tasks";

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

interface ProviderConfig {
  baseURL: string;
  endpoint: string;
  model: string;
  headers: Record<string, string>;
  body(messages: ChatMessage[]): unknown;
  parse(data: unknown): string;
}

interface ProviderResponseSummary {
  choicesLength: number;
  hasChoices: boolean;
  hasDataContent: boolean;
  hasMessageContent: boolean;
  keys: string[];
  summary: string;
}

const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = "https://api.fengapi.top/v1";

function buildAnthropicBody(messages: ChatMessage[], model: string) {
  const systemMessages = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const conversationMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      content: message.content,
      role: message.role,
    }));

  return {
    max_tokens: 2048,
    messages: conversationMessages.length
      ? conversationMessages
      : [{ content: "请回复 ok", role: "user" }],
    model,
    ...(systemMessages ? { system: systemMessages } : {}),
  };
}

function normalizeOpenAICompatibleBaseURL(baseURL: string) {
  const trimmed = baseURL.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return DEFAULT_OPENAI_COMPATIBLE_BASE_URL;
  }

  if (trimmed.endsWith("/chat/completions")) {
    return trimmed.slice(0, -"/chat/completions".length);
  }

  if (trimmed.endsWith("/v1")) {
    return trimmed;
  }

  return `${trimmed}/v1`;
}

function buildChatCompletionsEndpoint(baseURL: string) {
  return `${baseURL.replace(/\/+$/, "")}/chat/completions`;
}

function summarizeProviderData(data: unknown): ProviderResponseSummary {
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = choices[0] as
    | { message?: { content?: unknown }; text?: unknown }
    | undefined;
  const dataRecord =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : {};
  const providerMessage =
    typeof (record.error as { message?: unknown } | undefined)?.message ===
    "string"
      ? (record.error as { message: string }).message
      : typeof record.message === "string"
        ? record.message
        : "";

  return {
    choicesLength: choices.length,
    hasChoices: choices.length > 0,
    hasDataContent: typeof dataRecord.content === "string",
    hasMessageContent: typeof firstChoice?.message?.content === "string",
    keys: Object.keys(record),
    summary: providerMessage.slice(0, 200),
  };
}

function parseProviderContent(data: unknown) {
  if (typeof data === "string") {
    return data;
  }

  const response = data as {
    choices?: Array<{
      message?: { content?: unknown };
      text?: unknown;
    }>;
    output_text?: unknown;
    output?: unknown;
    content?: unknown;
    data?: { content?: unknown };
  };
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string"
          ? part
          : typeof (part as { text?: unknown })?.text === "string"
            ? (part as { text: string }).text
            : "",
      )
      .join("");
  }

  if (typeof response.choices?.[0]?.text === "string") {
    return response.choices[0].text;
  }

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  if (typeof response.output === "string") {
    return response.output;
  }

  if (typeof response.content === "string") {
    return response.content;
  }

  if (typeof response.data?.content === "string") {
    return response.data.content;
  }

  return "";
}

export function getProviderMeta(provider: AIProvider) {
  if (provider === "openai") {
    return {
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      name: "OpenAI",
      supported: true,
    };
  }

  if (provider === "deepseek") {
    return {
      baseURL: "https://api.deepseek.com",
      model: "deepseek-chat",
      name: "DeepSeek",
      supported: true,
    };
  }

  if (provider === "yunfeng") {
    return {
      baseURL: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
      model: "gpt-5.6",
      name: "FengAPI",
      supported: true,
    };
  }

  if (provider === "openai-compatible") {
    return {
      baseURL: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
      model: "gpt-5.6",
      name: "OpenAI-compatible",
      supported: true,
    };
  }

  return {
    baseURL: "https://api.anthropic.com/v1",
    model: "claude-3-5-haiku-latest",
    name: "Anthropic",
    supported: true,
  };
}

function getProviderConfig(
  provider: AIProvider,
  apiKey: string,
  baseURLOverride?: string,
  modelOverride?: string,
  responseFormat?: "json_object",
): ProviderConfig {
  const meta = getProviderMeta(provider);

  if (!meta.supported) {
    throw new AIProviderError(
      `${meta.name} 暂未接入当前 MVP，请先选择 OpenAI、DeepSeek 或 Anthropic。`,
      "unsupported-provider",
    );
  }

  const baseURL =
    provider === "openai-compatible" || provider === "yunfeng"
      ? normalizeOpenAICompatibleBaseURL(baseURLOverride || meta.baseURL)
      : meta.baseURL.replace(/\/+$/, "");
  const endpoint =
    provider === "anthropic"
      ? `${baseURL}/messages`
      : buildChatCompletionsEndpoint(baseURL);

  return {
    endpoint,
    baseURL,
    model: modelOverride?.trim() || meta.model,
    headers:
      provider === "anthropic"
        ? {
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          }
        : {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
    body(messages) {
      if (provider === "anthropic") {
        return buildAnthropicBody(messages, this.model);
      }

      const body: {
        messages: ChatMessage[];
        model: string;
        response_format?: { type: "json_object" };
        temperature: number;
      } = {
        messages,
        model: this.model,
        temperature: 0.2,
      };

      if (responseFormat === "json_object") {
        body.response_format = { type: "json_object" };
      }

      return body;
    },
    parse(data) {
      if (provider === "anthropic") {
        const response = data as {
          content?: Array<{ text?: unknown; type?: string }>;
        };

        return (
          response.content
            ?.map((part) => (typeof part.text === "string" ? part.text : ""))
            .join("") ?? ""
        );
      }

      return parseProviderContent(data);
    },
  };
}

async function readProviderError(response: Response) {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

function getProviderErrorText(details: unknown) {
  if (!details) {
    return "";
  }

  if (typeof details === "string") {
    return details;
  }

  const data = details as {
    error?: { code?: unknown; message?: unknown; type?: unknown };
    message?: unknown;
  };

  return [
    typeof data.error?.code === "string" ? data.error.code : "",
    typeof data.error?.message === "string" ? data.error.message : "",
    typeof data.error?.type === "string" ? data.error.type : "",
    typeof data.message === "string" ? data.message : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isModelError(details: unknown) {
  const text = getProviderErrorText(details);

  return (
    text.includes("model") ||
    text.includes("模型") ||
    text.includes("not found") ||
    text.includes("does not exist") ||
    text.includes("invalid_model")
  );
}

function mapHttpError(status: number, details: unknown) {
  if (isModelError(details)) {
    return new AIProviderError(
      "当前模型名不可用，请检查第三方平台支持的模型名。",
      "model-unavailable",
      status,
      details,
    );
  }

  if (status === 400) {
    return new AIProviderError(
      "请求参数错误，请检查模型名或接口地址。",
      "bad-request",
      status,
      details,
    );
  }

  if (status === 401) {
    return new AIProviderError(
      "API Key 无效或未授权，请在我的设置中检查后重试。",
      "invalid-api-key",
      status,
      details,
    );
  }

  if (status === 403) {
    return new AIProviderError(
      "没有权限访问该模型，请检查服务商账户权限。",
      "permission-or-quota",
      status,
      details,
    );
  }

  if (status === 404) {
    return new AIProviderError(
      "接口地址或模型不存在，请检查 Base URL 和模型名。",
      "model-unavailable",
      status,
      details,
    );
  }

  if (status === 429) {
    return new AIProviderError(
      "额度不足或请求过于频繁，请检查服务商账户状态。",
      "permission-or-quota",
      status,
      details,
    );
  }

  if (status >= 500) {
    return new AIProviderError(
      "模型服务商暂时不可用，请稍后重试。",
      "server-error",
      status,
      details,
    );
  }

  return new AIProviderError(
    `AI 服务请求失败（HTTP ${status}），请稍后重试。`,
    "provider",
    status,
    details,
  );
}

function getFetchFailureError(error: unknown, provider: AIProvider, endpoint: string) {
  const meta = getProviderMeta(provider);
  const host = new URL(endpoint).host;
  const cause = (error as { cause?: { code?: string; message?: string } })?.cause;
  const causeCode = cause?.code;
  const causeMessage = cause?.message ?? "";

  if (causeCode === "UND_ERR_CONNECT_TIMEOUT") {
    return new AIProviderError(
      `无法连接到 ${meta.name} API（${host}），连接超时。请检查网络、代理或改用当前网络可访问的 Provider。`,
      "timeout",
      504,
      { causeCode, causeMessage },
    );
  }

  if (causeCode === "ENOTFOUND" || causeCode === "EAI_AGAIN") {
    return new AIProviderError(
      `无法解析 ${meta.name} API 地址（${host}），请检查 DNS、网络或代理设置。`,
      "network",
      502,
      { causeCode, causeMessage },
    );
  }

  if (causeCode === "ECONNREFUSED" || causeCode === "ECONNRESET") {
    return new AIProviderError(
      `连接 ${meta.name} API（${host}）失败，请检查网络、代理或服务商状态。`,
      "network",
      502,
      { causeCode, causeMessage },
    );
  }

  return new AIProviderError(
    `无法连接到 ${meta.name} API（${host}）。请检查网络代理或稍后重试。`,
    "network",
    502,
    { causeCode, causeMessage, error: String(error) },
  );
}

function shouldRetryAIRequest(error: unknown) {
  if (!(error instanceof AIProviderError)) {
    return false;
  }

  return (
    error.code === "server-error" ||
    error.code === "timeout" ||
    error.code === "empty-content" ||
    error.code === "unparseable-response"
  );
}

export function serializeAIError(error: unknown) {
  console.error("AI request failed", {
    code: error instanceof AIProviderError ? error.code : "unknown",
    message: error instanceof Error ? error.message : String(error),
    status: error instanceof AIProviderError ? error.status : undefined,
  });

  if (error instanceof AIProviderError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      code: "timeout" satisfies AIErrorCode,
      message: "AI 请求超时，请稍后重试。",
    };
  }

  return {
    code: "network" satisfies AIErrorCode,
    message: "网络连接失败，请稍后重试。",
  };
}

export async function callAIProvider(params: {
  apiKey: string;
  baseURL?: string;
  messages: ChatMessage[];
  model?: string;
  provider: AIProvider;
  responseFormat?: "json_object";
  timeoutMs?: number;
}) {
  const apiKey = params.apiKey.trim();

  if (!apiKey) {
    throw new AIProviderError("请先在我的设置中配置 API Key。", "missing-api-key");
  }

  const config = getProviderConfig(
    params.provider,
    apiKey,
    params.baseURL,
    params.model,
    params.responseFormat,
  );
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 45000);

    try {
      const response = await fetch(config.endpoint, {
        body: JSON.stringify(config.body(params.messages)),
        headers: config.headers,
        method: "POST",
        signal: controller.signal,
      });
      const data = await readProviderError(response);
      const summary = summarizeProviderData(data);

      if (!response.ok) {
        throw mapHttpError(response.status, data);
      }

      const content = config.parse(data);

      if (!content.trim()) {
        const hasKnownContainer =
          summary.hasChoices ||
          summary.hasDataContent ||
          summary.keys.some((key) =>
            ["output_text", "output", "content", "data"].includes(key),
          );

        throw new AIProviderError(
          hasKnownContainer
            ? "AI 返回内容为空，请检查模型名或返回格式。"
            : "AI 返回格式无法解析，请检查服务商兼容性。",
          hasKnownContainer ? "empty-content" : "unparseable-response",
          502,
          {
            choicesLength: summary.choicesLength,
            hasMessageContent: summary.hasMessageContent,
            keys: summary.keys,
            safeSummary: summary.summary,
          },
        );
      }

      return content;
    } catch (error) {
      const normalizedError =
        error instanceof AIProviderError
          ? error
          : error instanceof DOMException && error.name === "AbortError"
            ? new AIProviderError("AI 请求超时，请稍后重试。", "timeout")
            : getFetchFailureError(error, params.provider, config.endpoint);

      if (attempt < maxAttempts && shouldRetryAIRequest(normalizedError)) {
        continue;
      }

      throw normalizedError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AIProviderError("AI 请求失败，请稍后重试。", "provider");
}
