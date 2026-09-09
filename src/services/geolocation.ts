const MINSK={lat:53.9006,lng:27.5590}; const R=32;
export interface MinskPosition { lat:number; lng:number; accuracy:number; timestamp:number }
export function distanceKm(a:[number,number],b:[number,number]){const rad=(x:number)=>x*Math.PI/180;const dLat=rad(b[0]-a[0]),dLng=rad(b[1]-a[1]);const q=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));}
export async function getMinskPositionDetails():Promise<MinskPosition|null>{
  if(!navigator.geolocation)return null;
  return new Promise(resolve=>navigator.geolocation.getCurrentPosition(p=>{
    const pos:[number,number]=[p.coords.latitude,p.coords.longitude];
    resolve(distanceKm([MINSK.lat,MINSK.lng],pos)<=R?{lat:p.coords.latitude,lng:p.coords.longitude,accuracy:Math.max(8,p.coords.accuracy||30),timestamp:p.timestamp}:null);
  },()=>resolve(null),{enableHighAccuracy:true,timeout:7000,maximumAge:60000}));
}
export async function getMinskPosition():Promise<[number,number]|null>{const p=await getMinskPositionDetails();return p?[p.lat,p.lng]:null;}
