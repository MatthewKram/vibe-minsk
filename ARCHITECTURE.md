# V I B E V17 Architecture

## Client
Vue 3 + TypeScript + Vite + Pinia + Vue Router + TanStack Vue Query + Zod.

Страницы загружаются lazy imports. MapLibre находится только в map chunk. UI разделён на pages/components/services/stores. Network-loading состояния вынесены в Skeleton/EmptyState компоненты.

## Realtime
Cloudflare Durable Object `RealtimeHub` держит WebSocket соединения. Signal не является source of truth: после сигнала клиент инвалидирует нужный query/store и получает актуальные данные из Worker/Supabase.

## Map
OpenFreeMap/OpenMapTiles data + MapLibre GL. События передаются одним GeoJSON source с clustering. V17 хранит signature текущего GeoJSON и не вызывает `setData()` при эквивалентных данных. Маркеры используют локально сгенерированные icon images.

## Backend
Cloudflare Worker + Hono + Zod + Supabase service connection.

Public unauthenticated `/api/events` использует Cloudflare Cache API. Authenticated response никогда не edge-cache-ится из-за пользовательских полей. Mutations инвалидируют публичный кеш.

## Security
Telegram `initData` валидируется только на Worker. Supabase secret и Bot token доступны только Worker Secrets. CORS ограничен same-origin/APP_URL; authenticated API responses имеют `no-store`.
