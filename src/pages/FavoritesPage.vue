<script setup lang="ts">
import { onMounted } from 'vue';
import TopBar from '@/components/ui/TopBar.vue';
import EventCard from '@/components/event/EventCard.vue';
import SkeletonEventCard from '@/components/ui/SkeletonEventCard.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useEventsStore } from '@/stores/events';
import { telegram } from '@/services/telegram';
const events=useEventsStore();
onMounted(()=>events.loadFavorites());
async function fav(id:string){telegram.haptic('light');await events.toggleFavorite(id);await events.loadFavorites();}
</script>
<template><section class="screen"><TopBar back title="Избранное"/><header class="page-title"><small>СОХРАНЕНО</small><h1>Избранное</h1><p>События, к которым хочется вернуться.</p></header><div v-if="events.loadingFavorites" class="stack"><SkeletonEventCard/><SkeletonEventCard/></div><EmptyState v-else-if="!events.favorites.length" icon="heart" title="Пока пусто" text="Нажимайте на сердце в карточках — события будут храниться здесь в вашем профиле." action="Найти события" @action="$router.push('/')"/><div v-else class="stack favorites-list"><EventCard v-for="e in events.favorites" :key="e.id" :event="e" @favorite="fav"/></div></section></template>
