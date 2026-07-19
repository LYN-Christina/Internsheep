"use client";

import { useEffect, useRef, useState } from "react";

export const AUTO_TRANSCRIBE_INTERVAL_SECONDS = 30;
export const MAX_RECORDING_SECONDS = 5 * 60;
export const RECORDING_WARNING_SECONDS = 4 * 60;

export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/webm;codecs=opus",
  "audio/webm",
];

type StopReason = "manual" | "auto" | "cancel" | "error";

interface UseAudioRecorderOptions {
  onAudioSegment?: (segment: {
    blob: Blob;
    elapsedSeconds: number;
    mimeType: string;
    segmentId: string;
    sessionId: string;
  }) => void;
  onError: (message: string | null) => void;
  onNotice: (message: string | null) => void;
  onSessionStart?: (sessionId: string) => void;
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  return (
    SUPPORTED_AUDIO_MIME_TYPES.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    ) ?? null
  );
}

export function formatRecordingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function useAudioRecorder({
  onAudioSegment,
  onError,
  onNotice,
  onSessionStart,
}: UseAudioRecorderOptions) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const elapsedSecondsRef = useRef(0);
  const hasShownWarningRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const segmentIndexRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const stopReasonRef = useRef<StopReason>("manual");
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  function clearRecordingTimer() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function finishRecording(blob: Blob | null) {
    stopTracks(streamRef.current);
    streamRef.current = null;
    mediaRecorderRef.current = null;
    clearRecordingTimer();
    setIsRecording(false);
    stopResolverRef.current?.(blob);
    stopResolverRef.current = null;
  }

  function startRecordingTimer() {
    clearRecordingTimer();
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    hasShownWarningRef.current = false;

    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((currentSeconds) => {
        const nextSeconds = currentSeconds + 1;
        elapsedSecondsRef.current = nextSeconds;

        if (
          nextSeconds >= RECORDING_WARNING_SECONDS &&
          !hasShownWarningRef.current
        ) {
          hasShownWarningRef.current = true;
          onNotice("录音已接近 5 分钟上限，建议结束后检查转写内容。");
        }

        if (nextSeconds >= MAX_RECORDING_SECONDS) {
          onNotice("已达到 5 分钟录音上限。测试版建议长会议分段记录。");
          void stopRecording("auto");
          return MAX_RECORDING_SECONDS;
        }

        return nextSeconds;
      });
    }, 1000);
  }

  async function startRecording() {
    onError(null);
    onNotice(null);
    setAudioBlob(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      onNotice("当前浏览器不支持网页录音，请使用手动输入或换用 Chrome / Safari。");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      onNotice("当前浏览器不支持网页录音，请使用手动输入或换用 Chrome / Safari。");
      return;
    }

    const supportedMimeType = getSupportedMimeType();

    if (!supportedMimeType) {
      onNotice("当前浏览器不支持网页录音，请使用手动输入或换用 Chrome / Safari。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
      const sessionId = crypto.randomUUID();

      chunksRef.current = [];
      segmentIndexRef.current = 0;
      sessionIdRef.current = sessionId;
      stopReasonRef.current = "manual";
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setMimeType(supportedMimeType);
      onSessionStart?.(sessionId);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          segmentIndexRef.current += 1;
          onAudioSegment?.({
            blob: event.data,
            elapsedSeconds: elapsedSecondsRef.current,
            mimeType: supportedMimeType,
            segmentId: `segment-${segmentIndexRef.current}`,
            sessionId,
          });
        }
      };

      recorder.onerror = () => {
        stopReasonRef.current = "error";
        onError("录音失败，请检查麦克风设备，或改用手动输入。");
        finishRecording(null);
      };

      recorder.onstop = () => {
        const shouldKeepAudio = stopReasonRef.current !== "cancel";
        const blob =
          shouldKeepAudio && chunksRef.current.length
            ? new Blob(chunksRef.current, { type: supportedMimeType })
            : null;

        chunksRef.current = [];
        setAudioBlob(blob);
        finishRecording(blob);
      };

      recorder.start(AUTO_TRANSCRIBE_INTERVAL_SECONDS * 1000);
      setIsRecording(true);
      startRecordingTimer();
    } catch (error) {
      stopTracks(streamRef.current);
      streamRef.current = null;

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        onError("麦克风权限被拒绝，请在浏览器设置中开启权限，或改用手动输入。");
        return;
      }

      onError("录音失败，请检查麦克风设备，或改用手动输入。");
    }
  }

  function stopRecording(reason: StopReason = "manual") {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(audioBlob);
    }

    stopReasonRef.current = reason;
    clearRecordingTimer();

    return new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve;
      recorder.stop();
    });
  }

  async function cancelRecording() {
    setAudioBlob(null);
    chunksRef.current = [];
    sessionIdRef.current = null;
    await stopRecording("cancel");
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    setMimeType(null);
    onNotice(null);
  }

  function clearRecordedAudio() {
    if (isRecording) {
      return;
    }

    setAudioBlob(null);
    chunksRef.current = [];
    sessionIdRef.current = null;
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    setMimeType(null);
    onNotice(null);
  }

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      stopTracks(streamRef.current);
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
    };
  }, []);

  return {
    audioBlob,
    cancelRecording,
    clearRecordedAudio,
    elapsedSeconds,
    isRecording,
    mimeType,
    startRecording,
    stopRecording,
  };
}
