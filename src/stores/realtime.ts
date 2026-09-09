import { defineStore } from 'pinia';
import { realtimeClient, type RealtimeSignal } from '@/services/realtime';
import { queryClient } from '@/services/queryClient';
import { useEventsStore } from './events';
import { useInboxStore } from './inbox';
import { useChatStore } from './chat';
import { useSessionStore } from './session';

export const useRealtimeStore = defineStore('realtime', {
  state: () => ({
    started:false,
    status:'idle' as 'idle'|'connecting'|'online'|'offline',
    unsubscribe:null as null|(()=>void),
    unsubscribeStatus:null as null|(()=>void),
    timers:{} as Record<string,number>,
    fallbackTimer:0,
    lastSignalAt:null as string|null,
    toast:'',
    toastTimer:0,
  }),
  getters:{ connected:s=>s.status==='online' },
  actions: {
    start() {
      if (this.started) return;
      this.started = true;
      this.unsubscribe = realtimeClient.subscribe((signal) => this.handle(signal));
      this.unsubscribeStatus = realtimeClient.subscribeStatus(status => { this.status = status; });
      void realtimeClient.start();
      this.scheduleFallback();
      window.addEventListener('online', this.reconnect);
      document.addEventListener('visibilitychange', this.visibility);
    },
    stop() {
      if (!this.started) return;
      this.started=false;
      this.unsubscribe?.(); this.unsubscribe=null;
      this.unsubscribeStatus?.(); this.unsubscribeStatus=null;
      realtimeClient.stop();
      for(const id of Object.values(this.timers)) window.clearTimeout(id);
      this.timers={};
      window.clearTimeout(this.fallbackTimer); this.fallbackTimer=0;
      window.removeEventListener('online', this.reconnect);
      document.removeEventListener('visibilitychange', this.visibility);
    },
    reconnect() { realtimeClient.forceReconnect(); this.syncEssential(); },
    visibility() { if(document.visibilityState==='visible'){ realtimeClient.start().catch(()=>{}); this.syncEssential(); } },
    scheduleFallback() {
      window.clearTimeout(this.fallbackTimer);
      const delay = this.status === 'online' ? 30000 : 7000;
      this.fallbackTimer = window.setTimeout(async()=>{
        if(document.visibilityState==='visible') await this.syncEssential();
        this.scheduleFallback();
      },delay);
    },
    showToast(text:string){
      this.toast=text;
      window.clearTimeout(this.toastTimer);
      this.toastTimer=window.setTimeout(()=>{this.toast='';},4200);
    },
    async syncEssential() {
      const events=useEventsStore(), inbox=useInboxStore(), chat=useChatStore(), session=useSessionStore();
      await Promise.allSettled([
        events.load(),
        session.refreshSession(),
        session.loadNotifications(),
        inbox.load(),
        chat.loadChats(),
      ]);
      if(chat.currentEventId) await chat.loadMessages(chat.currentEventId).catch(()=>{});
    },
    debounce(key:string,fn:()=>void,delay=100) {
      if(this.timers[key]) window.clearTimeout(this.timers[key]);
      this.timers[key]=window.setTimeout(()=>{delete this.timers[key];fn();},delay);
    },
    handle(signal:RealtimeSignal) {
      this.lastSignalAt = signal.at || new Date().toISOString();
      const events=useEventsStore(),inbox=useInboxStore(),chat=useChatStore(),session=useSessionStore();
      const eventId=signal.eventId;

      if(signal.type.startsWith('event.') || signal.type==='me.events.changed') {
        queryClient.invalidateQueries({queryKey:['events']});
        this.debounce('events',()=>events.load().catch(()=>{}));
        this.debounce('my-events',()=>events.loadMy().catch(()=>{}));
        if(eventId) this.debounce(`event:${eventId}`,()=>{
          queryClient.invalidateQueries({queryKey:['event',eventId]});
          if(events.current?.id===eventId) events.loadOne(eventId).catch(()=>{});
        });
      }

      if(signal.type.startsWith('request.')) {
        this.debounce('requests',()=>inbox.load().catch(()=>{}));
        if(signal.requestId && inbox.current?.id===signal.requestId) this.debounce(`request:${signal.requestId}`,()=>inbox.loadOne(signal.requestId!).catch(()=>{}));
        this.debounce('session-stats',()=>session.refreshSession().catch(()=>{}),150);
        this.debounce('notifications',()=>session.loadNotifications().catch(()=>{}),170);
        if(eventId) {
          queryClient.invalidateQueries({queryKey:['event',eventId]});
          if(events.current?.id===eventId) this.debounce(`request-event:${eventId}`,()=>events.loadOne(eventId).catch(()=>{}));
        }
      }

      if(signal.type==='membership.changed') {
        this.debounce('chats',()=>chat.loadChats().catch(()=>{}));
        this.debounce('requests',()=>inbox.load().catch(()=>{}));
        this.debounce('session-stats',()=>session.refreshSession().catch(()=>{}));
        if(eventId) {
          queryClient.invalidateQueries({queryKey:['event',eventId]});
          if(events.current?.id===eventId) this.debounce(`membership-event:${eventId}`,()=>events.loadOne(eventId).catch(()=>{}));
          this.debounce(`members:${eventId}`,()=>events.loadMembers(eventId).catch(()=>{}));
        }
      }

      if(signal.type==='chat.message' || signal.type==='chat.read') {
        this.debounce('chats',()=>chat.loadChats().catch(()=>{}),45);
        if(signal.type==='chat.message' && eventId && chat.currentEventId===eventId) {
          this.debounce(`chat:${eventId}`,()=>chat.loadMessages(eventId).catch(()=>{}),30);
        }
      }

      if(signal.type==='notification.changed') {
        this.debounce('notifications',async()=>{await session.loadNotifications().catch(()=>{});const n=session.notifications[0];if(n&&!n.read_at)this.showToast(`${n.title} · ${n.body}`);},50);
        this.debounce('session-stats',()=>session.refreshSession().catch(()=>{}),100);
      }

      if(signal.type==='profile.changed') this.debounce('session',()=>session.refreshSession().catch(()=>{}));
      this.scheduleFallback();
    }
  }
});
