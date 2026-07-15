import { supabase } from '../../lib/supabase';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'expired';

export type Campaign = {
  id?: string;
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  desktop_banner_url?: string | null;
  mobile_banner_url?: string | null;
  link_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: CampaignStatus;
  priority?: number;
  show_on_home?: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function getCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getActiveCampaigns() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('show_on_home', true)
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('priority', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveCampaign(payload: Campaign) {
  const clean = {
    title: payload.title,
    subtitle: payload.subtitle || null,
    slug: payload.slug || null,
    desktop_banner_url: payload.desktop_banner_url || null,
    mobile_banner_url: payload.mobile_banner_url || null,
    link_url: payload.link_url || null,
    starts_at: payload.starts_at || null,
    ends_at: payload.ends_at || null,
    status: payload.status || 'draft',
    priority: Number(payload.priority || 10),
    show_on_home: payload.show_on_home ?? true,
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(clean)
      .eq('id', payload.id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert(clean)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}
