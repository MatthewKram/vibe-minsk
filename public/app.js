const $ = (s, root = document) => root.querySelector(s);
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
  photoFile: null
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
function eventCoverStyle(e) { return e.coverUrl ? `background-image:linear-gradient(180deg,rgba(6,2,12,.05),rgba(7,2,12,.72)),url('${escapeHtml(e.coverUrl)}');background-size:cover;background-position:center` : `background:${eventGradient(e)}`; }

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
  return `<div class="app-shell"><div class="city-sun"></div><div class="grid-horizon"></div><div class="palm left">🌴</div><div class="palm right">🌴</div><div class="vignette"></div><main class="content">${content}</main>${bottomNav()}${state.notificationSheet ? notificationSheet() : ''}</div>`;
}
function mainTab() { const n=state.route.name; if(['home','event','user','favorites'].includes(n))return'home'; if(n==='map')return'map'; if(n==='create')return'create'; if(['inbox','chat'].includes(n))return'inbox'; return'profile'; }
function navItem(tab, icon, label) { return `<button class="nav-item ${mainTab()===tab?'active':''}" data-nav="${tab}"><div><span>${icon}</span><small>${label}</small></div></button>`; }
function bottomNav() { return `<nav class="bottom-nav">${navItem('home','⌂','Главная')}${navItem('map','⌖','Карта')}<button class="nav-create ${mainTab()==='create'?'active':''}" data-nav="create">＋</button>${navItem('inbox','◫','Заявки')}${navItem('profile','◉','Профиль')}</nav>`; }
function unreadCount() { return state.notifications.filter(n=>!n.read_at).length + state.chats.reduce((a,c)=>a+(c.unread||0),0); }
function topBar(sub='только Минск', back=false) {
  return `<div class="topbar top-space"><div class="brand-lockup">${back?`<button class="back-btn" data-back>← Назад</button>`:`<div class="brand-mark">ВС</div><div class="brand-copy"><b>V I B E</b><small>${escapeHtml(sub)}</small></div>`}</div><div class="top-actions">${!back?`<button class="location-chip" data-action="geo">⌖ <strong>Минск</strong></button>`:''}<button class="icon-btn hot" data-action="notifications">✦${unreadCount()?`<span class="notification-dot">${Math.min(9,unreadCount())}</span>`:''}</button></div></div>`;
}
function sectionTitle(title, sub='') { return `<div class="section-title"><h3>${title}</h3><small>${sub}</small></div>`; }
function authBanner() { return state.authError ? `<div class="notice auth-notice"><b>${state.publicOnly?'Режим просмотра':'Нужна настройка'}</b><div>${escapeHtml(state.authError)}</div></div>` : ''; }
function loadingBlock(text='Загрузка…') { return `<div class="empty"><div class="spinner">✦</div><b>${escapeHtml(text)}</b><div>Получаем данные из общей базы.</div></div>`; }

function eventCard(e) {
  const dist = eventDistance(e);
  return `<article class="event-card glass" data-event="${e.id}">
    <div class="event-art" style="${eventCoverStyle(e)}"><div class="event-badges"><span class="badge hot">${escapeHtml(e.vibe||'СОБЫТИЕ')}</span>${e.owner?'<span class="badge">МОЁ</span>':''}</div>${e.coverUrl?'':`<div class="event-emoji">${e.emoji}</div>`}<button class="heart-btn ${e.favorite?'active':''}" data-favorite="${e.id}">♥</button></div>
    <div class="event-info"><div class="event-meta">${escapeHtml(kindLabel(e.kind))} · ${escapeHtml(e.district)}</div><h3>${escapeHtml(e.title)}</h3><div class="event-row"><span>◷ ${formatDate(e.startAt)}</span><span>${formatPrice(e.price)}</span></div><div class="event-row"><span>👥 ${e.people}/${e.capacity}</span><span>${dist!=null?`${dist.toFixed(1)} км`:'Минск'}</span></div></div>
  </article>`;
}
function listCard(e) {
  return `<button class="list-card glass" data-event="${e.id}"><div class="list-preview" style="${eventCoverStyle(e)}"><span>${e.coverUrl?'':e.emoji}</span></div><div class="list-copy"><small>${escapeHtml(e.district)} · ${formatDate(e.startAt)}</small><b>${escapeHtml(e.title)}</b><p>${escapeHtml((e.tags||[]).slice(0,3).join(' · '))}</p></div><div class="list-side"><b>${formatPrice(e.price)}</b><small>👥 ${e.people}/${e.capacity}</small></div></button>`;
}

