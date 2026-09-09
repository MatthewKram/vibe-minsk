# V I B E V15.3.1 — Realtime build fix

Этот пакет исправляет ошибку Cloudflare Build:

- `Could not resolve './lib/realtime'`
- `Could not resolve './lib/realtime-token'`
- `Could not resolve './realtime'`

## Что делать

Распакуйте архив поверх текущего GitHub-репозитория с заменой файлов и сделайте Commit в `main`.

Будут добавлены/обновлены:

- `worker/index.ts`
- `worker/types.ts`
- `worker/realtime.ts`
- `worker/lib/realtime.ts`
- `worker/lib/realtime-token.ts`
- `wrangler.jsonc`
- `package.json`
- `scripts/realtime-check.mjs`

SQL, Supabase, BotFather и Cloudflare Secrets менять не нужно.

`wrangler.jsonc` уже содержит binding Durable Object `REALTIME` и декларацию `RealtimeHub` с SQLite storage.
