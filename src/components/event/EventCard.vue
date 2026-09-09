<script setup lang="ts">
import type { EventItem } from '@/types/domain';
import { formatPrice, formatTime } from '@/services/format';
import { eventCover } from '@/services/covers';
import Icon from '@/components/ui/Icon.vue';
import Avatar from '@/components/ui/Avatar.vue';

const props = defineProps<{ event: EventItem; eager?: boolean }>();
const emit = defineEmits<{ favorite: [id: string] }>();
const spots = () => Math.max(0, props.event.capacity - props.event.people);
</script>

<template>
  <article class="event-card event-card-native">
    <RouterLink :to="`/event/${event.id}`" class="event-card-link">
      <div class="event-media event-media-native">
        <img class="event-media-image" :src="eventCover(event.kind, event.coverUrl)" :alt="event.title" :loading="eager ? 'eager' : 'lazy'" :fetchpriority="eager ? 'high' : 'auto'" decoding="async" />
        <span class="kind-pill">{{ event.vibe || event.kind }}</span>
        <button class="heart heart-overlay" @click.prevent.stop="emit('favorite', event.id)" aria-label="В избранное"><Icon name="heart" :class="{ filled: event.favorite }" /></button>
      </div>

      <div class="event-card-body">
        <div class="event-kicker"><span>{{ event.district }}</span><i></i><span>{{ formatTime(event.startAt) }}</span></div>
        <h3>{{ event.title }}</h3>
        <p v-if="event.desc">{{ event.desc }}</p>
        <div class="event-native-meta">
          <span class="price">{{ formatPrice(event.price) }}</span>
          <span>{{ event.people }} идут</span>
          <span>{{ spots() ? `${spots()} мест` : 'мест нет' }}</span>
        </div>
        <div v-if="event.organizer" class="event-native-host">
          <Avatar :name="event.organizer.name" :src="event.organizer.avatarUrl" size="sm" />
          <span>{{ event.organizer.name }}</span>
          <small v-if="event.organizer.verified">✓</small>
        </div>
      </div>
    </RouterLink>
  </article>
</template>
