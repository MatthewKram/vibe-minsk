const $ = (s, root = document) => root.querySelector(s);
const ICONS = {
  home:'<path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  map:'<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  inbox:'<path d="M4 4h16v12H4z"/><path d="M4 13h4l2 3h4l2-3h4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.6-4 4.3-6 8-6s6.4 2 8 6"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  spark:'<path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  chat:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
  arrow:'<path d="m9 18 6-6-6-6"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  fire:'<path d="M12 22c4 0 7-3 7-7 0-5-4-8-5-11-2 2-3 4-3 6-1-1-2-2-2-4-3 3-4 6-4 9 0 4 3 7 7 7Z"/>',
  ticket:'<path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 0 0-6V5H2z"/><path d="M13 5v14"/>',
  crown:'<path d="m3 7 4 4 5-7 5 7 4-4-2 11H5z"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>'
};
function icon(name, cls=''){ return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.spark}</svg>`; }

const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const MINSK_CENTER = [53.9006, 27.5590];
const MINSK_RADIUS_KM = 32;
const DISTRICTS = {
  'Центр': [53.9006, 27.5590],
  'Немига': [53.9052, 27.5535],
  'Зыбицкая': [53.9050, 27.5587],
  'Октябрьская': [53.9023, 27.5619],
  'Верхний город': [53.9040, 27.5568],
  'Комаровка': [53.9165, 27.5770],
  'Площадь Победы': [53.9084, 27.5748],
  'Восток': [53.9230, 27.6104],
  'Уручье': [53.9382, 27.6550]
};

const KIND_ICON = { party:'fire', home:'home', bar:'ticket', music:'spark', games:'crown', social:'users', spontaneous:'spark', all:'spark' };
function kindIcon(kind, cls=''){ return icon(KIND_ICON[kind] || 'spark', cls); }

const KIND_META = {
  all: ['✨','Все'], party: ['🔥','Тусовки'], home: ['🏠','Домашние'], bar: ['🍸','Бары'],
  music: ['🎤','Музыка'], games: ['🎲','Игры'], social: ['💜','Знакомства'], spontaneous: ['⚡','Сейчас']
};

const state = {
  route: { name: 'home' }, history: [],
  tg: null, tgUser: null, user: null, appLinkBase: '', appUrl: '', sessionStats: { myEvents: 0, pendingRequests: 0, unreadNotifications: 0 },
  events: [], myEvents: [], incoming: [], outgoing: [], chats: [], notifications: [], favoriteEvents: [],
  currentMessages: [], profileView: null,
  query: '', timeFilter: 'Все', kindFilter: 'all', priceFilter: 'all', districtFilter: 'all', radius: 20,
  inboxTab: 'incoming', userPos: null, map: null, notificationSheet: false,
  loading: true, busy: false, authError: null, publicOnly: false,
  chatPoll: null,
  createDraft: defaultDraft(),
  photoFile: null,
  eventMembers: []
};

function defaultDraft() {
  const d = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Minsk', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const time = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Minsk', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { title: '', kind: 'party', date, time, capacity: 10, price: 0, district: 'Центр', age: '18+', description: '', tags: 'музыка, общение', publicLocation: 'Центр Минска', privateAddress: '', requiresApproval: true };
}

function escapeHtml(str = '') {
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function initials(name = 'ВС') {
  return name.split(/\s+/).filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();
}

function toast(message) {
  let root = $('.toast-root');
  if (!root) { root = document.createElement('div'); root.className = 'toast-root'; document.body.appendChild(root); }
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; root.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function haptic(style = 'light') {
  try { state.tg?.HapticFeedback?.impactOccurred?.(style); } catch {}
}

function setupTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  state.tg = tg;
  state.tgUser = tg.initDataUnsafe?.user || null;
  try {
    tg.ready(); tg.expand();
    tg.setHeaderColor?.('#090312'); tg.setBackgroundColor?.('#090312'); tg.setBottomBarColor?.('#090312');
    tg.enableClosingConfirmation?.();
  } catch {}
}

function authHeaders() {
  const headers = {};
  const initData = state.tg?.initData || '';
  if (initData) headers['x-telegram-init-data'] = initData;
  if (!initData && ['localhost','127.0.0.1'].includes(location.hostname)) headers['x-vibe-dev-user'] = '1';
  return headers;
}

async function api(action, payload = {}, options = {}) {
  const response = await fetch('/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await response.json().catch(() => ({ ok: false, error: 'Сервер вернул некорректный ответ.' }));
  if (!response.ok || !data.ok) {
    const error = new Error(data.error || `Ошибка ${response.status}`);
    error.status = response.status;
    if (!options.silent) throw error;
    return null;
  }
  return data;
}

async function apiUpload(eventId, file) {
  const form = new FormData();
  form.append('action', 'upload_cover'); form.append('eventId', eventId); form.append('file', file);
  const response = await fetch('/api', { method: 'POST', headers: authHeaders(), body: form });
  const data = await response.json().catch(() => ({ ok: false, error: 'Ошибка загрузки.' }));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Не удалось загрузить изображение.');
  return data;
}

async function bootstrap() {
  setupTelegram();
  render();
  try {
    const events = await api('events', {}, { silent: false });
    state.events = events.events || [];
  } catch (error) {
    state.authError = 'Не удалось подключиться к серверу. Проверьте настройки Cloudflare и Supabase.';
  }

  try {
    const session = await api('session');
    state.user = session.user;
    state.sessionStats = session.stats || state.sessionStats;
    state.appLinkBase = session.config?.appLinkBase || '';
    state.appUrl = session.config?.appUrl || '';
    await refreshPrivateData(false);
  } catch (error) {
    if (error.status === 401) {
      state.publicOnly = true;
      state.authError = 'Откройте V I B E через Telegram-бота, чтобы подавать заявки, создавать события и общаться.';
    } else {
      state.authError = error.message;
    }
  }
  state.loading = false;
  const qs = new URLSearchParams(location.search);
  const startParam = state.tg?.initDataUnsafe?.start_param || qs.get('tgWebAppStartParam');
  const sharedEvent = qs.get('event');
  if (startParam?.startsWith('event_')) state.route = { name: 'event', id: startParam.slice(6) };
  else if (sharedEvent) state.route = { name: 'event', id: sharedEvent };
  render();
}

async function refreshPrivateData(renderAfter = true) {
  if (!state.user) return;
  const [my, incoming, outgoing, chats, notes] = await Promise.all([
    api('my_events', {}, { silent: true }), api('requests', { direction: 'incoming' }, { silent: true }),
    api('requests', { direction: 'outgoing' }, { silent: true }), api('chats', {}, { silent: true }),
    api('notifications', {}, { silent: true })
  ]);
  state.myEvents = my?.events || state.myEvents;
  state.incoming = incoming?.requests || state.incoming;
  state.outgoing = outgoing?.requests || state.outgoing;
  state.chats = chats?.chats || state.chats;
  state.notifications = notes?.notifications || state.notifications;
  state.sessionStats.myEvents = state.myEvents.length;
  state.sessionStats.pendingRequests = state.incoming.filter(r => r.status === 'pending').length;
  state.sessionStats.unreadNotifications = state.notifications.filter(n => !n.read_at).length;
  if (renderAfter) render();
}

async function refreshEvents(renderAfter = true) {
  const result = await api('events', {}, { silent: true });
  if (result) state.events = result.events || [];
  if (renderAfter) render();
}

function requireAuth() {
  if (state.user) return true;
  toast('Это действие доступно после открытия приложения через Telegram.');
  haptic('medium');
  return false;
}

function formatPrice(value) { return Number(value) === 0 ? 'Бесплатно' : `${Number(value).toFixed(Number(value) % 1 ? 2 : 0)} руб.`; }
function formatDate(iso) {
  if (!iso) return 'Дата уточняется';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Minsk', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}
function formatTime(iso) { return new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Minsk', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)); }
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(diff / 60000));
  if (min < 1) return 'только что'; if (min < 60) return `${min} мин назад`; const h = Math.floor(min / 60); if (h < 24) return `${h} ч назад`;
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(iso));
}
function distanceKm(a, b) {
  if (!a || !b) return null;
  const rad = d => d * Math.PI / 180, R = 6371, dLat = rad(b[0]-a[0]), dLon = rad(b[1]-a[1]);
  const x = Math.sin(dLat/2)**2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
function eventDistance(e) { return state.userPos ? distanceKm(state.userPos, [e.lat,e.lng]) : null; }
function kindLabel(k) { return KIND_META[k]?.[1] || k; }
function eventGradient(e) {
  const map = {
    party:'linear-gradient(135deg,#6727ff 0%,#ff4fd8 52%,#ff9d47 100%)', home:'linear-gradient(135deg,#0f766e 0%,#19e6ff 48%,#b7ff5d 100%)',
    bar:'linear-gradient(135deg,#ff7a18 0%,#ff4fd8 56%,#6f3cff 100%)', music:'linear-gradient(135deg,#7a1cff 0%,#ff2fb3 55%,#ff7a18 100%)',
    games:'linear-gradient(135deg,#10428f 0%,#19e6ff 50%,#ff4fd8 100%)', social:'linear-gradient(135deg,#ff9d47 0%,#ffd76f 38%,#19e6ff 100%)',
    spontaneous:'linear-gradient(135deg,#00b7ff 0%,#19e6ff 44%,#8b5cf6 100%)'
  };
  return map[e.kind] || map.social;
}
function eventCoverStyle(e) {
  if (e.coverUrl) return `background-image:linear-gradient(180deg,rgba(6,6,8,.02),rgba(6,6,8,.52)),url('${escapeHtml(e.coverUrl)}');background-size:cover;background-position:center`;
  const fallback = ['party','home','bar','music','games','social','spontaneous'].includes(e.kind) ? e.kind : 'party';
  return `background-image:linear-gradient(180deg,rgba(6,6,8,.03),rgba(6,6,8,.2)),url('./assets/covers/${fallback}.svg');background-size:cover;background-position:center`;
}

function minskDateParts(iso) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Minsk', year:'numeric',month:'2-digit',day:'2-digit',weekday:'short' }).formatToParts(new Date(iso));
  return Object.fromEntries(parts.map(p => [p.type,p.value]));
}
function dateKey(date = new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Minsk',year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
function filteredEvents() {
  const q = state.query.trim().toLowerCase();
  const today = dateKey(); const tomorrow = dateKey(new Date(Date.now()+86400000));
  return state.events.filter(e => {
    if (e.status !== 'published') return false;
    const key = dateKey(new Date(e.startAt));
    let byTime = true;
    if (state.timeFilter === 'Сегодня') byTime = key === today;
    if (state.timeFilter === 'Завтра') byTime = key === tomorrow;
    if (state.timeFilter === 'Сейчас') { const diff = new Date(e.startAt).getTime() - Date.now(); byTime = diff > -3600000 && diff < 4*3600000; }
    if (state.timeFilter === 'Выходные') { const weekday = new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Minsk',weekday:'short'}).format(new Date(e.startAt)); byTime = ['Sat','Sun'].includes(weekday); }
    const byKind = state.kindFilter === 'all' || e.kind === state.kindFilter;
    const byPrice = state.priceFilter === 'all' || (state.priceFilter === 'free' ? e.price === 0 : e.price > 0);
    const byDistrict = state.districtFilter === 'all' || e.district === state.districtFilter;
    const dist = eventDistance(e); const byRadius = dist == null || dist <= state.radius;
    const hay = `${e.title} ${e.desc} ${e.district} ${(e.tags||[]).join(' ')} ${e.organizer?.name||''}`.toLowerCase();
    return byTime && byKind && byPrice && byDistrict && byRadius && (!q || hay.includes(q));
  }).sort((a,b) => new Date(a.startAt) - new Date(b.startAt));
}

function appShell(content) {
  return `<div class="app-shell"><div class="ambient ambient-a"></div><div class="ambient ambient-b"></div><div class="night-sky"><i></i><i></i><i></i><i></i><i></i></div><div class="cityline"></div><div class="noise"></div><main class="content">${content}</main>${bottomNav()}${state.notificationSheet ? notificationSheet() : ''}</div>`;
}
function mainTab() { const n=state.route.name; if(['home','event','user','favorites'].includes(n))return'home'; if(n==='map')return'map'; if(n==='create')return'create'; if(['inbox','chat'].includes(n))return'inbox'; return'profile'; }
function navItem(tab, iconName, label) { return `<button class="nav-item ${mainTab()===tab?'active':''}" data-nav="${tab}"><div>${icon(iconName)}<small>${label}</small></div></button>`; }
function bottomNav() { return `<nav class="bottom-nav">${navItem('home','home','Главная')}${navItem('map','map','Карта')}<button class="nav-create ${mainTab()==='create'?'active':''}" data-nav="create">${icon('plus')}</button>${navItem('inbox','inbox','Заявки')}${navItem('profile','user','Профиль')}</nav>`; }
function unreadCount() { return state.notifications.filter(n=>!n.read_at).length + state.chats.reduce((a,c)=>a+(c.unread||0),0); }
function topBar(sub='только Минск', back=false) {
  return `<div class="topbar top-space"><div class="brand-lockup">${back?`<button class="back-btn" data-back>${icon('back')}<span>Назад</span></button>`:`<button class="brand-core" data-nav="home" aria-label="V I B E"><span class="brand-v">V</span><span class="brand-word">I B E</span><em>MINSK</em></button>`}</div><div class="top-actions">${!back?`<button class="location-chip" data-action="geo">${icon('pin')}<strong>Минск</strong><small>локально</small></button>`:''}<button class="icon-btn top-notify" data-action="notifications">${icon('bell')}${unreadCount()?`<span class="notification-dot">${Math.min(9,unreadCount())}</span>`:''}</button></div></div>`;
}
function sectionTitle(title, sub='') { return `<div class="section-title"><div><h3>${title}</h3>${sub?`<small>${sub}</small>`:''}</div><span class="section-line"></span></div>`; }
function authBanner() { return state.authError ? `<div class="notice auth-notice"><b>${state.publicOnly?'Режим просмотра':'Нужна настройка'}</b><div>${escapeHtml(state.authError)}</div></div>` : ''; }
function loadingBlock(text='Загрузка…') { return `<div class="empty"><div class="spinner">✦</div><b>${escapeHtml(text)}</b><div>Получаем данные из общей базы.</div></div>`; }

function eventCard(e) {
  const dist = eventDistance(e);
  const fill = Math.min(100,Math.round((e.people/Math.max(1,e.capacity))*100));
  const spots = Math.max(0,e.capacity-e.people);
  const urgency = spots <= 3 ? 'Последние места' : spots <= 8 ? `${spots} мест` : `${e.people} уже идут`;
  const host = e.organizer?.name || 'Организатор';
  return `<article class="event-card premium-card" data-event="${e.id}">
    <div class="event-art" style="${eventCoverStyle(e)}"><div class="poster-noise"></div><div class="event-badges"><span class="badge live">${kindIcon(e.kind)} ${escapeHtml(e.vibe||'СОБЫТИЕ')}</span>${e.owner?'<span class="badge owner">МОЁ</span>':''}</div>${e.coverUrl?'':`<div class="art-signature">${kindIcon(e.kind,'hero-glyph')}<span>${escapeHtml(kindLabel(e.kind)).toUpperCase()}</span></div>`}<button class="heart-btn ${e.favorite?'active':''}" data-favorite="${e.id}">${icon('heart')}</button><div class="poster-footer"><span>${escapeHtml(e.district)}</span><strong>${escapeHtml(urgency)}</strong></div></div>
    <div class="event-info"><div class="eyebrow-row"><span>${formatDate(e.startAt)}</span><span>${formatPrice(e.price)}</span></div><h3>${escapeHtml(e.title)}</h3><div class="host-mini"><div class="micro-avatar">${e.organizer?.avatarUrl?`<img src="${escapeHtml(e.organizer.avatarUrl)}" alt="">`:initials(host)}</div><span>${escapeHtml(host)}</span>${e.organizer?.verified?'<i>✓</i>':''}</div><div class="event-bottom"><div class="capacity-wrap"><div class="capacity-line compact"><i style="width:${fill}%"></i></div><small>${e.people}/${e.capacity} · ${spots?`${spots} свободно`:'мест нет'}</small></div><span class="distance-pill">${dist!=null?`${dist.toFixed(1)} км`:'Минск'}</span></div></div>
  </article>`;
}
function listCard(e) {
  const spots=Math.max(0,e.capacity-e.people);
  return `<button class="list-card premium-list" data-event="${e.id}"><div class="list-preview" style="${eventCoverStyle(e)}">${e.coverUrl?'':`<span class="mini-art">${kindIcon(e.kind)}</span>`}</div><div class="list-copy"><small>${escapeHtml(e.district)} · ${formatDate(e.startAt)}</small><b>${escapeHtml(e.title)}</b><p>${escapeHtml((e.tags||[]).slice(0,3).join(' · ')||kindLabel(e.kind))}</p></div><div class="list-side"><b>${formatPrice(e.price)}</b><small class="${spots<=3?'hot-text':''}">${spots?`${spots} мест`:'полный'}</small>${icon('arrow')}</div></button>`;
}

function homeScreen() {
  const events = filteredEvents();
  const name = state.user?.firstName || state.tgUser?.first_name || 'Гость';
  const now=Date.now();
  const live=events.filter(e=>Math.abs(new Date(e.startAt)-now)<5*3600000).slice(0,5);
  const lastSpots=events.filter(e=>e.capacity-e.people>0&&e.capacity-e.people<=5).slice(0,6);
  const free=events.filter(e=>Number(e.price)===0).slice(0,6);
  const curated=events.slice(0,3);
  const districts = Object.keys(DISTRICTS).slice(0,6);
  return `<section class="screen home-v7">${topBar('Минск')}${authBanner()}
    <section class="hero-v7"><div class="hero-copy"><div class="live-kicker"><span></span> Сегодня в Минске</div><h1>Куда<br><em>сегодня?</em></h1><p>${escapeHtml(name)}, от камерных встреч до больших ночей — всё, что происходит рядом.</p><div class="hero-actions"><button class="primary-btn glow" data-action="random">${icon('spark')} Выбрать за меня</button><button class="round-action" data-nav="map">${icon('map')}</button></div></div><div class="hero-orbit"><div class="orb-ring r1"></div><div class="orb-ring r2"></div><div class="hero-orb"><span>${events.length}</span><small>событий</small></div><div class="orbit-chip c1">LIVE</div><div class="orbit-chip c2">${events.length} событий</div></div></section>
    <section class="pulse-strip"><div class="pulse-copy"><span class="pulse-dot"></span><div><b>Пульс города</b><small>${live.length?`${live.length} событий в ближайшие часы`:'вечер только начинается'}</small></div></div><div class="pulse-people">${(live.length?live:events).slice(0,4).map(e=>`<span title="${escapeHtml(e.title)}">${e.organizer?.avatarUrl?`<img src="${escapeHtml(e.organizer.avatarUrl)}" alt="">`:initials(e.organizer?.name||e.title)}</span>`).join('')}<b>LIVE</b></div></section>
    <div class="search-v7"><span>${icon('search')}</span><input id="searchInput" value="${escapeHtml(state.query)}" placeholder="Что ищем сегодня?"><button data-action="search">${icon('arrow')}</button></div>
    <div class="time-tabs premium-tabs">${['Сейчас','Сегодня','Завтра','Выходные','Все'].map(x=>`<button class="tab-chip ${state.timeFilter===x?'active':''}" data-time="${x}">${x}</button>`).join('')}</div>
    <section class="section">${sectionTitle('Настроение','выбери вайб')}<div class="vibe-categories">${Object.entries(KIND_META).map(([k,[emoji,label]])=>`<button class="vibe-category ${state.kindFilter===k?'active':''}" data-kind="${k}"><span>${kindIcon(k)}</span><b>${label}</b></button>`).join('')}</div></section>
    ${curated.length?`<section class="section">${sectionTitle('Выбор V I B E','то, что стоит открыть')}<div class="editorial-grid">${curated.map((e,i)=>`<button class="editorial-card e${i+1}" data-event="${e.id}" style="${eventCoverStyle(e)}"><span>${String(i+1).padStart(2,'0')}</span><div><small>${escapeHtml(e.district)} · ${formatTime(e.startAt)}</small><b>${escapeHtml(e.title)}</b><em>${formatPrice(e.price)}</em></div></button>`).join('')}</div></section>`:''}
    <section class="section">${sectionTitle('Горит сейчас',events.length?`${events.length} вариантов`:'пока тихо')}<div class="event-strip">${events.slice(0,8).map(eventCard).join('') || empty('', 'По этим фильтрам тихо','Попробуйте другой формат или время.')}</div></section>
    ${lastSpots.length?`<section class="section">${sectionTitle('Последние места','успей вписаться')}<div class="stack">${lastSpots.map(listCard).join('')}</div></section>`:''}
    ${free.length?`<section class="section">${sectionTitle('Бесплатно сегодня','без бюджета — не без планов')}<div class="event-strip compact-strip">${free.map(eventCard).join('')}</div></section>`:''}
    <section class="section">${sectionTitle('Районы','куда тянет сегодня')}<div class="district-grid v7">${districts.map((d,i)=>`<button class="district-card" data-district="${d}"><span>0${i+1}</span><b>${d}</b><small>${state.events.filter(e=>e.district===d&&e.status==='published').length} событий</small></button>`).join('')}</div></section>
    <section class="section filters-v7">${sectionTitle('Точный поиск','подстрой выдачу')}<div class="filter-bar"><select id="districtFilter"><option value="all">Все районы</option>${Object.keys(DISTRICTS).map(d=>`<option ${state.districtFilter===d?'selected':''}>${d}</option>`).join('')}</select><select id="priceFilter"><option value="all" ${state.priceFilter==='all'?'selected':''}>Любая цена</option><option value="free" ${state.priceFilter==='free'?'selected':''}>Бесплатно</option><option value="paid" ${state.priceFilter==='paid'?'selected':''}>Платно</option></select><label class="range-label">до ${state.radius} км<input id="radiusFilter" type="range" min="2" max="32" value="${state.radius}"></label></div></section>
    <section class="section">${sectionTitle('Вся лента','по времени')}<div class="stack">${events.map(listCard).join('')}</div></section>
  </section>`;
}

function mapScreen() {
  const events = filteredEvents();
  return `<section class="screen map-screen-v7">${topBar('карта Минска')}<div class="map-title"><div><div class="live-kicker"><span></span> ${events.length} точек</div><h1>Город<br>в движении</h1></div><button class="round-action" data-action="geo">${icon('pin')}</button></div><div class="map-controls">${Object.entries(KIND_META).map(([k,v])=>`<button class="filter-chip ${state.kindFilter===k?'active':''}" data-kind="${k}">${kindIcon(k)} ${v[1]}</button>`).join('')}</div><div class="map-wrap v7"><div id="map"></div><div class="map-fade"></div></div><div class="map-panel premium-panel"><div class="panel-label">Рядом с тобой</div><div class="mini-list">${events.slice(0,6).map(e=>`<button data-event="${e.id}"><span class="map-event-icon">${kindIcon(e.kind)}</span><div><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.district)} · ${formatDate(e.startAt)}</small></div><i>${formatPrice(e.price)}</i></button>`).join('')}</div></div></section>`;
}

function eventScreen(id) {
  const e = state.events.find(x=>x.id===id) || state.myEvents.find(x=>x.id===id);
  if (!e) return `<section class="screen">${topBar('событие',true)}${loadingBlock('Открываем событие…')}</section>`;
  const tags = (e.tags||[]).map(t=>`<span>${escapeHtml(t)}</span>`).join('');
  const schedule = (e.schedule||[]).map((row,i)=>`<div class="timeline-item"><span>${String(i+1).padStart(2,'0')}</span><div class="timeline-time">${escapeHtml(row[0]||'')}</div><div class="timeline-content"><b>${escapeHtml(row[1]||'')}</b></div></div>`).join('');
  const spots=Math.max(0,e.capacity-e.people); const fill=Math.min(100,Math.round(e.people/Math.max(1,e.capacity)*100));
  let cta = '';
  if (e.owner) cta = `<button class="primary-btn glow" data-manage="${e.id}">Управлять событием</button>`;
  else if (e.member) cta = `<button class="primary-btn glow" data-open-chat-event="${e.id}">${icon('chat')} В чат участников</button><button class="secondary-btn" data-leave-event="${e.id}">Покинуть</button>`;
  else if (e.requestStatus === 'pending') cta = `<button class="secondary-btn" data-cancel-request="${e.id}">Заявка отправлена · отменить</button>`;
  else if (e.requestStatus === 'declined') cta = `<button class="primary-btn glow" data-join="${e.id}">Подать заявку снова</button>`;
  else cta = `<button class="primary-btn glow" data-join="${e.id}">${e.requiresApproval?'Запросить вход':'Я иду'}</button>`;
  return `<section class="screen detail-v7">${topBar('событие',true)}<div class="detail-poster" style="${eventCoverStyle(e)}"><div class="poster-noise"></div><div class="detail-topbadges"><span class="badge live">${kindIcon(e.kind)} ${escapeHtml(e.vibe||'СЕГОДНЯ')}</span><span class="badge">${escapeHtml(e.district)}</span></div>${e.coverUrl?'':`<div class="detail-signature">${kindIcon(e.kind,'hero-glyph')}<b>${escapeHtml(kindLabel(e.kind)).toUpperCase()}</b></div>`}<div class="detail-poster-bottom"><div><small>${formatDate(e.startAt)}</small><b>${formatTime(e.startAt)}</b></div><div><small>Вход</small><b>${formatPrice(e.price)}</b></div></div></div><div class="detail-body"><div class="detail-title-row"><div><div class="live-kicker"><span></span> ${escapeHtml(e.vibe||'СОБЫТИЕ')}</div><h1>${escapeHtml(e.title)}</h1></div><button class="heart-btn floating ${e.favorite?'active':''}" data-favorite="${e.id}">${icon('heart')}</button></div><p class="lead">${escapeHtml(e.desc)}</p><div class="event-signal"><div><span>${icon('users')}</span><b>${e.people}</b><small>уже идут</small></div><div><span>${icon('ticket')}</span><b>${spots}</b><small>мест осталось</small></div><div><span>${icon('shield')}</span><b>${escapeHtml(e.age)}</b><small>возраст</small></div></div><div class="capacity-line large"><i style="width:${fill}%"></i></div>${e.privateAddress?`<div class="notice private-address"><b>${icon('pin')} Адрес открыт</b><div>${escapeHtml(e.privateAddress)}</div></div>`:`${e.kind==='home'?'<div class="notice safe-card"><b>Приватная локация</b><div>Точный адрес откроется после принятия заявки организатором.</div></div>':''}`}<button class="host-row premium-host" data-user="${e.organizer?.id||''}"><div class="avatar">${e.organizer?.avatarUrl?`<img src="${escapeHtml(e.organizer.avatarUrl)}" alt="">`:initials(e.organizer?.name||'Организатор')}</div><div><small>Организатор</small><b>${escapeHtml(e.organizer?.name||'Организатор')}</b><em>★ ${e.organizer?.rating||5} ${e.organizer?.verified?'· подтверждён':''}</em></div>${icon('arrow')}</button><div class="detail-actions">${cta}<div class="action-pair"><button class="secondary-btn" data-share="${e.id}">${icon('share')} Поделиться</button><button class="secondary-btn" data-favorite="${e.id}">${e.favorite?'Сохранено':'Сохранить'}</button></div></div></div><section class="section">${sectionTitle('Вайб','что ждёт внутри')}<div class="info-pills premium-pills">${tags||'<span>живое общение</span><span>новые люди</span>'}</div></section><section class="section">${sectionTitle('Как пойдёт вечер','ориентир от организатора')}<div class="timeline premium-timeline">${schedule || '<div class="notice">Организатор пока не добавил программу.</div>'}</div></section><section class="section trust-section"><div class="trust-card"><span>${icon('shield')}</span><div><b>Безопасность V I B E</b><p>Скрытые адреса, ручное подтверждение гостей и жалобы встроены в механику сервиса.</p></div></div><button class="danger-link" data-report-event="${e.id}">Пожаловаться на событие</button></section></section>`;
}

function createScreen() {
  const d = state.createDraft;
  if (!state.user) return `<section class="screen">${topBar('создать событие')}${authBanner()}${empty('', 'Нужен Telegram','Откройте V I B E через бота, чтобы публиковать события.')}</section>`;
  const preview={kind:d.kind,title:d.title||'Название вашего события',district:d.district,startAt:minskIso(d.date,d.time),price:d.price,capacity:d.capacity,people:1,organizer:{name:state.user.name},tags:d.tags.split(',').map(x=>x.trim()).filter(Boolean),coverUrl:null,vibe:'НОВОЕ'};
  return `<section class="screen create-v7">${topBar('создать',true)}<div class="create-head"><div class="live-kicker"><span></span> новая точка на карте</div><h1>Создай<br><em>свой движ.</em></h1><p>Заполни основу — событие сразу появится у людей в Минске.</p></div><div class="create-preview">${eventCard({...preview,id:'preview',favorite:false,owner:true,lat:MINSK_CENTER[0],lng:MINSK_CENTER[1],age:d.age,desc:d.description,status:'draft',requiresApproval:d.requiresApproval,emoji:'✨'})}</div><form id="createForm" class="form-wrap v7"><div class="form-step"><div class="step-label"><span>01</span><h3>Формат</h3></div><div class="choice-grid">${Object.entries(KIND_META).filter(([k])=>k!=='all').map(([k,[em,label]])=>`<button type="button" class="choice ${d.kind===k?'active':''}" data-create-kind="${k}"><span>${kindIcon(k)}</span><b>${label}</b></button>`).join('')}</div></div><div class="form-step"><div class="step-label"><span>02</span><h3>Суть</h3></div><label>Название<input name="title" value="${escapeHtml(d.title)}" maxlength="90" placeholder="Например: Midnight Loft" required></label><label>Описание<textarea name="description" rows="5" maxlength="3000" placeholder="Опиши атмосферу, формат и кого ждёшь…" required>${escapeHtml(d.description)}</textarea></label><label>Теги<input name="tags" value="${escapeHtml(d.tags)}" placeholder="хаус, новые люди, танцы"></label></div><div class="form-step"><div class="step-label"><span>03</span><h3>Время и место</h3></div><div class="field-grid"><label>Дата<input name="date" type="date" value="${d.date}" required></label><label>Время<input name="time" type="time" value="${d.time}" required></label></div><label>Район<select name="district">${Object.keys(DISTRICTS).map(x=>`<option ${d.district===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Публичная локация<input name="publicLocation" value="${escapeHtml(d.publicLocation)}" placeholder="Немига · 5 минут от метро"></label><label>Точный адрес <small>покажем только принятым гостям</small><input name="privateAddress" value="${escapeHtml(d.privateAddress)}" placeholder="улица, дом / название места"></label></div><div class="form-step"><div class="step-label"><span>04</span><h3>Правила</h3></div><div class="field-grid"><label>Вместимость<input name="capacity" type="number" min="2" max="5000" value="${d.capacity}"></label><label>Цена, руб.<input name="price" type="number" min="0" step="1" value="${d.price}"></label></div><label>Возраст<input name="age" value="${escapeHtml(d.age)}" placeholder="18+ или 20–30"></label><label class="check-row"><input name="requiresApproval" type="checkbox" ${d.requiresApproval?'checked':''}><span><b>Ручной вход</b><small>Ты сам решаешь, кто попадёт в событие и увидит адрес.</small></span></label></div><div class="form-step"><div class="step-label"><span>05</span><h3>Обложка</h3></div><label class="upload-box">${icon('spark')} <span><b>Добавить постер</b><small>JPG, PNG или WebP · до 5 МБ</small></span><input id="coverFile" type="file" accept="image/jpeg,image/png,image/webp"></label><small id="coverName">${state.photoFile?escapeHtml(state.photoFile.name):'Можно добавить позже.'}</small></div><button class="primary-btn glow wide publish-btn" type="submit" ${state.busy?'disabled':''}>${state.busy?'Публикуем…':'Опубликовать в Минске'}</button></form></section>`;
}

function statusBadge(status) {
  const map = { pending:['Ожидает','pending'], accepted:['Принято','accepted'], declined:['Отклонено','declined'], cancelled:['Отменено','cancelled'] };
  const [label,cls] = map[status] || [status,'']; return `<span class="status ${cls}">${label}</span>`;
}
function requestCard(r, incoming=true) {
  const person = r.applicant; const event = r.event;
  return `<article class="request-card glass"><div class="request-head"><div class="avatar">${person?.avatar_url?`<img src="${escapeHtml(person.avatar_url)}" alt="">`:incoming?initials(person?.display_name||'Гость'):event?.emoji||'✨'}</div><div class="grow"><b>${incoming?escapeHtml(person?.display_name||'Гость'):escapeHtml(event?.title||'Событие')}</b><small>${incoming?`★ ${person?.rating||5} · ${person?.verified?'подтверждён':'участник'}`:`${escapeHtml(event?.district||'Минск')} · ${formatDate(event?.start_at)}`}</small></div>${statusBadge(r.status)}</div>${r.note?`<p>${escapeHtml(r.note)}</p>`:''}${incoming&&r.status==='pending'?`<div class="request-actions"><button class="secondary-btn" data-resolve="declined" data-request-id="${r.id}">Отклонить</button><button class="primary-btn" data-resolve="accepted" data-request-id="${r.id}">Принять</button></div>`:''}${!incoming&&r.status==='pending'?`<div class="request-actions"><button class="secondary-btn" data-cancel-request="${r.event_id}">Отменить заявку</button><button class="secondary-btn" data-event="${r.event_id}">Событие</button></div>`:''}${!incoming&&r.status==='accepted'?`<div class="request-actions"><button class="primary-btn" data-open-chat-event="${r.event_id}">Открыть чат</button><button class="secondary-btn" data-event="${r.event_id}">Событие</button></div>`:''}</article>`;
}
function chatCard(c) {
  return `<button class="chat-card premium-chat" data-chat-event="${c.eventId}"><div class="avatar event-avatar">${kindIcon(c.event?.kind||'social')}</div><div class="grow"><div class="chat-title"><b>${escapeHtml(c.event?.title||'Чат события')}</b><small>${relativeTime(c.lastMessage?.created_at||c.event?.start_at)}</small></div><p>${c.lastMessage?`<strong>${escapeHtml(c.lastMessage.sender?.display_name||'Участник')}</strong> ${escapeHtml(c.lastMessage.text)}`:'Начните разговор первыми'}</p><span>${escapeHtml(c.event?.district||'Минск')} · ${formatDate(c.event?.start_at)}</span></div>${c.unread?`<i class="unread">${Math.min(c.unread,99)}</i>`:icon('arrow')}</button>`;
}
function inboxScreen() {
  if (!state.user) return `<section class="screen">${topBar('общение')}${authBanner()}${empty('', 'Раздел доступен в Telegram','Здесь будут реальные заявки и чаты между участниками.')}</section>`;
  const pending=state.incoming.filter(r=>r.status==='pending').length;
  return `<section class="screen inbox-v7">${topBar('общение')}<div class="inbox-head"><div><div class="live-kicker"><span></span> ${pending} требуют внимания</div><h1>Люди<br><em>и планы.</em></h1></div><div class="inbox-orb">${state.chats.reduce((a,c)=>a+(c.unread||0),0)}</div></div><div class="segmented premium-segmented">${[['incoming','Входящие'],['outgoing','Мои заявки'],['chats','Чаты']].map(([k,l])=>`<button class="${state.inboxTab===k?'active':''}" data-inbox-tab="${k}">${l}${k==='incoming'&&pending?` <i>${pending}</i>`:''}</button>`).join('')}</div><div class="stack">${state.inboxTab==='incoming'?(state.incoming.map(r=>requestCard(r,true)).join('')||empty('','Новых заявок нет','Когда кто-то захочет попасть на ваше событие, он появится здесь.')):state.inboxTab==='outgoing'?(state.outgoing.map(r=>requestCard(r,false)).join('')||empty('','Заявок пока нет','Откройте событие и запросите вход.')):(state.chats.map(chatCard).join('')||empty('','Чатов пока нет','Чат открывается после принятия заявки или создания события.'))}</div></section>`;
}

function empty(icon,title,text){return `<div class="empty"><div>${icon}</div><b>${title}</b><div>${text}</div></div>`;}

function chatScreen(eventId) {
  const chat = state.chats.find(c=>c.eventId===eventId); const event = state.events.find(e=>e.id===eventId)||state.myEvents.find(e=>e.id===eventId);
  const title=event?.title||chat?.event?.title||'Чат';
  return `<section class="screen chat-screen v7">${topBar(title,true)}<div class="chat-event-bar premium-chat-head"><div class="event-avatar">${kindIcon(event?.kind||'social')}</div><div><small>Чат участников</small><b>${escapeHtml(title)}</b><span><i></i> онлайн-событие · Минск</span></div><button class="round-action small" data-event="${eventId}">${icon('arrow')}</button></div><div class="quick-replies"><button data-quick-msg="Я уже рядом 👋">Я уже рядом</button><button data-quick-msg="Буду через 15 минут">Буду через 15 мин</button><button data-quick-msg="Кто уже на месте?">Кто на месте?</button></div><div id="messages" class="messages">${state.currentMessages.length?state.currentMessages.map(messageBubble).join(''):loadingBlock('Загружаем сообщения…')}</div><form id="chatForm" class="chat-composer"><textarea id="messageInput" rows="1" maxlength="2000" placeholder="Написать участникам…"></textarea><button class="send-btn" type="submit">${icon('send')}</button></form></section>`;
}
function messageBubble(m) {
  const mine = m.sender_id === state.user?.id;
  return `<div class="message-row ${mine?'mine':''}">${!mine?`<div class="avatar chat-avatar">${m.sender?.avatar_url?`<img src="${escapeHtml(m.sender.avatar_url)}" alt="">`:initials(m.sender?.display_name||'У')}</div>`:''}<div class="message ${mine?'mine':''}">${!mine?`<b>${escapeHtml(m.sender?.display_name||'Участник')}</b>`:''}<div>${escapeHtml(m.text)}</div><footer><small>${formatTime(m.created_at)}${m.edited_at?' · изменено':''}</small>${mine?`<button data-edit-message="${m.id}">изменить</button><button data-delete-message="${m.id}">удалить</button>`:''}</footer></div></div>`;
}

function profileScreen() {
  if (!state.user) return `<section class="screen">${topBar('профиль')}${authBanner()}<div class="profile-card premium-panel"><div class="avatar xl">${state.tgUser?.photo_url?`<img src="${escapeHtml(state.tgUser.photo_url)}" alt="">`:initials(state.tgUser?.first_name||'Гость')}</div><h2>Гость</h2><p>Откройте приложение через Telegram, чтобы создать постоянный профиль.</p></div></section>`;
  const u=state.user; const accepted=state.outgoing.filter(r=>r.status==='accepted').length; const vibeScore=Math.min(99,Math.round(62+state.myEvents.length*5+accepted*3+state.chats.length*2+Number(u.rating||5)*2));
  const badges=[state.myEvents.length?'Организатор':'Исследователь',accepted>=2?'Свой в городе':'Новый вайб',state.chats.length>=3?'На связи':'Открыт людям'];
  return `<section class="screen profile-v7">${topBar('профиль')}<div class="profile-hero"><div class="profile-glow"></div><div class="avatar mega">${u.avatarUrl?`<img src="${escapeHtml(u.avatarUrl)}" alt="">`:initials(u.name)}</div><div class="verified-chip">${icon('shield')} Telegram ID подтверждён</div><h1>${escapeHtml(u.name)}</h1><p>${u.username?'@'+escapeHtml(u.username):'Минск'} · ★ ${u.rating}</p><div class="vibe-pass"><div><small>V I B E PASS</small><b>${vibeScore}</b><span>городской рейтинг</span></div><div class="pass-bars"><i></i><i></i><i></i><i></i></div></div></div><div class="profile-about premium-panel"><div class="row-between"><h3>О себе</h3><button class="text-btn" data-action="edit-profile">Изменить</button></div><p>${escapeHtml(u.bio||'Расскажите о себе — организаторам проще принимать людей, когда профиль живой.')}</p><div class="badge-row">${badges.map(x=>`<span>${x}</span>`).join('')}</div></div><div class="profile-stats v7"><div><b>${state.myEvents.length}</b><span>создано</span></div><div><b>${accepted}</b><span>вписался</span></div><div><b>${state.chats.length}</b><span>компаний</span></div></div><div class="profile-menu v7"><button class="menu-row" data-nav="my-events"><span>${icon('spark')}</span><div><b>Мои события</b><small>гости, заявки и управление</small></div>${icon('arrow')}</button><button class="menu-row" data-nav="favorites"><span>${icon('heart')}</span><div><b>Сохранённое</b><small>планы, к которым хочется вернуться</small></div>${icon('arrow')}</button><button class="menu-row" data-action="notifications"><span>${icon('bell')}</span><div><b>Уведомления</b><small>${state.notifications.filter(n=>!n.read_at).length} непрочитанных</small></div>${icon('arrow')}</button><button class="menu-row" data-action="geo"><span>${icon('pin')}</span><div><b>Моя геолокация</b><small>только для расчёта расстояния в Минске</small></div>${icon('arrow')}</button></div><div class="footer-note">V I B E V7 · Minsk only · Telegram Mini App</div></section>`;
}

function myEventsScreen() {
  return `<section class="screen">${topBar('мои события',true)}${sectionTitle('Мои события',`${state.myEvents.length} создано`)}<div class="stack">${state.myEvents.map(e=>`<article class="manage-card glass"><div class="row-between"><div><div class="kicker">${e.status==='published'?'Опубликовано':e.status==='hidden'?'Скрыто':'Отменено'}</div><h3>${escapeHtml(e.title)}</h3><small>${escapeHtml(e.district)} · ${formatDate(e.startAt)}</small></div><span class="big-emoji">${e.emoji}</span></div><div class="manage-stats"><div><b>${e.people}/${e.capacity}</b><span>участники</span></div><div><b>${state.incoming.filter(r=>r.event_id===e.id&&r.status==='pending').length}</b><span>новые заявки</span></div><div><b>${formatPrice(e.price)}</b><span>цена</span></div></div><div class="request-actions"><button class="primary-btn" data-manage="${e.id}">Управлять</button><button class="secondary-btn" data-event="${e.id}">Открыть</button></div></article>`).join('')||empty('🪩','Событий пока нет','Создайте первое событие — оно появится здесь.')}</div></section>`;
}

function manageEventScreen(id) {
  const e = state.myEvents.find(x=>x.id===id) || state.events.find(x=>x.id===id);
  if (!e) return `<section class="screen">${topBar('управление',true)}${loadingBlock()}</section>`;
  const reqs = state.incoming.filter(r=>r.event_id===id); const members = state.eventMembers || [];
  const fill = Math.min(100, Math.round((e.people/Math.max(1,e.capacity))*100)); const spots=Math.max(0,e.capacity-e.people);
  return `<section class="screen manage-v7">${topBar('управление',true)}<div class="manage-hero" style="${eventCoverStyle(e)}"><div class="poster-noise"></div><div class="live-kicker"><span></span> ЦЕНТР УПРАВЛЕНИЯ</div><h1>${escapeHtml(e.title)}</h1><div class="manage-score"><b>${fill}%</b><span>заполнено</span></div></div><div class="manage-dashboard"><div><b>${e.people}</b><span>участников</span></div><div><b>${spots}</b><span>мест осталось</span></div><div><b>${reqs.filter(r=>r.status==='pending').length}</b><span>ждут решения</span></div></div><div class="manage-actions"><button class="primary-btn glow" data-open-chat-event="${e.id}">${icon('chat')} Чат</button><button class="secondary-btn" data-edit-event="${e.id}">${icon('spark')} Редактировать</button><button class="secondary-btn" data-event="${e.id}">Страница</button></div><div class="manage-settings premium-panel"><div class="switch-row"><div><b>Публикация</b><small>${e.status==='published'?'видно в общей ленте':'скрыто от пользователей'}</small></div><button class="switch ${e.status==='published'?'on':''}" data-toggle-publish="${e.id}"><i></i></button></div><label class="upload-box mini">${icon('spark')} Обновить обложку<input type="file" data-upload-event="${e.id}" accept="image/jpeg,image/png,image/webp"></label></div><section class="section">${sectionTitle('Новые заявки',`${reqs.filter(r=>r.status==='pending').length} ждут решения`)}<div class="stack">${reqs.map(r=>requestCard(r,true)).join('')||empty('','Никто не ждёт','Новые заявки появятся здесь автоматически.')}</div></section><section class="section">${sectionTitle('Команда вечера',`${members.length} участников`)}<div class="member-grid">${members.map(m=>`<article class="member-card"><div class="avatar">${m.user?.avatar_url?`<img src="${escapeHtml(m.user.avatar_url)}" alt="">`:initials(m.user?.display_name||'Гость')}</div><div><b>${escapeHtml(m.user?.display_name||'Участник')}</b><small>${m.role==='organizer'?'Организатор':'Участник'} · ★ ${m.user?.rating||5}</small></div>${m.role!=='organizer'?`<button class="icon-btn danger-mini" data-remove-member="${m.user_id}" data-event-id="${e.id}">${icon('close')}</button>`:''}</article>`).join('')||empty('','Список пока пуст','Принятые участники появятся здесь.')}</div></section></section>`;
}

function favoritesScreen() {
  return `<section class="screen">${topBar('избранное',true)}${sectionTitle('Избранное',`${state.favoriteEvents.length} сохранено`)}<div class="stack">${state.favoriteEvents.map(listCard).join('')||empty('♥','Избранное пусто','Нажимайте на сердечко у интересных событий.')}</div></section>`;
}

function userScreen() {
  const u=state.profileView;
  if (!u) return `<section class="screen">${topBar('профиль организатора',true)}${loadingBlock('Загружаем профиль…')}</section>`;
  return `<section class="screen">${topBar('профиль организатора',true)}<div class="user-card glass"><div class="user-card-head"><div class="avatar xl">${u.avatarUrl?`<img src="${escapeHtml(u.avatarUrl)}" alt="">`:initials(u.name)}</div><div><h2>${escapeHtml(u.name)}</h2><p>${u.username?'@'+escapeHtml(u.username):'Минск'} · ★ ${u.rating}</p></div></div><p>${escapeHtml(u.bio||'Организатор событий в Минске.')}</p><div class="rating-row"><span>✓ Telegram подтверждён</span><span>🪩 ${state.profileView.organizedEvents||0} событий</span></div><div class="section"><button class="danger-link" data-report-user="${u.id}">Пожаловаться на пользователя</button></div></div></section>`;
}

function notificationSheet() {
  const ico=n=>n.type==='message'?'chat':n.type==='join_request'?'users':n.type==='request_accepted'?'shield':n.type==='member_removed'?'close':'bell';
  return `<div class="sheet-wrap" data-close-sheet><div class="sheet premium-sheet" onclick="event.stopPropagation()"><div class="sheet-grab"></div><div class="sheet-head"><div><small>Центр активности</small><h3>Уведомления</h3></div><button class="icon-btn" data-close-sheet>${icon('close')}</button></div><div class="stack">${state.notifications.map(n=>`<button class="notification-item ${!n.read_at?'new':''}" data-notification="${n.id}" data-event-id="${n.event_id||''}"><div class="nicon">${icon(ico(n))}</div><div><b>${escapeHtml(n.title)}</b><p>${escapeHtml(n.body)}</p><time>${relativeTime(n.created_at)}${!n.read_at?' · новое':''}</time></div>${icon('arrow')}</button>`).join('')||empty('','Пока тихо','Здесь появятся заявки, решения и новые сообщения.')}</div></div></div>`;
}


async function editEvent(eventId){
  const e=state.myEvents.find(x=>x.id===eventId); if(!e)return;
  const title=prompt('Название события:',e.title); if(title===null)return;
  const desc=prompt('Описание:',e.desc||''); if(desc===null)return;
  const capacity=Number(prompt('Вместимость:',String(e.capacity))||e.capacity);
  try{await api('update_event',{eventId,title,description:desc,capacity});await Promise.all([refreshEvents(false),refreshPrivateData(false)]);render();toast('Событие обновлено.');haptic('medium');}catch(err){toast(err.message)}
}
async function editMessage(messageId){
  const m=state.currentMessages.find(x=>x.id===messageId); if(!m)return;
  const text=prompt('Изменить сообщение:',m.text); if(text===null||!text.trim())return;
  try{await api('edit_message',{messageId,text});await loadMessages(state.route.id,true);toast('Сообщение изменено.');}catch(e){toast(e.message)}
}
async function deleteMessage(messageId){
  if(!confirm('Удалить сообщение?'))return;
  try{await api('delete_message',{messageId});await loadMessages(state.route.id,true);toast('Сообщение удалено.');}catch(e){toast(e.message)}
}
function render() {
  stopChatPoll();
  const root = $('#app'); if (!root) return;
  let content;
  if (state.loading && !state.events.length) content = `<section class="screen">${topBar('загрузка')} ${loadingBlock('Подключаем V I B E…')}</section>`;
  else switch(state.route.name) {
    case 'home': content=homeScreen(); break; case 'map':content=mapScreen();break; case 'create':content=createScreen();break;
    case 'inbox':content=inboxScreen();break; case 'profile':content=profileScreen();break; case 'event':content=eventScreen(state.route.id);break;
    case 'chat':content=chatScreen(state.route.id);break; case 'my-events':content=myEventsScreen();break; case 'manage-event':content=manageEventScreen(state.route.id);break;
    case 'favorites':content=favoritesScreen();break; case 'user':content=userScreen();break; default:content=homeScreen();
  }
  root.innerHTML = appShell(content);
  bindGlobal();
  if (state.route.name === 'map') setTimeout(initMap, 30);
  if (state.route.name === 'chat') startChatPoll(state.route.id);
}

function navigate(name, params={}, push=true) {
  if (push) state.history.push(state.route);
  cleanupMap(); state.route={name,...params}; state.notificationSheet=false; window.scrollTo({top:0,behavior:'instant'}); render(); haptic();
  if (name==='event') loadEvent(params.id);
  if (name==='chat') loadMessages(params.id);
  if (name==='favorites') loadFavorites();
  if (name==='my-events') loadMyEvents();
  if (name==='manage-event') loadEventMembers(params.id);
  if (name==='user') loadUser(params.id);
}
function goBack() { cleanupMap(); state.route=state.history.pop()||{name:'home'}; render(); }
function cleanupMap(){ if(state.map){try{state.map.remove()}catch{} state.map=null;} }

async function loadEvent(id) {
  try {
    const result = await api('event',{id});
    const event=result.event;
    const idx=state.events.findIndex(x=>x.id===id); if(idx>=0)state.events[idx]=event; else state.events.push(event);
    const midx=state.myEvents.findIndex(x=>x.id===id); if(midx>=0)state.myEvents[midx]=event;
    if(state.route.name==='event'&&state.route.id===id)render();
  } catch(e){toast(e.message)}
}
async function loadMyEvents(){const r=await api('my_events',{}, {silent:true});if(r){state.myEvents=r.events||[];if(state.route.name==='my-events')render();}}
async function loadFavorites(){if(!requireAuth())return;const r=await api('favorites',{}, {silent:true});if(r){state.favoriteEvents=r.events||[];if(state.route.name==='favorites')render();}}
async function loadUser(id){if(!id)return;const r=await api('profile',{id},{silent:true});if(r){state.profileView={...r.user,organizedEvents:r.organizedEvents};if(state.route.name==='user')render();}}

function bindGlobal() {
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
  $$('[data-back]').forEach(b=>b.addEventListener('click',goBack));
  $$('[data-event]').forEach(b=>b.addEventListener('click',ev=>{if(ev.target.closest('[data-favorite]'))return;navigate('event',{id:b.dataset.event});}));
  $$('[data-time]').forEach(b=>b.addEventListener('click',()=>{state.timeFilter=b.dataset.time;render();}));
  $$('[data-kind]').forEach(b=>b.addEventListener('click',()=>{state.kindFilter=b.dataset.kind;render();}));
  $$('[data-district]').forEach(b=>b.addEventListener('click',()=>{state.districtFilter=b.dataset.district;state.timeFilter='Все';render();}));
  $('#districtFilter')?.addEventListener('change',e=>{state.districtFilter=e.target.value;render();});
  $('#priceFilter')?.addEventListener('change',e=>{state.priceFilter=e.target.value;render();});
  $('#radiusFilter')?.addEventListener('input',e=>{state.radius=Number(e.target.value);render();});
  $('[data-action="search"]')?.addEventListener('click',applySearch);
  $('#searchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')applySearch();});
  $('[data-action="random"]')?.addEventListener('click',randomEvent);
  $$('[data-favorite]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();toggleFavorite(b.dataset.favorite);}));
  $$('[data-join]').forEach(b=>b.addEventListener('click',()=>joinEvent(b.dataset.join)));
  $$('[data-cancel-request]').forEach(b=>b.addEventListener('click',()=>cancelRequest(b.dataset.cancelRequest)));
  $$('[data-resolve]').forEach(b=>b.addEventListener('click',()=>resolveRequest(b.dataset.requestId,b.dataset.resolve)));
  $$('[data-inbox-tab]').forEach(b=>b.addEventListener('click',()=>{state.inboxTab=b.dataset.inboxTab;render();}));
  $$('[data-chat-event],[data-open-chat-event]').forEach(b=>b.addEventListener('click',()=>openChat(b.dataset.chatEvent||b.dataset.openChatEvent)));
  $$('[data-manage]').forEach(b=>b.addEventListener('click',()=>navigate('manage-event',{id:b.dataset.manage})));
  $$('[data-toggle-publish]').forEach(b=>b.addEventListener('click',()=>togglePublish(b.dataset.togglePublish)));
  $$('[data-share]').forEach(b=>b.addEventListener('click',()=>shareEvent(b.dataset.share)));
  $$('[data-user]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.user)navigate('user',{id:b.dataset.user});}));
  $$('[data-report-event]').forEach(b=>b.addEventListener('click',()=>report('event',b.dataset.reportEvent)));
  $$('[data-report-user]').forEach(b=>b.addEventListener('click',()=>report('user',b.dataset.reportUser)));
  $$('[data-action="geo"]').forEach(b=>b.addEventListener('click',requestGeolocation));
  $$('[data-action="notifications"]').forEach(b=>b.addEventListener('click',()=>{if(!requireAuth())return;state.notificationSheet=true;render();}));
  $$('[data-close-sheet]').forEach(b=>b.addEventListener('click',()=>{state.notificationSheet=false;render();}));
  $$('[data-notification]').forEach(b=>b.addEventListener('click',()=>openNotification(b)));
  $('[data-action="edit-profile"]')?.addEventListener('click',editProfile);
  $$('[data-create-kind]').forEach(b=>b.addEventListener('click',()=>{state.createDraft.kind=b.dataset.createKind;render();}));
  $('#createForm')?.addEventListener('input',onDraftChange);
  $('#createForm')?.addEventListener('submit',publishEvent);
  $('#coverFile')?.addEventListener('change',e=>{state.photoFile=e.target.files?.[0]||null;const n=$('#coverName');if(n)n.textContent=state.photoFile?.name||'Можно пропустить.';});
  $$('[data-upload-event]').forEach(inp=>inp.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)uploadExistingCover(inp.dataset.uploadEvent,f);}));
  $$('[data-leave-event]').forEach(b=>b.addEventListener('click',()=>leaveEvent(b.dataset.leaveEvent)));
  $$('[data-remove-member]').forEach(b=>b.addEventListener('click',()=>removeMember(b.dataset.eventId,b.dataset.removeMember)));
  $('#chatForm')?.addEventListener('submit',sendMessage);
  $$('[data-quick-msg]').forEach(b=>b.addEventListener('click',()=>{const i=$('#messageInput');if(i){i.value=b.dataset.quickMsg;i.focus();}}));
  $$('[data-edit-event]').forEach(b=>b.addEventListener('click',()=>editEvent(b.dataset.editEvent)));
  $$('[data-edit-message]').forEach(b=>b.addEventListener('click',()=>editMessage(b.dataset.editMessage)));
  $$('[data-delete-message]').forEach(b=>b.addEventListener('click',()=>deleteMessage(b.dataset.deleteMessage)));
}

