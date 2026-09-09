# V I B E V17 — Product Polish

Telegram Mini App для поиска событий и компаний в Минске.

V17 сохраняет Vue 3 + TypeScript + Vite, Cloudflare Worker/Hono, Supabase, Durable Objects realtime и внутренний чат, но добавляет продуктовый UX/перфоманс-слой:

- Skeleton Loaders и анимированные Empty States.
- Карта с собственным bottom-sheet в состояниях peek / mid / full.
- Кэшированный GeoJSON и `setData()` только при реальном изменении точек.
- Собственные пиктограммы маркеров, heatmap, кластеры, геопозиция и круг точности.
- Поиск по карте по названию, району, описанию и тегам.
- Избранное в профиле и Telegram/native Share.
- Haptic feedback на ключевых действиях.
- Lazy loading страниц и MapLibre; lazy decoding изображений.
- Клиентская оптимизация обложек до WebP перед загрузкой.
- Cloudflare Cache API для публичной ленты без пользовательского состояния.
- Авторизованные API-ответы `no-store`, CORS ограничен текущим приложением/APP_URL.
- Telegram safe-area CSS variables + обычные iOS safe areas.

Существующая Supabase-схема совместима. Новая SQL-миграция не требуется.

См. `V17-UPGRADE-RU.md`.
