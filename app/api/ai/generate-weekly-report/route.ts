import { NextResponse } from "next/server";

import { serializeAIError } from "@/services/ai/providerRuntime";
import { resolveAIRequest, type AIRequestEnvelope } from "@/services/ai/serverConfig";
import {
  generateWeeklyReportWithProvider,
  type GenerateWeeklyReportInput,
} from "@/services/ai/weeklyReport";

type WeeklyReportPayload = Omit<
  GenerateWeeklyReportInput,
  "apiKey" | "apiProvider" | "model"
>;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AIRequestEnvelope<WeeklyReportPayload> &
      GenerateWeeklyReportInput;
    const resolved = resolveAIRequest<WeeklyReportPayload>(body, {
      endDate: body.endDate,
      lengthValue: body.lengthValue,
      role: body.role,
      startDate: body.startDate,
      tasks: body.tasks ?? [],
      toneValue: body.toneValue,
    });
    const content = await generateWeeklyReportWithProvider({
      ...resolved.payload,
      apiKey: resolved.apiKey,
      apiProvider: resolved.provider,
      model: resolved.model,
    });

    return NextResponse.json({ content });
  } catch (error) {
    const serialized = serializeAIError(error);

    return NextResponse.json(
      { error: serialized },
      { status: serialized.status ?? 400 },
    );
  }
}
