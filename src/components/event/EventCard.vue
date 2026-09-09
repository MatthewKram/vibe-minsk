<script setup lang="ts">
import type { EventItem } from '@/types/domain';import {formatPrice,formatTime} from '@/services/format';import Icon from '@/components/ui/Icon.vue';
const props=defineProps<{event:EventItem}>();const emit=defineEmits<{favorite:[id:string]}>();
const fallback=(k:string)=>`/assets/covers/${k}.svg`;const spots=()=>Math.max(0,props.event.capacity-props.event.people);
</script>
<template><article class="event-card"><RouterLink :to="`/event/${event.id}`" class="event-media" :style="{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.8)),url('${event.coverUrl||fallback(event.kind)}')`}"><span class="kind-pill">{{event.vibe||event.kind}}</span><button class="heart" @click.prevent.stop="emit('favorite',event.id)"><Icon name="heart" :class="{filled:event.favorite}"/></button><div class="event-copy"><small>{{event.district}} · {{formatTime(event.startAt)}}</small><h3>{{event.title}}</h3><div><span>{{formatPrice(event.price)}}</span><span>{{spots()?`${spots()} мест`:'мест нет'}}</span></div></div></RouterLink></article></template>
