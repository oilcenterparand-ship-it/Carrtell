import { supabase } from '../../lib/supabase';

export type TechnicianAvailability = {
  id: string;
  technician_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  max_jobs: number;
  is_available: boolean;
};

function tomorrowLocalDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getMyTomorrowAvailability() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError || new Error('ابتدا وارد پنل سرویس‌کار شوید.');
  const { data, error } = await supabase
    .from('service_technician_availability')
    .select('*')
    .eq('technician_id', authData.user.id)
    .eq('work_date', tomorrowLocalDate())
    .maybeSingle();
  if (error) throw error;
  return (data || null) as TechnicianAvailability | null;
}

export async function setMyTomorrowAvailability(startTime: string, endTime: string) {
  const { data, error } = await supabase.rpc('set_my_tomorrow_availability', {
    p_start_time: startTime,
    p_end_time: endTime,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as TechnicianAvailability;
}

export function tomorrowPersianLabel() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}
