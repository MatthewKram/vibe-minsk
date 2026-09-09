# V I B E V5 — Минск / Cloudflare Workers

Готовый многопользовательский Telegram Mini App для поиска мероприятий, домашних вечеринок и компаний в Минске.

## Уже настроено

- Бренд: **V I B E**
- Только Минск
- Supabase project URL: `https://oqjtaukwtzvhygdikdcd.supabase.co`
- Telegram bot: `@vibeminsk_bot`
- Worker: `vibe-minsk`
- Планируемый URL: `https://vibe-minsk.mamazaxist9797.workers.dev`
- Mini App short name по умолчанию: `app`

## Архитектура

- `public/` — интерфейс Telegram Mini App
- `src/index.js` — Cloudflare Worker API
- `supabase/schema.sql` — схема базы, RPC и политики
- `supabase/seed.sql` — демо-события Минска
- `wrangler.jsonc` — готовая конфигурация Cloudflare
- `DEPLOY-CLOUDFLARE-RU.md` — пошаговый запуск

## Секреты

В репозитории НЕТ и не должно быть:

- `SUPABASE_SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`

Их добавляют в Cloudflare как Worker Secrets.

## Быстрые команды

```bash
npm install
npx wrangler login
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npm run check
npm run deploy
```

До deploy сначала выполните `supabase/schema.sql` в Supabase SQL Editor.

Полная инструкция: `DEPLOY-CLOUDFLARE-RU.md`.
