# InternSheep Local MVP

This folder is a rebuilt business layer for the newer PRD.

- No account system
- No Supabase
- localStorage-first data model
- Browser MediaRecorder for audio capture, server-side ASR for transcription
- User-owned AI API key stored locally
- Core flow: input/recording -> AI draft tasks -> confirm/edit -> save today tasks -> weekly report

## Vercel environment variables

Free trial mode uses server-side environment variables only. Do not put real API
keys in source code, frontend code, public files, or GitHub.

- `AI_DEFAULT_PROVIDER`: `openai`, `deepseek`, `openai-compatible`, or `yunfeng`
- `AI_DEFAULT_API_KEY`: your server-side API key
- `AI_DEFAULT_BASE_URL`: optional OpenAI-compatible base URL, for example `https://api.fengapi.top/v1`
- `AI_DEFAULT_MODEL`: optional model override, for example `gpt-5.6`

For FengAPI, use:

- `AI_DEFAULT_PROVIDER`: `openai-compatible`
- `AI_DEFAULT_BASE_URL`: `https://api.fengapi.top/v1`
- `AI_DEFAULT_API_KEY`: your FengAPI key
- `AI_DEFAULT_MODEL`: `gpt-5.6` or another FengAPI-supported model name. The model name must
  exactly match the name supported by the third-party platform.

The app appends `/chat/completions` to `AI_DEFAULT_BASE_URL`. With the value
above, the final request URL is
`https://api.fengapi.top/v1/chat/completions`.

Server-side recording transcription supports OpenAI-compatible audio
transcriptions and Tencent Cloud ASR. Do not expose these values to the
frontend.

OpenAI-compatible ASR:

- `ASR_PROVIDER`: `openai-compatible` or `openai`
- `ASR_API_KEY`: server-side ASR API key
- `ASR_BASE_URL`: provider base URL, for example `https://api.openai.com/v1`
- `ASR_MODEL`: transcription model, for example `whisper-1`

Tencent Cloud ASR flash:

- `ASR_PROVIDER`: `tencent`
- `TENCENT_APP_ID`: Tencent Cloud account AppID
- `TENCENT_SECRET_ID`: Tencent Cloud CAM SecretId
- `TENCENT_SECRET_KEY`: Tencent Cloud CAM SecretKey
- `TENCENT_REGION`: `ap-shanghai`
- `TENCENT_ASR_ENGINE`: `16k_zh`
- `TENCENT_ASR_TYPE`: `flash`

Tencent Cloud flash recognition supports formats such as wav, mp3, m4a, aac,
and ogg-opus. Browser recordings in webm/opus are kept in the UI so users can
retry or fall back to manual input, but Tencent flash will reject unsupported
formats with a friendly error.
