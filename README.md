# InternSheep Local MVP

This folder is a rebuilt business layer for the newer PRD.

- No account system
- No Supabase
- localStorage-first data model
- Browser Web Speech API for transcription
- User-owned AI API key stored locally
- Core flow: input/recording -> AI draft tasks -> confirm/edit -> save today tasks -> weekly report

## Vercel environment variables

Free trial mode uses server-side environment variables only. Do not put real API
keys in source code, frontend code, public files, or GitHub.

- `AI_DEFAULT_PROVIDER`: `openai`, `deepseek`, or `yunfeng`
- `AI_DEFAULT_API_KEY`: your server-side API key
- `AI_DEFAULT_MODEL`: optional model override, for example `gpt-5.5`
