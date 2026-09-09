@echo off
chcp 65001 >nul
setlocal

echo ==========================================
echo   V I B E - Cloudflare Workers deploy
echo ==========================================
echo.
echo СНАЧАЛА:
echo 1. Выполните supabase\schema.sql в Supabase SQL Editor.
echo 2. Создайте Worker vibe-minsk в Cloudflare Dashboard.
echo 3. В Worker Settings - Variables and Secrets добавьте два Secret:
echo    SUPABASE_SECRET_KEY и TELEGRAM_BOT_TOKEN.
echo.
pause

echo.
echo [1/4] Установка зависимостей...
call npm install
if errorlevel 1 goto :error

echo.
echo [2/4] Авторизация в Cloudflare...
call npx wrangler login
if errorlevel 1 goto :error

echo.
echo [3/4] Проверка проекта...
call npm run check
if errorlevel 1 goto :error

echo.
echo [4/4] Deploy...
call npm run deploy
if errorlevel 1 goto :error

echo.
echo ГОТОВО. Скопируйте HTTPS адрес Worker из вывода выше.
echo Если он отличается от https://vibe-minsk.mamazaxist9797.workers.dev,
echo замените APP_URL в wrangler.jsonc и снова выполните npm run deploy.
echo.
pause
exit /b 0

:error
echo.
echo ОШИБКА. Смотрите сообщение выше.
pause
exit /b 1
