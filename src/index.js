import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

let RUNTIME_ENV = {};

const MINSK = { lat: 53.9006, lng: 27.5590, radiusKm: 32 };
const TELEGRAM_MAX_AGE_SECONDS = 24 * 60 * 60;
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const EVENT_SELECT = `
  id, organizer_id, title, description, kind, emoji, vibe, district, public_location,
  latitude, longitude, start_at, end_at, price, capacity, participant_count, age_label,
  tags, schedule, cover_url, status, requires_approval, created_at,
  organizer:users!events_organizer_id_fkey(id, telegram_id, username, display_name, avatar_url, rating, verified)
`;

function env(name, required = true) {
  const value = RUNTIME_ENV[name];
  if (required && !value) throw new Error(`Не задана переменная окружения ${name}`);
  return value || '';
}

function db() {
  const secretKey = env('SUPABASE_SECRET_KEY', false) || env('SUPABASE_SERVICE_ROLE_KEY', false);
  if (!secretKey) throw new Error('Не задан SUPABASE_SECRET_KEY');
  return createClient(env('SUPABASE_URL'), secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(message, status = 400, details) {
  return json({ ok: false, error: message, ...(details ? { details } : {}) }, status);
}

function safeText(value, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}

function haversineKm(a, b) {
  const rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

function timingSafeHexEqual(a, b) {
  try {
    const aa = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

function validateTelegramInitData(initData) {
  if (!initData) throw Object.assign(new Error('Приложение нужно открыть через Telegram.'), { status: 401 });
  const botToken = env('TELEGRAM_BOT_TOKEN');
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) throw Object.assign(new Error('Telegram не передал подпись авторизации.'), { status: 401 });

  const authDate = Number(params.get('auth_date') || 0);
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || Math.abs(now - authDate) > TELEGRAM_MAX_AGE_SECONDS) {
    throw Object.assign(new Error('Сессия Telegram устарела. Закройте и снова откройте приложение.'), { status: 401 });
  }

  const pairs = [];
  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (!timingSafeHexEqual(calculatedHash, receivedHash)) {
    throw Object.assign(new Error('Не удалось подтвердить подпись Telegram.'), { status: 401 });
  }

  let user;
  try { user = JSON.parse(params.get('user') || '{}'); } catch { user = null; }
  if (!user?.id) throw Object.assign(new Error('Telegram не передал данные пользователя.'), { status: 401 });
  return user;
}

function devTelegramUser(req) {
  if (RUNTIME_ENV.ALLOW_DEV_AUTH !== 'true') return null;
  const header = req.headers.get('x-vibe-dev-user');
  if (!header) return null;
  const id = Number(RUNTIME_ENV.DEV_TELEGRAM_ID || header || 999000001);
  return { id, first_name: 'Тестовый', last_name: 'Пользователь', username: 'vibe_dev', photo_url: null };
}

async function telegramUserFromRequest(req, required = true) {
  const dev = devTelegramUser(req);
  if (dev) return dev;
  const initData = req.headers.get('x-telegram-init-data') || '';
  if (!initData && !required) return null;
  return validateTelegramInitData(initData);
}

async function ensureUser(client, tg) {
  const payload = {
    telegram_id: Number(tg.id),
    username: tg.username || null,
    first_name: tg.first_name || '',
    last_name: tg.last_name || '',
    display_name: [tg.first_name, tg.last_name].filter(Boolean).join(' ') || tg.username || `Пользователь ${tg.id}`,
    avatar_url: tg.photo_url || null,
    verified: true
  };
  const { data, error } = await client.from('users').upsert(payload, { onConflict: 'telegram_id' }).select('*').single();
  if (error) throw error;
  if (data.is_blocked) throw Object.assign(new Error('Доступ к сервису ограничен.'), { status: 403 });
  return data;
}

async function currentUser(req, client, required = true) {
  const tg = await telegramUserFromRequest(req, required);
  if (!tg) return null;
  return ensureUser(client, tg);
}

function eventDto(row, extras = {}) {
  if (!row) return null;
  return {
    id: row.id,
    organizerId: row.organizer_id,
    title: row.title,
    desc: row.description,
    kind: row.kind,
    emoji: row.emoji,
    vibe: row.vibe,
    district: row.district,
    publicLocation: row.public_location,
    privateAddress: extras.privateAddress || null,
    lat: row.latitude,
    lng: row.longitude,
    startAt: row.start_at,
    endAt: row.end_at,
    price: Number(row.price || 0),
    capacity: row.capacity,
    people: row.participant_count,
    age: row.age_label,
    tags: row.tags || [],
    schedule: row.schedule || [],
    coverUrl: row.cover_url || null,
    status: row.status,
    requiresApproval: row.requires_approval,
    owner: !!extras.owner,
    favorite: !!extras.favorite,
    requestStatus: extras.requestStatus || null,
    member: !!extras.member,
    organizer: row.organizer ? {
      id: row.organizer.id,
      telegramId: row.organizer.telegram_id,
      name: row.organizer.display_name,
      username: row.organizer.username,
      avatarUrl: row.organizer.avatar_url,
      rating: Number(row.organizer.rating || 5),
      verified: row.organizer.verified
    } : null
  };
}

function userDto(row) {
  return {
    id: row.id,
    telegramId: row.telegram_id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    name: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    birthDate: row.birth_date,
    rating: Number(row.rating || 5),
    verified: row.verified,
    createdAt: row.created_at
  };
}

async function loadEventExtras(client, user, ids) {
  const result = new Map(ids.map(id => [id, { owner: false, favorite: false, requestStatus: null, member: false }]));
  if (!user || !ids.length) return result;
  const [favRes, reqRes, memberRes] = await Promise.all([
    client.from('favorites').select('event_id').eq('user_id', user.id).in('event_id', ids),
    client.from('event_requests').select('event_id,status').eq('user_id', user.id).in('event_id', ids),
    client.from('event_members').select('event_id').eq('user_id', user.id).in('event_id', ids)
  ]);
  for (const f of favRes.data || []) result.get(f.event_id).favorite = true;
  for (const r of reqRes.data || []) result.get(r.event_id).requestStatus = r.status;
  for (const m of memberRes.data || []) result.get(m.event_id).member = true;
  return result;
}

function eventDeepLink(eventId) {
  const bot = (RUNTIME_ENV.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
  const short = (RUNTIME_ENV.TELEGRAM_APP_SHORT_NAME || '').replace(/^\//, '');
  if (!bot || !eventId) return '';
  const base = short ? `https://t.me/${bot}/${short}` : `https://t.me/${bot}`;
  return `${base}?startapp=${encodeURIComponent('event_' + eventId)}`;
}

async function sendTelegramMessage(chatId, text, eventId = null) {
  const token = RUNTIME_ENV.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId || Number(chatId) <= 0) return;
  try {
    const url = eventDeepLink(eventId);
    const payload = { chat_id: chatId, text, disable_web_page_preview: true };
    if (url) payload.reply_markup = { inline_keyboard: [[{ text: 'Открыть в ВАЙБ СИТИ', url }]] };
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('Telegram notification failed:', error?.message || error);
  }
}

async function notify(client, { userId, actorId = null, eventId = null, type, title, body, telegramId = null }) {
  await client.from('notifications').insert({ user_id: userId, actor_id: actorId, event_id: eventId, type, title, body });
  if (telegramId) await sendTelegramMessage(telegramId, `${title}\n${body}`, eventId);
}

async function getPublicEvents(client, user) {
  const { data, error } = await client.from('events').select(EVENT_SELECT)
    .eq('status', 'published')
    .gte('start_at', new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString())
    .lte('start_at', new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString())
    .order('start_at', { ascending: true })
    .limit(150);
  if (error) throw error;
  const extras = await loadEventExtras(client, user, (data || []).map(x => x.id));
  return (data || []).map(row => eventDto(row, { ...extras.get(row.id), owner: user?.id === row.organizer_id }));
}

async function getOneEvent(client, user, id) {
  const { data: row, error } = await client.from('events').select(EVENT_SELECT).eq('id', id).single();
  if (error) throw error;
  let member = false, favorite = false, requestStatus = null, privateAddress = null;
  if (user) {
    const owner = row.organizer_id === user.id;
    const [m, f, r] = await Promise.all([
      client.from('event_members').select('event_id').eq('event_id', id).eq('user_id', user.id).maybeSingle(),
      client.from('favorites').select('event_id').eq('event_id', id).eq('user_id', user.id).maybeSingle(),
      client.from('event_requests').select('status').eq('event_id', id).eq('user_id', user.id).maybeSingle()
    ]);
    member = !!m.data;
    favorite = !!f.data;
    requestStatus = r.data?.status || null;
    if (owner || member) {
      const { data } = await client.from('events').select('private_address').eq('id', id).single();
      privateAddress = data?.private_address || null;
    }
    return eventDto(row, { owner, member, favorite, requestStatus, privateAddress });
  }
  return eventDto(row);
}

async function requireEventOwner(client, user, eventId) {
  const { data, error } = await client.from('events').select('id,organizer_id,title,status').eq('id', eventId).single();
  if (error) throw error;
  if (data.organizer_id !== user.id) throw Object.assign(new Error('Это действие доступно только организатору.'), { status: 403 });
  return data;
}

async function requireMember(client, user, eventId) {
  const { data, error } = await client.from('event_members').select('role').eq('event_id', eventId).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw Object.assign(new Error('Чат доступен только участникам события.'), { status: 403 });
  return data;
}

async function handleJsonAction(req, client, body) {
  const action = body?.action;

  if (action === 'events') {
    const user = await currentUser(req, client, false);
    return json({ ok: true, events: await getPublicEvents(client, user) });
  }

  if (action === 'session') {
    const user = await currentUser(req, client, true);
    const [events, notes] = await Promise.all([
      client.from('events').select('id', { count: 'exact' }).eq('organizer_id', user.id),
      client.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null)
    ]);
    const ownIds = (events.data || []).map(x => x.id);
    let pendingCount = 0;
    if (ownIds.length) {
      const pending = await client.from('event_requests').select('id', { count: 'exact', head: true }).in('event_id', ownIds).eq('status', 'pending');
      pendingCount = pending.count || 0;
    }
    const botUsername = (RUNTIME_ENV.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
    const shortName = (RUNTIME_ENV.TELEGRAM_APP_SHORT_NAME || '').replace(/^\//, '');
    const appLinkBase = botUsername ? (shortName ? `https://t.me/${botUsername}/${shortName}` : `https://t.me/${botUsername}`) : '';
    return json({ ok: true, user: userDto(user), stats: { myEvents: events.count || ownIds.length, pendingRequests: pendingCount, unreadNotifications: notes.count || 0 }, config: { appLinkBase, appUrl: RUNTIME_ENV.APP_URL || '' } });
  }

  const user = await currentUser(req, client, true);

  if (action === 'event') {
    return json({ ok: true, event: await getOneEvent(client, user, safeText(body.id, 80)) });
  }

  if (action === 'profile') {
    if (body.id) {
      const { data, error } = await client.from('users').select('*').eq('id', safeText(body.id, 80)).single();
      if (error) throw error;
      const { count } = await client.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', data.id).eq('status', 'published');
      return json({ ok: true, user: userDto(data), organizedEvents: count || 0 });
    }
    return json({ ok: true, user: userDto(user) });
  }

  if (action === 'update_profile') {
    const patch = {
      display_name: safeText(body.name, 80) || user.display_name,
      bio: safeText(body.bio, 500),
      birth_date: body.birthDate || null
    };
    const { data, error } = await client.from('users').update(patch).eq('id', user.id).select('*').single();
    if (error) throw error;
    return json({ ok: true, user: userDto(data) });
  }

  if (action === 'my_events') {
    const { data, error } = await client.from('events').select(EVENT_SELECT).eq('organizer_id', user.id).order('start_at', { ascending: true });
    if (error) throw error;
    return json({ ok: true, events: (data || []).map(row => eventDto(row, { owner: true, member: true })) });
  }

  if (action === 'create_event') {
    const lat = Number(body.lat), lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || haversineKm(MINSK, { lat, lng }) > MINSK.radiusKm) {
      return fail('Событие можно создать только в пределах Минска.', 422);
    }
    const allowedKinds = new Set(['party','home','bar','music','games','social','spontaneous']);
    const kind = allowedKinds.has(body.kind) ? body.kind : 'social';
    const event = {
      organizer_id: user.id,
      title: safeText(body.title, 90),
      description: safeText(body.description, 3000),
      kind,
      emoji: safeText(body.emoji, 8) || '✨',
      vibe: safeText(body.vibe, 30) || 'НОВОЕ',
      district: safeText(body.district, 80),
      public_location: safeText(body.publicLocation, 160) || safeText(body.district, 80),
      private_address: safeText(body.privateAddress, 300) || null,
      latitude: lat,
      longitude: lng,
      start_at: body.startAt,
      end_at: body.endAt || null,
      price: Math.max(0, Number(body.price || 0)),
      capacity: Math.min(5000, Math.max(2, Number(body.capacity || 8))),
      age_label: safeText(body.age, 30) || '18+',
      tags: Array.isArray(body.tags) ? body.tags.map(x => safeText(x, 40)).filter(Boolean).slice(0, 8) : [],
      schedule: Array.isArray(body.schedule) ? body.schedule.slice(0, 20) : [],
      status: 'published',
      requires_approval: body.requiresApproval !== false
    };
    if (event.title.length < 3 || event.description.length < 10 || !event.start_at) return fail('Заполните название, описание и время.', 422);
    const startMs = new Date(event.start_at).getTime();
    if (!Number.isFinite(startMs) || startMs < Date.now() - 30 * 60 * 1000) return fail('Время события должно быть сейчас или в будущем.', 422);
    const { data, error } = await client.from('events').insert(event).select(EVENT_SELECT).single();
    if (error) throw error;
    const member = await client.from('event_members').insert({ event_id: data.id, user_id: user.id, role: 'organizer' });
    if (member.error) throw member.error;
    return json({ ok: true, event: await getOneEvent(client, user, data.id) }, 201);
  }

  if (action === 'set_event_status') {
    const eventId = safeText(body.eventId, 80);
    await requireEventOwner(client, user, eventId);
    const allowed = new Set(['published','hidden','cancelled']);
    if (!allowed.has(body.status)) return fail('Недопустимый статус.', 422);
    const { error } = await client.from('events').update({ status: body.status }).eq('id', eventId);
    if (error) throw error;
    return json({ ok: true });
  }

  if (action === 'join_event') {
    const eventId = safeText(body.eventId, 80);
    const { data: rpcRows, error: rpcError } = await client.rpc('submit_event_request', {
      p_event_id: eventId,
      p_user_id: user.id,
      p_note: safeText(body.note, 500)
    });
    if (rpcError) throw rpcError;
    const result = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    await notify(client, {
      userId: result.organizer_id, actorId: user.id, eventId, type: 'join_request',
      title: result.request_status === 'accepted' ? 'Новый участник' : 'Новая заявка',
      body: result.request_status === 'accepted' ? `${user.display_name} присоединился к «${result.event_title}».` : `${user.display_name} хочет попасть на «${result.event_title}».`,
      telegramId: result.organizer_telegram_id
    });
    return json({ ok: true, request: { id: result.request_id, status: result.request_status } });
  }

  if (action === 'cancel_request') {
    const eventId = safeText(body.eventId, 80);
    const { error } = await client.from('event_requests').update({ status: 'cancelled' }).eq('event_id', eventId).eq('user_id', user.id).in('status', ['pending','declined']);
    if (error) throw error;
    return json({ ok: true });
  }

  if (action === 'requests') {
    const direction = body.direction === 'outgoing' ? 'outgoing' : 'incoming';
    if (direction === 'outgoing') {
      const { data, error } = await client.from('event_requests')
        .select('id,event_id,user_id,note,status,created_at,updated_at,event:events!event_requests_event_id_fkey(id,title,emoji,district,start_at,organizer_id,organizer:users!events_organizer_id_fkey(id,display_name,avatar_url,rating))')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return json({ ok: true, requests: data || [] });
    }
    const { data: own, error: ownError } = await client.from('events').select('id').eq('organizer_id', user.id);
    if (ownError) throw ownError;
    const ids = (own || []).map(x => x.id);
    if (!ids.length) return json({ ok: true, requests: [] });
    const { data, error } = await client.from('event_requests')
      .select('id,event_id,user_id,note,status,created_at,updated_at,applicant:users!event_requests_user_id_fkey(id,display_name,username,avatar_url,rating,verified),event:events!event_requests_event_id_fkey(id,title,emoji,district,start_at)')
      .in('event_id', ids).order('created_at', { ascending: false });
    if (error) throw error;
    return json({ ok: true, requests: data || [] });
  }

  if (action === 'resolve_request') {
    const requestId = safeText(body.requestId, 80);
    const decision = body.decision === 'accepted' ? 'accepted' : body.decision === 'declined' ? 'declined' : null;
    if (!decision) return fail('Нужно выбрать: принять или отклонить.', 422);
    const { data: rpcRows, error: rpcError } = await client.rpc('resolve_event_request', {
      p_request_id: requestId,
      p_organizer_id: user.id,
      p_decision: decision
    });
    if (rpcError) throw rpcError;
    const result = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    await notify(client, {
      userId: result.applicant_id, actorId: user.id, eventId: result.event_id,
      type: decision === 'accepted' ? 'request_accepted' : 'request_declined',
      title: decision === 'accepted' ? 'Заявка принята 🎉' : 'Заявка отклонена',
      body: decision === 'accepted' ? `Вы приняты на «${result.event_title}». Чат события открыт.` : `Организатор отклонил заявку на «${result.event_title}».`,
      telegramId: result.applicant_telegram_id
    });
    return json({ ok: true, status: decision });
  }

  if (action === 'chats') {
    const { data: memberships, error } = await client.from('event_members')
      .select('event_id,role,event:events!event_members_event_id_fkey(id,title,emoji,district,start_at,status,cover_url)')
      .eq('user_id', user.id).order('joined_at', { ascending: false });
    if (error) throw error;
    const ids = (memberships || []).map(m => m.event_id);
    if (!ids.length) return json({ ok: true, chats: [] });
    const { data: reads } = await client.from('chat_reads').select('event_id,last_read_at').eq('user_id', user.id).in('event_id', ids);
    const readMap = new Map((reads || []).map(r => [r.event_id, r.last_read_at]));
    const chats = [];
    for (const m of memberships || []) {
      const { data: last } = await client.from('messages').select('id,text,created_at,sender:users!messages_sender_id_fkey(display_name)').eq('event_id', m.event_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      const lastRead = readMap.get(m.event_id) || '1970-01-01T00:00:00Z';
      const { count } = await client.from('messages').select('id', { count: 'exact', head: true }).eq('event_id', m.event_id).gt('created_at', lastRead).neq('sender_id', user.id);
      chats.push({ eventId: m.event_id, role: m.role, event: m.event, lastMessage: last || null, unread: count || 0 });
    }
    chats.sort((a,b) => new Date(b.lastMessage?.created_at || b.event.start_at) - new Date(a.lastMessage?.created_at || a.event.start_at));
    return json({ ok: true, chats });
  }

  if (action === 'messages') {
    const eventId = safeText(body.eventId, 80);
    await requireMember(client, user, eventId);
    const { data, error } = await client.from('messages')
      .select('id,event_id,sender_id,text,created_at,edited_at,sender:users!messages_sender_id_fkey(id,display_name,avatar_url,username)')
      .eq('event_id', eventId).order('created_at', { ascending: true }).limit(250);
    if (error) throw error;
    await client.from('chat_reads').upsert({ event_id: eventId, user_id: user.id, last_read_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' });
    return json({ ok: true, messages: data || [] });
  }

  if (action === 'send_message') {
    const eventId = safeText(body.eventId, 80);
    const text = safeText(body.text, 2000);
    if (!text) return fail('Сообщение пустое.', 422);
    await requireMember(client, user, eventId);
    const { data: message, error } = await client.from('messages').insert({ event_id: eventId, sender_id: user.id, text }).select('id,event_id,sender_id,text,created_at').single();
    if (error) throw error;
    const { data: event } = await client.from('events').select('title').eq('id', eventId).single();
    const { data: members } = await client.from('event_members').select('user_id,user:users!event_members_user_id_fkey(telegram_id)').eq('event_id', eventId).neq('user_id', user.id).limit(50);
    await Promise.all((members || []).slice(0, 20).map(member => notify(client, {
        userId: member.user_id, actorId: user.id, eventId, type: 'message', title: `Новое сообщение · ${event?.title || 'событие'}`,
        body: `${user.display_name}: ${text.slice(0, 120)}`, telegramId: member.user?.telegram_id
      })));
    return json({ ok: true, message }, 201);
  }

  if (action === 'favorites') {
    const { data: favs, error: favError } = await client.from('favorites').select('event_id,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (favError) throw favError;
    const ids = (favs || []).map(x => x.event_id);
    if (!ids.length) return json({ ok: true, events: [] });
    const { data, error } = await client.from('events').select(EVENT_SELECT).in('id', ids);
    if (error) throw error;
    const byId = new Map((data || []).map(row => [row.id, row]));
    return json({ ok: true, events: ids.map(id => byId.get(id)).filter(Boolean).map(row => eventDto(row, { favorite: true, owner: row.organizer_id === user.id })) });
  }

  if (action === 'toggle_favorite') {
    const eventId = safeText(body.eventId, 80);
    const { data: existing } = await client.from('favorites').select('event_id').eq('user_id', user.id).eq('event_id', eventId).maybeSingle();
    if (existing) {
      const { error } = await client.from('favorites').delete().eq('user_id', user.id).eq('event_id', eventId);
      if (error) throw error;
      return json({ ok: true, favorite: false });
    }
    const { error } = await client.from('favorites').insert({ user_id: user.id, event_id: eventId });
    if (error) throw error;
    return json({ ok: true, favorite: true });
  }

  if (action === 'notifications') {
    const { data, error } = await client.from('notifications')
      .select('id,type,title,body,read_at,created_at,event_id,actor:users!notifications_actor_id_fkey(id,display_name,avatar_url)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return json({ ok: true, notifications: data || [] });
  }

  if (action === 'read_notification') {
    const id = safeText(body.id, 80);
    const { error } = await client.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return json({ ok: true });
  }

  if (action === 'report') {
    const reason = safeText(body.reason, 160);
    if (!reason) return fail('Укажите причину жалобы.', 422);
    const row = { reporter_id: user.id, reason, details: safeText(body.details, 1000) };
    if (body.eventId) row.event_id = safeText(body.eventId, 80);
    if (body.userId) row.target_user_id = safeText(body.userId, 80);
    if (!row.event_id && !row.target_user_id) return fail('Не указан объект жалобы.', 422);
    const { error } = await client.from('reports').insert(row);
    if (error) throw error;
    return json({ ok: true }, 201);
  }

  return fail('Неизвестное действие API.', 404);
}

async function handleUpload(req, client, form) {
  const user = await currentUser(req, client, true);
  const eventId = safeText(form.get('eventId'), 80);
  await requireEventOwner(client, user, eventId);
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') return fail('Файл не выбран.', 422);
  if (file.size > 5 * 1024 * 1024) return fail('Максимальный размер изображения — 5 МБ.', 413);
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return fail('Допустимы JPG, PNG и WebP.', 415);
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${user.id}/${eventId}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await client.storage.from('event-media').upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: '3600' });
  if (uploadError) throw uploadError;
  const { data: urlData } = client.storage.from('event-media').getPublicUrl(path);
  const coverUrl = urlData.publicUrl;
  const { error: updateError } = await client.from('events').update({ cover_url: coverUrl }).eq('id', eventId).eq('organizer_id', user.id);
  if (updateError) throw updateError;
  return json({ ok: true, coverUrl });
}

export default {
  async fetch(req, workerEnv) {
    RUNTIME_ENV = workerEnv;
    const url = new URL(req.url);

    // Static assets normally bypass the Worker because of run_worker_first,
    // but this fallback keeps direct/non-API requests safe during local dev.
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return workerEnv.ASSETS.fetch(req);
    }

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type,x-telegram-init-data,x-vibe-dev-user', 'access-control-allow-methods': 'POST,OPTIONS' } });
    if (req.method !== 'POST') return fail('Используйте POST.', 405);
    try {
      const client = db();
      const type = req.headers.get('content-type') || '';
      if (type.includes('multipart/form-data')) {
        const form = await req.formData();
        if (form.get('action') !== 'upload_cover') return fail('Неизвестная операция загрузки.', 404);
        return await handleUpload(req, client, form);
      }
      const body = await req.json().catch(() => ({}));
      return await handleJsonAction(req, client, body);
    } catch (error) {
      console.error(error);
      const raw = String(error?.message || error || '');
      const mapped = raw.includes('EVENT_FULL') ? ['Свободных мест больше нет.',409]
        : raw.includes('OWN_EVENT') ? ['Нельзя отправить заявку на собственное событие.',422]
        : raw.includes('EVENT_UNAVAILABLE') ? ['Событие сейчас недоступно.',409]
        : raw.includes('NOT_OWNER') ? ['Это действие доступно только организатору.',403]
        : raw.includes('REQUEST_ALREADY_RESOLVED') ? ['Эта заявка уже обработана.',409]
        : raw.includes('REQUEST_NOT_FOUND') || raw.includes('EVENT_NOT_FOUND') ? ['Запись не найдена.',404]
        : null;
      const status = mapped?.[1] || error?.status || (error?.code === 'PGRST116' ? 404 : 500);
      const message = mapped?.[0] || (status >= 500 ? 'Сервер временно не смог выполнить запрос.' : error.message);
      return fail(message, status, RUNTIME_ENV.ENVIRONMENT === 'development' ? raw : undefined);
    }
  }
};
