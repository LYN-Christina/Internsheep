import { NextResponse } from "next/server";

import { serializeASRError, transcribeAudio } from "@/services/asr";

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

function getASRProvider() {
  return process.env.ASR_PROVIDER?.trim() || "openai-compatible";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: { message: "请上传录音音频后再转写。" } },
        { status: 400 },
      );
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        {
          error: {
            code: "audio-too-large",
            message: "录音文件较大，建议缩短录音或分段记录。",
          },
        },
        { status: 413 },
      );
    }

    console.info("ASR upload received", {
      fileName: audio.name,
      mimeType: audio.type,
      provider: getASRProvider(),
      size: audio.size,
    });

    const result = await transcribeAudio({
      audio,
      fileName: audio.name,
      mimeType: audio.type,
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    const serialized = serializeASRError(error);

    console.error("ASR request failed", {
      code: serialized.code,
      details: serialized.details,
      message: serialized.message,
      provider: getASRProvider(),
      status: serialized.status,
    });

    return NextResponse.json(
      { error: { code: serialized.code, message: serialized.message } },
      { status: serialized.status },
    );
  }
}
