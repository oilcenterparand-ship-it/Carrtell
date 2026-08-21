import { supabase } from "../../lib/supabase";

export type FleetStatus = "active" | "busy" | "maintenance" | "inactive";
export type TechnicianOperationalStatus = "available" | "en_route" | "in_service" | "offline";

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
  operational_status?: TechnicianOperationalStatus | null;
  shift_ended_at?: string | null;
  last_seen_at?: string | null;
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
  operational_status?: TechnicianOperationalStatus;
  notes?: string;
}

export interface FleetOperationalRow extends ServiceFleetVehicle {
  today_missions: number;
  active_missions: number;
  completed_today: number;
  cancelled_today: number;
  next_mission_at?: string | null;
  active_request_id?: string | null;
  average_service_minutes?: number | null;
  completed_amount_today?: number;
}

export interface FleetSummary {
  today: number;
  unassigned: number;
  active: number;
  completed: number;
}

export async function getServiceFleet(): Promise<ServiceFleetVehicle[]> {
  const { data, error } = await supabase
    .from("service_fleet")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ServiceFleetVehicle[];
}

export async function getFleetOperationalDashboard(): Promise<{ rows: FleetOperationalRow[]; summary: FleetSummary }> {
  const fleet = await getServiceFleet();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data: missions, error } = await supabase
    .from("service_requests")
    .select("id, assigned_driver_id, driver_id, status, scheduled_at, completed_at, service_started_at, created_at, total_amount, final_amount")
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });
  if (error) throw error;

  const missionRows = (missions ?? []) as Array<Record<string, any>>;
  const activeStatuses = new Set(["assigned", "accepted", "en_route", "dispatched", "on_way", "arrived", "in_progress", "in_service", "working"]);

  const rows = fleet.map((item) => {
    const related = missionRows.filter((mission) => (mission.assigned_driver_id || mission.driver_id) === item.driver_id);
    const active = related.filter((mission) => activeStatuses.has(String(mission.status)));
    const completed = related.filter((mission) => mission.status === "completed");
    const cancelled = related.filter((mission) => mission.status === "cancelled");
    const next = active.find((mission) => mission.scheduled_at) || null;
    const durations = completed
      .map((mission) => {
        if (!mission.service_started_at || !mission.completed_at) return null;
        return Math.max(0, Math.round((new Date(mission.completed_at).getTime() - new Date(mission.service_started_at).getTime()) / 60000));
      })
      .filter((value): value is number => value !== null);

    return {
      ...item,
      today_missions: related.length,
      active_missions: active.length,
      completed_today: completed.length,
      cancelled_today: cancelled.length,
      next_mission_at: next?.scheduled_at ?? null,
      active_request_id: active[0]?.id ?? null,
      average_service_minutes: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null,
      completed_amount_today: completed.reduce((sum, mission) => sum + Number(mission.final_amount || mission.total_amount || 0), 0),
    } satisfies FleetOperationalRow;
  });

  return {
    rows,
    summary: {
      today: missionRows.length,
      unassigned: missionRows.filter((mission) => !(mission.assigned_driver_id || mission.driver_id) && !["completed", "cancelled"].includes(String(mission.status))).length,
      active: missionRows.filter((mission) => activeStatuses.has(String(mission.status))).length,
      completed: missionRows.filter((mission) => mission.status === "completed").length,
    },
  };
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
    operational_status: input.operational_status || "available",
    notes: input.notes || null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase.from("service_fleet").update(payload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as ServiceFleetVehicle;
  }

  const { data, error } = await supabase.from("service_fleet").insert(payload).select("*").single();
  if (error) throw error;
  return data as ServiceFleetVehicle;
}

export async function deleteServiceFleetVehicle(id: string): Promise<void> {
  const { error } = await supabase.from("service_fleet").delete().eq("id", id);
  if (error) throw error;
}

export async function updateFleetStatus(id: string, status: FleetStatus): Promise<void> {
  const { error } = await supabase.from("service_fleet").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function updateTechnicianOperationalStatus(id: string, operationalStatus: TechnicianOperationalStatus): Promise<void> {
  const patch: Record<string, unknown> = {
    operational_status: operationalStatus,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (operationalStatus === "offline") patch.shift_ended_at = new Date().toISOString();
  else patch.shift_ended_at = null;

  const { error } = await supabase.from("service_fleet").update(patch).eq("id", id);
  if (error) throw error;
}
