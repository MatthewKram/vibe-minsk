import fs from 'node:fs';

const required = [
  ['worker/index.ts', '/api/realtime/token'],
  ['worker/index.ts', "type:'chat.message'"],
  ['worker/realtime.ts', 'acceptWebSocket'],
  ['worker/lib/realtime.ts', "idFromName('vibe-main')"],
  ['src/services/realtime.ts', 'new WebSocket'],
  ['src/stores/realtime.ts', "signal.type==='chat.message'"],
  ['wrangler.jsonc', 'RealtimeHub']
];
for (const [file, needle] of required) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(needle)) throw new Error(`Realtime check failed: ${file} does not contain ${needle}`);
}
const chat = fs.readFileSync('src/stores/chat.ts','utf8');
if (/setInterval\s*\([^)]*loadMessages|startPolling|stopPolling/.test(chat)) {
  throw new Error('Realtime check failed: legacy chat polling is still present.');
}
console.log('Realtime architecture check: OK');
