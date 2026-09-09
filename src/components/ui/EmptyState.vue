<script setup lang="ts">
import Icon from './Icon.vue';
const props=withDefaults(defineProps<{icon?:string;title:string;text:string;action?:string}>(),{icon:'spark',action:''});
const emit=defineEmits<{action:[]}>();
</script>
<template>
  <div class="empty-state">
    <div class="empty-state-orbit"><span></span><Icon :name="props.icon" :size="24"/></div>
    <b>{{props.title}}</b>
    <p>{{props.text}}</p>
    <button v-if="props.action" class="secondary empty-action" @click="emit('action')">{{props.action}}</button>
  </div>
</template>
