# V I B E V15

Telegram Mini App для поиска событий и компаний в Минске.

## Стек

Frontend: Vue 3 + TypeScript + Vite + Vue Router + Pinia + TanStack Vue Query + Zod + MapLibre.

Backend: Cloudflare Workers + Hono + TypeScript + Zod.

Data: Supabase PostgreSQL + Storage.

## Команды

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run deploy
```

## Production settings

Публичные значения уже настроены в `wrangler.jsonc`:

- Supabase URL: `https://oqjtaukwtzvhygdikdcd.supabase.co`
- Telegram bot: `@vibeminsk_bot`
- Mini App short name: `app`
- Worker URL: `https://vibe-minsk.mamazaxist9797.workers.dev`

Secrets остаются только в Cloudflare Dashboard:

- `SUPABASE_SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`

## Совместимость

V15 использует существующую схему Supabase V14.1. SQL-миграция не требуется.

Старый монолитный `POST /api { action: ... }` частично сохранён как переходный compatibility endpoint. Новый Vue frontend использует REST API `/api/...`.


## Cloudflare Git build

Для подключённого GitHub репозитория:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Для ручного CLI deploy: `npm run deploy`.
