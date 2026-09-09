# V I B E V15.2 — MapLibre build fix

Замените в GitHub два файла с сохранением путей:

- `package.json`
- `src/components/map/VibeMap.vue`

После Commit Cloudflare автоматически запустит новый build.

Исправления:
- `@cloudflare/workers-types` -> `^5.20260908.1`
- MapLibre 6 использует namespace import вместо default import
- MapLibre worker подключён через Vite `?worker&url`
