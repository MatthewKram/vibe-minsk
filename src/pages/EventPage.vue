<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import TopBar from '@/components/ui/TopBar.vue';
import SkeletonEventCard from '@/components/ui/SkeletonEventCard.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Icon from '@/components/ui/Icon.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { api } from '@/services/api';
import { eventResponseSchema } from '@/schemas/api';
import { useEventsStore } from '@/stores/events';
import { useSessionStore } from '@/stores/session';
import { formatPrice, formatDate } from '@/services/format';
import { eventCover } from '@/services/covers';
import { telegram } from '@/services/telegram';

const route = useRoute();
const router = useRouter();
const events = useEventsStore();
const session = useSessionStore();
const qc = useQueryClient();
const id = String(route.params.id);
const q = useQuery({ queryKey: ['event', id], queryFn: () => api.getParsed(`/api/events/${id}`, eventResponseSchema), staleTime: 15_000 });
const event = computed(() => q.data.value?.event || (events.current?.id === id ? events.current : null));

async function join() {
  if (session.publicOnly) return alert('Откройте приложение через Telegram.');
  const note = prompt('Пару слов организатору:', 'Привет! Хочу присоединиться.');
  if (note === null) return;
  telegram.haptic('medium');
  await events.join(id, note);
  telegram.notify('success');
  await qc.invalidateQueries({ queryKey: ['event', id] });
}
async function cancel() {
  if (confirm('Отменить заявку?')) {
    await events.cancelRequest(id);
    telegram.notify('success');
    await qc.invalidateQueries({ queryKey: ['event', id] });
  }
}
async function favorite() {
  telegram.haptic('light');
  await events.toggleFavorite(id);
  await qc.invalidateQueries({ queryKey: ['event', id] });
}
function openOrganizer() {
  const username = event.value?.organizer?.username;
  if (username) telegram.openLink(`https://t.me/${username.replace(/^@/, '')}`);
}
async function share() {
  if (!event.value) return;
  const url = session.config.appLinkBase
    ? `${session.config.appLinkBase}?startapp=${encodeURIComponent(`event_${event.value.id}`)}`
    : `${location.origin}/event/${event.value.id}`;
  await telegram.share(url, `${event.value.title} · ${event.value.district} · ${formatDate(event.value.startAt)}`);
}
</script>

<template>
  <section class="screen event-page event-page-v172">
    <TopBar back title="Назад" />

    <div v-if="q.isPending.value" class="event-loading"><SkeletonEventCard /></div>
    <EmptyState
      v-else-if="q.isError.value || !event"
      icon="close"
      title="Событие не открылось"
      text="Возможно, организатор скрыл его или соединение временно недоступно."
      action="На главную"
      @action="router.push('/')"
    />

    <article v-else class="event-detail-v172">
      <div class="event-hero-v172">
        <img :src="eventCover(event.kind, event.coverUrl)" :alt="event.title" fetchpriority="high" decoding="async" />
        <div class="event-hero-shade"></div>

        <div class="event-hero-actions">
          <button class="event-hero-icon" aria-label="Поделиться" @click="share"><Icon name="share" :size="17" /></button>
          <button class="event-hero-icon" aria-label="Сохранить" @click="favorite"><Icon name="heart" :size="17" :class="{ filled: event.favorite }" /></button>
        </div>

        <div class="event-hero-copy">
          <span class="event-category-v172">{{ event.vibe }}</span>
          <div class="event-hero-meta">{{ event.district }} · {{ formatDate(event.startAt) }}</div>
          <h1>{{ event.title }}</h1>
        </div>
      </div>

      <div class="event-content-v172">
        <p class="event-lead-v172">{{ event.desc }}</p>

        <div class="tags tags-v172" v-if="event.tags?.length">
          <span v-for="tag in event.tags" :key="tag">{{ tag }}</span>
        </div>

        <div class="event-meta-badges">
          <span><Icon name="users" :size="14" /><b>{{ event.people }}</b> идут</span>
          <span><Icon name="ticket" :size="14" /><b>{{ Math.max(0, event.capacity - event.people) }}</b> мест</span>
          <span><Icon name="shield" :size="14" /><b>{{ event.age }}</b></span>
          <span class="price"><b>{{ formatPrice(event.price) }}</b></span>
        </div>

        <div class="event-going-v172" v-if="event.people > 0">
          <div class="event-going-stack" aria-hidden="true">
            <span v-for="n in Math.min(event.people, 4)" :key="n"></span>
          </div>
          <div><b>Уже собираются</b><small>{{ event.people }} {{ event.people === 1 ? 'участник' : 'участника' }} будут здесь</small></div>
        </div>

        <button class="organizer-card-v172" v-if="event.organizer" type="button" :class="{ clickable: !!event.organizer.username }" @click="openOrganizer">
          <Avatar :name="event.organizer.name" :src="event.organizer.avatarUrl" size="md" />
          <span>
            <small>Организатор</small>
            <b>{{ event.organizer.name }} <i v-if="event.organizer.verified">✓</i></b>
            <em>★ {{ event.organizer.rating }} · отвечает быстро</em>
          </span>
          <Icon name="arrow" :size="16" />
        </button>

        <div v-if="event.privateAddress" class="private-box private-box-v172">
          <small>Приватная локация</small>
          <b>{{ event.privateAddress }}</b>
          <span>Адрес доступен только участникам.</span>
        </div>

        <div class="event-actions event-actions-v172">
          <button v-if="event.owner" class="primary" @click="router.push(`/manage/${event.id}`)">Управлять</button>
          <button v-else-if="event.member" class="primary" @click="router.push(`/chat/${event.id}`)"><Icon name="chat" :size="17" /> В чат</button>
          <button v-else-if="event.requestStatus === 'pending'" class="secondary" @click="cancel">Отменить заявку</button>
          <button v-else class="primary" @click="join">{{ event.requiresApproval ? 'Подать заявку' : 'Присоединиться' }}</button>
        </div>
      </div>
    </article>
  </section>
</template>
