import type { AIProvider } from "@/types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AIErrorCode =
  | "missing-api-key"
  | "invalid-api-key"
  | "permission-or-quota"
  | "bad-request"
  | "server-error"
  | "cors"
  | "network"
  | "timeout"
  | "unsupported-provider"
  | "provider"
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
  endpoint: string;
  model: string;
  headers: Record<string, string>;
  body(messages: ChatMessage[]): unknown;
  parse(data: unknown): string;
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
      baseURL: "https://yun.feng.xx.kg/v1",
      model: "gpt-5.5",
      name: "yun.feng.xx.kg",
      supported: true,
    };
  }

  return {
    baseURL: "https://api.anthropic.com/v1",
    model: "claude-3-5-haiku-latest",
    name: "Anthropic",
    supported: false,
  };
}

function getProviderConfig(provider: AIProvider, apiKey: string): ProviderConfig {
  const meta = getProviderMeta(provider);

  if (!meta.supported) {
    throw new AIProviderError(
      `${meta.name} 暂未接入当前 MVP，请先选择 OpenAI、DeepSeek 或 yun.feng.xx.kg。`,
      "unsupported-provider",
    );
  }

  const endpointByProvider: Record<AIProvider, string> = {
    anthropic: "https://api.anthropic.com/v1/messages",
    deepseek: "https://api.deepseek.com/chat/completions",
    openai: "https://api.openai.com/v1/chat/completions",
    yunfeng: "https://yun.feng.xx.kg/v1/chat/completions",
  };

  return {
    endpoint: endpointByProvider[provider],
    model: meta.model,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body(messages) {
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

      if (provider !== "yunfeng") {
        body.response_format = { type: "json_object" };
      }

      return body;
    },
    parse(data) {
      const response = data as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return response.choices?.[0]?.message?.content ?? "";
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

function mapHttpError(status: number, details: unknown) {
  if (status === 400) {
    return new AIProviderError(
      "AI 请求格式不正确，请检查 Provider 和模型配置。",
      "bad-request",
      status,
      details,
    );
  }

  if (status === 401) {
    return new AIProviderError(
      "API Key 无效，请在我的设置中检查后重试。",
      "invalid-api-key",
      status,
      details,
    );
  }

  if (status === 403 || status === 429) {
    return new AIProviderError(
      "权限不足、余额不足或请求额度受限，请检查服务商账户状态。",
      "permission-or-quota",
      status,
      details,
    );
  }

  if (status >= 500) {
    return new AIProviderError(
      "AI 服务暂时不可用，请稍后重试。",
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
    `无法连接到 ${meta.name} API（${host}）。如果浏览器直连不可用，请使用本地后端代理或检查网络代理设置。`,
    "network",
    502,
    { causeCode, causeMessage, error: String(error) },
  );
}

export function serializeAIError(error: unknown) {
  console.error("AI request failed", error);

  if (error instanceof AIProviderError) {
    return {
      code: error.code,
      details: error.details,
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
    message: "网络连接失败，请检查网络后重试。",
  };
}

export async function callAIProvider(params: {
  apiKey: string;
  messages: ChatMessage[];
  provider: AIProvider;
  timeoutMs?: number;
}) {
  const apiKey = params.apiKey.trim();

  if (!apiKey) {
    throw new AIProviderError("请先在我的设置中配置 API Key。", "missing-api-key");
  }

  const config = getProviderConfig(params.provider, apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 45000);

  try {
    const response = await fetch(config.endpoint, {
      body: JSON.stringify(config.body(params.messages)),
      headers: config.headers,
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw mapHttpError(response.status, await readProviderError(response));
    }

    const content = config.parse(await response.json());

    if (!content.trim()) {
      throw new AIProviderError("AI 返回内容为空，请稍后重试。", "empty-content");
    }

    return content;
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AIProviderError("AI 请求超时，请稍后重试。", "timeout");
    }

    throw getFetchFailureError(error, params.provider, config.endpoint);
  } finally {
    clearTimeout(timeout);
  }
}
