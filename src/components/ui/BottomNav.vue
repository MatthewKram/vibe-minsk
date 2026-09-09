<script setup lang="ts">
import Icon from './Icon.vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session';
const route = useRoute();
const session = useSessionStore();
const active = (prefix: string) => route.path === prefix || route.path.startsWith(prefix + '/');
</script>

<template>
  <nav class="bottom-nav bottom-nav-native">
    <RouterLink to="/" :class="{ active: route.path === '/' }"><Icon name="home" :size="18" /><small>Главная</small></RouterLink>
    <RouterLink to="/map" :class="{ active: active('/map') }"><Icon name="map" :size="18" /><small>Карта</small></RouterLink>
    <RouterLink to="/create" class="create create-native" :class="{ active: active('/create') }" aria-label="Создать"><Icon name="plus" :size="19" /><small>Создать</small></RouterLink>
    <RouterLink to="/inbox" class="nav-with-badge" :class="{ active: active('/inbox') || active('/request') || active('/chat') }"><Icon name="inbox" :size="18" /><small>Заявки</small><i v-if="session.stats.pendingRequests" class="nav-badge">{{ session.stats.pendingRequests > 9 ? '9+' : session.stats.pendingRequests }}</i></RouterLink>
    <RouterLink to="/profile" :class="{ active: active('/profile') || active('/my-events') || active('/manage') }"><Icon name="user" :size="18" /><small>Профиль</small></RouterLink>
  </nav>
</template>
