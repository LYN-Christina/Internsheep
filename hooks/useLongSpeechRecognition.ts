"use client";

import { useEffect, useRef, useState } from "react";

export const MAX_RECORDING_SECONDS = 30 * 60;
export const RECORDING_WARNING_SECONDS = 25 * 60;

type StopReason = "manual" | "auto" | "cancel" | "error" | null;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onerror:
    | ((event: {
        error?: string;
      }) => void)
    | null;
  onend: (() => void) | null;
  onresult:
    | ((event: {
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal?: boolean }
        >;
      }) => void)
    | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseLongSpeechRecognitionOptions {
  onTranscript: (update: (currentText: string) => string) => void;
  onNotice: (message: string | null) => void;
  onError: (message: string | null) => void;
}

function getSpeechRecognition() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function stopTracks(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

export function formatRecordingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function useLongSpeechRecognition({
  onError,
  onNotice,
  onTranscript,
}: UseLongSpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const hasShownWarningRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const lastSpeechTextRef = useRef("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stopReasonRef = useRef<StopReason>(null);

  function clearRecordingTimer() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function stopRecognition(reason: Exclude<StopReason, null>) {
    stopReasonRef.current = reason;
    clearRecordingTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }

  function stopRecording() {
    stopRecognition("manual");
  }

  function cancelRecording() {
    stopRecognition("cancel");
    lastSpeechTextRef.current = "";
    setElapsedSeconds(0);
    hasShownWarningRef.current = false;
  }

  function startRecordingTimer() {
    clearRecordingTimer();
    setElapsedSeconds(0);
    hasShownWarningRef.current = false;

    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((currentSeconds) => {
        const nextSeconds = currentSeconds + 1;

        if (
          nextSeconds >= RECORDING_WARNING_SECONDS &&
          !hasShownWarningRef.current
        ) {
          hasShownWarningRef.current = true;
          onNotice("录音已接近 30 分钟上限，建议结束后先保存转录文本。");
        }

        if (nextSeconds >= MAX_RECORDING_SECONDS) {
          onNotice(
            "已达到 30 分钟录音上限，转录文本已保留，你可以继续编辑后提取任务。",
          );
          stopRecognition("auto");
          return MAX_RECORDING_SECONDS;
        }

        return nextSeconds;
      });
    }, 1000);
  }

  async function startRecording() {
    onError(null);
    onNotice(null);

    if (isRecording) {
      stopRecording();
      return;
    }

    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      onNotice(
        "当前浏览器不支持语音转文字，请使用手动输入，或尝试使用 Chrome / Safari 打开。",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      onNotice(
        "当前浏览器不支持语音转文字，请使用手动输入，或尝试使用 Chrome / Safari 打开。",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stopTracks(stream);
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        onError("麦克风权限被拒绝，请在浏览器设置中开启权限，或改用手动输入");
        return;
      }

      onError("录音失败，请检查麦克风设备，或改用手动输入");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    lastSpeechTextRef.current = "";
    stopReasonRef.current = null;
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => {
      setIsRecording(true);
      startRecordingTimer();
    };
    recognition.onerror = (event) => {
      setIsRecording(false);
      clearRecordingTimer();
      stopReasonRef.current = "error";
      recognitionRef.current = null;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        onError("麦克风权限被拒绝，请在浏览器设置中开启权限，或改用手动输入");
        return;
      }

      if (event.error === "no-speech") {
        onNotice("没有检测到语音，请再试一次，或改用手动输入");
        return;
      }

      if (event.error === "audio-capture") {
        onError("录音失败，请检查麦克风设备，或改用手动输入");
        return;
      }

      onError("录音失败，请稍后重试，或改用手动输入");
    };
    recognition.onend = () => {
      setIsRecording(false);
      clearRecordingTimer();
      recognitionRef.current = null;

      if (stopReasonRef.current === null) {
        onNotice("浏览器已停止语音识别，已保留转录文本，你可以继续手动补充。");
      }

      stopReasonRef.current = null;
    };
    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];

      Array.from(event.results).forEach((result) => {
        const transcript = result[0]?.transcript ?? "";

        if (!transcript) {
          return;
        }

        if (result.isFinal) {
          finalParts.push(transcript);
        } else {
          interimParts.push(transcript);
        }
      });

      const nextSpeechText = [...finalParts, ...interimParts].join("").trim();

      if (!nextSpeechText) {
        return;
      }

      onTranscript((currentText) => {
        const previousSpeechText = lastSpeechTextRef.current;
        const baseText =
          previousSpeechText && currentText.endsWith(previousSpeechText)
            ? currentText.slice(0, -previousSpeechText.length).trimEnd()
            : currentText.trimEnd();
        const separator = baseText ? "\n" : "";

        lastSpeechTextRef.current = nextSpeechText;
        return `${baseText}${separator}${nextSpeechText}`;
      });
    };

    try {
      recognition.start();
    } catch {
      setIsRecording(false);
      clearRecordingTimer();
      recognitionRef.current = null;
      onError("录音失败，请稍后重试，或改用手动输入");
    }
  }

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  return {
    cancelRecording,
    elapsedSeconds,
    isRecording,
    startRecording,
    stopRecording,
  };
}
