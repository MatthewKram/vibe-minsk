<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import TopBar from '@/components/ui/TopBar.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Icon from '@/components/ui/Icon.vue';
import SkeletonRow from '@/components/ui/SkeletonRow.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useInboxStore } from '@/stores/inbox';
import { requestStatusLabel } from '@/services/status';
import { telegram } from '@/services/telegram';
const route=useRoute(),inbox=useInboxStore();const id=String(route.params.id);onMounted(()=>inbox.loadOne(id));const r=computed(()=>inbox.current?.id===id?inbox.current:null);
async function resolve(decision:'accepted'|'declined'){telegram.haptic('medium');await inbox.resolve(id,decision);telegram.notify(decision==='accepted'?'success':'warning')}
</script>
<template><section class="screen"><TopBar back title="Заявка гостя"/><div v-if="inbox.loadingOne&&!r" class="request-loading"><SkeletonRow/><SkeletonRow/></div><EmptyState v-else-if="!r" icon="inbox" title="Заявка не найдена" text="Возможно, она уже была отменена или недоступна этому аккаунту."/><div v-else class="request-detail"><Avatar :name="r.applicant?.display_name||'Гость'" :src="r.applicant?.avatar_url" size="lg"/><small>Хочет попасть на</small><h1>{{r.event?.title}}</h1><h2>{{r.applicant?.display_name}}</h2><p class="lead">{{r.note||'Пользователь не добавил сообщение.'}}</p><div class="inline-stats"><span>★ {{r.applicant?.rating||5}}</span><span v-if="r.applicant?.verified"><Icon name="shield" :size="14"/> Telegram подтверждён</span><span>{{requestStatusLabel(r.status)}}</span></div><div v-if="r.status==='pending'" class="action-row"><button class="secondary" @click="resolve('declined')">Отклонить</button><button class="primary" @click="resolve('accepted')">Принять гостя</button></div><RouterLink v-else-if="r.status==='accepted'" :to="`/chat/${r.event_id}`" class="primary link-button">Открыть чат события</RouterLink></div></section></template>