function homeScreen() {
  const events = filteredEvents();
  const name = state.user?.firstName || state.tgUser?.first_name || 'Гость';
  const districts = Object.keys(DISTRICTS).slice(0,6);
  return `<section class="screen">${topBar('развлечения и компании в Минске')}${authBanner()}
    <section class="hero glass"><div class="kicker">Минск · сегодня · рядом</div><h1>Минск не спит</h1><p>${escapeHtml(name)}, находи планы на вечер, знакомься с людьми и собирай собственные события.</p>
      <div class="hero-stats"><div class="stat-card"><b>${events.length}</b><span>событий в выдаче</span></div><div class="stat-card"><b>${state.sessionStats.pendingRequests||0}</b><span>входящих заявок</span></div><div class="stat-card"><b>${state.chats.length||0}</b><span>чатов</span></div></div>
      <div class="cta-row"><button class="primary-btn" data-action="random">🎲 Выбрать вечер</button><button class="secondary-btn" data-nav="map">Карта</button><button class="secondary-btn" data-nav="create">Создать</button></div>
      <div class="search-card glass"><input id="searchInput" value="${escapeHtml(state.query)}" placeholder="Событие, район, музыка, настроение…"><button class="primary-btn" data-action="search">Найти</button></div>
      <div class="time-tabs">${['Сейчас','Сегодня','Завтра','Выходные','Все'].map(x=>`<button class="tab-chip ${state.timeFilter===x?'active':''}" data-time="${x}">${x}</button>`).join('')}</div>
    </section>
    <section class="section">${sectionTitle('Что хочется?','выбери формат')}<div class="categories-row">${Object.entries(KIND_META).map(([k,[emoji,label]])=>`<button class="category-card ${state.kindFilter===k?'active':''}" data-kind="${k}"><span>${emoji}</span><b>${label}</b></button>`).join('')}</div></section>
    <section class="section">${sectionTitle('Фильтры','все события только в Минске')}<div class="filter-bar"><select id="districtFilter"><option value="all">Все районы</option>${Object.keys(DISTRICTS).map(d=>`<option ${state.districtFilter===d?'selected':''}>${d}</option>`).join('')}</select><select id="priceFilter"><option value="all" ${state.priceFilter==='all'?'selected':''}>Любая цена</option><option value="free" ${state.priceFilter==='free'?'selected':''}>Бесплатно</option><option value="paid" ${state.priceFilter==='paid'?'selected':''}>Платно</option></select><label class="range-label">до ${state.radius} км<input id="radiusFilter" type="range" min="2" max="32" value="${state.radius}"></label></div></section>
    <section class="section">${sectionTitle('Горит сейчас',events.length?`${events.length} вариантов по текущим фильтрам`:'ничего не найдено')}<div class="event-strip">${events.slice(0,6).map(eventCard).join('') || `<div class="empty"><div>🌙</div><b>По этим фильтрам тихо</b><div>Расширьте радиус или выберите другой формат.</div></div>`}</div></section>
    <section class="section">${sectionTitle('Районы Минска','быстрый переход')}<div class="district-grid">${districts.map(d=>`<button class="district-card glass" data-district="${d}"><b>${d}</b><small>${state.events.filter(e=>e.district===d&&e.status==='published').length} событий</small></button>`).join('')}</div></section>
    <section class="section">${sectionTitle('Все подходящие события','от ближайших по времени')}<div class="stack">${events.map(listCard).join('')}</div></section>
  </section>`;
}

function mapScreen() {
  const events = filteredEvents();
  return `<section class="screen">${topBar('карта ночного Минска')}${sectionTitle('Карта событий',`${events.length} точек`)}<div class="map-controls">${Object.entries(KIND_META).map(([k,v])=>`<button class="filter-chip ${state.kindFilter===k?'active':''}" data-kind="${k}">${v[1]}</button>`).join('')}</div><div class="map-wrap"><div id="map"></div><div class="map-overlay"></div></div><div class="map-panel glass"><div class="kicker">Только Минск</div><h4>События рядом</h4><p>Точный адрес домашнего события появляется только после принятия заявки.</p><div class="mini-list">${events.slice(0,6).map(e=>`<button data-event="${e.id}"><span class="emo">${e.emoji}</span><div><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.district)} · ${formatDate(e.startAt)}</small></div><i>${formatPrice(e.price)}</i></button>`).join('')}</div></div></section>`;
}

