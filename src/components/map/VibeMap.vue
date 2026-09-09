<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { EventItem } from '@/types/domain';
import { getMinskPositionDetails, type MinskPosition } from '@/services/geolocation';
import { telegram } from '@/services/telegram';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const props=defineProps<{events:EventItem[]}>();
const emit=defineEmits<{select:[event:EventItem];ready:[]}>();
const el=ref<HTMLElement|null>(null);
let map:Map|null=null;
let userMarker:Marker|null=null;
let lastGeoKey='';let lastGeo:any=null;
const colors=['match',['get','kind'],'home','#9c75ff','bar','#ffac66','music','#52c7ff','games','#79d890','social','#ff79a9','spontaneous','#ffd66b','#ff3d71'] as any;

function geoKey(){return props.events.map(e=>`${e.id}:${e.lng.toFixed(5)}:${e.lat.toFixed(5)}:${e.kind}:${e.people}`).join('|')}
function geo(){const key=geoKey();if(key===lastGeoKey&&lastGeo)return lastGeo;lastGeoKey=key;lastGeo={type:'FeatureCollection' as const,features:props.events.map(e=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[e.lng,e.lat]},properties:{id:e.id,title:e.title,kind:e.kind,people:e.people}}))};return lastGeo}
function update(){const src=map?.getSource('events') as GeoJSONSource|undefined;if(!src)return;const before=(src as any).__vibeKey;if(before===geoKey())return;(src as any).__vibeKey=geoKey();src.setData(geo() as any)}
function setPaint(id:string,prop:string,value:any){try{map?.setPaintProperty(id,prop,value)}catch{/* layer/property mismatch */}}

function markerCanvas(kind:string){
  const canvas=document.createElement('canvas');canvas.width=40;canvas.height=40;const c=canvas.getContext('2d')!;c.strokeStyle='#fff';c.fillStyle='#fff';c.lineWidth=3;c.lineCap='round';c.lineJoin='round';
  if(kind==='home'){c.beginPath();c.moveTo(9,20);c.lineTo(20,10);c.lineTo(31,20);c.stroke();c.strokeRect(12,19,16,13);}
  else if(kind==='bar'){c.beginPath();c.moveTo(11,12);c.lineTo(29,12);c.lineTo(25,24);c.lineTo(15,24);c.closePath();c.stroke();c.beginPath();c.moveTo(20,24);c.lineTo(20,31);c.moveTo(15,31);c.lineTo(25,31);c.stroke();}
  else if(kind==='music'){c.beginPath();c.moveTo(24,10);c.lineTo(24,27);c.moveTo(24,11);c.lineTo(31,9);c.lineTo(31,23);c.stroke();c.beginPath();c.arc(19,28,5,0,Math.PI*2);c.stroke();c.beginPath();c.arc(27,24,5,0,Math.PI*2);c.stroke();}
  else if(kind==='games'){c.strokeRect(9,14,22,14);c.beginPath();c.moveTo(15,18);c.lineTo(15,24);c.moveTo(12,21);c.lineTo(18,21);c.stroke();c.beginPath();c.arc(25,19,1.7,0,Math.PI*2);c.arc(28,23,1.7,0,Math.PI*2);c.fill();}
  else if(kind==='social'){c.beginPath();c.arc(15,16,4,0,Math.PI*2);c.arc(26,17,3.5,0,Math.PI*2);c.stroke();c.beginPath();c.arc(15,30,8,Math.PI,Math.PI*2);c.arc(26,29,6,Math.PI,Math.PI*2);c.stroke();}
  else if(kind==='spontaneous'){c.beginPath();c.moveTo(23,7);c.lineTo(13,22);c.lineTo(20,22);c.lineTo(17,33);c.lineTo(29,18);c.lineTo(22,18);c.closePath();c.stroke();}
  else {c.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,r=i%2?5:11,x=20+Math.cos(a)*r,y=20+Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.stroke();}
  return c.getImageData(0,0,40,40);
}
function installMarkerIcons(){if(!map)return;for(const kind of ['party','home','bar','music','games','social','spontaneous']){const id=`vibe-${kind}`;if(!map.hasImage(id))map.addImage(id,markerCanvas(kind),{pixelRatio:2});}}

