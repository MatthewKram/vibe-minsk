<script setup lang="ts">
const props=defineProps<{name:string;size?:number}>();
const paths:Record<string,string>={
 home:'<path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 map:'<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', inbox:'<path d="M4 4h16v12H4z"/><path d="M4 13h4l2 3h4l2-3h4"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.6-4 4.3-6 8-6s6.4 2 8 6"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
 pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', spark:'<path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8Z"/>',
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
 chat:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
 arrow:'<path d="m9 18 6-6-6-6"/>', back:'<path d="m15 18-6-6 6-6"/>',
 send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>', ticket:'<path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 0 0-6V5H2z"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.1M8.6 13.4l6.8 4.1"/>',
 navigation:'<path d="m3 11 18-8-8 18-2-8-8-2Z"/>',
 star:'<path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8L2.2 9.2l6.8-1Z"/>',
 refresh:'<path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/>'
};
</script>
<template><svg class="ui-icon" :width="size||22" :height="size||22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" v-html="paths[props.name]||paths.spark" /></template>
