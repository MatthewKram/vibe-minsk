<script setup lang="ts">
import { onMounted } from 'vue';
import TopBar from '@/components/ui/TopBar.vue';
import Icon from '@/components/ui/Icon.vue';
import SkeletonRow from '@/components/ui/SkeletonRow.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useEventsStore } from '@/stores/events';
import { formatDate } from '@/services/format';
import { eventStatusLabel } from '@/services/status';
const s=useEventsStore();onMounted(()=>s.loadMy());
</script>
<template><section class="screen"><TopBar back title="Мои события"/><header class="page-title"><small>ОРГАНИЗАТОР</small><h1>Мои события</h1><p>{{s.my.length}} создано</p></header><div v-if="s.loadingMy" class="stack"><SkeletonRow v-for="i in 3" :key="i"/></div><div v-else class="stack"><RouterLink v-for="e in s.my" :key="e.id" :to="`/manage/${e.id}`" class="manage-row"><div><small>{{eventStatusLabel(e.status)}} · {{formatDate(e.startAt)}}</small><b>{{e.title}}</b><span>{{e.people}} / {{e.capacity}} участников</span></div><Icon name="arrow"/></RouterLink><EmptyState v-if="!s.my.length" icon="spark" title="Событий пока нет" text="Создай первый вечер — он сразу появится в ленте и на карте." action="Создать событие" @action="$router.push('/create')"/></div></section></template>
