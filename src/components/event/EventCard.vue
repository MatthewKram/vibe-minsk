<script setup lang="ts">
import type { EventItem } from '@/types/domain';
import {formatPrice,formatTime} from '@/services/format';
import {eventCover} from '@/services/covers';
import Icon from '@/components/ui/Icon.vue';
import Avatar from '@/components/ui/Avatar.vue';
const props=defineProps<{event:EventItem}>();
const emit=defineEmits<{favorite:[id:string]}>();
const spots=()=>Math.max(0,props.event.capacity-props.event.people);
</script>
<template><article class="event-card">
  <RouterLink :to="`/event/${event.id}`" class="event-media" :style="{backgroundImage:`linear-gradient(180deg,rgba(4,4,6,.05) 15%,rgba(4,4,6,.88) 100%),url('${eventCover(event.kind,event.coverUrl)}')`}">
    <div class="event-card-top"><span class="kind-pill">{{event.vibe||event.kind}}</span><button class="heart" @click.prevent.stop="emit('favorite',event.id)"><Icon name="heart" :class="{filled:event.favorite}"/></button></div>
    <div class="event-copy">
      <div class="event-location"><span>{{event.district}}</span><i></i><span>{{formatTime(event.startAt)}}</span></div>
      <h3>{{event.title}}</h3>
      <p v-if="event.desc">{{event.desc}}</p>
      <div class="event-meta-row"><span class="price-pill">{{formatPrice(event.price)}}</span><span>{{event.people}} идут</span><span>{{spots()?`${spots()} мест`:'мест нет'}}</span></div>
      <div v-if="event.organizer" class="event-host"><Avatar :name="event.organizer.name" :src="event.organizer.avatarUrl" size="sm"/><span>{{event.organizer.name}}</span><small v-if="event.organizer.verified">✓</small></div>
    </div>
  </RouterLink>
</article></template>
