import { supabase } from '../lib/supabase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order' | 'service' | 'payment' | 'support' | 'loyalty';
export type NotificationRole = 'admin' | 'driver' | 'customer';

export interface CarrtellNotification {
  id: string;
  user_id?: string | null;
  role?: NotificationRole | null;
  title: string;
  body?: string | null;
  type: NotificationType;
  link?: string | null;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string | null;
}

export async function getMyNotifications(role?: NotificationRole | null) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(80);

  if (userId && role) {
    query = query.or(`user_id.eq.${userId},role.eq.${role}`);
  } else if (userId) {
    query = query.eq('user_id', userId);
  } else if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CarrtellNotification[];
}

export async function getAdminNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as CarrtellNotification[];
}

export async function createNotification(input: {
  user_id?: string | null;
  role?: NotificationRole | null;
  title: string;
  body?: string;
  type?: NotificationType;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.user_id ?? null,
      role: input.role ?? null,
      title: input.title,
      body: input.body ?? null,
      type: input.type ?? 'info',
      link: input.link ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as CarrtellNotification;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in('id', ids);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}
