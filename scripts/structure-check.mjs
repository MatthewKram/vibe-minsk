import { access, readFile } from 'node:fs/promises';
const required=[
  'src/main.ts','src/router/index.ts','src/stores/session.ts','src/stores/realtime.ts','src/services/api.ts','src/services/image.ts',
  'src/components/ui/SkeletonEventCard.vue','src/components/ui/EmptyState.vue','src/components/ui/BottomSheet.vue','src/components/map/VibeMap.vue',
  'src/pages/HomePage.vue','src/pages/MapPage.vue','src/pages/FavoritesPage.vue','worker/index.ts','worker/lib/cache.ts','worker/services/events.ts','worker/services/requests.ts','worker/services/chat.ts'
];
for(const p of required) await access(p);
const pkg=JSON.parse(await readFile('package.json','utf8'));
for(const dep of ['vue','pinia','vue-router','zod','hono','maplibre-gl','@tanstack/vue-query']) if(!pkg.dependencies?.[dep]) throw new Error(`Missing ${dep}`);
console.log(`V17 structure OK: ${required.length} critical modules found.`);
