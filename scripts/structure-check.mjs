import { access, readFile } from 'node:fs/promises';
const required=['src/main.ts','src/router/index.ts','src/stores/session.ts','src/services/api.ts','src/pages/HomePage.vue','src/pages/MapPage.vue','worker/index.ts','worker/services/events.ts','worker/services/requests.ts','worker/services/chat.ts'];
for(const p of required) await access(p);
const pkg=JSON.parse(await readFile('package.json','utf8'));
for(const dep of ['vue','pinia','vue-router','zod','hono']) if(!pkg.dependencies?.[dep]) throw new Error(`Missing ${dep}`);
console.log(`V15 structure OK: ${required.length} critical modules found.`);
