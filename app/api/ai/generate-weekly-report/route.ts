import { NextResponse } from "next/server";

import { serializeAIError } from "@/services/ai/providerRuntime";
import {
  generateWeeklyReportWithProvider,
  type GenerateWeeklyReportInput,
} from "@/services/ai/weeklyReport";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateWeeklyReportInput;
    const content = await generateWeeklyReportWithProvider(body);

    return NextResponse.json({ content });
  } catch (error) {
    const serialized = serializeAIError(error);

    return NextResponse.json(
      { error: serialized },
      { status: serialized.status ?? 400 },
    );
  }
}