function eventScreen(id) {
  const e = state.events.find(x=>x.id===id) || state.myEvents.find(x=>x.id===id);
  if (!e) return `<section class="screen">${topBar('событие',true)}${loadingBlock('Открываем событие…')}</section>`;
  const tags = (e.tags||[]).map(t=>`<span>${escapeHtml(t)}</span>`).join('');
  const schedule = (e.schedule||[]).map(row=>`<div class="timeline-item"><div class="timeline-time">${escapeHtml(row[0]||'')}</div><div class="timeline-content"><b>${escapeHtml(row[1]||'')}</b></div></div>`).join('');
  let cta = '';
  if (e.owner) cta = `<button class="primary-btn" data-manage="${e.id}">Управлять событием</button>`;
  else if (e.member) cta = `<button class="primary-btn" data-open-chat-event="${e.id}">Открыть чат</button>`;
  else if (e.requestStatus === 'pending') cta = `<button class="secondary-btn" data-cancel-request="${e.id}">Отменить заявку</button>`;
  else if (e.requestStatus === 'declined') cta = `<button class="primary-btn" data-join="${e.id}">Подать снова</button>`;
  else cta = `<button class="primary-btn" data-join="${e.id}">${e.requiresApproval?'Подать заявку':'Присоединиться'}</button>`;
  return `<section class="screen">${topBar('событие',true)}<div class="event-detail-cover" style="--cover:${eventGradient(e)};${eventCoverStyle(e)}"><div class="event-badges"><span class="badge hot">${escapeHtml(e.vibe||'СОБЫТИЕ')}</span><span class="badge">${escapeHtml(kindLabel(e.kind))}</span></div>${e.coverUrl?'':`<div class="detail-emoji">${e.emoji}</div>`}</div><div class="detail-body"><div class="kicker">${escapeHtml(e.district)} · Минск</div><h1>${escapeHtml(e.title)}</h1><p>${escapeHtml(e.desc)}</p><div class="info-pills"><span>◷ ${formatDate(e.startAt)}</span><span>💰 ${formatPrice(e.price)}</span><span>👥 ${e.people}/${e.capacity}</span><span>🔞 ${escapeHtml(e.age)}</span></div>${e.privateAddress?`<div class="notice private-address"><b>📍 Точный адрес открыт</b><div>${escapeHtml(e.privateAddress)}</div></div>`:`${e.kind==='home'?'<div class="notice"><b>🔒 Адрес скрыт</b><div>Точный адрес увидят только принятые участники.</div></div>':''}`}<div class="host-row" data-user="${e.organizer?.id||''}"><div class="avatar">${e.organizer?.avatarUrl?`<img src="${escapeHtml(e.organizer.avatarUrl)}" alt="">`:initials(e.organizer?.name||'Организатор')}</div><div><b>${escapeHtml(e.organizer?.name||'Организатор')}</b><small>★ ${e.organizer?.rating||5} · ${e.organizer?.verified?'Telegram подтверждён':'организатор'}</small></div><span>›</span></div><div class="detail-actions">${cta}<button class="secondary-btn" data-favorite="${e.id}">${e.favorite?'♥ В избранном':'♡ В избранное'}</button><button class="secondary-btn" data-share="${e.id}">Поделиться</button></div></div><section class="section">${sectionTitle('Атмосфера','что ждёт внутри')}<div class="info-pills">${tags}</div></section><section class="section">${sectionTitle('План','ориентировочная программа')}<div class="timeline">${schedule || '<div class="notice">Организатор пока не добавил программу.</div>'}</div></section><section class="section"><button class="danger-link" data-report-event="${e.id}">Пожаловаться на событие</button></section></section>`;
}

