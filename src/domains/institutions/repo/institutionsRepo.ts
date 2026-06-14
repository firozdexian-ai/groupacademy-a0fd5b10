/**
 * Institutions domain repository (Phase 10i.2).
 */
import { supabase } from "@/integrations/supabase/client";

export async function upsertGraphRow(table: string, payload: unknown): Promise<void> {
  const { created_at, updated_at, ...cleanPayload } = payload;
  if (cleanPayload?.id) {
    const { id, ...patch } = cleanPayload;
    const { error } = await supabase.from(table as unknown).update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(table as unknown).insert([cleanPayload]);
    if (error) throw error;
  }
}

export async function deleteGraphRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table as unknown).delete().eq("id", id);
  if (error) throw error;
}

// â”€â”€â”€ Institution types taxonomy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function listInstitutionTypes(): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("institution_types")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// â”€â”€â”€ Institutions overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getInstitutionsOverviewStats() {
  const [institutions, talents, programs, events] = await Promise.all([
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    supabase
      .from("talents")
      .select("*", { count: "exact", head: true })
      .not("institution_id", "is", null),
    supabase
      .from("study_abroad_programs")
      .select("*", { count: "exact", head: true })
      .not("institution_id", "is", null),
    supabase
      .from("competitions")
      .select("*", { count: "exact", head: true })
      .not("institution_id", "is", null),
  ]);
  return {
    totalInstitutions: institutions.count || 0,
    connectedTalents: talents.count || 0,
    linkedPrograms: programs.count || 0,
    hostedEvents: events.count || 0,
  };
}

// â”€â”€â”€ Stakeholder Registry (institutions / partner_organizations) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function listStakeholders(table: "institutions" | "partner_organizations"): Promise<unknown[]> {
  const { data, error } = await supabase
    .from(table as unknown)
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown[];
}

export async function getInstitutionRollups(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc("get_institution_rollups" as unknown);
  if (error) throw error;
  return (data ?? []).reduce((acc: unknown, curr: unknown) => {
    acc[curr.institution_id] = curr;
    return acc;
  }, {} as Record<string, unknown>);
}

// â”€â”€â”€ Institution Child Registry helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function listInstitutionsMin(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from("institutions").select("id,name").order("name");
  if (error) throw error;
  return (data ?? []) as unknown;
}

export async function listInstitutionClubsByInstitution(institutionId: string): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase
    .from("institution_clubs")
    .select("id, name")
    .eq("institution_id", institutionId);
  return (data ?? []) as unknown;
}

export interface ListInstitutionChildOpts {
  table: "institution_clubs" | "institution_representatives" | "institution_events";
  instFilter: string; // "all" or institution_id
  eventTab: "upcoming" | "past";
}

export async function listInstitutionChildRows(opts: ListInstitutionChildOpts): Promise<unknown[]> {
  let query;
  if (opts.table === "institution_representatives") {
    query = supabase.from("institution_representatives").select("*, club:institution_clubs(id, name)");
  } else {
    query = supabase.from(opts.table as unknown).select("*");
  }

  if (opts.instFilter !== "all") query = query.eq("institution_id", opts.instFilter);

  if (opts.table === "institution_events") {
    const now = new Date().toISOString();
    query =
      opts.eventTab === "upcoming"
        ? query.gte("starts_at", now).order("starts_at", { ascending: true })
        : query.lt("starts_at", now).order("starts_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown[];
}


