import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const required = [
  'public/index.html', 'public/app.js', 'public/styles.css',
  'src/index.js', 'supabase/schema.sql', 'supabase/seed.sql',
  'wrangler.jsonc', 'package.json', 'DEPLOY-CLOUDFLARE-RU.md'
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Нет обязательного файла: ${file}`);
}
execFileSync(process.execPath, ['--check', 'public/app.js'], { stdio: 'inherit' });
execFileSync(process.execPath, ['--check', 'src/index.js'], { stdio: 'inherit' });
const wrangler = readFileSync('wrangler.jsonc', 'utf8');
for (const needle of [
  '"name": "vibe-minsk"',
  'https://oqjtaukwtzvhygdikdcd.supabase.co',
  '"TELEGRAM_BOT_USERNAME": "vibeminsk_bot"',
  'https://vibe-minsk.mamazaxist9797.workers.dev',
  '"SUPABASE_SECRET_KEY"',
  '"TELEGRAM_BOT_TOKEN"'
]) {
  if (!wrangler.includes(needle)) throw new Error(`wrangler.jsonc: не найдено ${needle}`);
}
const app = readFileSync('public/app.js', 'utf8');
if (app.includes('Netlify')) throw new Error('В клиенте осталась ссылка на Netlify');
console.log('V I B E V5 Cloudflare: базовая проверка пройдена.');
