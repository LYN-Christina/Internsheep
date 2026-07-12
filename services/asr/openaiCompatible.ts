import { ASRError, type TranscribeAudioInput, type TranscribeAudioResult } from "@/services/asr/types";

const DEFAULT_ASR_MODEL = "whisper-1";

interface OpenAICompatibleConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

function getConfig(): OpenAICompatibleConfig {
  const apiKey = process.env.ASR_API_KEY?.trim();
  const baseURL = process.env.ASR_BASE_URL?.trim();
  const model = process.env.ASR_MODEL?.trim() || DEFAULT_ASR_MODEL;

  if (!apiKey || !baseURL) {
    throw new ASRError(
      "语音转文字服务暂未配置，请使用手动输入。",
      503,
      "asr-not-configured",
    );
  }

  return {
    apiKey,
    baseURL: baseURL.replace(/\/+$/, ""),
    model,
  };
}

async function readProviderError(response: Response) {
  try {
    const data = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };

    return data.error?.message ?? data.message;
  } catch {
    return undefined;
  }
}

function getTranscriptionText(data: unknown) {
  const response = data as { text?: unknown };
  const text = typeof response.text === "string" ? response.text.trim() : "";

  if (!text) {
    throw new ASRError(
      "语音转文字服务返回为空，请重试，或改用手动输入。",
      502,
      "asr-empty-result",
    );
  }

  return text;
}

export async function transcribeWithOpenAICompatible({
  audio,
}: TranscribeAudioInput): Promise<TranscribeAudioResult> {
  const config = getConfig();
  const formData = new FormData();

  formData.append("file", audio, audio.name || "recording.webm");
  formData.append("model", config.model);

  const response = await fetch(`${config.baseURL}/audio/transcriptions`, {
    body: formData,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    method: "POST",
  });

  if (!response.ok) {
    const providerMessage = await readProviderError(response);

    throw new ASRError(
      providerMessage ||
        `语音转文字服务请求失败（HTTP ${response.status}），请稍后重试，或改用手动输入。`,
      response.status,
      "asr-provider-error",
    );
  }

  return { text: getTranscriptionText(await response.json()) };
}
