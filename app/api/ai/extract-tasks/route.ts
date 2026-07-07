import { NextResponse } from "next/server";

import { serializeAIError } from "@/services/ai/providerRuntime";
import { resolveAIRequest, type AIRequestEnvelope } from "@/services/ai/serverConfig";
import { extractTasksWithProvider } from "@/services/ai/taskExtraction";
import type { AIProvider, Role } from "@/types";

interface ExtractTasksRequest {
  apiKey?: string;
  mode?: "free" | "user-key";
  payload?: {
    role?: Role;
    text?: string;
  };
  provider?: AIProvider;
  role?: Role;
  text?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AIRequestEnvelope<ExtractTasksRequest["payload"]> &
      ExtractTasksRequest;
    const resolved = resolveAIRequest(body, {
      role: body.role ?? "intern",
      text: body.text ?? "",
    });

    const result = await extractTasksWithProvider({
      apiKey: resolved.apiKey,
      model: resolved.model,
      provider: resolved.provider,
      role: resolved.payload?.role ?? "intern",
      text: resolved.payload?.text ?? "",
    });

    return NextResponse.json({ result });
  } catch (error) {
    const serialized = serializeAIError(error);

    return NextResponse.json(
      { error: serialized },
      { status: serialized.status ?? 400 },
    );
  }
}
