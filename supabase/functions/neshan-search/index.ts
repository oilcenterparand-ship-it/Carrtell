const allowedOrigins = new Set(['https://carrtell.ir','https://www.carrtell.ir','http://localhost:5173','http://127.0.0.1:5173','http://localhost:4173','http://127.0.0.1:4173']);
function cors(req: Request){const o=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':allowedOrigins.has(o)?o:'https://carrtell.ir','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};}
function json(req:Request,b:unknown,s=200){return new Response(JSON.stringify(b),{status:s,headers:{...cors(req),'content-type':'application/json; charset=utf-8'}})}
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});
  if(req.method!=='POST')return json(req,{ok:false,error:'method_not_allowed'},405);
  const origin=req.headers.get('origin')||''; if(origin&&!allowedOrigins.has(origin))return json(req,{ok:false,error:'origin_not_allowed'},403);
  const key=String(Deno.env.get('NESHAN_SERVICE_API_KEY')||'').trim(); if(!key)return json(req,{ok:false,error:'neshan_service_key_missing'},500);
  try{
    const body=await req.json(); const term=String(body?.term||'').trim().slice(0,120); const lat=Number(body?.latitude); const lng=Number(body?.longitude);
    if(term.length<2||!Number.isFinite(lat)||!Number.isFinite(lng))return json(req,{ok:false,error:'invalid_search'},400);
    const endpoint=new URL('https://api.neshan.org/v1/search'); endpoint.searchParams.set('term',term); endpoint.searchParams.set('lat',String(lat)); endpoint.searchParams.set('lng',String(lng));
    const response=await fetch(endpoint,{headers:{'Api-Key':key,'Accept':'application/json'}}); const payload=await response.json().catch(()=>({}));
    if(!response.ok)return json(req,{ok:false,error:'neshan_search_unavailable',status:response.status},502);
    const items=(Array.isArray(payload?.items)?payload.items:[]).slice(0,8).map((item:any)=>({title:String(item?.title||item?.name||''),address:String(item?.address||item?.region||''),type:String(item?.type||item?.category||''),latitude:Number(item?.location?.y??item?.location?.lat??item?.latitude),longitude:Number(item?.location?.x??item?.location?.lng??item?.longitude)})).filter((item:any)=>item.title&&Number.isFinite(item.latitude)&&Number.isFinite(item.longitude));
    return json(req,{ok:true,items});
  }catch(error){console.error('neshan-search',error);return json(req,{ok:false,error:'neshan_search_failed'},500)}
});
