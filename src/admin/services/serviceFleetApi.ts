import { supabase } from "../../lib/supabase";

export type FleetStatus = "active" | "busy" | "maintenance" | "inactive";

export interface ServiceFleetVehicle {
  id: string;
  branch_id?: string | null;
  driver_id?: string | null;
  title: string;
  plate_number?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  service_area?: string | null;
  status: FleetStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceFleetInput {
  branch_id?: string;
  driver_id?: string;
  title: string;
  plate_number?: string;
  driver_name?: string;
  driver_phone?: string;
  service_area?: string;
  status?: FleetStatus;
  notes?: string;
}

export async function getServiceFleet(): Promise<ServiceFleetVehicle[]> {
  const { data, error } = await supabase
    .from("service_fleet")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ServiceFleetVehicle[];
}

export async function saveServiceFleetVehicle(input: ServiceFleetInput, id?: string): Promise<ServiceFleetVehicle> {
  const payload = {
    branch_id: input.branch_id || null,
    driver_id: input.driver_id || null,
    title: input.title,
    plate_number: input.plate_number || null,
    driver_name: input.driver_name || null,
    driver_phone: input.driver_phone || null,
    service_area: input.service_area || null,
    status: input.status || "active",
    notes: input.notes || null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase
      .from("service_fleet")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as ServiceFleetVehicle;
  }

  const { data, error } = await supabase
    .from("service_fleet")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as ServiceFleetVehicle;
}

export async function deleteServiceFleetVehicle(id: string): Promise<void> {
  const { error } = await supabase.from("service_fleet").delete().eq("id", id);
  if (error) throw error;
}

export async function updateFleetStatus(id: string, status: FleetStatus): Promise<void> {
  const { error } = await supabase
    .from("service_fleet")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
