<script setup lang="ts">import { initials } from '@/services/format';defineProps<{name:string;src?:string|null;size?:'sm'|'md'|'lg'}>();</script>
<template><div class="avatar" :class="size||'md'"><img v-if="src" :src="src" alt=""><span v-else>{{initials(name)}}</span></div></template>
