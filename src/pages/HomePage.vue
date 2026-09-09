<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import TopBar from '@/components/ui/TopBar.vue';import EventCard from '@/components/event/EventCard.vue';import Icon from '@/components/ui/Icon.vue';
import { api } from '@/services/api';import { eventsResponseSchema } from '@/schemas/api';import { useEventsStore } from '@/stores/events';import { useSessionStore } from '@/stores/session';
const store=useEventsStore();const session=useSessionStore();
const q=useQuery({queryKey:['events'],queryFn:()=>api.getParsed('/api/events',eventsResponseSchema)});watchEffect(()=>{if(q.data.value)store.items=q.data.value.events});
const feature=computed(()=>store.filtered[0]);const live=computed(()=>store.filtered.slice(1,5));const close=computed(()=>store.filtered.filter(e=>Math.max(0,e.capacity-e.people)<=5&&e.capacity>e.people).slice(0,5));
async function fav(id:string){if(session.publicOnly)return;await store.toggleFavorite(id)}
</script>
<template><section class="screen home"><TopBar/>
  <div v-if="session.publicOnly" class="auth-banner"><b>Просмотр без входа</b><span>{{session.authError}}</span></div>
  <header class="home-intro"><small>СЕГОДНЯ · МИНСК</small><h1>Сегодня есть планы.</h1><p>Люди, встречи и места рядом — без бесконечного каталога.</p></header>
  <div class="search"><Icon name="search"/><input v-model="store.query" placeholder="Куда, с кем или какой вайб?"></div>
  <EventCard v-if="feature" :event="feature" @favorite="fav"/>
  <section v-if="live.length" class="section"><div class="section-head"><div><h2>Прямо сейчас</h2><small>город уже в движении</small></div></div><div class="h-scroll"><RouterLink v-for="e in live" :key="e.id" :to="`/event/${e.id}`" class="mini-card"><div class="mini-cover" :style="{backgroundImage:`url('${e.coverUrl||`/assets/covers/${e.kind}.svg`}')`}"></div><div><small>{{e.district}}</small><b>{{e.title}}</b><span>{{e.people}} идут</span></div></RouterLink></div></section>
  <section class="section"><div class="section-head"><div><h2>По настроению</h2><small>быстрый вход</small></div></div><div class="mood-grid"><button v-for="k in [['party','Тусовки'],['home','Домашние'],['bar','Бары'],['music','Музыка']]" :key="k[0]" @click="store.kind=String(k[0])"><span>{{k[1]}}</span><small>{{store.items.filter(e=>e.kind===k[0]).length}} рядом</small></button></div></section>
  <section v-if="close.length" class="section"><div class="section-head"><div><h2>Последние места</h2><small>лучше не откладывать</small></div></div><div class="stack"><RouterLink v-for="e in close" :key="e.id" :to="`/event/${e.id}`" class="list-row"><div class="list-thumb" :style="{backgroundImage:`url('${e.coverUrl||`/assets/covers/${e.kind}.svg`}')`}"></div><div><small>{{e.district}}</small><b>{{e.title}}</b><span>Осталось {{Math.max(0,e.capacity-e.people)}} мест</span></div><Icon name="arrow"/></RouterLink></div></section>
</section></template>