function applySearch(){state.query=$('#searchInput')?.value||'';state.timeFilter='Все';render();}
function randomEvent(){const list=filteredEvents();if(!list.length)return toast('По текущим фильтрам вариантов нет.');const e=list[Math.floor(Math.random()*Math.min(list.length,8))];navigate('event',{id:e.id});toast(`Сегодня предлагаем: ${e.title}`);}

async function toggleFavorite(id){if(!requireAuth())return;try{const r=await api('toggle_favorite',{eventId:id});for(const e of [...state.events,...state.myEvents])if(e.id===id)e.favorite=r.favorite;toast(r.favorite?'Добавлено в избранное':'Удалено из избранного');haptic();render();}catch(e){toast(e.message)}}
async function joinEvent(eventId){if(!requireAuth())return;const note=prompt('Напишите пару слов организатору:', 'Привет! Хочу присоединиться к вашей компании.');if(note===null)return;try{const r=await api('join_event',{eventId,note});await Promise.all([refreshEvents(false),refreshPrivateData(false)]);await loadEvent(eventId);toast(r.request.status==='accepted'?'Вы участник! Чат открыт.':'Заявка отправлена организатору.');haptic('medium');}catch(e){toast(e.message)}}
async function cancelRequest(eventId){if(!requireAuth())return;if(!confirm('Отменить заявку?'))return;try{await api('cancel_request',{eventId});await Promise.all([refreshEvents(false),refreshPrivateData(false)]);render();toast('Заявка отменена.');}catch(e){toast(e.message)}}
async function resolveRequest(requestId, decision){if(!requireAuth())return;try{await api('resolve_request',{requestId,decision});await Promise.all([refreshPrivateData(false),refreshEvents(false)]);render();toast(decision==='accepted'?'Гость принят. Чат ему открыт.':'Заявка отклонена.');haptic('medium');}catch(e){toast(e.message)}}
async function togglePublish(eventId){const e=state.myEvents.find(x=>x.id===eventId);if(!e)return;const status=e.status==='published'?'hidden':'published';try{await api('set_event_status',{eventId,status});await Promise.all([refreshPrivateData(false),refreshEvents(false)]);render();toast(status==='published'?'Событие снова опубликовано.':'Событие скрыто из ленты.');}catch(err){toast(err.message)}}

