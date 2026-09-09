import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import { createDb } from './lib/supabase';import { currentUser } from './lib/auth';import { errorResponse, HttpError } from './lib/errors';import { userDto } from './lib/dto';import { appDeepLink } from './lib/telegram';
import * as events from './services/events';import * as requests from './services/requests';import * as chat from './services/chat';import * as users from './services/users';
import { createEventSchema, joinSchema, messageSchema, profileSchema, reportSchema, resolveSchema, statusSchema, updateEventSchema } from './schemas/input';

const app=new Hono<AppEnv>();
app.use('/api/*',cors({origin:'*',allowHeaders:['content-type','x-telegram-init-data','x-vibe-dev-user'],allowMethods:['GET','POST','PATCH','DELETE','OPTIONS']}));
app.onError((err,c)=>errorResponse(c,err));

const body=async <T>(c:any,schema:any):Promise<T>=>{const parsed=schema.safeParse(await c.req.json().catch(()=>({})));if(!parsed.success)throw new HttpError(422,'Проверьте заполнение формы.',parsed.error.flatten());return parsed.data as T};

app.get('/api/config',c=>c.json({ok:true,config:{appUrl:c.env.APP_URL||'',mapEngine:'maplibre-osm'}}));
app.get('/api/events',async c=>{const db=createDb(c.env),user=await currentUser(c,db,false);return c.json({ok:true,events:await events.publicEvents(db,user)})});
app.get('/api/session',async c=>{const db=createDb(c.env),user=await currentUser(c,db,true);const own=await db.from('events').select('id').eq('organizer_id',user.id);if(own.error)throw own.error;const ids=(own.data||[]).map((x:any)=>x.id);const pending=ids.length?await db.from('event_requests').select('id',{count:'exact',head:true}).in('event_id',ids).eq('status','pending'):{count:0};const notes=await db.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).is('read_at',null);const bot=(c.env.TELEGRAM_BOT_USERNAME||'').replace(/^@/,'');const short=(c.env.TELEGRAM_APP_SHORT_NAME||'').replace(/^\//,'');return c.json({ok:true,user:userDto(user),stats:{myEvents:ids.length,pendingRequests:pending.count||0,unreadNotifications:notes.count||0},config:{appLinkBase:bot?(short?`https://t.me/${bot}/${short}`:`https://t.me/${bot}`):'',appUrl:c.env.APP_URL||'',mapEngine:'maplibre-osm'}})});

app.get('/api/events/:id',async c=>{const db=createDb(c.env),user=await currentUser(c,db,false);return c.json({ok:true,event:await events.oneEvent(db,user,c.req.param('id'))})});
app.get('/api/me/events',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,events:await events.myEvents(db,user)})});
app.post('/api/events',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,createEventSchema);return c.json({ok:true,event:await events.createEvent(db,user,input)},201)});
app.patch('/api/events/:id',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,updateEventSchema);return c.json({ok:true,event:await events.updateEvent(db,user,c.req.param('id'),input)})});
app.post('/api/events/:id/status',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,statusSchema);await events.setStatus(db,user,c.req.param('id'),input.status);return c.json({ok:true})});
app.post('/api/events/:id/join',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,joinSchema);return c.json({ok:true,request:await requests.joinEvent(db,c.env,user,c.req.param('id'),input.note)})});
app.delete('/api/events/:id/request',async c=>{const db=createDb(c.env),user=await currentUser(c,db);await requests.cancelRequest(db,user,c.req.param('id'));return c.json({ok:true})});
app.get('/api/events/:id/members',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,members:await events.members(db,user,c.req.param('id'))})});
app.post('/api/events/:id/leave',async c=>{const db=createDb(c.env),user=await currentUser(c,db);await requests.leaveEvent(db,c.env,user,c.req.param('id'));return c.json({ok:true})});
app.delete('/api/events/:id/members/:userId',async c=>{const db=createDb(c.env),user=await currentUser(c,db);await requests.removeMember(db,c.env,user,c.req.param('id'),c.req.param('userId'));return c.json({ok:true})});
app.post('/api/events/:id/cover',async c=>{const db=createDb(c.env),user=await currentUser(c,db),eventId=c.req.param('id');await events.requireOwner(db,user,eventId);const form=await c.req.formData(),file=form.get('file');if(!(file instanceof File))throw new HttpError(422,'Файл не выбран.');if(file.size>5*1024*1024)throw new HttpError(413,'Максимальный размер изображения — 5 МБ.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new HttpError(415,'Допустимы JPG, PNG и WebP.');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg',path=`${user.id}/${eventId}/${Date.now()}.${ext}`;const up=await db.storage.from('event-media').upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false,cacheControl:'3600'});if(up.error)throw up.error;const url=db.storage.from('event-media').getPublicUrl(path).data.publicUrl;const update=await db.from('events').update({cover_url:url}).eq('id',eventId).eq('organizer_id',user.id);if(update.error)throw update.error;return c.json({ok:true,coverUrl:url})});

