import { defineStore } from 'pinia';
import { api, ApiError } from '@/services/api';
import { telegram } from '@/services/telegram';
import { sessionResponseSchema, notificationsResponseSchema, profileResponseSchema } from '@/schemas/api';
import type { NotificationItem, User } from '@/types/domain';

export const useSessionStore=defineStore('session',{
  state:()=>({user:null as User|null,publicOnly:false,authError:'',loading:false,stats:{myEvents:0,pendingRequests:0,unreadNotifications:0},config:{appLinkBase:'',appUrl:'',mapEngine:'maplibre-osm'},notifications:[] as NotificationItem[]}),
  getters:{unreadNotifications:s=>s.notifications.filter(n=>!n.read_at).length},
  actions:{
    async bootstrap(){telegram.ready();this.loading=true;try{await this.refreshSession();await this.loadNotifications();}catch(e){if(e instanceof ApiError&&e.status===401){this.publicOnly=true;this.authError='Откройте V I B E через Telegram-бота, чтобы подавать заявки, создавать события и общаться.';}else this.authError=e instanceof Error?e.message:'Не удалось открыть сессию.';}finally{this.loading=false;}},
    async refreshSession(){const r=await api.getParsed('/api/session',sessionResponseSchema);this.user=r.user;this.stats=r.stats;this.config=r.config;this.authError='';this.publicOnly=false;return r;},
    async loadNotifications(){if(!this.user)return;const r=await api.getParsed('/api/notifications',notificationsResponseSchema);this.notifications=r.notifications;},
    async updateProfile(patch:{name:string;bio:string;birthDate?:string|null}){const r=await api.patchParsed('/api/profile',patch,profileResponseSchema);this.user=r.user;},
    async markNotification(id:string){await api.post(`/api/notifications/${id}/read`);const n=this.notifications.find(x=>x.id===id);if(n)n.read_at=new Date().toISOString();}
  }
});
