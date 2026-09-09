<script setup lang="ts">
import { onMounted } from 'vue';
import TopBar from '@/components/ui/TopBar.vue';
import Icon from '@/components/ui/Icon.vue';
import Avatar from '@/components/ui/Avatar.vue';
import SkeletonRow from '@/components/ui/SkeletonRow.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useInboxStore } from '@/stores/inbox';
import { useChatStore } from '@/stores/chat';
import { useRealtimeStore } from '@/stores/realtime';
import { formatDate } from '@/services/format';
import { requestStatusLabel } from '@/services/status';
import { telegram } from '@/services/telegram';
const inbox=useInboxStore(),chat=useChatStore(),realtime=useRealtimeStore();
onMounted(()=>Promise.all([inbox.load(),chat.loadChats()]));
function setTab(tab:'incoming'|'outgoing'){telegram.select();inbox.tab=tab;}
</script>
<template><section class="screen inbox-page"><TopBar/><header class="page-title"><small>АКТИВНОСТЬ · <span class="status-inline"><i :class="realtime.status"></i>{{realtime.connected?'ОНЛАЙН':'СИНХРОНИЗАЦИЯ'}}</span></small><h1>Заявки и чаты</h1><p>Изменения появляются сами — без перезагрузки.</p></header><div class="tabs"><button :class="{active:inbox.tab==='incoming'}" @click="setTab('incoming')">Входящие <b v-if="inbox.incoming.filter(x=>x.status==='pending').length">{{inbox.incoming.filter(x=>x.status==='pending').length}}</b></button><button :class="{active:inbox.tab==='outgoing'}" @click="setTab('outgoing')">Мои заявки</button></div>
<div v-if="inbox.loading" class="stack skeleton-list"><SkeletonRow v-for="i in 3" :key="i"/></div>
<template v-else>
  <div class="stack" v-if="inbox.tab==='incoming'"><RouterLink v-for="r in inbox.incoming" :key="r.id" :to="`/request/${r.id}`" class="request-row" :class="`status-${r.status}`"><Avatar :name="r.applicant?.display_name||'Гость'" :src="r.applicant?.avatar_url" size="md"/><div><small>{{r.event?.title}}</small><b>{{r.applicant?.display_name||'Гость'}}</b><p>{{r.note||'Без сообщения'}}</p><span>{{requestStatusLabel(r.status)}}</span></div><Icon name="arrow"/></RouterLink><EmptyState v-if="!inbox.incoming.length" icon="inbox" title="Новых заявок нет" text="Когда кто-то захочет присоединиться, карточка появится здесь автоматически."/></div>
  <div class="stack" v-else><article v-for="r in inbox.outgoing" :key="r.id" class="request-row"><div><small>{{r.event?.district}} · {{r.event?.start_at?formatDate(r.event.start_at):''}}</small><b>{{r.event?.title}}</b><span>{{requestStatusLabel(r.status)}}</span></div></article><EmptyState v-if="!inbox.outgoing.length" icon="spark" title="Заявок пока нет" text="Найдите событие и отправьте заявку — её статус будет обновляться здесь в реальном времени." action="Найти событие" @action="$router.push('/')"/></div>
</template>
<section class="section"><div class="section-head"><div><h2>Чаты</h2><small>внутри приложения</small></div></div><div v-if="chat.loadingChats" class="stack"><SkeletonRow v-for="i in 2" :key="i"/></div><div v-else class="stack"><RouterLink v-for="c in chat.chats" :key="c.eventId" :to="`/chat/${c.eventId}`" class="chat-row"><div class="chat-thumb">{{c.event.emoji}}</div><div><b>{{c.event.title}}</b><small>{{c.lastMessage?.text||'Сообщений пока нет'}}</small></div><span v-if="c.unread" class="unread-badge">{{c.unread}}</span><Icon name="arrow"/></RouterLink><EmptyState v-if="!chat.chats.length" icon="chat" title="Чатов пока нет" text="После принятия заявки здесь появится внутренний чат события."/></div></section></section></template>
