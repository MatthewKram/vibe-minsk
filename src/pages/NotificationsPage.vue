<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TopBar from '@/components/ui/TopBar.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Icon from '@/components/ui/Icon.vue';
import { useSessionStore } from '@/stores/session';
import { formatDate } from '@/services/format';
const session=useSessionStore();
const router=useRouter();
onMounted(()=>session.loadNotifications());
async function open(id:string,eventId:string|null){await session.markNotification(id);if(eventId)router.push(`/event/${eventId}`)}
async function readAll(){for(const n of session.notifications.filter(x=>!x.read_at)) await session.markNotification(n.id)}
</script>
<template><section class="screen notifications-page"><TopBar back title="Уведомления"/>
  <header class="page-title compact-title"><small>V I B E · СЕЙЧАС</small><div class="row-between"><h1>Уведомления</h1><button v-if="session.unreadNotifications" class="text-action" @click="readAll">Прочитать все</button></div></header>
  <div class="notification-list">
    <button v-for="n in session.notifications" :key="n.id" class="notification-item" :class="{unread:!n.read_at}" @click="open(n.id,n.event_id)">
      <Avatar :name="n.actor?.display_name||'VIBE'" :src="n.actor?.avatar_url" size="md"/>
      <div><div class="notification-title"><b>{{n.title}}</b><i v-if="!n.read_at"></i></div><p>{{n.body}}</p><small>{{formatDate(n.created_at)}}</small></div><Icon name="arrow" :size="18"/>
    </button>
    <div v-if="!session.notifications.length" class="empty rich-empty"><Icon name="bell" :size="28"/><b>Здесь пока тихо</b><span>Заявки, изменения событий и важные обновления появятся здесь сами.</span></div>
  </div>
</section></template>
