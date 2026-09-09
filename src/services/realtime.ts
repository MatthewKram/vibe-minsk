import { api } from './api';

export interface RealtimeSignal {
  type: string;
  eventId?: string;
  requestId?: string;
  messageId?: string;
  at?: string;
  [key: string]: unknown;
}

type Handler = (signal: RealtimeSignal) => void;
type StatusHandler = (status: RealtimeClient['status']) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<Handler>();
  private statusHandlers = new Set<StatusHandler>();
  private reconnectTimer = 0;
  private pingTimer = 0;
  private attempts = 0;
  private stopped = true;
  private connecting = false;

  status: 'idle'|'connecting'|'online'|'offline' = 'idle';

  subscribe(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  subscribeStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(status: RealtimeClient['status']) {
    if (this.status === status) return;
    this.status = status;
    for (const handler of this.statusHandlers) handler(status);
  }

  async start() {
    if (!this.stopped && (this.connecting || this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING)) return;
    this.stopped = false;
    await this.connect();
  }

  forceReconnect() {
    if (this.stopped) return;
    try { this.ws?.close(4001, 'reconnect'); } catch { /* noop */ }
    this.ws = null;
    this.connecting = false;
    void this.connect();
  }

  stop() {
    this.stopped = true;
    this.connecting = false;
    window.clearTimeout(this.reconnectTimer);
    window.clearInterval(this.pingTimer);
    this.reconnectTimer = 0;
    this.pingTimer = 0;
    try { this.ws?.close(1000, 'client stop'); } catch { /* noop */ }
    this.ws = null;
    this.setStatus('idle');
  }

  private async connect() {
    if (this.stopped || this.connecting || this.ws?.readyState === WebSocket.OPEN) return;
    this.connecting = true;
    this.setStatus('connecting');
    try {
      const ticket = await api.get<{ok:true;token:string;expiresAt:string}>('/api/realtime/token');
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${location.host}/api/realtime?token=${encodeURIComponent(ticket.token)}`;
      const ws = new WebSocket(url);
      this.ws = ws;
      const timeout = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          try { ws.close(4000, 'connect timeout'); } catch { /* noop */ }
        }
      }, 9000);
      ws.onopen = () => {
        window.clearTimeout(timeout);
        this.connecting = false;
        this.attempts = 0;
        this.setStatus('online');
        window.clearInterval(this.pingTimer);
        this.pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 22000);
      };
      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const signal = JSON.parse(String(event.data)) as RealtimeSignal;
          if (signal.type === 'realtime.ready') this.setStatus('online');
          for (const handler of this.handlers) handler(signal);
        } catch { /* ignore malformed event */ }
      };
      ws.onerror = () => this.setStatus('offline');
      ws.onclose = () => {
        window.clearTimeout(timeout);
        if (this.ws === ws) this.ws = null;
        this.connecting = false;
        window.clearInterval(this.pingTimer);
        this.pingTimer = 0;
        if (!this.stopped) {
          this.setStatus('offline');
          this.scheduleReconnect();
        }
      };
    } catch {
      this.connecting = false;
      this.setStatus('offline');
      if (!this.stopped) this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    window.clearTimeout(this.reconnectTimer);
    const delay = Math.min(16000, 700 * 2 ** Math.min(this.attempts++, 4)) + Math.round(Math.random() * 500);
    this.reconnectTimer = window.setTimeout(() => void this.connect(), delay);
  }
}

export const realtimeClient = new RealtimeClient();
