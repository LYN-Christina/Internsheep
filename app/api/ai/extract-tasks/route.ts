import { NextResponse } from "next/server";

import { serializeAIError } from "@/services/ai/providerRuntime";
import { extractTasksWithProvider } from "@/services/ai/taskExtraction";
import type { AIProvider, Role } from "@/types";

interface ExtractTasksRequest {
  apiKey?: string;
  provider?: AIProvider;
  role?: Role;
  text?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExtractTasksRequest;
    const result = await extractTasksWithProvider({
      apiKey: body.apiKey ?? "",
      provider: body.provider ?? "openai",
      role: body.role ?? "intern",
      text: body.text ?? "",
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
