import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { chatsResponseSchema, messagesResponseSchema } from '@/schemas/api';
import type { ChatItem, MessageItem } from '@/types/domain';

export const useChatStore=defineStore('chat',{
  state:()=>({chats:[] as ChatItem[],messages:[] as MessageItem[],currentEventId:null as string|null}),
  actions:{
    async loadChats(){const r=await api.getParsed('/api/chats',chatsResponseSchema);this.chats=r.chats;},
    async loadMessages(eventId:string){const r=await api.getParsed(`/api/chats/${eventId}/messages`,messagesResponseSchema);this.messages=r.messages;},
    async send(eventId:string,text:string){await api.post(`/api/chats/${eventId}/messages`,{text});await this.loadMessages(eventId);},
    async edit(messageId:string,text:string){await api.patch(`/api/messages/${messageId}`,{text});if(this.currentEventId)await this.loadMessages(this.currentEventId);},
    async remove(messageId:string){await api.delete(`/api/messages/${messageId}`);if(this.currentEventId)await this.loadMessages(this.currentEventId);},
    async open(eventId:string){this.currentEventId=eventId;await this.loadMessages(eventId);},
    close(){this.currentEventId=null;this.messages=[];}
  }
});
