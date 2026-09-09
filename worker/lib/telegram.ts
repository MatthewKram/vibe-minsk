import type { DB } from './supabase';
import type { Bindings } from '../types';
import { realtime } from './realtime';

const TELEGRAM_SYSTEM_TYPES = new Set([
  'join_request',
  'request_accepted',
  'request_declined',
  'member_left',
  'member_removed',
]);

export function appDeepLink(env: Bindings, startParam = '') {
  const bot = (env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
  if (!bot) return env.APP_URL || '';
  const short = (env.TELEGRAM_APP_SHORT_NAME || '').replace(/^\//, '');
  if (!short) return `https://t.me/${bot}`;
  const base = `https://t.me/${bot}/${short}`;
  return startParam ? `${base}?startapp=${encodeURIComponent(startParam)}` : base;
}

async function sendTelegram(
  env: Bindings,
  chatId: number | string | undefined,
  text: string,
  startParam = '',
) {
  if (!env.TELEGRAM_BOT_TOKEN || !chatId || Number(chatId) <= 0) return;

  try {
    const url = appDeepLink(env, startParam);
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };

    if (url) {
      payload.reply_markup = {
        inline_keyboard: [[{ text: 'Открыть в V I B E', url }]],
      };
    }

    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Telegram notification failed', error);
  }
}

export async function notify(
  db: DB,
  env: Bindings,
  p: {
    userId: string;
    actorId?: string | null;
    eventId?: string | null;
    type: string;
    title: string;
    body: string;
    telegramId?: number | string | null;
    startParam?: string;
  },
) {
  // In-app notifications are always stored in V I B E.
  const inserted = await db.from('notifications').insert({
    user_id: p.userId,
    actor_id: p.actorId || null,
    event_id: p.eventId || null,
    type: p.type,
    title: p.title,
    body: p.body,
  });
  if (inserted.error) throw inserted.error;
  await realtime.users(env, [p.userId], { type: 'notification.changed', eventId: p.eventId || undefined });

  // IMPORTANT: Telegram is NOT a transport for internal chat messages.
  // Only explicit system-level event types may leave the Mini App.
  if (!p.telegramId || !TELEGRAM_SYSTEM_TYPES.has(p.type)) return;

  await sendTelegram(
    env,
    p.telegramId,
    `${p.title}\n${p.body}`,
    p.startParam || '',
  );
}
