# Переход V14.1 → V15

V15 — не обычный patch. Меняется сборка frontend и структура Worker, поэтому лучше заменить содержимое GitHub-репозитория файлами из полного V15-архива.

## Что НЕ меняется

- Worker: `vibe-minsk`
- URL: `https://vibe-minsk.mamazaxist9797.workers.dev`
- Supabase project и все текущие записи
- `SUPABASE_SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`
- BotFather / Mini App URL
- SQL повторно запускать не нужно

## 1. Сделайте резервный commit

Перед заменой файлов убедитесь, что текущая V14.1 сохранена в GitHub history. Этого достаточно для rollback.

## 2. Замените содержимое репозитория

Удалите старые монолитные файлы:

- `public/app.js`
- `public/styles.css`
- старый `src/index.js`

Загрузите все файлы V15 в корень репозитория. `package.json`, `wrangler.jsonc`, `index.html`, `src/`, `worker/`, `public/` должны быть именно из V15.

## 3. ВАЖНО: Cloudflare Build configuration

V15 использует Cloudflare Vite plugin. Перед deploy Vite должен собрать Vue frontend и Worker deployment config.

В Cloudflare откройте **Worker → Settings → Build** и выставьте:

**Build command**
```bash
npm run build
```

**Deploy command**
```bash
npx wrangler deploy
```

Vite сначала собирает Vue frontend и создаёт generated Wrangler config, после чего `wrangler deploy` использует именно эту сборку.

Для ручного деплоя с компьютера можно по-прежнему использовать:
```bash
npm run deploy
```

Cloudflare сам установит зависимости в Git build.

## 4. Commit

Сделайте commit в основной branch. Cloudflare запустит build.

В логе должны пройти Vite build и Wrangler deploy.

## 5. Проверка

1. Главная загружает события из существующей Supabase.
2. Карта открывается через MapLibre/OpenFreeMap.
3. Аккаунт A создаёт событие.
4. Аккаунт B подаёт заявку.
5. A открывает `/request/<id>` и принимает B.
6. B получает доступ к внутреннему чату.
7. Сообщения видны только внутри V I B E и не дублируются в Telegram-бота.

## Rollback

Если Cloudflare build не прошёл, просто redeploy предыдущий Git commit V14.1. База не менялась, поэтому rollback безопасный.
