import { z } from 'zod';
import { telegram } from './telegram';

export class ApiError extends Error { constructor(message:string, public status:number, public details?:unknown){ super(message); } }

function headers(json=true):HeadersInit {
  const h:Record<string,string> = {};
  if (json) h['content-type']='application/json';
  const initData=telegram.initData(); if(initData) h['x-telegram-init-data']=initData;
  if(import.meta.env.DEV && import.meta.env.VITE_DEV_USER) h['x-vibe-dev-user']=import.meta.env.VITE_DEV_USER;
  return h;
}

async function request<T>(url:string,init:RequestInit):Promise<T>;
async function request<S extends z.ZodType>(url:string,init:RequestInit,schema:S):Promise<z.infer<S>>;
async function request<S extends z.ZodType>(url:string,init:RequestInit,schema?:S):Promise<unknown>{
  const response=await fetch(url,{...init,headers:{...headers(!(init.body instanceof FormData)),...(init.headers||{})}});
  const payload=await response.json().catch(()=>({ok:false,error:'Сервер вернул некорректный ответ.'}));
  if(!response.ok || (payload as any)?.ok===false) throw new ApiError((payload as any)?.error||`Ошибка ${response.status}`,response.status,(payload as any)?.details);
  return schema?schema.parse(payload):payload;
}

export const api={
  get<T>(url:string):Promise<T> { return request<T>(url,{method:'GET'}); },
  getParsed<S extends z.ZodType>(url:string,schema:S):Promise<z.infer<S>> { return request(url,{method:'GET'},schema); },
  post<T>(url:string,body?:unknown):Promise<T> { return request<T>(url,{method:'POST',body:body===undefined?undefined:JSON.stringify(body)}); },
  postParsed<S extends z.ZodType>(url:string,body:unknown,schema:S):Promise<z.infer<S>> { return request(url,{method:'POST',body:JSON.stringify(body)},schema); },
  patch<T>(url:string,body?:unknown):Promise<T> { return request<T>(url,{method:'PATCH',body:body===undefined?undefined:JSON.stringify(body)}); },
  patchParsed<S extends z.ZodType>(url:string,body:unknown,schema:S):Promise<z.infer<S>> { return request(url,{method:'PATCH',body:JSON.stringify(body)},schema); },
  delete<T>(url:string,body?:unknown):Promise<T> { return request<T>(url,{method:'DELETE',body:body===undefined?undefined:JSON.stringify(body)}); },
  upload<T>(url:string,form:FormData):Promise<T> { return request<T>(url,{method:'POST',body:form}); }
};