function applyVibeTheme(){
  const layers=map?.getStyle().layers||[];
  for(const layer of layers as any[]){
    const id=String(layer.id||'').toLowerCase();
    const sourceLayer=String(layer['source-layer']||'').toLowerCase();
    const key=`${id} ${sourceLayer}`;
    if(layer.type==='background'){setPaint(layer.id,'background-color','#07080a');continue}
    if(layer.type==='fill'){
      let color='#0d0f12',opacity=.9;
      if(/water/.test(key)){color='#091621';opacity=1}
      else if(/park|grass|green|wood|forest|landcover/.test(key)){color='#0b1512';opacity=.92}
      else if(/building/.test(key)){color='#17181d';opacity=.82}
      else if(/industrial|commercial/.test(key)){color='#121217';opacity=.9}
      setPaint(layer.id,'fill-color',color);setPaint(layer.id,'fill-opacity',opacity);setPaint(layer.id,'fill-outline-color','#17191d');
    }
    if(layer.type==='line'){
      let color='#24262c',opacity=.76;
      if(/water/.test(key)){color='#173047';opacity=.72}
      else if(/motorway|trunk/.test(key)){color='#52303d';opacity=.9}
      else if(/primary|secondary/.test(key)){color='#3a3039';opacity=.92}
      else if(/road|street|tertiary/.test(key)){color='#26272d';opacity=.82}
      else if(/rail/.test(key)){color='#32343a';opacity=.55}
      else if(/boundary/.test(key)){color='#34323a';opacity=.45}
      setPaint(layer.id,'line-color',color);setPaint(layer.id,'line-opacity',opacity);
    }
    if(layer.type==='symbol'){
      setPaint(layer.id,'text-color',/place|city|town|suburb/.test(key)?'#a9aab1':'#747680');
      setPaint(layer.id,'text-halo-color','#08090b');setPaint(layer.id,'text-halo-width',1.2);setPaint(layer.id,'text-opacity',.88);setPaint(layer.id,'icon-opacity',.45);
    }
    if(layer.type==='fill-extrusion'){setPaint(layer.id,'fill-extrusion-color','#17181d');setPaint(layer.id,'fill-extrusion-opacity',.68)}
    if(layer.type==='raster'){setPaint(layer.id,'raster-saturation',-.7);setPaint(layer.id,'raster-contrast',.14);setPaint(layer.id,'raster-brightness-max',.48)}
  }
}
function accuracyPolygon(p:MinskPosition){const steps=48,R=6378137,lat=p.lat*Math.PI/180;const points=[] as number[][];for(let i=0;i<=steps;i++){const a=i/steps*Math.PI*2;const dx=Math.cos(a)*p.accuracy,dy=Math.sin(a)*p.accuracy;points.push([p.lng+(dx/(R*Math.cos(lat)))*180/Math.PI,p.lat+(dy/R)*180/Math.PI])}return {type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[points]},properties:{}}]}}
function setAccuracy(p:MinskPosition){if(!map)return;const data=accuracyPolygon(p) as any;const src=map.getSource('user-accuracy') as GeoJSONSource|undefined;if(src){src.setData(data);return}map.addSource('user-accuracy',{type:'geojson',data});map.addLayer({id:'user-accuracy-fill',type:'fill',source:'user-accuracy',paint:{'fill-color':'#ff496d','fill-opacity':.08,'fill-outline-color':'rgba(255,73,109,.28)'}} as any,'event-heat')}