function onDraftChange(e){const {name}=e.target;if(!name)return;if(e.target.type==='checkbox')state.createDraft[name]=e.target.checked;else if(['capacity','price'].includes(name))state.createDraft[name]=Number(e.target.value);else state.createDraft[name]=e.target.value;}
function minskIso(date,time){return `${date}T${time}:00+03:00`;}
async function publishEvent(ev){ev.preventDefault();if(!requireAuth()||state.busy)return;const d=state.createDraft;if(!d.title.trim()||d.description.trim().length<10)return toast('Добавьте название и нормальное описание.');state.busy=true;render();try{const [lat,lng]=DISTRICTS[d.district]||MINSK_CENTER;const jitter=()=> (Math.random()-.5)*.004;const emoji=KIND_META[d.kind]?.[0]||'✨';const schedule=[[d.time,'Сбор участников'],['+30 мин','Знакомство и начало'],['+2 часа','Основная часть вечера']];const r=await api('create_event',{title:d.title,description:d.description,kind:d.kind,emoji,vibe:'НОВОЕ',district:d.district,publicLocation:d.publicLocation||d.district,privateAddress:d.privateAddress,lat:lat+jitter(),lng:lng+jitter(),startAt:minskIso(d.date,d.time),price:d.price,capacity:d.capacity,age:d.age,tags:d.tags.split(',').map(x=>x.trim()).filter(Boolean),schedule,requiresApproval:d.requiresApproval});if(state.photoFile){try{await apiUpload(r.event.id,state.photoFile);}catch(uploadErr){toast(`Событие создано, но обложка не загрузилась: ${uploadErr.message}`);}}state.createDraft=defaultDraft();state.photoFile=null;await Promise.all([refreshEvents(false),refreshPrivateData(false)]);state.busy=false;navigate('manage-event',{id:r.event.id},false);toast('Событие опубликовано в Минске.');haptic('medium');}catch(e){state.busy=false;render();toast(e.message)}}
async function uploadExistingCover(eventId,file){if(!requireAuth())return;try{toast('Загружаем обложку…');await apiUpload(eventId,file);await Promise.all([refreshEvents(false),refreshPrivateData(false)]);render();toast('Обложка обновлена.');}catch(e){toast(e.message)}}

