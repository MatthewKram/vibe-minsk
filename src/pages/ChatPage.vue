<script setup lang="ts">
import { onBeforeUnmount, onMounted, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import TopBar from '@/components/ui/TopBar.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Icon from '@/components/ui/Icon.vue';
import SkeletonRow from '@/components/ui/SkeletonRow.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useChatStore } from '@/stores/chat';
import { useSessionStore } from '@/stores/session';
import { useRealtimeStore } from '@/stores/realtime';
import { formatTime } from '@/services/format';
import { telegram } from '@/services/telegram';
const route=useRoute(),chat=useChatStore(),session=useSessionStore(),realtime=useRealtimeStore();const eventId=String(route.params.eventId),text=ref(''),box=ref<HTMLElement|null>(null);onMounted(()=>chat.open(eventId));onBeforeUnmount(()=>chat.close());watch(()=>chat.messages.length,async()=>{await nextTick();if(box.value)box.value.scrollTo({top:box.value.scrollHeight,behavior:'smooth'})});
async function send(){const value=text.value.trim();if(!value)return;text.value='';telegram.haptic('light');await chat.send(eventId,value)}
async function edit(id:string,current:string){const t=prompt('Изменить сообщение:',current);if(t?.trim()){await chat.edit(id,t.trim());telegram.notify('success')}}
async function remove(id:string){if(confirm('Удалить сообщение?')){await chat.remove(id);telegram.notify('success')}}
</script>
<template><section class="screen chat-page"><TopBar back title="Чат участников"/>
  <div class="chat-status"><span class="status-dot" :class="realtime.status"></span><b>{{realtime.connected?'Онлайн':'Подключаем обновления…'}}</b><small>внутренний чат V I B E</small></div>
  <div ref="box" class="messages"><template v-if="chat.loadingMessages && !chat.messages.length"><SkeletonRow v-for="i in 4" :key="i"/></template><EmptyState v-else-if="!chat.messages.length" icon="chat" title="Сообщений пока нет" text="Напишите первым — сообщения остаются только внутри V I B E."/><div v-for="m in chat.messages" :key="m.id" class="message" :class="{mine:m.sender_id===session.user?.id}"><Avatar v-if="m.sender_id!==session.user?.id" :name="m.sender?.display_name||'Гость'" :src="m.sender?.avatar_url" size="sm"/><div class="bubble"><header><b>{{m.sender?.display_name||'Вы'}}</b><time>{{formatTime(m.created_at)}}</time></header><p>{{m.text}}</p><small v-if="m.edited_at">изменено</small><footer v-if="m.sender_id===session.user?.id"><button @click="edit(m.id,m.text)">Изменить</button><button @click="remove(m.id)">Удалить</button></footer></div></div></div>
  <form class="chat-composer" @submit.prevent="send"><textarea v-model="text" rows="1" maxlength="2000" placeholder="Написать участникам…" @keydown.enter.exact.prevent="send"></textarea><button aria-label="Отправить"><Icon name="send"/></button></form>
</section></template>
