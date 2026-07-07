import { NextResponse } from "next/server";

import {
  callAIProvider,
  serializeAIError,
  type ChatMessage,
} from "@/services/ai/providerRuntime";
import { resolveAIRequest, type AIRequestEnvelope } from "@/services/ai/serverConfig";
import type { AIProvider } from "@/types";

interface TestConnectionRequest {
  apiKey?: string;
  mode?: "free" | "user-key";
  provider?: AIProvider;
}

const testMessages: ChatMessage[] = [
  {
    role: "system",
    content: "只输出 JSON。",
  },
  {
    role: "user",
    content: `请输出 {"ok":true}`,
  },
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AIRequestEnvelope<Record<string, never>> &
      TestConnectionRequest;
    const resolved = resolveAIRequest(body, {});

    await callAIProvider({
      apiKey: resolved.apiKey,
      messages: testMessages,
      model: resolved.model,
      provider: resolved.provider,
      timeoutMs: 20000,
    });

    return NextResponse.json({ ok: true, message: "连接成功" });
  } catch (error) {
    const serialized = serializeAIError(error);

    return NextResponse.json(
      { error: serialized },
      { status: serialized.status ?? 400 },
    );
  }
}