async function openChat(eventId){if(!requireAuth())return;const exists=state.chats.some(c=>c.eventId===eventId);if(!exists){await refreshPrivateData(false);if(!state.chats.some(c=>c.eventId===eventId))return toast('Чат доступен после принятия заявки.');}state.currentMessages=[];navigate('chat',{id:eventId});}
async function loadMessages(eventId,silent=false){if(!state.user)return;try{const r=await api('messages',{eventId},{silent});if(r){state.currentMessages=r.messages||[];const chat=state.chats.find(c=>c.eventId===eventId);if(chat)chat.unread=0;if(state.route.name==='chat'&&state.route.id===eventId)renderMessagesOnly();}}catch(e){if(!silent)toast(e.message)}}
function renderMessagesOnly(){const box=$('#messages');if(!box)return;box.innerHTML=state.currentMessages.length?state.currentMessages.map(messageBubble).join(''):empty('💬','Сообщений пока нет','Напишите первым.');box.scrollTop=box.scrollHeight;}
function startChatPoll(eventId){loadMessages(eventId,true);state.chatPoll=setInterval(()=>{if(state.route.name==='chat'&&state.route.id===eventId)loadMessages(eventId,true);},3000);}
function stopChatPoll(){if(state.chatPoll){clearInterval(state.chatPoll);state.chatPoll=null;}}
async function sendMessage(ev){ev.preventDefault();const input=$('#messageInput');const text=input?.value.trim();if(!text)return;input.value='';try{await api('send_message',{eventId:state.route.id,text});await loadMessages(state.route.id,true);haptic();}catch(e){toast(e.message)}}

