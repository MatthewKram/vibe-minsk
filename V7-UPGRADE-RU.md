# V I B E V7 — обновление рабочего проекта

V7 рассчитан на уже работающую связку Cloudflare Worker + Supabase + Telegram.

## Что менять в GitHub

Для обновления существующего V5/V6 достаточно заменить три файла:

- `public/app.js`
- `public/styles.css`
- `src/index.js`

После Commit Cloudflare Git integration должен автоматически запустить новый deploy.

## SQL

Новый SQL для V7 запускать не требуется. V7 использует существующую схему Supabase.

## Secrets

Не менять:

- `SUPABASE_SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`

Публичные vars в `wrangler.jsonc` уже настроены под:

- `https://oqjtaukwtzvhygdikdcd.supabase.co`
- `@vibeminsk_bot`
- `https://vibe-minsk.mamazaxist9797.workers.dev`

## После deploy проверить

1. Главная: новый V7-интерфейс, подборки, пульс города, последние места.
2. Карта: тёмная карта и новые маркеры.
3. Событие: новый постер, заполнение, приватный адрес, новый CTA.
4. Профиль: V I B E PASS и бейджи.
5. Мои события -> Управлять -> Редактировать.
6. Чат: быстрые ответы, редактирование и удаление своих сообщений.
7. Старые события/заявки/чаты должны сохраниться — база не меняется.

Если Cloudflare Build завершился Success, достаточно перезапустить Telegram Mini App или открыть его заново.
