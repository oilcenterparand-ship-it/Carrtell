import { supabase } from '../../lib/supabase';
import { defaultRecommendationSettings, type RecommendationSettings } from '../../customer/services/recommendationsApi';

export async function getAdminRecommendationSettings(): Promise<RecommendationSettings> {
  const { data, error } = await supabase
    .from('recommendation_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) return defaultRecommendationSettings;
  return { ...defaultRecommendationSettings, ...data };
}

export async function saveAdminRecommendationSettings(settings: RecommendationSettings) {
  const payload = {
    is_enabled: settings.is_enabled,
    only_in_stock: settings.only_in_stock,
    show_unmatched_warning: settings.show_unmatched_warning,
    essential_categories: settings.essential_categories || [],
    carrtell_pick_categories: settings.carrtell_pick_categories || [],
    next_service_categories: settings.next_service_categories || [],
    updated_at: new Date().toISOString(),
  };

  const current = await getAdminRecommendationSettings();
  const query = current.id
    ? supabase.from('recommendation_settings').update(payload).eq('id', current.id).select('*').single()
    : supabase.from('recommendation_settings').insert(payload).select('*').single();

  const { data, error } = await query;
  if (error) throw error;
  return data as RecommendationSettings;
}
