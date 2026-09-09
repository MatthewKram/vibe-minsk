export const formatPrice=(value:number)=>value===0?'Бесплатно':`${Number.isInteger(value)?value:value.toFixed(2)} руб.`;
export const formatTime=(iso:string)=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Minsk',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
export const formatDate=(iso:string)=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Minsk',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
export const relativeTime=(iso:string)=>{const s=Math.round((Date.now()-new Date(iso).getTime())/1000);if(s<60)return'только что';if(s<3600)return`${Math.floor(s/60)} мин назад`;if(s<86400)return`${Math.floor(s/3600)} ч назад`;return`${Math.floor(s/86400)} дн назад`;};
export const initials=(name:string)=>name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'V';
