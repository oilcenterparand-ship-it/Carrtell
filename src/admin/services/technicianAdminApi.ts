import { supabase } from '../../lib/supabase';

export type ServiceTechnician = {
  id: string;
  username: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
  service_area?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ServiceTechnicianInput = {
  id?: string;
  username: string;
  password?: string;
  full_name: string;
  phone?: string;
  is_active?: boolean;
  service_area?: string;
  notes?: string;
};

export async function listServiceTechnicians(activeOnly = false): Promise<ServiceTechnician[]> {
  let query = supabase.from('service_technicians').select('id,username,full_name,phone,is_active,service_area,notes,created_at,updated_at').order('full_name');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ServiceTechnician[];
}

export async function saveServiceTechnician(input: ServiceTechnicianInput) {
  const { data, error } = await supabase.functions.invoke('staff-password-login', {
    body: { action: 'technician_upsert', role: 'technician', ...input },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'ذخیره سرویس‌کار انجام نشد.');
  return data.technician as ServiceTechnician;
}

export async function setServiceTechnicianActive(id: string, isActive: boolean) {
  const { data, error } = await supabase.functions.invoke('staff-password-login', {
    body: { action: 'technician_set_active', role: 'technician', id, is_active: isActive },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'تغییر وضعیت سرویس‌کار انجام نشد.');
}
