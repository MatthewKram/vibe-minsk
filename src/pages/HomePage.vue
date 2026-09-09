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

const store = useEventsStore();
const session = useSessionStore();
const q = useQuery({ queryKey: ['events'], queryFn: () => api.getParsed('/api/events', eventsResponseSchema) });
watchEffect(() => { if (q.data.value) store.items = q.data.value.events; });

const feature = computed(() => store.filtered[0]);
const live = computed(() => store.filtered.slice(1, 5));
const close = computed(() => store.filtered.filter(e => Math.max(0, e.capacity - e.people) <= 5 && e.capacity > e.people).slice(0, 5));
const people = computed(() => store.items.filter(e => e.organizer).slice(0, 5));
const moods = [['all', 'Все'], ['party', 'Тусовки'], ['home', 'Домашние'], ['bar', 'Бары'], ['music', 'Музыка']];

async function fav(id: string) {
  if (session.publicOnly) return;
  await store.toggleFavorite(id);
}
</script>

<template>
  <section class="screen home">
    <TopBar />

    <div v-if="session.publicOnly" class="auth-banner auth-banner-compact">
      <div><b>Просмотр без входа</b><span>Открой V I B E в Telegram, чтобы участвовать.</span></div>
      <a :href="session.config.appLinkBase || '#'">Открыть</a>
    </div>

    <header class="home-heading">
      <div>
        <small>СЕГОДНЯ В МИНСКЕ</small>
        <h1>Куда идём?</h1>
        <p>{{ store.items.length }} событий и компаний рядом</p>
      </div>
      <RouterLink to="/map" class="home-map-button" aria-label="Открыть карту"><Icon name="map" :size="18" /></RouterLink>
    </header>

    <div class="search search-compact">
      <Icon name="search" :size="18" />
      <input v-model="store.query" placeholder="Событие, район или настроение" />
    </div>

    <div class="quick-filters compact-filter-row">
      <button v-for="m in moods" :key="m[0]" :class="{ active: store.kind === m[0] }" @click="store.kind = String(m[0])">{{ m[1] }}</button>
    </div>

    <section v-if="feature" class="feature-section">
      <div class="section-head section-head-tight">
        <div><h2>Выбор на вечер</h2><small>самое интересное сейчас</small></div>
        <RouterLink to="/map">Все на карте</RouterLink>
      </div>
      <EventCard :event="feature" @favorite="fav" />
    </section>

    <section v-if="live.length" class="section section-tight">
      <div class="section-head section-head-tight"><div><h2>Сейчас рядом</h2><small>уже начинается</small></div></div>
      <div class="h-scroll live-scroll native-rail">
        <RouterLink v-for="e in live" :key="e.id" :to="`/event/${e.id}`" class="native-mini-card">
          <div class="native-mini-thumb" :style="{ backgroundImage: `url('${eventCover(e.kind, e.coverUrl)}')` }"></div>
          <div class="native-mini-copy">
            <small>{{ e.district }} · {{ formatTime(e.startAt) }}</small>
            <b>{{ e.title }}</b>
            <span>{{ e.people }} идут · {{ Math.max(0, e.capacity - e.people) }} мест</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <section v-if="people.length" class="section section-tight">
      <div class="section-head section-head-tight"><div><h2>Люди рядом</h2><small>уже строят планы</small></div></div>
      <div class="people-grid">
        <RouterLink v-for="e in people" :key="e.id" :to="`/event/${e.id}`" class="person-row">
          <Avatar :name="e.organizer?.name || 'VIBE'" :src="e.organizer?.avatarUrl" size="md" />
          <div><b>{{ e.organizer?.name }}</b><small>{{ e.district }}</small><span>{{ e.title }}</span></div>
          <Icon name="arrow" :size="16" />
        </RouterLink>
      </div>
    </section>

    <section v-if="close.length" class="section section-tight">
      <div class="section-head section-head-tight"><div><h2>Последние места</h2><small>пока ещё можно успеть</small></div></div>
      <div class="stack compact-stack">
        <RouterLink v-for="e in close" :key="e.id" :to="`/event/${e.id}`" class="compact-event-row">
          <div class="compact-event-thumb" :style="{ backgroundImage: `url('${eventCover(e.kind, e.coverUrl)}')` }"></div>
          <div><small>{{ e.district }} · {{ formatTime(e.startAt) }}</small><b>{{ e.title }}</b><span>Осталось {{ Math.max(0, e.capacity - e.people) }} мест</span></div>
          <Icon name="arrow" :size="16" />
        </RouterLink>
      </div>
    </section>
  </section>
</template>
