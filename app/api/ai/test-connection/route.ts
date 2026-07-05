import { NextResponse } from "next/server";

import {
  callAIProvider,
  serializeAIError,
  type ChatMessage,
} from "@/services/ai/providerRuntime";
import type { AIProvider } from "@/types";

interface TestConnectionRequest {
  apiKey?: string;
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
    const body = (await request.json()) as TestConnectionRequest;

    await callAIProvider({
      apiKey: body.apiKey ?? "",
      messages: testMessages,
      provider: body.provider ?? "openai",
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
