import { createClient, type SupabaseClient } from '@supabase/supabase-js';import type { Bindings } from '../types';import { HttpError } from './errors';
export type DB = SupabaseClient<any>;
export function createDb(env:Bindings):DB{const key=env.SUPABASE_SECRET_KEY;if(!env.SUPABASE_URL||!key)throw new HttpError(500,'Не настроено подключение к Supabase.');return createClient(env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false}})}
