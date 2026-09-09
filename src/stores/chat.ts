import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { chatsResponseSchema, messagesResponseSchema } from '@/schemas/api';
import type { ChatItem, MessageItem } from '@/types/domain';

export const useChatStore=defineStore('chat',{
  state:()=>({chats:[] as ChatItem[],messages:[] as MessageItem[],poll:0 as number|0}),
  actions:{
    async loadChats(){const r=await api.getParsed('/api/chats',chatsResponseSchema);this.chats=r.chats;},
    async loadMessages(eventId:string){const r=await api.getParsed(`/api/chats/${eventId}/messages`,messagesResponseSchema);this.messages=r.messages;},
    async send(eventId:string,text:string){await api.post(`/api/chats/${eventId}/messages`,{text});await this.loadMessages(eventId);},
    async edit(messageId:string,text:string){await api.patch(`/api/messages/${messageId}`,{text});},
    async remove(messageId:string){await api.delete(`/api/messages/${messageId}`);},
    startPolling(eventId:string){this.stopPolling();this.loadMessages(eventId);this.poll=window.setInterval(()=>this.loadMessages(eventId).catch(()=>{}),3000);},
    stopPolling(){if(this.poll){clearInterval(this.poll);this.poll=0;}}
  }
});