function createScreen() {
  const d = state.createDraft;
  if (!state.user) return `<section class="screen">${topBar('создать событие')}${authBanner()}<div class="empty"><div>🔐</div><b>Нужен Telegram</b><div>Откройте Mini App через бота — после этого форма создания станет доступна.</div></div></section>`;
  return `<section class="screen">${topBar('создать событие')}${sectionTitle('Создать событие','после публикации его увидят пользователи в Минске')}<form id="createForm" class="form-wrap"><div class="form-step glass"><h3>1. Формат</h3><div class="choice-grid">${Object.entries(KIND_META).filter(([k])=>k!=='all'&&k!=='spontaneous').map(([k,[em,label]])=>`<button type="button" class="choice ${d.kind===k?'active':''}" data-create-kind="${k}"><span>${em}</span><b>${label}</b></button>`).join('')}</div></div><div class="form-step glass"><h3>2. Основное</h3><label>Название<input name="title" value="${escapeHtml(d.title)}" maxlength="90" placeholder="Например: Лофт на Немиге" required></label><label>Описание<textarea name="description" rows="5" maxlength="3000" placeholder="Что будет происходить, кого ждёте, какая атмосфера…" required>${escapeHtml(d.description)}</textarea></label><label>Теги через запятую<input name="tags" value="${escapeHtml(d.tags)}" placeholder="хаус, настолки, новые знакомства"></label></div><div class="form-step glass"><h3>3. Когда и где</h3><div class="field-grid"><label>Дата<input name="date" type="date" value="${d.date}" required></label><label>Время<input name="time" type="time" value="${d.time}" required></label></div><label>Район<select name="district">${Object.keys(DISTRICTS).map(x=>`<option ${d.district===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Что показываем всем<input name="publicLocation" value="${escapeHtml(d.publicLocation)}" placeholder="Например: Немига · 5 минут от метро"></label><label>Точный адрес <small>виден организатору и принятым гостям</small><input name="privateAddress" value="${escapeHtml(d.privateAddress)}" placeholder="Улица, дом, квартира / название места"></label></div><div class="form-step glass"><h3>4. Условия</h3><div class="field-grid"><label>Вместимость<input name="capacity" type="number" min="2" max="5000" value="${d.capacity}"></label><label>Цена, руб.<input name="price" type="number" min="0" step="1" value="${d.price}"></label></div><label>Возраст<input name="age" value="${escapeHtml(d.age)}" placeholder="18+ или 20–30"></label><label class="check-row"><input name="requiresApproval" type="checkbox" ${d.requiresApproval?'checked':''}><span><b>Принимать гостей вручную</b><small>Без подтверждения пользователь не увидит скрытый адрес и чат.</small></span></label></div><div class="form-step glass"><h3>5. Обложка</h3><label class="upload-box">📸 Выберите JPG, PNG или WebP до 5 МБ<input id="coverFile" type="file" accept="image/jpeg,image/png,image/webp"></label><small id="coverName">${state.photoFile?escapeHtml(state.photoFile.name):'Можно пропустить и добавить позже.'}</small></div><button class="primary-btn wide" type="submit" ${state.busy?'disabled':''}>${state.busy?'Публикуем…':'Опубликовать событие'}</button></form></section>`;
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
  return `<button class="chat-card glass" data-chat-event="${c.eventId}"><div class="avatar">${c.event?.emoji||'💬'}</div><div class="grow"><b>${escapeHtml(c.event?.title||'Чат события')}</b><p>${c.lastMessage?`${escapeHtml(c.lastMessage.sender?.display_name||'Участник')}: ${escapeHtml(c.lastMessage.text)}`:'Сообщений пока нет'}</p><small>${escapeHtml(c.event?.district||'Минск')} · ${formatDate(c.event?.start_at)}</small></div>${c.unread?`<span class="unread">${Math.min(c.unread,99)}</span>`:''}</button>`;
}
function inboxScreen() {
  if (!state.user) return `<section class="screen">${topBar('заявки и чаты')}${authBanner()}<div class="empty"><div>💬</div><b>Раздел доступен в Telegram</b><div>Здесь будут реальные заявки и чаты между участниками.</div></div></section>`;
  return `<section class="screen">${topBar('заявки и чаты')}${sectionTitle('Общение','всё, что требует вашего внимания')}<div class="segmented">${[['incoming','Входящие'],['outgoing','Мои заявки'],['chats','Чаты']].map(([k,l])=>`<button class="${state.inboxTab===k?'active':''}" data-inbox-tab="${k}">${l}</button>`).join('')}</div><div class="stack">${state.inboxTab==='incoming'?(state.incoming.map(r=>requestCard(r,true)).join('')||empty('📥','Нет входящих заявок','Когда кто-то захочет попасть на ваше событие, заявка появится здесь.')):state.inboxTab==='outgoing'?(state.outgoing.map(r=>requestCard(r,false)).join('')||empty('📤','Вы ещё никуда не подавали заявку','Найдите событие и нажмите «Подать заявку».')):(state.chats.map(chatCard).join('')||empty('💬','Чатов пока нет','Чат откроется после принятия заявки или создания собственного события.'))}</div></section>`;
}

function empty(icon,title,text){return `<div class="empty"><div>${icon}</div><b>${title}</b><div>${text}</div></div>`;}

function chatScreen(eventId) {
  const chat = state.chats.find(c=>c.eventId===eventId); const event = state.events.find(e=>e.id===eventId)||state.myEvents.find(e=>e.id===eventId);
  return `<section class="screen chat-screen">${topBar(event?.title||chat?.event?.title||'чат',true)}<div class="chat-event-bar glass"><span>${event?.emoji||chat?.event?.emoji||'💬'}</span><div><b>${escapeHtml(event?.title||chat?.event?.title||'Событие')}</b><small>Чат участников · Минск</small></div><button class="secondary-btn" data-event="${eventId}">О событии</button></div><div id="messages" class="messages">${state.currentMessages.length?state.currentMessages.map(messageBubble).join(''):loadingBlock('Загружаем сообщения…')}</div><form id="chatForm" class="chat-composer glass"><textarea id="messageInput" rows="1" maxlength="2000" placeholder="Сообщение участникам…"></textarea><button class="send-btn" type="submit">➤</button></form></section>`;
}
function messageBubble(m) {
  const mine = m.sender_id === state.user?.id;
  return `<div class="message-row ${mine?'mine':''}"><div class="message ${mine?'mine':''}">${!mine?`<b>${escapeHtml(m.sender?.display_name||'Участник')}</b>`:''}<div>${escapeHtml(m.text)}</div><small>${formatTime(m.created_at)}</small></div></div>`;
}

function profileScreen() {
  if (!state.user) return `<section class="screen">${topBar('профиль')}${authBanner()}<div class="profile-card glass"><div class="avatar xl">${state.tgUser?.photo_url?`<img src="${escapeHtml(state.tgUser.photo_url)}" alt="">`:initials(state.tgUser?.first_name||'Гость')}</div><h2>Гость</h2><p>Откройте приложение через Telegram, чтобы создать постоянный профиль.</p></div></section>`;
  const u=state.user;
  return `<section class="screen">${topBar('мой профиль')}<div class="profile-card glass"><div class="profile-head"><div class="avatar xl">${u.avatarUrl?`<img src="${escapeHtml(u.avatarUrl)}" alt="">`:initials(u.name)}</div><div><div class="kicker">Telegram подтверждён</div><h2>${escapeHtml(u.name)}</h2><p>${u.username?'@'+escapeHtml(u.username):'Минск'} · ★ ${u.rating}</p></div><button class="secondary-btn" data-action="edit-profile">Изменить</button></div><p>${escapeHtml(u.bio||'Расскажите немного о себе — это поможет организаторам понимать, кого они принимают на событие.')}</p><div class="profile-stats"><div><b>${state.myEvents.length}</b><span>моих событий</span></div><div><b>${state.outgoing.filter(r=>r.status==='accepted').length}</b><span>принято заявок</span></div><div><b>${state.chats.length}</b><span>чатов</span></div></div></div><div class="profile-menu"><button class="menu-row glass" data-nav="my-events"><span>🪩</span><div><b>Мои события</b><small>управление, гости и публикация</small></div><i>›</i></button><button class="menu-row glass" data-nav="favorites"><span>♥</span><div><b>Избранное</b><small>сохранённые планы</small></div><i>›</i></button><button class="menu-row glass" data-action="notifications"><span>✦</span><div><b>Уведомления</b><small>${state.notifications.filter(n=>!n.read_at).length} непрочитанных</small></div><i>›</i></button><button class="menu-row glass" data-action="geo"><span>⌖</span><div><b>Геолокация</b><small>расстояния только внутри Минска</small></div><i>›</i></button></div><div class="footer-note">V I B E V5 · профиль привязан к вашему Telegram ID</div></section>`;
}

function myEventsScreen() {
  return `<section class="screen">${topBar('мои события',true)}${sectionTitle('Мои события',`${state.myEvents.length} создано`)}<div class="stack">${state.myEvents.map(e=>`<article class="manage-card glass"><div class="row-between"><div><div class="kicker">${e.status==='published'?'Опубликовано':e.status==='hidden'?'Скрыто':'Отменено'}</div><h3>${escapeHtml(e.title)}</h3><small>${escapeHtml(e.district)} · ${formatDate(e.startAt)}</small></div><span class="big-emoji">${e.emoji}</span></div><div class="manage-stats"><div><b>${e.people}/${e.capacity}</b><span>участники</span></div><div><b>${state.incoming.filter(r=>r.event_id===e.id&&r.status==='pending').length}</b><span>новые заявки</span></div><div><b>${formatPrice(e.price)}</b><span>цена</span></div></div><div class="request-actions"><button class="primary-btn" data-manage="${e.id}">Управлять</button><button class="secondary-btn" data-event="${e.id}">Открыть</button></div></article>`).join('')||empty('🪩','Событий пока нет','Создайте первое событие — оно появится здесь.')}</div></section>`;
}

function manageEventScreen(id) {
  const e = state.myEvents.find(x=>x.id===id) || state.events.find(x=>x.id===id);
  if (!e) return `<section class="screen">${topBar('управление',true)}${loadingBlock()}</section>`;
  const reqs = state.incoming.filter(r=>r.event_id===id);
  return `<section class="screen">${topBar('управление событием',true)}<div class="manage-card glass"><div class="kicker">${e.status==='published'?'В ленте Минска':'Не показывается в общей ленте'}</div><h2>${escapeHtml(e.title)}</h2><p>${escapeHtml(e.desc)}</p><div class="manage-stats"><div><b>${e.people}/${e.capacity}</b><span>участники</span></div><div><b>${reqs.filter(r=>r.status==='pending').length}</b><span>ожидают</span></div><div><b>${formatDate(e.startAt)}</b><span>начало</span></div></div><div class="request-actions"><button class="primary-btn" data-open-chat-event="${e.id}">Чат события</button><button class="secondary-btn" data-event="${e.id}">Страница события</button></div><div class="switch-row"><div><b>Публикация</b><small>${e.status==='published'?'событие видно пользователям':'событие скрыто'}</small></div><button class="switch ${e.status==='published'?'on':''}" data-toggle-publish="${e.id}"><i></i></button></div><label class="upload-box mini">📸 Заменить обложку<input type="file" data-upload-event="${e.id}" accept="image/jpeg,image/png,image/webp"></label></div><section class="section">${sectionTitle('Заявки гостей',`${reqs.filter(r=>r.status==='pending').length} ждут решения`)}<div class="stack">${reqs.map(r=>requestCard(r,true)).join('')||empty('📥','Пока никто не просится','Новые заявки появятся здесь автоматически.')}</div></section></section>`;
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
  return `<div class="sheet-wrap" data-close-sheet><div class="sheet" onclick="event.stopPropagation()"><div class="sheet-grab"></div><div class="sheet-head"><h3>Уведомления</h3><button class="icon-btn" data-close-sheet>×</button></div><div class="stack">${state.notifications.map(n=>`<button class="notification-item glass" data-notification="${n.id}" data-event-id="${n.event_id||''}"><div class="nicon">${n.type==='message'?'💬':n.type==='join_request'?'👋':n.type==='request_accepted'?'✅':'✦'}</div><div><b>${escapeHtml(n.title)}</b><p>${escapeHtml(n.body)}</p><time>${relativeTime(n.created_at)}${!n.read_at?' · новое':''}</time></div></button>`).join('')||empty('✦','Пока тихо','Здесь появятся заявки, решения и новые сообщения.')}</div></div></div>`;
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
  $('#chatForm')?.addEventListener('submit',sendMessage);
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

async function editProfile(){if(!requireAuth())return;const name=prompt('Как вас показывать другим пользователям?',state.user.name||'');if(name===null)return;const bio=prompt('Коротко о себе:',state.user.bio||'');if(bio===null)return;try{const r=await api('update_profile',{name,bio,birthDate:state.user.birthDate||null});state.user=r.user;render();toast('Профиль обновлён.');}catch(e){toast(e.message)}}
async function report(type,id){if(!requireAuth())return;const reason=prompt('Коротко опишите причину жалобы:');if(!reason)return;try{await api('report',type==='event'?{eventId:id,reason}:{userId:id,reason});toast('Жалоба отправлена на модерацию.');}catch(e){toast(e.message)}}

async function openNotification(button){const id=button.dataset.notification;const eventId=button.dataset.eventId;try{await api('read_notification',{id});const n=state.notifications.find(x=>x.id===id);if(n)n.read_at=new Date().toISOString();state.notificationSheet=false;if(eventId)navigate('event',{id:eventId},false);else render();}catch(e){toast(e.message)}}

function requestGeolocation(){if(!navigator.geolocation)return toast('Браузер не поддерживает геолокацию.');navigator.geolocation.getCurrentPosition(pos=>{const candidate=[pos.coords.latitude,pos.coords.longitude];const d=distanceKm(MINSK_CENTER,candidate);if(d>MINSK_RADIUS_KM){state.userPos=null;toast('V I B E ищет события только в Минске.');}else{state.userPos=candidate;toast('Геолокация обновлена.');}render();},()=>toast('Не удалось получить геолокацию. Показываем весь Минск.'))}

function initMap(){const el=$('#map');if(!el)return;if(typeof L==='undefined'){renderFallbackMap(el);return;}const center=state.userPos||MINSK_CENTER;state.map=L.map(el,{zoomControl:true}).setView(center,12.6);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.map);if(state.userPos)L.marker(state.userPos,{icon:L.divIcon({className:'vibe-marker-wrap',html:'<div class="user-marker"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(state.map).bindPopup('Вы здесь');for(const e of filteredEvents()){const icon=L.divIcon({className:'vibe-marker-wrap',html:`<div class="vibe-marker"><span>${e.emoji}</span><b>${escapeHtml(e.vibe||'СОБЫТИЕ')}</b></div>`,iconSize:[104,32],iconAnchor:[52,16]});const marker=L.marker([e.lat,e.lng],{icon}).addTo(state.map);marker.on('click',()=>navigate('event',{id:e.id}));}setTimeout(()=>state.map?.invalidateSize(),120);}
function renderFallbackMap(el){const items=filteredEvents().slice(0,9);const pos=[[18,30],[43,22],[72,31],[30,54],[58,49],[82,60],[17,73],[48,78],[73,82]];el.innerHTML=`<div class="fallback-map"><span class="fallback-road" style="left:6%;top:24%;width:90%;transform:rotate(12deg)"></span><span class="fallback-road" style="left:12%;top:67%;width:82%;transform:rotate(-17deg)"></span><span class="fallback-road" style="left:46%;top:3%;width:85%;transform:rotate(82deg)"></span><span class="fallback-center"></span>${items.map((e,i)=>`<button class="fallback-pin" data-map-event="${e.id}" style="left:${pos[i][0]}%;top:${pos[i][1]}%"><span>${e.emoji}</span><b>${escapeHtml(e.vibe||'СОБЫТИЕ')}</b></button>`).join('')}</div>`;$$('[data-map-event]',el).forEach(b=>b.addEventListener('click',()=>navigate('event',{id:b.dataset.mapEvent})));}

function shareEvent(id){const e=state.events.find(x=>x.id===id)||state.myEvents.find(x=>x.id===id);if(!e)return;const text=`🌴 ${e.title}\n${formatDate(e.startAt)} · ${e.district} · ${formatPrice(e.price)}\nV I B E — Минск`;const url=state.appLinkBase?`${state.appLinkBase}?startapp=${encodeURIComponent('event_'+id)}`:(state.appUrl||location.origin+location.pathname)+`?event=${encodeURIComponent(id)}`;if(state.tg?.openTelegramLink)state.tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);else if(navigator.share)navigator.share({title:e.title,text,url}).catch(()=>{});else navigator.clipboard?.writeText(`${text}\n${url}`).then(()=>toast('Ссылка скопирована.'));}

window.addEventListener('beforeunload',stopChatPoll);
bootstrap();
