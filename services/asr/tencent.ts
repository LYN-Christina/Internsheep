import { createHmac } from "crypto";

import {
  ASRError,
  type TranscribeAudioInput,
  type TranscribeAudioResult,
} from "@/services/asr/types";

const TENCENT_FLASH_HOST = "asr.cloud.tencent.com";
const DEFAULT_TENCENT_REGION = "ap-shanghai";
const DEFAULT_TENCENT_ENGINE = "16k_zh";
const DEFAULT_TENCENT_ASR_TYPE = "flash";

interface TencentASRConfig {
  appId: string;
  asrType: string;
  engine: string;
  region: string;
  secretId: string;
  secretKey: string;
}

interface TencentFlashResponse {
  code?: number;
  message?: string;
  request_id?: string;
  flash_result?: Array<{
    channel_id?: number;
    sentence_list?: Array<{ text?: string }>;
    text?: string;
  }>;
}

function getConfig(): TencentASRConfig {
  const appId = process.env.TENCENT_APP_ID?.trim();
  const secretId = process.env.TENCENT_SECRET_ID?.trim();
  const secretKey = process.env.TENCENT_SECRET_KEY?.trim();

  if (!appId || !secretId || !secretKey) {
    throw new ASRError(
      "腾讯云语音转文字服务未配置完整，请联系开发者。",
      503,
      "tencent-not-configured",
    );
  }

  return {
    appId,
    asrType: process.env.TENCENT_ASR_TYPE?.trim() || DEFAULT_TENCENT_ASR_TYPE,
    engine: process.env.TENCENT_ASR_ENGINE?.trim() || DEFAULT_TENCENT_ENGINE,
    region: process.env.TENCENT_REGION?.trim() || DEFAULT_TENCENT_REGION,
    secretId,
    secretKey,
  };
}

function getVoiceFormat(mimeType = "", fileName = "") {
  const normalizedMimeType = mimeType.toLowerCase();
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedMimeType.includes("wav") || normalizedFileName.endsWith(".wav")) {
    return "wav";
  }

  if (
    normalizedMimeType.includes("mpeg") ||
    normalizedMimeType.includes("mp3") ||
    normalizedFileName.endsWith(".mp3")
  ) {
    return "mp3";
  }

  if (
    normalizedMimeType.includes("mp4") ||
    normalizedFileName.endsWith(".mp4") ||
    normalizedFileName.endsWith(".m4a")
  ) {
    return "m4a";
  }

  if (
    normalizedMimeType.includes("aac") ||
    normalizedFileName.endsWith(".aac")
  ) {
    return "aac";
  }

  if (
    normalizedMimeType.includes("ogg") ||
    normalizedFileName.endsWith(".ogg") ||
    normalizedFileName.endsWith(".opus")
  ) {
    return "ogg-opus";
  }

  throw new ASRError(
    "当前录音格式暂不支持转写，请尝试换用手机自带浏览器或使用手动输入。",
    415,
    "tencent-unsupported-format",
    { fileName, mimeType },
  );
}

function buildQuery(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
}

function signTencentFlashRequest(params: {
  path: string;
  query: string;
  secretKey: string;
}) {
  const signText = `POST${TENCENT_FLASH_HOST}${params.path}?${params.query}`;

  return createHmac("sha1", params.secretKey)
    .update(signText)
    .digest("base64");
}

function getTencentErrorMessage(message?: string) {
  if (!message) {
    return "腾讯云语音转文字失败，你可以重试，或直接手动输入 / 粘贴会议内容。";
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("signature") || normalized.includes("secretid")) {
    return "语音转文字服务鉴权失败，请联系开发者检查腾讯云密钥。";
  }

  if (normalized.includes("format") || normalized.includes("voice_format")) {
    return "当前录音格式暂不支持转写，请尝试换用手机自带浏览器或使用手动输入。";
  }

  if (
    normalized.includes("param") ||
    normalized.includes("engine_type") ||
    normalized.includes("appid")
  ) {
    return "语音转文字参数配置有误，请联系开发者检查腾讯云配置。";
  }

  return "腾讯云语音转文字失败，你可以重试，或直接手动输入 / 粘贴会议内容。";
}

function getTencentErrorCode(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (
    normalizedMessage.includes("signature") ||
    normalizedMessage.includes("secretid") ||
    normalizedMessage.includes("auth")
  ) {
    return "tencent-auth-failed";
  }

  if (
    normalizedMessage.includes("format") ||
    normalizedMessage.includes("voice_format")
  ) {
    return "tencent-unsupported-format";
  }

  if (
    normalizedMessage.includes("param") ||
    normalizedMessage.includes("engine_type") ||
    normalizedMessage.includes("appid")
  ) {
    return "tencent-bad-config";
  }

  return "tencent-provider-error";
}

function parseTencentText(data: TencentFlashResponse) {
  const text = data.flash_result
    ?.flatMap((result) => [
      result.text,
      ...(result.sentence_list?.map((sentence) => sentence.text) ?? []),
    ])
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n")
    .trim();

  if (!text) {
    throw new ASRError(
      "腾讯云语音转文字结果为空，请重试，或直接手动输入 / 粘贴会议内容。",
      502,
      "tencent-empty-result",
      { requestId: data.request_id },
    );
  }

  return text;
}

export async function transcribeWithTencent({
  audio,
  fileName,
  mimeType,
}: TranscribeAudioInput): Promise<TranscribeAudioResult> {
  const config = getConfig();
  const actualMimeType = mimeType || audio.type;
  const actualFileName = fileName || audio.name;

  if (config.asrType !== "flash") {
    throw new ASRError(
      "当前测试版仅支持腾讯云极速识别 flash，请联系开发者检查 TENCENT_ASR_TYPE。",
      400,
      "tencent-unsupported-type",
    );
  }

  const voiceFormat = getVoiceFormat(actualMimeType, actualFileName);
  const timestamp = Math.floor(Date.now() / 1000);
  const path = `/asr/flash/v1/${config.appId}`;
  const query = buildQuery({
    engine_type: config.engine,
    expired: String(timestamp + 3600),
    filter_dirty: "0",
    filter_modal: "0",
    filter_punc: "0",
    first_channel_only: "1",
    secretid: config.secretId,
    speaker_diarization: "0",
    timestamp: String(timestamp),
    voice_format: voiceFormat,
    word_info: "0",
  });
  const signature = signTencentFlashRequest({
    path,
    query,
    secretKey: config.secretKey,
  });
  const response = await fetch(`https://${TENCENT_FLASH_HOST}${path}?${query}`, {
    body: Buffer.from(await audio.arrayBuffer()),
    headers: {
      Authorization: signature,
      "Content-Type": "application/octet-stream",
      "X-Tencent-Region": config.region,
    },
    method: "POST",
  });

  let data: TencentFlashResponse | null = null;

  try {
    data = (await response.json()) as TencentFlashResponse;
  } catch {
    data = null;
  }

  if (!response.ok || !data || data.code !== 0) {
    const code = getTencentErrorCode(data?.message);

    console.warn("Tencent ASR provider error", {
      code: data?.code,
      message: data?.message,
      requestId: data?.request_id,
      status: response.status,
      voiceFormat,
    });

    throw new ASRError(
      getTencentErrorMessage(data?.message),
      response.ok ? 502 : response.status,
      code,
      {
        code: data?.code,
        message: data?.message,
        requestId: data?.request_id,
        status: response.status,
      },
    );
  }

  return { text: parseTencentText(data) };
}
