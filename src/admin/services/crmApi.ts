import { supabase } from '../../lib/supabase';

export type CustomerSegment = 'vip' | 'active' | 'new' | 'inactive' | 'service_due' | 'high_value';
export type CustomerTag = { id: string; title: string; color?: string; description?: string | null };
export type CustomerNote = { id: string; user_id: string; note: string; created_at?: string; created_by?: string | null; is_pinned?: boolean };
export type CustomerTask = { id: string; user_id: string; title: string; due_at?: string | null; status: 'open'|'done'|'cancelled'; priority: 'low'|'normal'|'high'; created_at?: string };
export type CustomerInteraction = { id: string; user_id: string; channel: string; direction: string; subject?: string|null; body?: string|null; created_at?: string };

export type CrmCustomer = {
  id: string;
  full_name: string;
  phone: string;
  role?: string;
  created_at?: string;
  orders_count: number;
  paid_orders_count: number;
  total_spent: number;
  average_order_value: number;
  last_order_at?: string | null;
  last_order_status?: string | null;
  vehicles_count: number;
  service_count: number;
  last_service_at?: string | null;
  next_service_km?: number | null;
  current_km?: number | null;
  service_due: boolean;
  days_since_last_order: number | null;
  lifetime_months: number;
  segments: CustomerSegment[];
  tags: CustomerTag[];
  wallet_balance: number;
  loyalty_points: number;
};

const cleanPhone = (value?: string | null) => String(value || '').replace(/\D/g, '').replace(/^98/, '0');
const orderAmount = (row: any) => Number(row.total_amount ?? row.total ?? row.amount ?? 0) || 0;
const isPaid = (status?: string | null) => ['paid','processing','preparing','ready','shipped','delivered','completed'].includes(String(status || '').toLowerCase());
const daysBetween = (date?: string | null) => date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : null;

async function safeSelect(table: string, columns = '*') {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) return [] as any[];
  return (data || []) as any[];
}

export async function getCrmCustomers(): Promise<CrmCustomer[]> {
  const [profiles, orders, vehicles, services, wallets, assignments, tags] = await Promise.all([
    safeSelect('profiles'), safeSelect('orders'), safeSelect('customer_vehicles'), safeSelect('service_requests'),
    safeSelect('customer_wallets'), safeSelect('customer_tag_assignments'), getCustomerTags(),
  ]);
  const tagMap = new Map(tags.map(t => [t.id, t]));
  const assignedByUser = new Map<string, CustomerTag[]>();
  assignments.forEach((a:any) => { const t = tagMap.get(a.tag_id); if (t) assignedByUser.set(a.user_id, [...(assignedByUser.get(a.user_id)||[]), t]); });

  return profiles.filter((p:any) => !p.role || p.role === 'customer').map((p:any) => {
    const phone = cleanPhone(p.phone || p.mobile);
    const userOrders = orders.filter((o:any) => o.user_id === p.id || (phone && cleanPhone(o.customer_phone) === phone));
    const paid = userOrders.filter((o:any) => isPaid(o.status) || o.payment_status === 'paid');
    const sortedOrders = [...userOrders].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
    const userVehicles = vehicles.filter((v:any) => v.user_id === p.id || (phone && cleanPhone(v.customer_phone) === phone));
    const userServices = services.filter((s:any) => s.user_id === p.id || (phone && cleanPhone(s.customer_phone) === phone));
    const sortedServices = [...userServices].sort((a,b)=>String(b.completed_at||b.created_at||'').localeCompare(String(a.completed_at||a.created_at||'')));
    const defaultVehicle = userVehicles.find((v:any)=>v.is_default) || userVehicles[0];
    const currentKm = Number(defaultVehicle?.current_km ?? defaultVehicle?.kilometers ?? sortedServices[0]?.final_km ?? 0) || null;
    const nextKm = Number(defaultVehicle?.next_service_km ?? sortedServices[0]?.next_service_km ?? 0) || null;
    const spent = paid.reduce((sum:number,o:any)=>sum+orderAmount(o),0);
    const lastOrder = sortedOrders[0];
    const inactiveDays = daysBetween(lastOrder?.created_at);
    const created = p.created_at ? new Date(p.created_at) : new Date();
    const lifetimeMonths = Math.max(1, Math.ceil((Date.now()-created.getTime())/(30*86400000)));
    const serviceDue = Boolean(nextKm && currentKm && currentKm >= nextKm - 500);
    const segments: CustomerSegment[] = [];
    if (spent >= 20_000_000 || paid.length >= 5) segments.push('vip');
    if (spent >= 10_000_000) segments.push('high_value');
    if (inactiveDays !== null && inactiveDays <= 60) segments.push('active');
    if (lifetimeMonths <= 1) segments.push('new');
    if (inactiveDays === null || inactiveDays >= 120) segments.push('inactive');
    if (serviceDue) segments.push('service_due');
    const wallet = wallets.find((w:any)=>w.user_id === p.id || (phone && cleanPhone(w.customer_phone) === phone));
    return {
      id:p.id, full_name:p.full_name || p.name || 'مشتری بدون نام', phone:p.phone || p.mobile || '', role:p.role,
      created_at:p.created_at, orders_count:userOrders.length, paid_orders_count:paid.length, total_spent:spent,
      average_order_value:paid.length ? Math.round(spent/paid.length) : 0, last_order_at:lastOrder?.created_at || null,
      last_order_status:lastOrder?.status || null, vehicles_count:userVehicles.length, service_count:userServices.length,
      last_service_at:sortedServices[0]?.completed_at || sortedServices[0]?.created_at || null, next_service_km:nextKm,
      current_km:currentKm, service_due:serviceDue, days_since_last_order:inactiveDays, lifetime_months:lifetimeMonths,
      segments, tags:assignedByUser.get(p.id)||[], wallet_balance:Number(wallet?.balance||0), loyalty_points:Number(wallet?.points||0),
    };
  }).sort((a,b)=>b.total_spent-a.total_spent);
}

