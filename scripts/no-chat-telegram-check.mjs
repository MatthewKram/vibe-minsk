import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const chatFile = path.join(root, 'worker', 'services', 'chat.ts');
const telegramFile = path.join(root, 'worker', 'lib', 'telegram.ts');

const chat = fs.readFileSync(chatFile, 'utf8');
const telegram = fs.readFileSync(telegramFile, 'utf8');

const forbiddenInChat = [
  'sendTelegram(',
  'notify(',
  'TELEGRAM_BOT_TOKEN',
  'api.telegram.org',
];

for (const needle of forbiddenInChat) {
  if (chat.includes(needle)) {
    console.error(`Chat isolation check failed: ${needle} found in worker/services/chat.ts`);
    process.exit(1);
  }
}

for (const required of [
  "'join_request'",
  "'request_accepted'",
  "'request_declined'",
  "'member_left'",
  "'member_removed'",
]) {
  if (!telegram.includes(required)) {
    console.error(`Telegram whitelist check failed: ${required} is missing`);
    process.exit(1);
  }
}

if (!telegram.includes('TELEGRAM_SYSTEM_TYPES.has(p.type)')) {
  console.error('Telegram whitelist enforcement is missing');
  process.exit(1);
}

if (telegram.includes('export async function sendTelegram')) {
  console.error('sendTelegram must stay private to the Telegram module');
  process.exit(1);
}

console.log('Chat isolation check: OK');
