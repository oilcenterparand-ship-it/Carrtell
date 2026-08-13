import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type, x-bootstrap-secret','Content-Type':'application/json'};
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  const expected=Deno.env.get('ADMIN_BOOTSTRAP_SECRET');
  if(!expected||req.headers.get('x-bootstrap-secret')!==expected)return new Response(JSON.stringify({error:'unauthorized'}),{status:401,headers});
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{autoRefreshToken:false,persistSession:false}});
  const body=await req.json(); const username=String(body.username||'').trim().toLowerCase(); const password=String(body.password||'');
  if(!/^[a-z0-9_.-]{3,40}$/.test(username)||password.length<10)return new Response(JSON.stringify({error:'username/password invalid'}),{status:400,headers});
  const {count}=await supabase.from('admin_accounts').select('*',{count:'exact',head:true}); if((count||0)>0)return new Response(JSON.stringify({error:'bootstrap already completed'}),{status:409,headers});
  const email=`${username}@admin.carrtell.local`; const {data,error}=await supabase.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{account_type:'admin',username}});
  if(error||!data.user)return new Response(JSON.stringify({error:error?.message}),{status:400,headers});
  const {data:role}=await supabase.from('admin_roles').select('id').eq('name','owner').single();
  const {error:insertError}=await supabase.from('admin_accounts').insert({id:data.user.id,username,full_name:String(body.fullName||username),email,role_id:role?.id,is_active:true,is_super_admin:true});
  if(insertError){await supabase.auth.admin.deleteUser(data.user.id);return new Response(JSON.stringify({error:insertError.message}),{status:400,headers});}
  return new Response(JSON.stringify({ok:true,username}),{headers});
});
