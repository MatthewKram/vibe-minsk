<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import VibeMap from '@/components/map/VibeMap.vue';
import BottomSheet from '@/components/ui/BottomSheet.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Icon from '@/components/ui/Icon.vue';
import { useEventsStore } from '@/stores/events';
import { useSessionStore } from '@/stores/session';
import { formatTime } from '@/services/format';
import { eventCover } from '@/services/covers';
import { telegram } from '@/services/telegram';
import type { EventItem } from '@/types/domain';
const events=useEventsStore(),session=useSessionStore(),mapReady=ref(false);const selected=ref<EventItem|null>(null),filter=ref<'all'|'home'|'free'|'now'>('all'),query=ref(''),sheetState=ref<'peek'|'mid'|'full'>('peek'),map=ref<{ locate: () => void; zoomIn:()=>void; zoomOut:()=>void; reset:()=>void; focus:(e:EventItem)=>void }|null>(null);
const points=computed(()=>{const q=query.value.trim().toLowerCase();return events.items.filter(e=>{if(filter.value==='home'&&e.kind!=='home')return false;if(filter.value==='free'&&e.price!==0)return false;if(filter.value==='now'&&Math.abs(new Date(e.startAt).getTime()-Date.now())>=4*3600000)return false;if(q&&!`${e.title} ${e.desc} ${e.district} ${e.tags.join(' ')}`.toLowerCase().includes(q))return false;return true})});
function selectEvent(e:EventItem){selected.value=e;sheetState.value='peek'}
function setFilter(v:'all'|'home'|'free'|'now'){telegram.select();filter.value=v}
function closeSheet(){selected.value=null;sheetState.value='peek'}
async function shareSelected(){if(!selected.value)return;const url=session.config.appLinkBase?`${session.config.appLinkBase}?startapp=${encodeURIComponent(`event_${selected.value.id}`)}`:`${location.origin}/event/${selected.value.id}`;await telegram.share(url,`${selected.value.title} · ${selected.value.district} · ${formatTime(selected.value.startAt)}`)}
watch(points,()=>{if(selected.value&&!points.value.some(e=>e.id===selected.value?.id))closeSheet()});
</script>
<template><section class="map-page">
  <VibeMap ref="map" :events="points" @select="selectEvent" @ready="mapReady=true"/><Transition name="map-fade"><div v-if="!mapReady" class="map-skeleton"><div class="map-skeleton-grid"></div><span>Готовим карту Минска…</span></div></Transition>
  <div class="map-chrome"><div class="map-topline"><div><small>МИНСК · {{points.length}} СОБЫТИЙ</small><h1>Карта вечера</h1></div><button class="map-locate" @click="map?.locate()"><Icon name="navigation" :size="18"/></button></div><div class="map-search"><Icon name="search" :size="16"/><input v-model="query" placeholder="Событие, район или тег"/></div><div class="map-filters"><button :class="{active:filter==='now'}" @click="setFilter('now')">Сейчас</button><button :class="{active:filter==='all'}" @click="setFilter('all')">Сегодня</button><button :class="{active:filter==='home'}" @click="setFilter('home')">Домашние</button><button :class="{active:filter==='free'}" @click="setFilter('free')">Бесплатно</button></div></div>
  <div v-if="events.loading" class="map-loading-pill"><span></span>Обновляем события</div>
  <div class="map-controls"><button aria-label="Приблизить" @click="map?.zoomIn()">+</button><button aria-label="Отдалить" @click="map?.zoomOut()">−</button><button aria-label="Вернуть Минск" @click="map?.reset()"><Icon name="refresh" :size="18"/></button></div>
  <div v-if="!events.loading&&!points.length" class="map-empty"><EmptyState icon="map" title="На карте пусто" text="По этим условиям событий нет. Сбросьте фильтры или попробуйте другой запрос." action="Показать всё" @action="query='';setFilter('all')"/></div>
  <Transition name="sheet"><BottomSheet v-if="selected" v-model="sheetState" @close="closeSheet"><button class="sheet-close" @click="closeSheet">×</button><div class="map-sheet-grid"><div class="map-sheet-cover"><img :src="eventCover(selected.kind,selected.coverUrl)" :alt="selected.title" loading="lazy" decoding="async"/></div><div class="map-sheet-copy"><small>{{selected.district}} · {{formatTime(selected.startAt)}}</small><h2>{{selected.title}}</h2><p>{{selected.people}} идут · {{Math.max(0,selected.capacity-selected.people)}} мест</p><p v-if="sheetState!=='peek'" class="map-sheet-desc">{{selected.desc}}</p><div v-if="sheetState==='full'" class="tags tags-native"><span v-for="t in selected.tags" :key="t">{{t}}</span></div><div class="map-sheet-actions"><button class="secondary" @click="shareSelected"><Icon name="share" :size="15"/>Поделиться</button><RouterLink :to="`/event/${selected.id}`" class="primary link-button" @click="telegram.haptic('light')">Открыть</RouterLink></div></div></div></BottomSheet></Transition>
</section></template>
