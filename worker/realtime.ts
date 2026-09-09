import { DurableObject } from 'cloudflare:workers';
import type { Bindings } from './types';

export interface RealtimeEnvelope {
  type: string;
  eventId?: string;
  requestId?: string;
  messageId?: string;
  at?: string;
  [key: string]: unknown;
}

type PublishBody = {
  userIds?: string[];
  broadcast?: boolean;
  event: RealtimeEnvelope;
};

export class RealtimeHub extends DurableObject<Bindings> {
  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/connect') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
      }
      const userId = request.headers.get('x-vibe-user-id');
      if (!userId) return new Response('Missing user id', { status: 401 });

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server, ['all', `user:${userId}`]);
      server.serializeAttachment({ userId, connectedAt: Date.now() });
      server.send(JSON.stringify({ type: 'realtime.ready', at: new Date().toISOString() }));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/publish' && request.method === 'POST') {
      const body = await request.json().catch(() => null) as PublishBody | null;
      if (!body?.event?.type) return new Response('Bad payload', { status: 400 });
      const message = JSON.stringify({ ...body.event, at: body.event.at || new Date().toISOString() });
      const sockets = new Set<WebSocket>();

      if (body.broadcast) {
        for (const ws of this.ctx.getWebSockets('all')) sockets.add(ws);
      }
      for (const userId of body.userIds || []) {
        for (const ws of this.ctx.getWebSockets(`user:${userId}`)) sockets.add(ws);
      }
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send(message); } catch { /* disconnected socket */ }
        }
      }
      return Response.json({ ok: true, delivered: sockets.size });
    }

    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message === 'string' && message === 'ping') ws.send('pong');
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    try { ws.close(code, reason); } catch { /* already closed */ }
  }
}
