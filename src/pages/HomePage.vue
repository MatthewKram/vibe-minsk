<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import TopBar from '@/components/ui/TopBar.vue';
import EventCard from '@/components/event/EventCard.vue';
import Icon from '@/components/ui/Icon.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { api } from '@/services/api';
import { eventsResponseSchema } from '@/schemas/api';
import { useEventsStore } from '@/stores/events';
import { useSessionStore } from '@/stores/session';
import { eventCover } from '@/services/covers';
import { formatTime } from '@/services/format';
const store=useEventsStore();const session=useSessionStore();
const q=useQuery({queryKey:['events'],queryFn:()=>api.getParsed('/api/events',eventsResponseSchema)});watchEffect(()=>{if(q.data.value)store.items=q.data.value.events});
const feature=computed(()=>store.filtered[0]);
const live=computed(()=>store.filtered.slice(1,5));
const close=computed(()=>store.filtered.filter(e=>Math.max(0,e.capacity-e.people)<=5&&e.capacity>e.people).slice(0,5));
const people=computed(()=>store.items.filter(e=>e.organizer).slice(0,5));
const moods=[['all','Все'],['party','Тусовки'],['home','Домашние'],['bar','Бары'],['music','Музыка']];
async function fav(id:string){if(session.publicOnly)return;await store.toggleFavorite(id)}
</script>
<template><section class="screen home"><TopBar/>
  <div v-if="session.publicOnly" class="auth-banner"><div><b>Просмотр без входа</b><span>{{session.authError}}</span></div><a :href="session.config.appLinkBase||'#'">Открыть в Telegram</a></div>
  <header class="home-intro"><small>СЕГОДНЯ · МИНСК</small><h1>Город уже<br><em>в движении.</em></h1><p>Живые планы, компании и места рядом — без бесконечного каталога.</p></header>
  <div class="search"><Icon name="search"/><input v-model="store.query" placeholder="Куда сегодня?"/><button class="search-action" @click="store.query=''">Найти</button></div>
  <div class="quick-filters"><button v-for="m in moods" :key="m[0]" :class="{active:store.kind===m[0]}" @click="store.kind=String(m[0])">{{m[1]}}</button></div>
  <EventCard v-if="feature" :event="feature" @favorite="fav"/>

  <section v-if="live.length" class="section"><div class="section-head"><div><h2>Прямо сейчас</h2><small>город уже в движении</small></div><RouterLink to="/map">На карте</RouterLink></div><div class="h-scroll live-scroll"><RouterLink v-for="e in live" :key="e.id" :to="`/event/${e.id}`" class="mini-card"><div class="mini-cover" :style="{backgroundImage:`linear-gradient(180deg,transparent,rgba(0,0,0,.68)),url('${eventCover(e.kind,e.coverUrl)}')`}"><span>{{e.district}}</span></div><div><small>{{formatTime(e.startAt)}} · {{e.people}} идут</small><b>{{e.title}}</b><span>{{Math.max(0,e.capacity-e.people)}} мест осталось</span></div></RouterLink></div></section>

  <section v-if="people.length" class="section"><div class="section-head"><div><h2>Люди рядом</h2><small>уже строят планы</small></div></div><div class="people-strip"><RouterLink v-for="e in people" :key="e.id" :to="`/event/${e.id}`" class="person-card"><Avatar :name="e.organizer?.name||'VIBE'" :src="e.organizer?.avatarUrl" size="md"/><div><b>{{e.organizer?.name}}</b><small>{{e.district}} · {{e.title}}</small></div><Icon name="arrow" :size="18"/></RouterLink></div></section>

  <section v-if="close.length" class="section"><div class="section-head"><div><h2>Последние места</h2><small>лучше не откладывать</small></div></div><div class="stack"><RouterLink v-for="e in close" :key="e.id" :to="`/event/${e.id}`" class="list-row"><div class="list-thumb" :style="{backgroundImage:`url('${eventCover(e.kind,e.coverUrl)}')`}"></div><div><small>{{e.district}} · {{formatTime(e.startAt)}}</small><b>{{e.title}}</b><span>Осталось {{Math.max(0,e.capacity-e.people)}} мест</span></div><Icon name="arrow"/></RouterLink></div></section>
</section></template>
