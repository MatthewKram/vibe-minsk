import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { requestResponseSchema, requestsResponseSchema } from '@/schemas/api';
import type { EventRequest } from '@/types/domain';

export const useInboxStore=defineStore('inbox',{
  state:()=>({incoming:[] as EventRequest[],outgoing:[] as EventRequest[],current:null as EventRequest|null,tab:'incoming' as 'incoming'|'outgoing'}),
  actions:{
    async load(){const [a,b]=await Promise.all([api.getParsed('/api/requests?direction=incoming',requestsResponseSchema),api.getParsed('/api/requests?direction=outgoing',requestsResponseSchema)]);this.incoming=a.requests;this.outgoing=b.requests;},
    async loadOne(id:string){const r=await api.getParsed(`/api/requests/${id}`,requestResponseSchema);this.current=r.request;return r.request;},
    async resolve(id:string,decision:'accepted'|'declined'){await api.post(`/api/requests/${id}/resolve`,{decision});await Promise.all([this.load(),this.loadOne(id)]);}
  }
});
