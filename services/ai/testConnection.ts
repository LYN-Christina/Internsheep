import { AIProviderError } from "@/services/ai/providerRuntime";
import type { AIProvider } from "@/types";

export async function testAIConnection(params: {
  apiKey: string;
  provider: AIProvider;
}) {
  const response = await fetch("/api/ai/test-connection", {
    body: JSON.stringify(params),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const data = (await response.json()) as
    | { ok: true; message: string }
    | { error: { code: string; message: string; status?: number } };

  if (!response.ok || "error" in data) {
    throw new AIProviderError(
      "error" in data ? data.error.message : "连接测试失败。",
      "provider",
      "error" in data ? data.error.status : response.status,
      data,
    );
  }

  return data.message;
}
