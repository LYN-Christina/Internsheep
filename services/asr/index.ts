import { transcribeWithOpenAICompatible } from "@/services/asr/openaiCompatible";
import { transcribeWithTencent } from "@/services/asr/tencent";
import {
  ASRError,
  isASRError,
  type ASRProvider,
  type TranscribeAudioInput,
} from "@/services/asr/types";

function getProvider(): ASRProvider {
  const provider = process.env.ASR_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === "openai-compatible") {
    return "openai-compatible";
  }

  if (provider === "openai") {
    return "openai";
  }

  if (provider === "tencent") {
    return "tencent";
  }

  throw new ASRError(
    "语音转文字服务暂不支持当前 Provider，请联系开发者。",
    400,
    "asr-unsupported-provider",
  );
}

export async function transcribeAudio(input: TranscribeAudioInput) {
  const provider = getProvider();

  if (provider === "tencent") {
    return transcribeWithTencent(input);
  }

  if (provider === "openai" || provider === "openai-compatible") {
    return transcribeWithOpenAICompatible(input);
  }

  throw new ASRError(
    "语音转文字服务暂不支持当前 Provider，请联系开发者。",
    400,
    "asr-unsupported-provider",
  );
}

export function serializeASRError(error: unknown) {
  if (isASRError(error)) {
    return {
      code: error.code,
      details: error.details,
      message: error.message,
      status: error.status,
    };
  }

  return {
    code: "asr-error",
    message: "语音转文字失败，你可以重试，或直接手动输入 / 粘贴会议内容。",
    status: 500,
  };
}