async function loadChats(){const r=await api('chats',{}, {silent:true});if(r)state.chats=r.chats||[];}


async function loadEventMembers(eventId){ if(!state.user)return; const r=await api('event_members',{eventId},{silent:true}); state.eventMembers=r?.members||[]; if(state.route.name==='manage-event'&&state.route.id===eventId) render(); }
async function leaveEvent(eventId){ if(!requireAuth())return; if(!confirm('Покинуть событие и закрыть для себя чат?'))return; try{await api('leave_event',{eventId}); await Promise.all([refreshEvents(false),refreshPrivateData(false)]); navigate('event',{id:eventId},false); toast('Вы покинули событие.');}catch(e){toast(e.message)} }
async function removeMember(eventId,userId){ if(!confirm('Удалить участника из события?'))return; try{await api('remove_member',{eventId,userId}); await Promise.all([refreshEvents(false),refreshPrivateData(false)]); await loadEventMembers(eventId); toast('Участник удалён.');}catch(e){toast(e.message)} }

async function editProfile(){if(!requireAuth())return;const name=prompt('Как вас показывать другим пользователям?',state.user.name||'');if(name===null)return;const bio=prompt('Коротко о себе:',state.user.bio||'');if(bio===null)return;try{const r=await api('update_profile',{name,bio,birthDate:state.user.birthDate||null});state.user=r.user;render();toast('Профиль обновлён.');}catch(e){toast(e.message)}}
async function report(type,id){if(!requireAuth())return;const reason=prompt('Коротко опишите причину жалобы:');if(!reason)return;try{await api('report',type==='event'?{eventId:id,reason}:{userId:id,reason});toast('Жалоба отправлена на модерацию.');}catch(e){toast(e.message)}}

