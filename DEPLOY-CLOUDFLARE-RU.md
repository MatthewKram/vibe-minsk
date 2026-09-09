# V I B E — пошаговый запуск на Cloudflare

Эта версия уже привязана к:

- Supabase: `https://oqjtaukwtzvhygdikdcd.supabase.co`
- Telegram: `@vibeminsk_bot`
- Worker name: `vibe-minsk`
- ожидаемый адрес: `https://vibe-minsk.mamazaxist9797.workers.dev`
- бренд: `V I B E`

В исходники осталось НЕ вставлять, а безопасно добавить в Cloudflare только два секрета:

- `SUPABASE_SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`

## 1. Supabase — создать таблицы

1. Войдите в Supabase и откройте проект `oqjtaukwtzvhygdikdcd`.
2. Слева откройте **SQL Editor**.
3. Нажмите **New query**.
4. Откройте локальный файл `supabase/schema.sql`.
5. Скопируйте весь текст в SQL Editor.
6. Нажмите **Run**.
7. После успешного выполнения откройте `supabase/seed.sql`, вставьте его в новый запрос и нажмите **Run**. Это добавит демонстрационные события Минска.

## 2. Получить Supabase Secret Key

В Supabase откройте настройки проекта/API Keys и скопируйте серверный Secret key вида `sb_secret_...`.

Не вставляйте его в `public/app.js`, `wrangler.jsonc`, GitHub или Telegram.

## 3. Получить Telegram Bot Token

1. Откройте `@BotFather`.
2. Выберите бота `@vibeminsk_bot`.
3. Получите/скопируйте Bot Token.
4. Не публикуйте токен и не помещайте его в GitHub.

## 4. Установить Node.js

На компьютере нужен Node.js 20+.

Проверьте:

```bash
node -v
npm -v
```

## 5. Распаковать проект

Откройте терминал в папке проекта и выполните:

```bash
npm install
npm run check
```

## 6. Создать Worker в Cloudflare Dashboard

1. Откройте Cloudflare Dashboard.
2. Перейдите **Workers & Pages**.
3. Нажмите **Create** → **Worker**.
4. Назовите Worker строго `vibe-minsk`.
5. Создайте/Deploy стандартный Hello World Worker. Его код потом будет полностью заменён нашим проектом.

## 7. Добавить два секрета в Cloudflare

Откройте Worker `vibe-minsk` → **Settings** → **Variables and Secrets** → **Add**.

Добавьте как тип **Secret**:

```text
SUPABASE_SECRET_KEY = ваш sb_secret_...
TELEGRAM_BOT_TOKEN = токен @vibeminsk_bot
```

Нажмите **Deploy/Save**. Значения секретов после сохранения будут скрыты.

## 8. Загрузить наш код через Wrangler

В терминале из папки проекта:

```bash
npm install
npx wrangler login
npm run check
npm run deploy
```

Wrangler полностью заменит Hello World нашим Worker API и одновременно загрузит папку `public` как Static Assets.

Ожидаемый адрес:

`https://vibe-minsk.mamazaxist9797.workers.dev`

Адрес Cloudflare уже подтверждён для этого проекта: `https://vibe-minsk.mamazaxist9797.workers.dev`. Он уже записан в `wrangler.jsonc` как `APP_URL`.

## 9. Проверить сайт

Откройте полученный HTTPS URL в браузере.

Лента событий должна загрузиться. В обычном браузере защищённые действия будут недоступны — это правильно. Для авторизации приложение нужно открыть из Telegram.

## 10. Настроить Telegram Mini App

Откройте `@BotFather` и выберите `@vibeminsk_bot`.

Настройте Mini App/Web App и укажите HTTPS URL Cloudflare Worker.

В проекте сейчас используется short name:

`app`

Если в BotFather вы выбрали другой short name, измените в `wrangler.jsonc`:

```json
"TELEGRAM_APP_SHORT_NAME": "app"
```

на фактический short name и снова выполните:

```bash
npm run deploy
```

## 11. Проверить настоящую авторизацию

1. Откройте `@vibeminsk_bot`.
2. Запустите Mini App.
3. Откройте профиль.
4. Там должно быть настоящее имя Telegram-пользователя.

Если появляется сообщение, что приложение надо открыть через Telegram, проверьте:

- Bot Token относится именно к `@vibeminsk_bot`;
- Mini App URL в BotFather совпадает с Cloudflare URL;
- Worker был redeploy после изменения конфигурации.

## 12. Проверить заявки двумя аккаунтами

Понадобятся два Telegram-пользователя.

Аккаунт A:
1. Открывает V I B E.
2. Создаёт событие.

Аккаунт B:
1. Открывает того же бота.
2. Находит событие A.
3. Отправляет заявку.

Аккаунт A:
1. Открывает входящие заявки.
2. Нажимает **Принять**.

Аккаунт B после обновления увидит статус принятия и получит доступ к чату/закрытой информации события.

## 13. Чат

Принятые участники пишут сообщения в чат мероприятия. Сообщения лежат в общей базе Supabase, поэтому разные телефоны видят одну переписку.

## 14. Фото

Обложки событий загружаются через Worker в Supabase Storage. Доступ к upload-пути проверяется сервером: менять обложку может организатор своего события.

## 15. Что НЕ делать

Никогда не помещайте в `public/`, GitHub или `wrangler.jsonc`:

- `SUPABASE_SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`

Не включайте `ALLOW_DEV_AUTH=true` на production.

## Готовая конфигурация проекта

`wrangler.jsonc` уже содержит публичные значения проекта. Для запуска нужны только два secrets и выполненная SQL-схема Supabase.
