<script setup lang="ts">
import Icon from './Icon.vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useRealtimeStore } from '@/stores/realtime';

defineProps<{ back?: boolean; title?: string }>();
const router = useRouter();
const session = useSessionStore();
const realtime = useRealtimeStore();
</script>

<template>
  <header class="topbar topbar-native">
    <button v-if="back" class="back back-native" @click="router.back()"><Icon name="back" :size="18" /><b>{{ title || 'Назад' }}</b></button>
    <RouterLink v-else to="/" class="brand brand-native" aria-label="V I B E"><span class="brand-word">VIBE</span><i></i></RouterLink>
    <div class="top-actions top-actions-native">
      <span v-if="!back" class="city city-native"><Icon name="pin" :size="14" />Минск</span>
      <button class="icon-button notify-button notify-native" aria-label="Уведомления" @click="router.push('/notifications')">
        <Icon name="bell" :size="18" />
        <i v-if="session.unreadNotifications" class="badge">{{ session.unreadNotifications > 9 ? '9+' : session.unreadNotifications }}</i>
        <span class="live-dot" :class="realtime.status" :title="realtime.status === 'online' ? 'Обновления онлайн' : 'Переподключение'"></span>
      </button>
    </div>
  </header>
</template>