async function openNotification(button){const id=button.dataset.notification;const eventId=button.dataset.eventId;try{await api('read_notification',{id});const n=state.notifications.find(x=>x.id===id);if(n)n.read_at=new Date().toISOString();state.notificationSheet=false;if(eventId)navigate('event',{id:eventId},false);else render();}catch(e){toast(e.message)}}

function requestGeolocation(){if(!navigator.geolocation)return toast('Браузер не поддерживает геолокацию.');navigator.geolocation.getCurrentPosition(pos=>{const candidate=[pos.coords.latitude,pos.coords.longitude];const d=distanceKm(MINSK_CENTER,candidate);if(d>MINSK_RADIUS_KM){state.userPos=null;toast('V I B E ищет события только в Минске.');}else{state.userPos=candidate;toast('Геолокация обновлена.');}render();},()=>toast('Не удалось получить геолокацию. Показываем весь Минск.'))}

function initMap(){const el=$('#map');if(!el)return;if(typeof L==='undefined'){renderFallbackMap(el);return;}const center=state.userPos||MINSK_CENTER;state.map=L.map(el,{zoomControl:true}).setView(center,12.6);L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(state.map);if(state.userPos)L.marker(state.userPos,{icon:L.divIcon({className:'vibe-marker-wrap',html:'<div class="user-marker"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(state.map).bindPopup('Вы здесь');for(const e of filteredEvents()){const icon=L.divIcon({className:'vibe-marker-wrap',html:`<div class="vibe-marker">${kindIcon(e.kind)}<b>${escapeHtml(e.vibe||'СОБЫТИЕ')}</b></div>`,iconSize:[104,32],iconAnchor:[52,16]});const marker=L.marker([e.lat,e.lng],{icon}).addTo(state.map);marker.on('click',()=>navigate('event',{id:e.id}));}setTimeout(()=>state.map?.invalidateSize(),120);}
function renderFallbackMap(el){const items=filteredEvents().slice(0,9);const pos=[[18,30],[43,22],[72,31],[30,54],[58,49],[82,60],[17,73],[48,78],[73,82]];el.innerHTML=`<div class="fallback-map"><span class="fallback-road" style="left:6%;top:24%;width:90%;transform:rotate(12deg)"></span><span class="fallback-road" style="left:12%;top:67%;width:82%;transform:rotate(-17deg)"></span><span class="fallback-road" style="left:46%;top:3%;width:85%;transform:rotate(82deg)"></span><span class="fallback-center"></span>${items.map((e,i)=>`<button class="fallback-pin" data-map-event="${e.id}" style="left:${pos[i][0]}%;top:${pos[i][1]}%"><span>${e.emoji}</span><b>${escapeHtml(e.vibe||'СОБЫТИЕ')}</b></button>`).join('')}</div>`;$$('[data-map-event]',el).forEach(b=>b.addEventListener('click',()=>navigate('event',{id:b.dataset.mapEvent})));}

function shareEvent(id){const e=state.events.find(x=>x.id===id)||state.myEvents.find(x=>x.id===id);if(!e)return;const text=`🌴 ${e.title}\n${formatDate(e.startAt)} · ${e.district} · ${formatPrice(e.price)}\nV I B E — Минск`;const url=state.appLinkBase?`${state.appLinkBase}?startapp=${encodeURIComponent('event_'+id)}`:(state.appUrl||location.origin+location.pathname)+`?event=${encodeURIComponent(id)}`;if(state.tg?.openTelegramLink)state.tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);else if(navigator.share)navigator.share({title:e.title,text,url}).catch(()=>{});else navigator.clipboard?.writeText(`${text}\n${url}`).then(()=>toast('Ссылка скопирована.'));}

window.addEventListener('beforeunload',stopChatPoll);
bootstrap();
