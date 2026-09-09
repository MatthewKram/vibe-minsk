const PUBLIC_EVENTS_CACHE_PATH='/__vibe_cache__/events-v17';
function keyFromRequest(req:Request){const u=new URL(req.url);u.pathname=PUBLIC_EVENTS_CACHE_PATH;u.search='';return new Request(u.toString(),{method:'GET'});}
export async function cachedPublicEvents(c:any,factory:()=>Promise<unknown>){
  const cache=caches.default;const key=keyFromRequest(c.req.raw);const hit=await cache.match(key);if(hit)return hit;
  const payload=await factory();
  const response=new Response(JSON.stringify(payload),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=20, s-maxage=45, stale-while-revalidate=90','x-vibe-cache':'miss'}});
  const put=cache.put(key,response.clone());const ctx=c.executionCtx;if(ctx?.waitUntil)ctx.waitUntil(put);else await put;
  return response;
}
export async function purgePublicEventsCache(c:any){try{await caches.default.delete(keyFromRequest(c.req.raw));}catch{/* cache is best effort */}}