export async function getCustomer360(userId: string, phone?: string) {
  const clean = cleanPhone(phone);
  const [orders, vehicles, services, notes, tasks, interactions] = await Promise.all([
    safeSelect('orders'), safeSelect('customer_vehicles'), safeSelect('service_requests'), getCustomerNotes(userId), getCustomerTasks(userId), getCustomerInteractions(userId),
  ]);
  const match = (r:any) => r.user_id === userId || (clean && cleanPhone(r.customer_phone) === clean);
  return {
    orders: orders.filter(match).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))),
    vehicles: vehicles.filter(match), services: services.filter(match).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))),
    notes, tasks, interactions,
  };
}

export async function getCustomerTags(): Promise<CustomerTag[]> { const {data,error}=await supabase.from('customer_tags').select('*').order('title'); return error?[]:(data||[]); }
export async function createCustomerTag(title:string,color='#f59e0b'){const {data,error}=await supabase.from('customer_tags').insert({title,color}).select().single();if(error)throw error;return data;}
export async function assignCustomerTag(userId:string,tagId:string){const {error}=await supabase.from('customer_tag_assignments').upsert({user_id:userId,tag_id:tagId},{onConflict:'user_id,tag_id'});if(error)throw error;}
export async function removeCustomerTag(userId:string,tagId:string){const {error}=await supabase.from('customer_tag_assignments').delete().eq('user_id',userId).eq('tag_id',tagId);if(error)throw error;}
export async function getCustomerNotes(userId:string):Promise<CustomerNote[]>{const {data,error}=await supabase.from('customer_notes').select('*').eq('user_id',userId).order('is_pinned',{ascending:false}).order('created_at',{ascending:false});return error?[]:(data||[]);}
export async function addCustomerNote(userId:string,note:string){const {data:userData}=await supabase.auth.getUser();const {data,error}=await supabase.from('customer_notes').insert({user_id:userId,note,created_by:userData.user?.id??null}).select().single();if(error)throw error;return data;}
export async function getCustomerTasks(userId:string):Promise<CustomerTask[]>{const {data,error}=await supabase.from('customer_tasks').select('*').eq('user_id',userId).order('status').order('due_at',{ascending:true});return error?[]:(data||[]);}
export async function createCustomerTask(userId:string,title:string,dueAt?:string,priority='normal'){const {data,error}=await supabase.from('customer_tasks').insert({user_id:userId,title,due_at:dueAt||null,priority}).select().single();if(error)throw error;return data;}
export async function setCustomerTaskStatus(id:string,status:'open'|'done'|'cancelled'){const {error}=await supabase.from('customer_tasks').update({status,completed_at:status==='done'?new Date().toISOString():null}).eq('id',id);if(error)throw error;}
export async function getCustomerInteractions(userId:string):Promise<CustomerInteraction[]>{const {data,error}=await supabase.from('customer_interactions').select('*').eq('user_id',userId).order('created_at',{ascending:false});return error?[]:(data||[]);}
export async function addCustomerInteraction(userId:string,channel:string,subject:string,body:string){const {data,error}=await supabase.from('customer_interactions').insert({user_id:userId,channel,direction:'outbound',subject,body}).select().single();if(error)throw error;return data;}

export function exportCustomersCsv(customers:CrmCustomer[]){const header=['نام','موبایل','سگمنت‌ها','برچسب‌ها','تعداد سفارش','سفارش پرداخت‌شده','ارزش مشتری','میانگین سفارش','آخرین خرید','خودرو','سرویس','کیلومتر فعلی','سرویس بعدی','امتیاز','کیف پول'];const rows=customers.map(c=>[c.full_name,c.phone,c.segments.join('|'),c.tags.map(t=>t.title).join('|'),c.orders_count,c.paid_orders_count,c.total_spent,c.average_order_value,c.last_order_at||'',c.vehicles_count,c.service_count,c.current_km||'',c.next_service_km||'',c.loyalty_points,c.wallet_balance]);const csv='\uFEFF'+[header,...rows].map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`carrtell-crm-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);}
