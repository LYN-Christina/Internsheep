import {
  AIProviderError,
  type AIErrorCode,
} from "@/services/ai/providerRuntime";
import type { AIProvider } from "@/types";

export async function testAIConnection(params: {
  apiKey: string;
  provider: AIProvider;
}) {
  const response = await fetch("/api/ai/test-connection", {
    body: JSON.stringify({
      apiKey: params.apiKey,
      mode: "user-key",
      provider: params.provider,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const data = (await response.json()) as
    | { ok: true; message: string }
    | { error: { code: string; message: string; status?: number } };

  if (!response.ok || "error" in data) {
    const error = "error" in data ? data.error : null;

    throw new AIProviderError(
      error?.message ?? "连接测试失败。",
      (error?.code as AIErrorCode | undefined) ?? "provider",
      error?.status ?? response.status,
      data,
    );
  }

  return data.message;
}
