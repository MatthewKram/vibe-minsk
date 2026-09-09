import crypto from 'node:crypto';
import { HttpError } from './errors';

interface TicketPayload { uid: string; exp: number; v: 1 }
const TTL_SECONDS = 10 * 60;
const enc = (value: string) => Buffer.from(value).toString('base64url');

export function createRealtimeTicket(userId: string, secret: string) {
  const payload: TicketPayload = { uid: userId, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS, v: 1 };
  const body = enc(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return { token: `${body}.${sig}`, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

export function verifyRealtimeTicket(token: string, secret: string): TicketPayload {
  const [body, sig] = token.split('.');
  if (!body || !sig) throw new HttpError(401, 'Недействительный realtime-токен.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(401, 'Недействительный realtime-токен.');
  let payload: TicketPayload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
  catch { throw new HttpError(401, 'Недействительный realtime-токен.'); }
  if (!payload.uid || payload.v !== 1 || payload.exp < Math.floor(Date.now() / 1000)) throw new HttpError(401, 'Realtime-сессия устарела.');
  return payload;
}