app.get('/api/requests',async c=>{const db=createDb(c.env),user=await currentUser(c,db),direction=c.req.query('direction')==='outgoing'?'outgoing':'incoming';return c.json({ok:true,requests:await requests.listRequests(db,user,direction)})});
app.get('/api/requests/:id',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,request:await requests.requestDetail(db,user,c.req.param('id'))})});
app.post('/api/requests/:id/resolve',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,resolveSchema);return c.json({ok:true,status:await requests.resolveRequest(db,c.env,user,c.req.param('id'),input.decision)})});

app.get('/api/chats',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,chats:await chat.chats(db,user)})});
app.get('/api/chats/:eventId/messages',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,messages:await chat.messages(db,user,c.req.param('eventId'))})});
app.post('/api/chats/:eventId/messages',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,messageSchema);return c.json({ok:true,message:await chat.sendMessage(db,user,c.req.param('eventId'),input.text)},201)});
app.patch('/api/messages/:id',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,messageSchema);await chat.editMessage(db,user,c.req.param('id'),input.text);return c.json({ok:true})});
app.delete('/api/messages/:id',async c=>{const db=createDb(c.env),user=await currentUser(c,db);await chat.deleteMessage(db,user,c.req.param('id'));return c.json({ok:true})});

app.get('/api/favorites',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,events:await events.favorites(db,user)})});
app.post('/api/favorites/:id/toggle',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,favorite:await events.toggleFavorite(db,user,c.req.param('id'))})});
app.get('/api/profile',async c=>{const db=createDb(c.env),user=await currentUser(c,db),p=await users.profile(db,user);return c.json({ok:true,...p})});
app.get('/api/users/:id',async c=>{const db=createDb(c.env),user=await currentUser(c,db),p=await users.profile(db,user,c.req.param('id'));return c.json({ok:true,...p})});
app.patch('/api/profile',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,profileSchema);return c.json({ok:true,user:await users.updateProfile(db,user,input)})});
app.get('/api/notifications',async c=>{const db=createDb(c.env),user=await currentUser(c,db);return c.json({ok:true,notifications:await users.notifications(db,user)})});
app.post('/api/notifications/:id/read',async c=>{const db=createDb(c.env),user=await currentUser(c,db);await users.readNotification(db,user,c.req.param('id'));return c.json({ok:true})});
app.post('/api/reports',async c=>{const db=createDb(c.env),user=await currentUser(c,db),input=await body<any>(c,reportSchema);await users.report(db,user,input);return c.json({ok:true},201)});

// Transitional compatibility for cached V14 clients. New V15 uses the REST routes above.
app.post('/api',async c=>{const b:any=await c.req.json().catch(()=>({}));const db=createDb(c.env);if(b.action==='events'){const u=await currentUser(c,db,false);return c.json({ok:true,events:await events.publicEvents(db,u)})}if(b.action==='public_config')return c.json({ok:true,config:{appUrl:c.env.APP_URL||'',mapEngine:'maplibre-osm'}});const u=await currentUser(c,db,true);switch(b.action){case'session':{const bot=(c.env.TELEGRAM_BOT_USERNAME||'').replace(/^@/,'');return c.json({ok:true,user:userDto(u),stats:{myEvents:0,pendingRequests:0,unreadNotifications:0},config:{appLinkBase:bot?`https://t.me/${bot}/${c.env.TELEGRAM_APP_SHORT_NAME||'app'}`:'',appUrl:c.env.APP_URL||'',mapEngine:'maplibre-osm'}})}case'event':return c.json({ok:true,event:await events.oneEvent(db,u,String(b.id||''))});case'my_events':return c.json({ok:true,events:await events.myEvents(db,u)});case'create_event':return c.json({ok:true,event:await events.createEvent(db,u,b)},201);case'join_event':return c.json({ok:true,request:await requests.joinEvent(db,c.env,u,String(b.eventId||''),String(b.note||''))});case'requests':return c.json({ok:true,requests:await requests.listRequests(db,u,b.direction==='outgoing'?'outgoing':'incoming')});case'request_detail':return c.json({ok:true,request:await requests.requestDetail(db,u,String(b.requestId||''))});case'resolve_request':return c.json({ok:true,status:await requests.resolveRequest(db,c.env,u,String(b.requestId||''),b.decision)});case'chats':return c.json({ok:true,chats:await chat.chats(db,u)});case'messages':return c.json({ok:true,messages:await chat.messages(db,u,String(b.eventId||''))});case'send_message':return c.json({ok:true,message:await chat.sendMessage(db,u,String(b.eventId||''),String(b.text||''))},201);default:throw new HttpError(404,'Неизвестное действие API.')}});

app.all('*',c=>c.env.ASSETS.fetch(c.req.raw));
export default app;
