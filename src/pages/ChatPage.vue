<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import Avatar from '@/components/ui/Avatar.vue';
import Icon from '@/components/ui/Icon.vue';
import SkeletonRow from '@/components/ui/SkeletonRow.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useChatStore } from '@/stores/chat';
import { useSessionStore } from '@/stores/session';
import { useRealtimeStore } from '@/stores/realtime';
import { api } from '@/services/api';
import { eventResponseSchema } from '@/schemas/api';
import { formatTime } from '@/services/format';
import { telegram } from '@/services/telegram';
import type { MessageItem } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const chat = useChatStore();
const session = useSessionStore();
const realtime = useRealtimeStore();
const eventId = String(route.params.eventId);
const text = ref('');
const box = ref<HTMLElement | null>(null);
const menuMessage = ref<MessageItem | null>(null);
const replyTo = ref<MessageItem | null>(null);
let holdTimer: number | null = null;

const eventQuery = useQuery({ queryKey: ['event', eventId], queryFn: () => api.getParsed(`/api/events/${eventId}`, eventResponseSchema), staleTime: 15_000 });
const event = computed(() => eventQuery.data.value?.event || null);

onMounted(async () => {
  await Promise.allSettled([chat.open(eventId), chat.loadChats()]);
});
onBeforeUnmount(() => {
  if (holdTimer) clearTimeout(holdTimer);
  chat.close();
});
watch(() => chat.messages.length, async () => {
  await nextTick();
  if (box.value) box.value.scrollTo({ top: box.value.scrollHeight, behavior: 'smooth' });
});

function senderName(m: MessageItem) {
  return m.sender_id === session.user?.id ? 'Вы' : (m.sender?.display_name || 'Гость');
}
function isGroupStart(index: number) {
  if (index === 0) return true;
  const cur = chat.messages[index], prev = chat.messages[index - 1];
  const far = Math.abs(new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime()) > 5 * 60_000;
  return cur.sender_id !== prev.sender_id || far;
}
function isGroupEnd(index: number) {
  if (index === chat.messages.length - 1) return true;
  const cur = chat.messages[index], next = chat.messages[index + 1];
  const far = Math.abs(new Date(next.created_at).getTime() - new Date(cur.created_at).getTime()) > 5 * 60_000;
  return cur.sender_id !== next.sender_id || far;
}
function startHold(m: MessageItem) {
  cancelHold();
  holdTimer = window.setTimeout(() => { menuMessage.value = m; telegram.haptic('light'); }, 480);
}
function cancelHold() {
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = null;
}
function openMenu(m: MessageItem) {
  cancelHold();
  menuMessage.value = m;
}
function setReply(m: MessageItem) {
  replyTo.value = m;
  menuMessage.value = null;
}
async function edit(m: MessageItem) {
  menuMessage.value = null;
  const t = prompt('Изменить сообщение:', m.text);
  if (t?.trim()) { await chat.edit(m.id, t.trim()); telegram.notify('success'); }
}
async function remove(m: MessageItem) {
  menuMessage.value = null;
  if (confirm('Удалить сообщение?')) { await chat.remove(m.id); telegram.notify('success'); }
}
async function copyText(m: MessageItem) {
  menuMessage.value = null;
  await navigator.clipboard?.writeText(m.text);
  telegram.notify('success');
}
async function send() {
  const value = text.value.trim();
  if (!value) return;
  const payload = replyTo.value
    ? `↪ ${senderName(replyTo.value)}: ${replyTo.value.text.slice(0, 72).replace(/\n/g, ' ')}\n${value}`
    : value;
  text.value = '';
  replyTo.value = null;
  telegram.haptic('light');
  await chat.send(eventId, payload);
}
function parts(raw: string) {
  if (!raw.startsWith('↪ ')) return { quote: '', body: raw };
  const i = raw.indexOf('\n');
  if (i === -1) return { quote: raw, body: '' };
  return { quote: raw.slice(0, i), body: raw.slice(i + 1) };
}
</script>

<template>
  <section class="chat-page chat-page-v172">
    <header class="chat-header-v172">
      <button class="chat-back-v172" @click="router.back()"><Icon name="back" :size="19" /></button>
      <div class="chat-event-v172">
        <b>{{ event?.title || 'Чат события' }}</b>
        <small>{{ event ? `${event.people} участников` : 'участники' }} · <span :class="realtime.status">{{ realtime.connected ? 'онлайн' : 'подключаемся' }}</span></small>
      </div>
      <button class="chat-event-link-v172" @click="router.push(`/event/${eventId}`)"><Icon name="arrow" :size="17" /></button>
    </header>

    <div ref="box" class="messages messages-v172">
      <template v-if="chat.loadingMessages && !chat.messages.length"><SkeletonRow v-for="i in 4" :key="i" /></template>
      <EmptyState v-else-if="!chat.messages.length" icon="chat" title="Сообщений пока нет" text="Начните разговор — чат остаётся только внутри V I B E." />

      <template v-for="(m, index) in chat.messages" :key="m.id">
        <div class="message-v172" :class="{ mine: m.sender_id === session.user?.id, grouped: !isGroupStart(index) }">
          <div class="message-avatar-slot">
            <Avatar v-if="m.sender_id !== session.user?.id && isGroupEnd(index)" :name="m.sender?.display_name || 'Гость'" :src="m.sender?.avatar_url" size="sm" />
          </div>

          <div
            class="bubble-v172"
            :class="{ 'group-start': isGroupStart(index), 'group-end': isGroupEnd(index) }"
            @pointerdown="startHold(m)"
            @pointerup="cancelHold"
            @pointercancel="cancelHold"
            @pointerleave="cancelHold"
            @contextmenu.prevent="openMenu(m)"
          >
            <b v-if="m.sender_id !== session.user?.id && isGroupStart(index)" class="message-author-v172">{{ m.sender?.display_name || 'Гость' }}</b>
            <div v-if="parts(m.text).quote" class="reply-quote-v172">{{ parts(m.text).quote }}</div>
            <p>{{ parts(m.text).body }}</p>
            <div class="message-meta-v172"><span v-if="m.edited_at">изменено · </span>{{ formatTime(m.created_at) }}</div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="replyTo" class="reply-bar-v172">
      <div><small>Ответ для {{ senderName(replyTo) }}</small><b>{{ replyTo.text.slice(0, 70) }}</b></div>
      <button @click="replyTo = null">×</button>
    </div>

    <form class="chat-composer chat-composer-v172" @submit.prevent="send">
      <button type="button" class="composer-tool-v172" aria-label="Дополнительно"><Icon name="plus" :size="18" /></button>
      <textarea v-model="text" rows="1" maxlength="2000" placeholder="Сообщение…" @keydown.enter.exact.prevent="send"></textarea>
      <button class="composer-send-v172" aria-label="Отправить"><Icon name="send" :size="18" /></button>
    </form>

    <Transition name="menu-fade">
      <div v-if="menuMessage" class="message-menu-backdrop" @click.self="menuMessage = null">
        <div class="message-menu-v172">
          <button @click="setReply(menuMessage)"><Icon name="chat" :size="17" />Ответить</button>
          <button @click="copyText(menuMessage)"><Icon name="share" :size="17" />Копировать</button>
          <button v-if="menuMessage.sender_id === session.user?.id" @click="edit(menuMessage)">Изменить</button>
          <button v-if="menuMessage.sender_id === session.user?.id" class="danger" @click="remove(menuMessage)">Удалить</button>
          <button class="cancel" @click="menuMessage = null">Отмена</button>
        </div>
      </div>
    </Transition>
  </section>
</template>
