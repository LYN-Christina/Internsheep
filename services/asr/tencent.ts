import { createHash, createHmac } from "crypto";

import {
  ASRError,
  type TranscribeAudioInput,
  type TranscribeAudioResult,
} from "@/services/asr/types";

const TENCENT_API_HOST = "asr.tencentcloudapi.com";
const TENCENT_API_SERVICE = "asr";
const TENCENT_API_VERSION = "2019-06-14";
const DEFAULT_TENCENT_REGION = "ap-shanghai";
const DEFAULT_TENCENT_ENGINE = "16k_zh";
const DEFAULT_TENCENT_ASR_TYPE = "flash";
const MAX_SENTENCE_RECOGNITION_BASE64_BYTES = 3 * 1024 * 1024;

interface TencentASRConfig {
  appId: string;
  asrType: string;
  engine: string;
  region: string;
  secretId: string;
  secretKey: string;
}

interface TencentAPIResponse<T> {
  Response?: T & {
    Error?: {
      Code?: string;
      Message?: string;
    };
    RequestId?: string;
  };
}

interface SentenceRecognitionResponse {
  AudioDuration?: number;
  Result?: string;
}

function readEnvLine(name: string) {
  return process.env[name]
    ?.split(/\r?\n/)
    .map((part) => part.trim())
    .find(Boolean);
}

function getConfigSummary(config: TencentASRConfig) {
  return {
    appIdLength: config.appId.length,
    appIdPreview: config.appId.replace(/^(\d{3})\d+(\d{3})$/, "$1***$2"),
    appIdValid: /^\d+$/.test(config.appId),
    asrType: config.asrType,
    engine: config.engine,
    region: config.region,
  };
}

