<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { EventItem } from '@/types/domain';
import { getMinskPosition } from '@/services/geolocation';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const props=defineProps<{events:EventItem[]}>();
const emit=defineEmits<{select:[event:EventItem]}>();
const el=ref<HTMLElement|null>(null);
let map:Map|null=null;
let userMarker:Marker|null=null;
const colors=['match',['get','kind'],'home','#9c75ff','bar','#ffac66','music','#52c7ff','games','#79d890','social','#ff79a9','spontaneous','#ffd66b','#ff3d71'] as any;

function geo(){return {type:'FeatureCollection' as const,features:props.events.map(e=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[e.lng,e.lat]},properties:{id:e.id,title:e.title,kind:e.kind,people:e.people}}))}}
function update(){const src=map?.getSource('events') as GeoJSONSource|undefined;src?.setData(geo() as any)}
function setPaint(id:string,prop:string,value:any){try{map?.setPaintProperty(id,prop,value)}catch{/* layer/property mismatch */}}
function applyVibeTheme(){
  const layers=map?.getStyle().layers||[];
  for(const layer of layers as any[]){
    const id=String(layer.id||'').toLowerCase();
    const sourceLayer=String(layer['source-layer']||'').toLowerCase();
    const key=`${id} ${sourceLayer}`;
    if(layer.type==='background'){setPaint(layer.id,'background-color','#07080a');continue}
    if(layer.type==='fill'){
      let color='#0d0f12',opacity=.88;
      if(/water/.test(key)){color='#0a1420';opacity=1}
      else if(/park|grass|green|wood|forest|landcover/.test(key)){color='#0c1513';opacity=.9}
      else if(/building/.test(key)){color='#17181d';opacity=.82}
      else if(/industrial|commercial/.test(key)){color='#121217';opacity=.9}
      setPaint(layer.id,'fill-color',color);setPaint(layer.id,'fill-opacity',opacity);setPaint(layer.id,'fill-outline-color','#17191d');
    }
    if(layer.type==='line'){
      let color='#24262c',opacity=.76,width:any=undefined;
      if(/water/.test(key)){color='#183047';opacity=.72}
      else if(/motorway|trunk/.test(key)){color='#49303a';opacity=.9}
      else if(/primary|secondary/.test(key)){color='#373039';opacity=.92}
      else if(/road|street|tertiary/.test(key)){color='#26272d';opacity=.82}
      else if(/rail/.test(key)){color='#32343a';opacity=.55}
      else if(/boundary/.test(key)){color='#34323a';opacity=.45}
      setPaint(layer.id,'line-color',color);setPaint(layer.id,'line-opacity',opacity);if(width)setPaint(layer.id,'line-width',width);
    }
    if(layer.type==='symbol'){
      setPaint(layer.id,'text-color',/place|city|town|suburb/.test(key)?'#9fa0a8':'#73757e');
      setPaint(layer.id,'text-halo-color','#08090b');setPaint(layer.id,'text-halo-width',1.2);setPaint(layer.id,'text-opacity',.85);
      setPaint(layer.id,'icon-opacity',.55);
    }
    if(layer.type==='fill-extrusion'){setPaint(layer.id,'fill-extrusion-color','#17181d');setPaint(layer.id,'fill-extrusion-opacity',.72)}
    if(layer.type==='raster'){setPaint(layer.id,'raster-saturation',-.65);setPaint(layer.id,'raster-contrast',.12);setPaint(layer.id,'raster-brightness-max',.55)}
  }
}

