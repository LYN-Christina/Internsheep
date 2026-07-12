export type ASRProvider = "openai" | "openai-compatible" | "tencent";

export interface TranscribeAudioInput {
  audio: File;
  fileName?: string;
  mimeType?: string;
}

export interface TranscribeAudioResult {
  text: string;
}

export class ASRError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code = "asr-error",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ASRError";
  }
}

export function isASRError(error: unknown): error is ASRError {
  return error instanceof ASRError;
}