function getConfig(): TencentASRConfig {
  const appId = readEnvLine("TENCENT_APP_ID");
  const secretId = readEnvLine("TENCENT_SECRET_ID");
  const secretKey = readEnvLine("TENCENT_SECRET_KEY");

  if (!appId || !secretId || !secretKey) {
    throw new ASRError(
      "腾讯云语音转文字服务未配置完整，请联系开发者。",
      503,
      "tencent-not-configured",
    );
  }

  if (!/^\d+$/.test(appId)) {
    throw new ASRError(
      "语音转文字参数配置有误，请联系开发者检查 TENCENT_APP_ID。",
      400,
      "tencent-bad-config",
      {
        appIdLength: appId.length,
        appIdValid: false,
      },
    );
  }

  return {
    appId,
    asrType: readEnvLine("TENCENT_ASR_TYPE") || DEFAULT_TENCENT_ASR_TYPE,
    engine: readEnvLine("TENCENT_ASR_ENGINE") || DEFAULT_TENCENT_ENGINE,
    region: readEnvLine("TENCENT_REGION") || DEFAULT_TENCENT_REGION,
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

function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmacSha256(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacSha256Hex(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function getUTCDate(timestamp: number) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function signTencentAPIRequest(params: {
  action: string;
  body: string;
  config: TencentASRConfig;
  timestamp: number;
}) {
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${TENCENT_API_HOST}\n`;
  const signedHeaders = "content-type;host";
  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    sha256Hex(params.body),
  ].join("\n");
  const date = getUTCDate(params.timestamp);
  const credentialScope = `${date}/${TENCENT_API_SERVICE}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    String(params.timestamp),
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const secretDate = hmacSha256(`TC3${params.config.secretKey}`, date);
  const secretService = hmacSha256(secretDate, TENCENT_API_SERVICE);
  const secretSigning = hmacSha256(secretService, "tc3_request");
  const signature = hmacSha256Hex(secretSigning, stringToSign);

  return `TC3-HMAC-SHA256 Credential=${params.config.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function getTencentAPIErrorMessage(code?: string, message?: string) {
  const normalizedCode = code?.toLowerCase() ?? "";
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (
    normalizedCode.includes("authfailure") ||
    normalizedCode.includes("unauthorized") ||
    normalizedMessage.includes("signature") ||
    normalizedMessage.includes("secretid")
  ) {
    return "语音转文字服务鉴权失败，请联系开发者检查腾讯云密钥。";
  }

  if (
    normalizedCode.includes("invalidparameter") ||
    normalizedCode.includes("unsupportedoperation") ||
    normalizedMessage.includes("engine") ||
    normalizedMessage.includes("voiceformat") ||
    normalizedMessage.includes("format")
  ) {
    return "语音转文字参数配置有误，请联系开发者检查腾讯云配置。";
  }

  if (
    normalizedCode.includes("limitexceeded") ||
    normalizedMessage.includes("too large") ||
    normalizedMessage.includes("exceed")
  ) {
    return "录音文件较大，建议缩短录音或分段记录。";
  }

  return "语音转文字失败，你可以重试，或直接手动输入 / 粘贴会议内容。";
}

function getTencentAPIErrorCode(code?: string, message?: string) {
  const normalizedCode = code?.toLowerCase() ?? "";
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (
    normalizedCode.includes("authfailure") ||
    normalizedCode.includes("unauthorized") ||
    normalizedMessage.includes("signature") ||
    normalizedMessage.includes("secretid")
  ) {
    return "tencent-auth-failed";
  }

  if (
    normalizedCode.includes("invalidparameter") ||
    normalizedCode.includes("unsupportedoperation") ||
    normalizedMessage.includes("engine") ||
    normalizedMessage.includes("voiceformat") ||
    normalizedMessage.includes("format")
  ) {
    return "tencent-bad-config";
  }

  if (
    normalizedCode.includes("limitexceeded") ||
    normalizedMessage.includes("too large") ||
    normalizedMessage.includes("exceed")
  ) {
    return "audio-too-large";
  }

  return "tencent-provider-error";
}

function parseSentenceRecognitionText(
  data: TencentAPIResponse<SentenceRecognitionResponse>,
) {
  const response = data.Response;

  if (response?.Error) {
    throw new ASRError(
      getTencentAPIErrorMessage(response.Error.Code, response.Error.Message),
      502,
      getTencentAPIErrorCode(response.Error.Code, response.Error.Message),
      {
        code: response.Error.Code,
        message: response.Error.Message,
        requestId: response.RequestId,
      },
    );
  }

  const text = response?.Result?.trim();

  if (!text) {
    throw new ASRError(
      "腾讯云语音转文字结果为空，请重试，或直接手动输入 / 粘贴会议内容。",
      502,
      "tencent-empty-result",
      {
        audioDuration: response?.AudioDuration,
        requestId: response?.RequestId,
      },
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
      "当前测试版仅支持腾讯云短音频识别，请联系开发者检查 TENCENT_ASR_TYPE。",
      400,
      "tencent-unsupported-type",
    );
  }

  const voiceFormat = getVoiceFormat(actualMimeType, actualFileName);
  const audioBuffer = Buffer.from(await audio.arrayBuffer());
  const audioBase64 = audioBuffer.toString("base64");
  const audioBase64Bytes = Buffer.byteLength(audioBase64, "utf8");

  if (audioBase64Bytes > MAX_SENTENCE_RECOGNITION_BASE64_BYTES) {
    throw new ASRError(
      "录音文件较大，建议缩短录音或分段记录。",
      413,
      "audio-too-large",
      {
        audioBase64Bytes,
        audioBytes: audioBuffer.length,
        limitBytes: MAX_SENTENCE_RECOGNITION_BASE64_BYTES,
        voiceFormat,
      },
    );
  }

  const body = JSON.stringify({
    ConvertNumMode: 1,
    Data: audioBase64,
    DataLen: audioBuffer.length,
    EngSerViceType: config.engine,
    FilterDirty: 0,
    FilterModal: 0,
    FilterPunc: 0,
    ProjectId: 0,
    SourceType: 1,
    SubServiceType: 2,
    VoiceFormat: voiceFormat,
    WordInfo: 0,
  });
  const timestamp = Math.floor(Date.now() / 1000);
  const authorization = signTencentAPIRequest({
    action: "SentenceRecognition",
    body,
    config,
    timestamp,
  });
  let response: Response;

  try {
    response = await fetch(`https://${TENCENT_API_HOST}`, {
      body,
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json; charset=utf-8",
        "X-TC-Action": "SentenceRecognition",
        "X-TC-Region": config.region,
        "X-TC-Timestamp": String(timestamp),
        "X-TC-Version": TENCENT_API_VERSION,
      },
      method: "POST",
    });
  } catch (error) {
    console.warn("Tencent ASR network error", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
      host: TENCENT_API_HOST,
      interface: "SentenceRecognition",
      voiceFormat,
    });

    throw new ASRError(
      "腾讯云语音转文字连接失败，请稍后重试，或直接手动输入 / 粘贴会议内容。",
      502,
      "tencent-network-error",
      {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : typeof error,
        host: TENCENT_API_HOST,
        interface: "SentenceRecognition",
        voiceFormat,
      },
    );
  }

  const responseText = await response.text();
  let data: TencentAPIResponse<SentenceRecognitionResponse> | null = null;

  try {
    data = JSON.parse(responseText) as TencentAPIResponse<SentenceRecognitionResponse>;
  } catch {
    data = null;
  }

  if (!response.ok || !data?.Response) {
    console.warn("Tencent ASR provider error", {
      config: getConfigSummary(config),
      interface: "SentenceRecognition",
      responseBodyPreview: data ? undefined : responseText.slice(0, 240),
      status: response.status,
      voiceFormat,
    });

    throw new ASRError(
      "语音转文字失败，你可以重试，或直接手动输入 / 粘贴会议内容。",
      response.ok ? 502 : response.status,
      "tencent-provider-error",
      {
        config: getConfigSummary(config),
        interface: "SentenceRecognition",
        responseBodyPreview: data ? undefined : responseText.slice(0, 240),
        status: response.status,
      },
    );
  }

  try {
    return { text: parseSentenceRecognitionText(data) };
  } catch (error) {
    if (error instanceof ASRError) {
      console.warn("Tencent ASR provider error", {
        config: getConfigSummary(config),
        details: error.details,
        interface: "SentenceRecognition",
        status: error.status,
        voiceFormat,
      });
    }

    throw error;
  }
}
