import { supabase } from '../../lib/supabase';

export async function fetchAdminStats() {
  const { data, error } = await supabase.from('admin_stats').select('*').single();
  if (error) {
    console.error('fetchAdminStats error', error);
    return null;
  }
  return data;
}

export async function fetchAdminUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('fetchAdminUsers error', error);
    return [];
  }
  return data;
}
