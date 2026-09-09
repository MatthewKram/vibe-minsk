<script setup lang="ts">
import { onMounted } from 'vue';
import TopBar from '@/components/ui/TopBar.vue';
import Avatar from '@/components/ui/Avatar.vue';
import SkeletonRow from '@/components/ui/SkeletonRow.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useInboxStore } from '@/stores/inbox';
import { useChatStore } from '@/stores/chat';
import { useRealtimeStore } from '@/stores/realtime';
import { formatDate, formatTime } from '@/services/format';
import { requestStatusLabel } from '@/services/status';
import { eventCover } from '@/services/covers';
import { telegram } from '@/services/telegram';

const inbox = useInboxStore();
const chat = useChatStore();
const realtime = useRealtimeStore();
onMounted(() => Promise.all([inbox.load(), chat.loadChats()]));
function setTab(tab: 'incoming' | 'outgoing') { telegram.select(); inbox.tab = tab; }
</script>

<template>
  <section class="screen inbox-page inbox-page-v172">
    <TopBar />

    <header class="page-title page-title-v172">
      <div class="title-line-v172"><h1>Заявки и чаты</h1><span class="status-dot-v172" :class="realtime.status"></span></div>
    </header>

    <div class="tabs tabs-v172">
      <button :class="{ active: inbox.tab === 'incoming' }" @click="setTab('incoming')">Входящие <b v-if="inbox.incoming.filter(x => x.status === 'pending').length">{{ inbox.incoming.filter(x => x.status === 'pending').length }}</b></button>
      <button :class="{ active: inbox.tab === 'outgoing' }" @click="setTab('outgoing')">Мои заявки</button>
    </div>

    <div v-if="inbox.loading" class="stack skeleton-list"><SkeletonRow v-for="i in 3" :key="i" /></div>
    <template v-else>
      <div class="stack requests-list-v172" v-if="inbox.tab === 'incoming'">
        <RouterLink v-for="r in inbox.incoming" :key="r.id" :to="`/request/${r.id}`" class="request-row request-row-v172" :class="`status-${r.status}`">
          <Avatar :name="r.applicant?.display_name || 'Гость'" :src="r.applicant?.avatar_url" size="md" />
          <div><small>{{ r.event?.title }}</small><b>{{ r.applicant?.display_name || 'Гость' }}</b><p>{{ r.note || 'Без сообщения' }}</p></div>
          <span class="request-status-v172">{{ requestStatusLabel(r.status) }}</span>
        </RouterLink>
        <EmptyState v-if="!inbox.incoming.length" icon="inbox" title="Новых заявок нет" text="Когда кто-то захочет присоединиться, заявка появится здесь автоматически." />
      </div>

      <div class="stack requests-list-v172" v-else>
        <article v-for="r in inbox.outgoing" :key="r.id" class="request-row request-row-v172 outgoing">
          <div><small>{{ r.event?.district }} · {{ r.event?.start_at ? formatDate(r.event.start_at) : '' }}</small><b>{{ r.event?.title }}</b></div>
          <span class="request-status-v172">{{ requestStatusLabel(r.status) }}</span>
        </article>
        <EmptyState v-if="!inbox.outgoing.length" icon="spark" title="Заявок пока нет" text="Найдите событие и отправьте заявку — её статус появится здесь автоматически." action="Найти событие" @action="$router.push('/')" />
      </div>
    </template>

    <section class="section chats-section-v172">
      <div class="section-head"><div><h2>Чаты</h2></div></div>
      <div v-if="chat.loadingChats" class="stack"><SkeletonRow v-for="i in 2" :key="i" /></div>
      <div v-else class="chat-list-v172">
        <RouterLink v-for="c in chat.chats" :key="c.eventId" :to="`/chat/${c.eventId}`" class="chat-row chat-row-v172">
          <Avatar :name="c.event.title" :src="eventCover(c.event.kind, c.event.cover_url)" size="md" />
          <div class="chat-row-copy-v172"><b>{{ c.event.title }}</b><small>{{ c.lastMessage?.text || 'Сообщений пока нет' }}</small></div>
          <div class="chat-row-side-v172"><time>{{ c.lastMessage ? formatTime(c.lastMessage.created_at) : '' }}</time><span v-if="c.unread" class="unread-badge">{{ c.unread }}</span></div>
        </RouterLink>
        <EmptyState v-if="!chat.chats.length" icon="chat" title="Чатов пока нет" text="После принятия заявки здесь появится чат события." />
      </div>
    </section>
  </section>
</template>
