"use client";

const TARGET_SAMPLE_RATE = 16000;

export function shouldConvertToTencentWav(mimeType = "", fileName = "") {
  const normalizedMimeType = mimeType.toLowerCase();
  const normalizedFileName = fileName.toLowerCase();

  return (
    normalizedMimeType.includes("mp4") ||
    normalizedMimeType.includes("m4a") ||
    normalizedMimeType.includes("aac") ||
    normalizedMimeType.includes("webm") ||
    normalizedFileName.endsWith(".mp4") ||
    normalizedFileName.endsWith(".m4a") ||
    normalizedFileName.endsWith(".aac") ||
    normalizedFileName.endsWith(".webm")
  );
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeMonoWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      offset,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true,
    );
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function resampleToTargetRate(samples: Float32Array, sourceSampleRate: number) {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) {
    return samples;
  }

  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const targetLength = Math.max(1, Math.round(samples.length / ratio));
  const result = new Float32Array(targetLength);

  for (let index = 0; index < targetLength; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(Math.floor((index + 1) * ratio), samples.length);
    let sum = 0;
    let count = 0;

    for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1) {
      sum += samples[sourceIndex];
      count += 1;
    }

    result[index] = count ? sum / count : samples[start] ?? 0;
  }

  return result;
}

export function encodePcmToTencentWav(
  samples: Float32Array,
  sourceSampleRate: number,
) {
  return encodeMonoWav(
    resampleToTargetRate(samples, sourceSampleRate),
    TARGET_SAMPLE_RATE,
  );
}

export async function convertAudioBlobToTencentWav(audioBlob: Blob) {
  const audioWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
  const AudioContextClass =
    audioWindow.AudioContext || audioWindow.webkitAudioContext;

  if (!AudioContextClass || typeof OfflineAudioContext === "undefined") {
    throw new Error("当前浏览器不支持音频格式转换，请改用手动输入或缩短录音后重试。");
  }

  const audioContext = new AudioContextClass();

  try {
    const inputBuffer = await audioContext.decodeAudioData(
      await audioBlob.arrayBuffer(),
    );
    const frameCount = Math.ceil(inputBuffer.duration * TARGET_SAMPLE_RATE);
    const offlineContext = new OfflineAudioContext(
      1,
      frameCount,
      TARGET_SAMPLE_RATE,
    );
    const source = offlineContext.createBufferSource();

    source.buffer = inputBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();

    return encodeMonoWav(
      renderedBuffer.getChannelData(0),
      TARGET_SAMPLE_RATE,
    );
  } finally {
    await audioContext.close();
  }
}