onMounted(()=>{
  if(!el.value)return;
  map=new maplibregl.Map({container:el.value,style:'https://tiles.openfreemap.org/styles/liberty',center:[27.559,53.9006],zoom:12.4,minZoom:10,maxZoom:18,pitch:42,bearing:-7,antialias:true,attributionControl:false,maxBounds:[[27.16,53.69],[27.93,54.08]]});
  map.addControl(new maplibregl.AttributionControl({compact:true}), 'bottom-right');
  map.on('load',()=>{
    applyVibeTheme();installMarkerIcons();
    map?.addSource('events',{type:'geojson',data:geo() as any,cluster:true,clusterMaxZoom:14,clusterRadius:52});
    const src=map?.getSource('events') as any;if(src)src.__vibeKey=geoKey();
    map?.addLayer({id:'event-heat',type:'heatmap',source:'events',maxzoom:14,paint:{'heatmap-weight':['interpolate',['linear'],['get','people'],0,.25,20,1],'heatmap-intensity':['interpolate',['linear'],['zoom'],10,.4,14,1.05],'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(255,73,109,0)',.35,'rgba(255,73,109,.10)',.65,'rgba(255,73,109,.22)',1,'rgba(255,73,109,.38)'],'heatmap-radius':['interpolate',['linear'],['zoom'],10,24,14,44],'heatmap-opacity':['interpolate',['linear'],['zoom'],11,.68,15,0]}} as any);
    map?.addLayer({id:'cluster-glow',type:'circle',source:'events',filter:['has','point_count'],paint:{'circle-color':'rgba(255,73,109,.22)','circle-radius':['step',['get','point_count'],32,10,41,30,50],'circle-blur':.8}} as any);
    map?.addLayer({id:'clusters',type:'circle',source:'events',filter:['has','point_count'],paint:{'circle-color':'#101116','circle-radius':['step',['get','point_count'],21,10,27,30,33],'circle-stroke-color':'#ff496d','circle-stroke-width':2.2,'circle-opacity':.98}} as any);
    map?.addLayer({id:'cluster-count',type:'symbol',source:'events',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':13},paint:{'text-color':'#f8f4ef'}} as any);
    map?.addLayer({id:'point-glow',type:'circle',source:'events',filter:['!',['has','point_count']],paint:{'circle-color':colors,'circle-radius':17,'circle-opacity':.16,'circle-blur':.62}} as any);
    map?.addLayer({id:'points',type:'circle',source:'events',filter:['!',['has','point_count']],paint:{'circle-color':colors,'circle-radius':9,'circle-stroke-width':3.5,'circle-stroke-color':'#08090b'}} as any);
    map?.addLayer({id:'point-icons',type:'symbol',source:'events',filter:['!',['has','point_count']],layout:{'icon-image':['concat','vibe-',['get','kind']],'icon-size':.82,'icon-allow-overlap':true,'icon-ignore-placement':true}} as any);
    map?.on('mouseenter','points',()=>{if(map)map.getCanvas().style.cursor='pointer'});map?.on('mouseleave','points',()=>{if(map)map.getCanvas().style.cursor=''});
    map?.on('click','points',(ev:any)=>{const id=ev.features?.[0]?.properties?.id;const event=props.events.find(x=>x.id===id);if(event){telegram.haptic('light');emit('select',event);map?.flyTo({center:[event.lng,event.lat],zoom:14.4,pitch:48,duration:650,essential:true})}});
    map?.on('click','clusters',async(ev:any)=>{const f=ev.features?.[0];if(!f||!map)return;telegram.haptic('light');const src=map.getSource('events') as GeoJSONSource;const zoom=await src.getClusterExpansionZoom(f.properties.cluster_id);map.flyTo({center:f.geometry.coordinates,zoom,pitch:42,duration:650,essential:true})});
    emit('ready');
  });
});
watch(()=>geoKey(),update);
onBeforeUnmount(()=>{userMarker?.remove();map?.remove();map=null});
async function locate(){telegram.haptic('light');const pos=await getMinskPositionDetails();if(!pos||!map)return false;if(!map.isStyleLoaded())await new Promise<void>(resolve=>map?.once('load',()=>resolve()));userMarker?.remove();setAccuracy(pos);const node=document.createElement('div');node.className='user-pin';node.innerHTML='<i></i>';userMarker=new maplibregl.Marker({element:node}).setLngLat([pos.lng,pos.lat]).addTo(map);map.flyTo({center:[pos.lng,pos.lat],zoom:15,pitch:48,duration:700,essential:true});return true}
function zoomIn(){telegram.haptic('light');map?.zoomIn({duration:260})}function zoomOut(){telegram.haptic('light');map?.zoomOut({duration:260})}function reset(){telegram.haptic('light');map?.flyTo({center:[27.559,53.9006],zoom:12.4,pitch:42,bearing:-7,duration:650,essential:true})}function focus(e:EventItem){map?.flyTo({center:[e.lng,e.lat],zoom:14.4,pitch:48,duration:650,essential:true})}
defineExpose({locate,zoomIn,zoomOut,reset,focus});
</script>
<template><div ref="el" class="vibe-map"></div></template>
