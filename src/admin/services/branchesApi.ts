import { supabase } from "../../lib/supabase";

export type BranchStatus = "active" | "inactive";

export interface Branch {
  id: string;
  name: string;
  city?: string | null;
  service_area?: string | null;
  manager_name?: string | null;
  manager_phone?: string | null;
  address?: string | null;
  status: BranchStatus;
  created_at?: string;
  updated_at?: string;
}

export interface BranchInput {
  name: string;
  city?: string;
  service_area?: string;
  manager_name?: string;
  manager_phone?: string;
  address?: string;
  status?: BranchStatus;
}

export async function getBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function getActiveBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function saveBranch(input: BranchInput, id?: string): Promise<Branch> {
  const payload = {
    name: input.name,
    city: input.city || null,
    service_area: input.service_area || null,
    manager_name: input.manager_name || null,
    manager_phone: input.manager_phone || null,
    address: input.address || null,
    status: input.status || "active",
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase
      .from("branches")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Branch;
  }

  const { data, error } = await supabase
    .from("branches")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as Branch;
}

export async function deleteBranch(id: string): Promise<void> {
  const { error } = await supabase.from("branches").delete().eq("id", id);
  if (error) throw error;
}
