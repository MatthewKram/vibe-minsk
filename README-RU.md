# V I B E V15.3.2 — Build completeness fix

Этот пакет исправляет ошибку Cloudflare:

`Could not load src/services/queryClient`

В предыдущий upload не попал `src/services/queryClient.ts`. Чтобы не ловить отсутствующие realtime-файлы по одному, пакет содержит весь критичный client/realtime слой.

## Установка

1. Распакуй ZIP.
2. Загрузи **содержимое папки** в корень GitHub-репозитория с заменой файлов и сохранением структуры папок.
3. Commit changes.
4. Cloudflare автоматически запустит новый build.

Supabase, SQL, Secrets и BotFather менять не надо.
