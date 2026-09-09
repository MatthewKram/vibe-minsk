<script setup lang="ts">
import { computed } from 'vue';import { useRoute, useRouter } from 'vue-router';import { useQuery, useQueryClient } from '@tanstack/vue-query';
import TopBar from '@/components/ui/TopBar.vue';import Icon from '@/components/ui/Icon.vue';import Avatar from '@/components/ui/Avatar.vue';
import { api } from '@/services/api';import { eventResponseSchema } from '@/schemas/api';import { useEventsStore } from '@/stores/events';import { useSessionStore } from '@/stores/session';import { formatPrice,formatDate } from '@/services/format';
const route=useRoute(),router=useRouter(),events=useEventsStore(),session=useSessionStore(),qc=useQueryClient();const id=String(route.params.id);
const q=useQuery({queryKey:['event',id],queryFn:()=>api.getParsed(`/api/events/${id}`,eventResponseSchema)});const event=computed(()=>q.data.value?.event||events.current);
async function join(){if(session.publicOnly)return alert('Откройте приложение через Telegram.');const note=prompt('Пару слов организатору:','Привет! Хочу присоединиться.');if(note===null)return;await events.join(id,note);await qc.invalidateQueries({queryKey:['event',id]});}
async function cancel(){if(confirm('Отменить заявку?')){await events.cancelRequest(id);await qc.invalidateQueries({queryKey:['event',id]});}}
async function favorite(){await events.toggleFavorite(id);await qc.invalidateQueries({queryKey:['event',id]});}
</script>
<template><section class="screen"><TopBar back title="Назад"/>
  <div v-if="event" class="event-detail"><div class="detail-cover" :style="{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.92)),url('${event.coverUrl||`/assets/covers/${event.kind}.svg`}')`}"><button class="heart floating" @click="favorite"><Icon name="heart"/></button><div class="detail-cover-copy"><span>{{event.vibe}}</span><h1>{{event.title}}</h1><small>{{event.district}} · {{formatDate(event.startAt)}}</small></div></div>
    <div class="detail-body"><p class="lead">{{event.desc}}</p><div class="inline-stats"><span><Icon name="users"/> {{event.people}} идут</span><span><Icon name="ticket"/> {{Math.max(0,event.capacity-event.people)}} мест</span><span><Icon name="shield"/> {{event.age}}</span></div>
    <div class="organizer" v-if="event.organizer"><Avatar :name="event.organizer.name" :src="event.organizer.avatarUrl"/><div><small>Организатор</small><b>{{event.organizer.name}}</b><span>★ {{event.organizer.rating}} · {{event.organizer.verified?'подтверждён':''}}</span></div></div>
    <div class="tags"><span v-for="t in event.tags" :key="t">{{t}}</span></div>
    <div v-if="event.privateAddress" class="private-box"><small>Приватная локация</small><b>{{event.privateAddress}}</b></div>
    <button v-if="event.owner" class="primary" @click="router.push(`/manage/${event.id}`)">Управлять событием</button>
    <button v-else-if="event.member" class="primary" @click="router.push(`/chat/${event.id}`)"><Icon name="chat"/> В чат участников</button>
    <button v-else-if="event.requestStatus==='pending'" class="secondary" @click="cancel">Отменить заявку</button>
    <button v-else class="primary" @click="join">{{event.requiresApproval?'Подать заявку':'Присоединиться'}} · {{formatPrice(event.price)}}</button>
  </div></div><div v-else class="loading">Загружаем событие…</div>
</section></template>
