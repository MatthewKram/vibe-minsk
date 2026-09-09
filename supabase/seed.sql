-- Необязательные демонстрационные события для первого запуска.
-- Можно выполнить ПОСЛЕ schema.sql. Они нужны, чтобы лента не была пустой до появления реальных пользователей.

insert into public.users (telegram_id, username, first_name, display_name, bio, rating, verified)
values
  (-10001, 'vibe_demo_nova', 'Команда Нова', 'Команда «Нова»', 'Демо-организатор ночных событий Минска.', 4.9, true),
  (-10002, 'vibe_demo_marina', 'Марина', 'Марина', 'Демо-профиль организатора домашних вечеринок.', 4.8, true),
  (-10003, 'vibe_demo_city', 'Вайб Сити', 'Вайб Сити', 'Редакционная подборка городских событий.', 4.9, true)
on conflict (telegram_id) do nothing;

with u as (select id from public.users where telegram_id = -10001)
insert into public.events (organizer_id,title,description,kind,emoji,vibe,district,public_location,private_address,latitude,longitude,start_at,end_at,price,capacity,age_label,tags,schedule,status,requires_approval)
select id,'Неоновый мираж','Большая ночная вечеринка с неоном, диджей-сетом и танцами до рассвета.','party','🌴','ГОРЯЧО','Октябрьская','район Октябрьской площади',null,53.9023,27.5619,now()+interval '7 hours',now()+interval '13 hours',35,180,'21+',array['хаус','танцпол','новые знакомства'],'[["23:00","Открытие дверей"],["00:00","Диджей-сет"],["02:00","Главный сет"]]'::jsonb,'published',false from u
where not exists (select 1 from public.events where title='Неоновый мираж');

with u as (select id from public.users where telegram_id = -10002)
insert into public.events (organizer_id,title,description,kind,emoji,vibe,district,public_location,private_address,latitude,longitude,start_at,end_at,price,capacity,age_label,tags,schedule,status,requires_approval)
select id,'Квартира на Немиге','Уютная домашняя вечеринка с музыкой и настолками. Точный адрес видят только принятые гости.','home','🏠','МАЛО МЕСТ','Немига','Немига · около метро','ул. Примерная, 1, кв. 10',53.9052,27.5535,now()+interval '5 hours',now()+interval '10 hours',0,12,'20–30',array['вино','настолки','уютно'],'[["21:30","Собираемся"],["22:00","Знакомимся"],["23:30","Музыка и общение"]]'::jsonb,'published',true from u
where not exists (select 1 from public.events where title='Квартира на Немиге');

with u as (select id from public.users where telegram_id = -10003)
insert into public.events (organizer_id,title,description,kind,emoji,vibe,district,public_location,private_address,latitude,longitude,start_at,end_at,price,capacity,age_label,tags,schedule,status,requires_approval)
select id,'Закат в Верхнем городе','Спокойный старт вечера: вид на центр, музыка и новые знакомства.','bar','🍸','ЗАКАТ','Верхний город','Верхний город',null,53.9049,27.5566,now()+interval '3 hours',now()+interval '7 hours',20,60,'18+',array['коктейли','панорама','спокойно'],'[["19:45","Сбор"],["20:15","Закат"],["21:00","Музыкальный сет"]]'::jsonb,'published',false from u
where not exists (select 1 from public.events where title='Закат в Верхнем городе');

-- Организаторов добавляем участниками своих событий.
insert into public.event_members(event_id,user_id,role)
select e.id,e.organizer_id,'organizer' from public.events e
where not exists (select 1 from public.event_members m where m.event_id=e.id and m.user_id=e.organizer_id)
on conflict do nothing;
