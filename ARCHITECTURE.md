# V I B E V15 — архитектура

## Frontend

- `src/pages/` — экраны Mini App.
- `src/components/` — переиспользуемые UI/event/chat/map компоненты.
- `src/stores/` — Pinia: только клиентское состояние и оркестрация.
- `src/services/api.ts` — единая HTTP-точка входа.
- `src/schemas/` — Zod-проверка ответов API.
- `src/types/` — доменные TypeScript-типы.
- `src/services/telegram.ts` — Telegram WebApp SDK изолирован от UI.
- TanStack Vue Query используется для кэшируемых серверных запросов на ключевых страницах.

## Backend

- `worker/index.ts` — Hono router, без бизнес-логики.
- `worker/lib/` — auth, Supabase, DTO, Telegram notifications, error mapping.
- `worker/services/events.ts` — события, избранное, участники.
- `worker/services/requests.ts` — заявки и membership lifecycle.
- `worker/services/chat.ts` — внутренний чат V I B E. Сообщения не отправляются ботом.
- `worker/services/users.ts` — профиль, уведомления, жалобы.
- `worker/schemas/` — Zod validation входных payload.

## Data

Схема Supabase V14.1 совместима. Новая миграция для V15 не нужна.
