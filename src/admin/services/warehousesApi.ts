import { supabase } from '../../lib/supabase';

export type Warehouse = {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export async function getWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as Warehouse[];
}

export async function updateOrderWarehouse(orderId: string, warehouseId: string | null) {
  const { data, error } = await supabase
    .from('orders')
    .update({ fulfillment_warehouse_id: warehouseId })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
