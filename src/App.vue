<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '@/components/ui/BottomNav.vue';
import Icon from '@/components/ui/Icon.vue';
import { useSessionStore } from '@/stores/session';
import { useEventsStore } from '@/stores/events';
import { useRealtimeStore } from '@/stores/realtime';
import { telegram } from '@/services/telegram';
const session=useSessionStore();const events=useEventsStore();const realtime=useRealtimeStore();const route=useRoute();const router=useRouter();
onMounted(async()=>{await Promise.allSettled([events.load(),session.bootstrap()]);if(session.user)realtime.start();const p=telegram.startParam();if(p.startsWith('request_'))router.replace(`/request/${p.slice(8)}`);else if(p.startsWith('event_'))router.replace(`/event/${p.slice(6)}`);});
onBeforeUnmount(()=>realtime.stop());
</script>
<template><div class="app-shell"><main class="app-content"><RouterView/></main><Transition name="toast"><button v-if="realtime.toast" class="realtime-toast" @click="router.push('/notifications')"><Icon name="bell" :size="18"/><span>{{realtime.toast}}</span></button></Transition><BottomNav v-if="route.meta.nav!==false"/></div></template>
