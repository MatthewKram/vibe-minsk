import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { eventResponseSchema, eventsResponseSchema, membersResponseSchema } from '@/schemas/api';
import type { CreateEventInput, EventItem, EventMember } from '@/types/domain';
import { optimizeCover } from '@/services/image';

export const useEventsStore=defineStore('events',{
  state:()=>({items:[] as EventItem[],my:[] as EventItem[],favorites:[] as EventItem[],current:null as EventItem|null,members:[] as EventMember[],loading:false,loadingFavorites:false,loadingMy:false,query:'',time:'Все',kind:'all'}),
  getters:{filtered(s){const q=s.query.trim().toLowerCase();return s.items.filter(e=>{if(s.kind!=='all'&&e.kind!==s.kind)return false;if(q&&!`${e.title} ${e.desc} ${e.district} ${e.tags.join(' ')}`.toLowerCase().includes(q))return false;return true;});}},
  actions:{
    async load(){this.loading=true;try{const r=await api.getParsed('/api/events',eventsResponseSchema);this.items=r.events;}finally{this.loading=false;}},
    async loadOne(id:string){const r=await api.getParsed(`/api/events/${id}`,eventResponseSchema);this.current=r.event;this.replace(r.event);return r.event;},
    replace(e:EventItem){for(const list of [this.items,this.my,this.favorites]){const i=list.findIndex(x=>x.id===e.id);if(i>=0)list[i]=e;}},
    async loadMy(){this.loadingMy=true;try{const r=await api.getParsed('/api/me/events',eventsResponseSchema);this.my=r.events;}finally{this.loadingMy=false;}},
    async loadFavorites(){this.loadingFavorites=true;try{const r=await api.getParsed('/api/favorites',eventsResponseSchema);this.favorites=r.events;}finally{this.loadingFavorites=false;}},
    async create(input:CreateEventInput){const r=await api.postParsed('/api/events',input,eventResponseSchema);this.my.unshift(r.event);this.items.unshift(r.event);return r.event;},
    async update(id:string,patch:Partial<CreateEventInput>){const r=await api.patchParsed(`/api/events/${id}`,patch,eventResponseSchema);this.replace(r.event);return r.event;},
    async setStatus(id:string,status:'published'|'hidden'|'cancelled'){await api.post(`/api/events/${id}/status`,{status});await Promise.all([this.load(),this.loadMy()]);},
    async join(id:string,note:string){await api.post(`/api/events/${id}/join`,{note});return this.loadOne(id);},
    async cancelRequest(id:string){await api.delete(`/api/events/${id}/request`);return this.loadOne(id);},
    async leave(id:string){await api.post(`/api/events/${id}/leave`);await Promise.all([this.load(),this.loadOne(id)]);},
    async toggleFavorite(id:string){const r=await api.post<{ok:true;favorite:boolean}>(`/api/favorites/${id}/toggle`);const e=this.items.find(x=>x.id===id)||this.my.find(x=>x.id===id);if(e)e.favorite=r.favorite;return r.favorite;},
    async loadMembers(id:string){const r=await api.getParsed(`/api/events/${id}/members`,membersResponseSchema);this.members=r.members;},
    async removeMember(eventId:string,userId:string){await api.delete(`/api/events/${eventId}/members/${userId}`);await this.loadMembers(eventId);await this.loadOne(eventId);},
    async uploadCover(eventId:string,file:File){const optimized=await optimizeCover(file);const fd=new FormData();fd.append('file',optimized);await api.upload(`/api/events/${eventId}/cover`,fd);await Promise.all([this.loadOne(eventId),this.loadMy()]);}
  }
});
