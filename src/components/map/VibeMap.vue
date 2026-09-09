<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { EventItem } from '@/types/domain';
import { getMinskPosition } from '@/services/geolocation';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const props=defineProps<{events:EventItem[]}>();const emit=defineEmits<{select:[event:EventItem]}>();const el=ref<HTMLElement|null>(null);let map:Map|null=null;let userMarker:Marker|null=null;
const colors=['match',['get','kind'],'home','#a77bff','bar','#ff9b55','music','#4dd9ff','games','#8ee08e','social','#ff77bd','spontaneous','#ffe45e','#ff4778'] as any;
function geo(){return {type:'FeatureCollection' as const,features:props.events.map(e=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[e.lng,e.lat]},properties:{id:e.id,title:e.title,kind:e.kind}}))}}
function update(){const src=map?.getSource('events') as GeoJSONSource|undefined;src?.setData(geo() as any)}
onMounted(()=>{if(!el.value)return;map=new maplibregl.Map({container:el.value,style:'https://tiles.openfreemap.org/styles/liberty',center:[27.559,53.9006],zoom:12.2,minZoom:10,maxZoom:18,pitch:34,bearing:-8,antialias:true,attributionControl:false});map.addControl(new maplibregl.AttributionControl({compact:true}));map.on('load',()=>{map?.addSource('events',{type:'geojson',data:geo() as any,cluster:true,clusterMaxZoom:14,clusterRadius:48});map?.addLayer({id:'clusters',type:'circle',source:'events',filter:['has','point_count'],paint:{'circle-color':'#151217','circle-radius':['step',['get','point_count'],22,10,28,30,34],'circle-stroke-color':'#ff4778','circle-stroke-width':2,'circle-opacity':.94}} as any);map?.addLayer({id:'cluster-count',type:'symbol',source:'events',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':14},paint:{'text-color':'#fff'}} as any);map?.addLayer({id:'points',type:'circle',source:'events',filter:['!',['has','point_count']],paint:{'circle-color':colors,'circle-radius':9,'circle-stroke-width':3,'circle-stroke-color':'#09090b'}} as any);map?.on('click','points',(ev:any)=>{const id=ev.features?.[0]?.properties?.id;const event=props.events.find(x=>x.id===id);if(event)emit('select',event)});map?.on('click','clusters',async(ev:any)=>{const f=ev.features?.[0];const src=map?.getSource('events') as GeoJSONSource;const zoom=await src.getClusterExpansionZoom(f.properties.cluster_id);map?.easeTo({center:f.geometry.coordinates,zoom})});});});watch(()=>props.events,update,{deep:true});onBeforeUnmount(()=>{userMarker?.remove();map?.remove();map=null});
async function locate(){const pos=await getMinskPosition();if(!pos||!map)return false;userMarker?.remove();const node=document.createElement('div');node.className='user-pin';userMarker=new maplibregl.Marker({element:node}).setLngLat([pos[1],pos[0]]).addTo(map);map.easeTo({center:[pos[1],pos[0]],zoom:14});return true}
defineExpose({locate});
</script>
<template><div ref="el" class="vibe-map"></div></template>
