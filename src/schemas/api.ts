import { z } from 'zod';

const nullableString = z.string().nullable();

export const userSchema = z.object({
  id:z.string(), telegramId:z.number(), username:nullableString, firstName:z.string(), lastName:z.string(), name:z.string(),
  avatarUrl:nullableString, bio:z.string(), birthDate:nullableString, rating:z.number(), verified:z.boolean(), createdAt:z.string()
});

export const organizerSchema = z.object({
  id:z.string(), telegramId:z.number(), name:z.string(), username:nullableString, avatarUrl:nullableString, rating:z.number(), verified:z.boolean()
});

export const eventSchema = z.object({
  id:z.string(), organizerId:z.string(), title:z.string(), desc:z.string(), kind:z.enum(['party','home','bar','music','games','social','spontaneous']), emoji:z.string(), vibe:z.string(), district:z.string(), publicLocation:z.string(), privateAddress:nullableString,
  lat:z.number(), lng:z.number(), startAt:z.string(), endAt:nullableString, price:z.number(), capacity:z.number(), people:z.number(), age:z.string(), tags:z.array(z.string()), schedule:z.array(z.unknown()), coverUrl:nullableString,
  status:z.enum(['draft','published','hidden','cancelled']), requiresApproval:z.boolean(), owner:z.boolean(), favorite:z.boolean(), requestStatus:z.enum(['pending','accepted','declined','cancelled']).nullable(), member:z.boolean(), organizer:organizerSchema.nullable()
});

const requestApplicantSchema = z.object({
  id:z.string(), display_name:z.string(), username:nullableString, avatar_url:nullableString, rating:z.coerce.number(), verified:z.boolean()
});
const requestEventSchema = z.object({
  id:z.string(), title:z.string(), emoji:z.string(), district:z.string(), start_at:z.string(), organizer_id:z.string().optional(),
  organizer:z.object({id:z.string(),display_name:z.string(),avatar_url:nullableString,rating:z.coerce.number()}).nullable().optional()
});
export const eventRequestSchema = z.object({
  id:z.string(), event_id:z.string(), user_id:z.string(), note:z.string(), status:z.enum(['pending','accepted','declined','cancelled']), created_at:z.string(), updated_at:z.string(),
  applicant:requestApplicantSchema.nullable().optional(), event:requestEventSchema.nullable().optional()
});

const memberUserSchema = z.object({
  id:z.string(), display_name:z.string(), username:nullableString, avatar_url:nullableString, rating:z.coerce.number(), verified:z.boolean()
});
export const eventMemberSchema = z.object({
  event_id:z.string(), user_id:z.string(), role:z.enum(['organizer','guest','moderator']), joined_at:z.string(), user:memberUserSchema.nullable().optional()
});

const chatEventSchema = z.object({
  id:z.string(), title:z.string(), emoji:z.string(), kind:z.enum(['party','home','bar','music','games','social','spontaneous']), district:z.string(), start_at:z.string(), status:z.string(), cover_url:nullableString
});
const chatLastMessageSchema = z.object({
  id:z.string(), text:z.string(), created_at:z.string(), sender:z.object({display_name:z.string()}).nullable().optional()
});
export const chatSchema = z.object({
  eventId:z.string(), role:z.string(), event:chatEventSchema, lastMessage:chatLastMessageSchema.nullable(), unread:z.number()
});

const messageSenderSchema = z.object({ id:z.string(), display_name:z.string(), avatar_url:nullableString, username:nullableString });
export const messageSchema = z.object({
  id:z.string(), event_id:z.string(), sender_id:z.string(), text:z.string(), created_at:z.string(), edited_at:nullableString.optional().default(null), sender:messageSenderSchema.nullable().optional()
});

const notificationActorSchema = z.object({id:z.string(),display_name:z.string(),avatar_url:nullableString});
export const notificationSchema = z.object({
  id:z.string(), type:z.string(), title:z.string(), body:z.string(), read_at:nullableString, created_at:z.string(), event_id:nullableString, actor:notificationActorSchema.nullable().optional()
});

export const eventsResponseSchema = z.object({ ok:z.literal(true), events:z.array(eventSchema) });
export const eventResponseSchema = z.object({ ok:z.literal(true), event:eventSchema });
export const sessionResponseSchema = z.object({ ok:z.literal(true), user:userSchema, stats:z.object({myEvents:z.number(),pendingRequests:z.number(),unreadNotifications:z.number()}), config:z.object({appLinkBase:z.string(),appUrl:z.string(),mapEngine:z.string()}) });
export const profileResponseSchema = z.object({ ok:z.literal(true), user:userSchema, organizedEvents:z.number().optional() });
export const requestsResponseSchema = z.object({ ok:z.literal(true), requests:z.array(eventRequestSchema) });
export const requestResponseSchema = z.object({ ok:z.literal(true), request:eventRequestSchema });
export const chatsResponseSchema = z.object({ ok:z.literal(true), chats:z.array(chatSchema) });
export const messagesResponseSchema = z.object({ ok:z.literal(true), messages:z.array(messageSchema) });
export const notificationsResponseSchema = z.object({ ok:z.literal(true), notifications:z.array(notificationSchema) });
export const membersResponseSchema = z.object({ ok:z.literal(true), members:z.array(eventMemberSchema) });
