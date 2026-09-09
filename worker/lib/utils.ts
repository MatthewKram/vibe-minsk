export const safeText=(value:unknown,max=2000)=>String(value??'').trim().slice(0,max);
export const MINSK={lat:53.9006,lng:27.5590,radiusKm:32};
export function haversineKm(a:{lat:number;lng:number},b:{lat:number;lng:number}){const rad=(x:number)=>x*Math.PI/180;const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));}