onMounted(()=>{
  if(!el.value)return;
  map=new maplibregl.Map({container:el.value,style:'https://tiles.openfreemap.org/styles/liberty',center:[27.559,53.9006],zoom:12.4,minZoom:10,maxZoom:18,pitch:42,bearing:-7,antialias:true,attributionControl:false,maxBounds:[[27.16,53.69],[27.93,54.08]]});
  map.addControl(new maplibregl.AttributionControl({compact:true}), 'bottom-right');
  map.on('load',()=>{
    applyVibeTheme();
    map?.addSource('events',{type:'geojson',data:geo() as any,cluster:true,clusterMaxZoom:14,clusterRadius:52});
    map?.addLayer({id:'event-heat',type:'heatmap',source:'events',maxzoom:14,paint:{'heatmap-weight':['interpolate',['linear'],['get','people'],0,.25,20,1],'heatmap-intensity':['interpolate',['linear'],['zoom'],10,.45,14,1.15],'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(255,61,113,0)',.35,'rgba(255,61,113,.12)',.62,'rgba(255,61,113,.24)',1,'rgba(255,61,113,.42)'],'heatmap-radius':['interpolate',['linear'],['zoom'],10,26,14,48],'heatmap-opacity':['interpolate',['linear'],['zoom'],11,.72,15,0]}} as any);
    map?.addLayer({id:'cluster-glow',type:'circle',source:'events',filter:['has','point_count'],paint:{'circle-color':'rgba(255,61,113,.28)','circle-radius':['step',['get','point_count'],34,10,43,30,52],'circle-blur':.75}} as any);
    map?.addLayer({id:'clusters',type:'circle',source:'events',filter:['has','point_count'],paint:{'circle-color':'#101116','circle-radius':['step',['get','point_count'],22,10,28,30,34],'circle-stroke-color':'#ff3d71','circle-stroke-width':2.4,'circle-opacity':.98}} as any);
    map?.addLayer({id:'cluster-count',type:'symbol',source:'events',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':14},paint:{'text-color':'#f8f4ef','text-halo-color':'rgba(0,0,0,0)','text-halo-width':0}} as any);
    map?.addLayer({id:'point-glow',type:'circle',source:'events',filter:['!',['has','point_count']],paint:{'circle-color':colors,'circle-radius':17,'circle-opacity':.18,'circle-blur':.6}} as any);
    map?.addLayer({id:'points',type:'circle',source:'events',filter:['!',['has','point_count']],paint:{'circle-color':colors,'circle-radius':8.5,'circle-stroke-width':3.5,'circle-stroke-color':'#08090b'}} as any);
    map?.on('mouseenter','points',()=>{if(map)map.getCanvas().style.cursor='pointer'});map?.on('mouseleave','points',()=>{if(map)map.getCanvas().style.cursor=''});
    map?.on('click','points',(ev:any)=>{const id=ev.features?.[0]?.properties?.id;const event=props.events.find(x=>x.id===id);if(event){emit('select',event);map?.easeTo({center:[event.lng,event.lat],zoom:14.4,pitch:48,duration:650})}});
    map?.on('click','clusters',async(ev:any)=>{const f=ev.features?.[0];if(!f||!map)return;const src=map.getSource('events') as GeoJSONSource;const zoom=await src.getClusterExpansionZoom(f.properties.cluster_id);map.easeTo({center:f.geometry.coordinates,zoom,pitch:42,duration:650})});
  });
});
watch(()=>props.events,update,{deep:true});
onBeforeUnmount(()=>{userMarker?.remove();map?.remove();map=null});
async function locate(){const pos=await getMinskPosition();if(!pos||!map)return false;userMarker?.remove();const node=document.createElement('div');node.className='user-pin';node.innerHTML='<i></i>';userMarker=new maplibregl.Marker({element:node}).setLngLat([pos[1],pos[0]]).addTo(map);map.easeTo({center:[pos[1],pos[0]],zoom:14.6,pitch:48,duration:700});return true}
function zoomIn(){map?.zoomIn({duration:280})}function zoomOut(){map?.zoomOut({duration:280})}function reset(){map?.easeTo({center:[27.559,53.9006],zoom:12.4,pitch:42,bearing:-7,duration:650})}
defineExpose({locate,zoomIn,zoomOut,reset});
</script>
<template><div ref="el" class="vibe-map"></div></template>
