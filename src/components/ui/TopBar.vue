<script setup lang="ts">
import Icon from './Icon.vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useRealtimeStore } from '@/stores/realtime';

defineProps<{back?:boolean;title?:string}>();
const router=useRouter();
const session=useSessionStore();
const realtime=useRealtimeStore();
</script>
<template>
  <header class="topbar">
    <button v-if="back" class="back" @click="router.back()"><Icon name="back"/><b>{{title||'Назад'}}</b></button>
    <RouterLink v-else to="/" class="brand" aria-label="V I B E"><strong>V</strong><span>I B E</span></RouterLink>
    <div class="top-actions">
      <span v-if="!back" class="city"><Icon name="pin" :size="17"/>Минск</span>
      <button class="icon-button notify-button" aria-label="Уведомления" @click="router.push('/notifications')">
        <Icon name="bell"/>
        <i v-if="session.unreadNotifications" class="badge">{{session.unreadNotifications>9?'9+':session.unreadNotifications}}</i>
        <span class="live-dot" :class="realtime.status" :title="realtime.status==='online'?'Обновления онлайн':'Переподключение'"></span>
      </button>
    </div>
  </header>
</template>
