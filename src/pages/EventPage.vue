<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import TopBar from '@/components/ui/TopBar.vue';
import Icon from '@/components/ui/Icon.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { api } from '@/services/api';
import { eventResponseSchema } from '@/schemas/api';
import { useEventsStore } from '@/stores/events';
import { useSessionStore } from '@/stores/session';
import { formatPrice, formatDate } from '@/services/format';
import { eventCover } from '@/services/covers';

const route = useRoute(), router = useRouter(), events = useEventsStore(), session = useSessionStore(), qc = useQueryClient();
const id = String(route.params.id);
const q = useQuery({ queryKey: ['event', id], queryFn: () => api.getParsed(`/api/events/${id}`, eventResponseSchema) });
const event = computed(() => q.data.value?.event || events.current);
async function join() { if (session.publicOnly) return alert('Откройте приложение через Telegram.'); const note = prompt('Пару слов организатору:', 'Привет! Хочу присоединиться.'); if (note === null) return; await events.join(id, note); await qc.invalidateQueries({ queryKey: ['event', id] }); }
async function cancel() { if (confirm('Отменить заявку?')) { await events.cancelRequest(id); await qc.invalidateQueries({ queryKey: ['event', id] }); } }
async function favorite() { await events.toggleFavorite(id); await qc.invalidateQueries({ queryKey: ['event', id] }); }
</script>

<template>
  <section class="screen event-page event-page-native">
    <TopBar back title="Назад" />
    <div v-if="event" class="event-detail-native">
      <div class="detail-cover detail-cover-native" :style="{ backgroundImage: `url('${eventCover(event.kind, event.coverUrl)}')` }">
        <button class="heart floating detail-heart" @click="favorite"><Icon name="heart" /></button>
      </div>

      <div class="detail-native-body">
        <div class="detail-kicker"><span>{{ event.vibe }}</span><i></i><span>{{ event.district }} · {{ formatDate(event.startAt) }}</span></div>
        <h1>{{ event.title }}</h1>
        <p class="detail-lead">{{ event.desc }}</p>

        <div class="detail-inline-stats">
          <span><Icon name="users" :size="15" /><b>{{ event.people }}</b> идут</span>
          <span><Icon name="ticket" :size="15" /><b>{{ Math.max(0, event.capacity - event.people) }}</b> мест</span>
          <span><Icon name="shield" :size="15" /><b>{{ event.age }}</b></span>
        </div>

        <div class="organizer organizer-native" v-if="event.organizer">
          <Avatar :name="event.organizer.name" :src="event.organizer.avatarUrl" size="md" />
          <div><small>Организатор</small><b>{{ event.organizer.name }} <i v-if="event.organizer.verified">✓</i></b><span>★ {{ event.organizer.rating }} · отвечает быстро</span></div>
          <Icon name="arrow" :size="16" />
        </div>

        <div class="tags tags-native"><span v-for="t in event.tags" :key="t">{{ t }}</span></div>
        <div v-if="event.privateAddress" class="private-box private-box-native"><small>Приватная локация</small><b>{{ event.privateAddress }}</b><span>Адрес доступен только участникам.</span></div>

        <div class="event-actions event-actions-native">
          <button v-if="event.owner" class="primary" @click="router.push(`/manage/${event.id}`)">Управлять</button>
          <button v-else-if="event.member" class="primary" @click="router.push(`/chat/${event.id}`)"><Icon name="chat" :size="17" /> В чат</button>
          <button v-else-if="event.requestStatus === 'pending'" class="secondary" @click="cancel">Отменить заявку</button>
          <button v-else class="primary" @click="join">{{ event.requiresApproval ? 'Подать заявку' : 'Присоединиться' }} · {{ formatPrice(event.price) }}</button>
        </div>
      </div>
    </div>
    <div v-else class="loading">Загружаем событие…</div>
  </section>
</template>
