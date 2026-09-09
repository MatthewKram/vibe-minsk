-- V I B E V5 — схема Supabase/PostgreSQL
-- Запускать целиком в Supabase -> SQL Editor -> New query.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  display_name text not null,
  avatar_url text,
  bio text not null default '',
  birth_date date,
  rating numeric(2,1) not null default 5.0 check (rating >= 0 and rating <= 5),
  verified boolean not null default true,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 90),
  description text not null check (char_length(description) between 10 and 3000),
  kind text not null check (kind in ('party','home','bar','music','games','social','spontaneous')),
  emoji text not null default '✨',
  vibe text not null default 'НОВОЕ',
  district text not null,
  public_location text not null,
  private_address text,
  latitude double precision not null,
  longitude double precision not null,
  start_at timestamptz not null,
  end_at timestamptz,
  price numeric(10,2) not null default 0 check (price >= 0),
  capacity integer not null check (capacity between 2 and 5000),
  participant_count integer not null default 0 check (participant_count >= 0),
  age_label text not null default '18+',
  tags text[] not null default '{}',
  schedule jsonb not null default '[]'::jsonb,
  cover_url text,
  status text not null default 'published' check (status in ('draft','published','hidden','cancelled')),
  requires_approval boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create table if not exists public.event_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'guest' check (role in ('organizer','guest','moderator')),
  joined_at timestamptz not null default now(),
  primary key(event_id, user_id)
);

create table if not exists public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, event_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.chat_reads (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key(event_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  event_id uuid references public.events(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open','reviewed','closed')),
  created_at timestamptz not null default now(),
  check (target_user_id is not null or event_id is not null)
);

create index if not exists events_start_at_idx on public.events(start_at);
create index if not exists events_status_idx on public.events(status);
create index if not exists events_kind_idx on public.events(kind);
create index if not exists events_district_idx on public.events(district);
create index if not exists event_requests_event_status_idx on public.event_requests(event_id, status);
create index if not exists event_requests_user_idx on public.event_requests(user_id);
create index if not exists event_members_user_idx on public.event_members(user_id);
create index if not exists messages_event_created_idx on public.messages(event_id, created_at);
create index if not exists chat_reads_user_idx on public.chat_reads(user_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists event_requests_set_updated_at on public.event_requests;
create trigger event_requests_set_updated_at before update on public.event_requests
for each row execute function public.set_updated_at();


create or replace function public.guard_event_capacity()
returns trigger language plpgsql as $$
declare
  cap integer;
  cnt integer;
begin
  select capacity, participant_count into cap, cnt from public.events where id = new.event_id for update;
  if cnt >= cap then
    raise exception 'EVENT_FULL';
  end if;
  return new;
end;
$$;

drop trigger if exists event_members_capacity_guard on public.event_members;
create trigger event_members_capacity_guard before insert on public.event_members
for each row execute function public.guard_event_capacity();

create or replace function public.sync_event_participant_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.events set participant_count = participant_count + 1 where id = new.event_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.events set participant_count = greatest(participant_count - 1, 0) where id = old.event_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists event_members_count_insert on public.event_members;
create trigger event_members_count_insert after insert on public.event_members
for each row execute function public.sync_event_participant_count();

drop trigger if exists event_members_count_delete on public.event_members;
create trigger event_members_count_delete after delete on public.event_members
for each row execute function public.sync_event_participant_count();


-- Атомарная подача заявки: статус и добавление в участники меняются одной транзакцией.
create or replace function public.submit_event_request(p_event_id uuid, p_user_id uuid, p_note text)
returns table(request_id uuid, request_status text, organizer_id uuid, event_title text, organizer_telegram_id bigint)
language plpgsql security definer set search_path = public as $$
declare
  e public.events%rowtype;
  rid uuid;
  rstatus text;
  already_member boolean;
begin
  select * into e from public.events where id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if e.organizer_id = p_user_id then raise exception 'OWN_EVENT'; end if;
  if e.status <> 'published' then raise exception 'EVENT_UNAVAILABLE'; end if;

  select exists(select 1 from public.event_members m where m.event_id=p_event_id and m.user_id=p_user_id) into already_member;
  if already_member then
    select r.id, r.status into rid, rstatus from public.event_requests r where r.event_id=p_event_id and r.user_id=p_user_id;
    return query select rid, coalesce(rstatus,'accepted'), e.organizer_id, e.title, u.telegram_id from public.users u where u.id=e.organizer_id;
    return;
  end if;

  insert into public.event_requests(event_id,user_id,note,status)
  values (p_event_id,p_user_id,left(coalesce(p_note,''),500),case when e.requires_approval then 'pending' else 'accepted' end)
  on conflict(event_id,user_id) do update set
    note=excluded.note,
    status=case when public.event_requests.status='accepted' then 'accepted' else excluded.status end,
    updated_at=now()
  returning id,status into rid,rstatus;

  if rstatus='accepted' then
    insert into public.event_members(event_id,user_id,role) values(p_event_id,p_user_id,'guest')
    on conflict(event_id,user_id) do nothing;
  end if;

  return query select rid, rstatus, e.organizer_id, e.title, u.telegram_id from public.users u where u.id=e.organizer_id;
end;
$$;

-- Атомарное решение организатора по заявке.
create or replace function public.resolve_event_request(p_request_id uuid, p_organizer_id uuid, p_decision text)
returns table(event_id uuid, applicant_id uuid, event_title text, applicant_telegram_id bigint, applicant_name text, request_status text)
language plpgsql security definer set search_path = public as $$
declare
  r public.event_requests%rowtype;
  e public.events%rowtype;
  u public.users%rowtype;
begin
  if p_decision not in ('accepted','declined') then raise exception 'BAD_DECISION'; end if;
  select * into r from public.event_requests where id=p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  select * into e from public.events where id=r.event_id for update;
  if e.organizer_id <> p_organizer_id then raise exception 'NOT_OWNER'; end if;
  if r.status <> 'pending' then raise exception 'REQUEST_ALREADY_RESOLVED'; end if;

  if p_decision='accepted' then
    insert into public.event_members(event_id,user_id,role) values(r.event_id,r.user_id,'guest')
    on conflict(event_id,user_id) do nothing;
  end if;
  update public.event_requests set status=p_decision,updated_at=now() where id=r.id;
  select * into u from public.users where id=r.user_id;
  return query select r.event_id,r.user_id,e.title,u.telegram_id,u.display_name,p_decision;
end;
$$;

revoke all on function public.submit_event_request(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.resolve_event_request(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.submit_event_request(uuid,uuid,text) to service_role;
grant execute on function public.resolve_event_request(uuid,uuid,text) to service_role;

-- Клиент не обращается к таблицам напрямую: весь доступ идёт через Cloudflare Worker с серверным secret key.
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.event_requests enable row level security;
alter table public.event_members enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;
alter table public.chat_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Публичное хранилище только для обложек событий. Запись выполняет серверная функция.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-media', 'event-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- Явно разрешаем серверной роли работать через Data API.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
