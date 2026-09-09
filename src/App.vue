<script setup lang="ts">
import { onMounted } from 'vue';import { useRoute, useRouter } from 'vue-router';import BottomNav from '@/components/ui/BottomNav.vue';import { useSessionStore } from '@/stores/session';import { useEventsStore } from '@/stores/events';import { telegram } from '@/services/telegram';
const session=useSessionStore();const events=useEventsStore();const route=useRoute();const router=useRouter();
onMounted(async()=>{await Promise.allSettled([events.load(),session.bootstrap()]);const p=telegram.startParam();if(p.startsWith('request_'))router.replace(`/request/${p.slice(8)}`);else if(p.startsWith('event_'))router.replace(`/event/${p.slice(6)}`);});
</script>
<template><div class="app-shell"><main class="app-content"><RouterView/></main><BottomNav v-if="route.meta.nav!==false"/></div></template>
