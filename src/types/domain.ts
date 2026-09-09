export type EventKind = 'party'|'home'|'bar'|'music'|'games'|'social'|'spontaneous';
export type RequestStatus = 'pending'|'accepted'|'declined'|'cancelled';
export type EventStatus = 'draft'|'published'|'hidden'|'cancelled';

export interface User {
  id: string; telegramId: number; username: string|null; firstName: string; lastName: string;
  name: string; avatarUrl: string|null; bio: string; birthDate: string|null; rating: number;
  verified: boolean; createdAt: string;
}
export interface Organizer {
  id: string; telegramId: number; name: string; username: string|null; avatarUrl: string|null; rating: number; verified: boolean;
}
export interface EventItem {
  id: string; organizerId: string; title: string; desc: string; kind: EventKind; emoji: string; vibe: string;
  district: string; publicLocation: string; privateAddress: string|null; lat: number; lng: number;
  startAt: string; endAt: string|null; price: number; capacity: number; people: number; age: string;
  tags: string[]; schedule: unknown[]; coverUrl: string|null; status: EventStatus; requiresApproval: boolean;
  owner: boolean; favorite: boolean; requestStatus: RequestStatus|null; member: boolean; organizer: Organizer|null;
}
export interface SessionStats { myEvents:number; pendingRequests:number; unreadNotifications:number }
export interface SessionResponse { user: User; stats:SessionStats; config:{appLinkBase:string;appUrl:string;mapEngine:string} }
export interface EventRequest {
  id:string; event_id:string; user_id:string; note:string; status:RequestStatus; created_at:string; updated_at:string;
  applicant?: { id:string; display_name:string; username:string|null; avatar_url:string|null; rating:number; verified:boolean };
  event?: { id:string; title:string; emoji:string; district:string; start_at:string; organizer_id?:string; organizer?: unknown };
}
export interface EventMember {
  event_id:string; user_id:string; role:'organizer'|'guest'|'moderator'; joined_at:string;
  user?: { id:string; display_name:string; username:string|null; avatar_url:string|null; rating:number; verified:boolean };
}
export interface ChatItem {
  eventId:string; role:string; event:{id:string;title:string;emoji:string;kind:EventKind;district:string;start_at:string;status:string;cover_url:string|null};
  lastMessage:{id:string;text:string;created_at:string;sender?:{display_name:string}}|null; unread:number;
}
export interface MessageItem {
  id:string; event_id:string; sender_id:string; text:string; created_at:string; edited_at:string|null;
  sender?: {id:string;display_name:string;avatar_url:string|null;username:string|null};
}
export interface NotificationItem {
  id:string; type:string; title:string; body:string; read_at:string|null; created_at:string; event_id:string|null;
  actor?: {id:string;display_name:string;avatar_url:string|null}|null;
}
export interface CreateEventInput {
  title:string; description:string; kind:EventKind; emoji:string; vibe:string; district:string; publicLocation:string; privateAddress:string;
  lat:number; lng:number; startAt:string; endAt:string|null; price:number; capacity:number; age:string; tags:string[]; schedule:unknown[]; requiresApproval:boolean;
}
