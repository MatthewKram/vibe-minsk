<script setup lang="ts">
import { computed, ref } from 'vue';
const props=withDefaults(defineProps<{modelValue:'peek'|'mid'|'full';closable?:boolean}>(),{closable:true});
const emit=defineEmits<{ 'update:modelValue':[value:'peek'|'mid'|'full']; close:[] }>();
const dragging=ref(false),dragY=ref(0);let startY=0;
const cls=computed(()=>[`sheet-${props.modelValue}`,{'is-dragging':dragging.value}]);
function begin(e:PointerEvent){dragging.value=true;startY=e.clientY;dragY.value=0;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)}
function move(e:PointerEvent){if(!dragging.value)return;dragY.value=e.clientY-startY}
function end(){if(!dragging.value)return;const dy=dragY.value;dragging.value=false;dragY.value=0;const states=['peek','mid','full'] as const;const i=states.indexOf(props.modelValue);if(dy<-38&&i<2)emit('update:modelValue',states[i+1]);else if(dy>38&&i>0)emit('update:modelValue',states[i-1]);else if(dy>90&&i===0&&props.closable)emit('close')}
function cycle(){const next=props.modelValue==='peek'?'mid':props.modelValue==='mid'?'full':'mid';emit('update:modelValue',next)}
</script>
<template>
  <section class="bottom-sheet" :class="cls" :style="dragging?{transform:`translateY(${Math.max(-30,dragY)}px)`}:undefined">
    <button class="sheet-handle-zone" aria-label="Изменить высоту панели" @click="cycle" @pointerdown="begin" @pointermove="move" @pointerup="end" @pointercancel="end"><i class="sheet-handle"></i></button>
    <div class="sheet-content"><slot/></div>
  </section>
</template>
