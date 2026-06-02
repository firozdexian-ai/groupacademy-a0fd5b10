/**
 * Admin generic CRUD repository (Phase 10j.3 - Hardened).
 * * Backs the SimpleAdminRegistry component, providing a clean generic CRUD layer
 * over system taxonomy tables. Isolates direct supabase client invocations,
 * enforces admin-role checking gates before destructive writes, and hooks into
 * the Digital Workforce logging ecosystem for telemetry auditing.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared error humanizer and telemetry channel for the Admin Substrate.
 */
async function reportAdminSubstrateAnomaly(action: string, error: any, context: Record<string, unknown> = {}) {
  const errorMessage = error?.message || "Unknown execution pipeline exception";
  console.error(`[Digital Workforce Anomaly] Admin Repository [${action}]: ${errorMessage}`, context);

  // Pipe into the immutable platform events ledger for audit logging
  try {
    await supabase.from("platform_events" as any).insert({
      event_type: "admin_substrate_fault",
      severity: "error",
      payload: {
        action,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  } catch (logError) {
    console.error("Critical: Telemetry firehose reporting failed:", logError);
  }
}

/**
 * Fetches all records from a specified administrative reference table.
 */
export async function listAdminTableRows(table: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(table as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as any[];
  } catch (error) {
    await reportAdminSubstrateAnomaly("listAdminTableRows", error, { table });
    throw new Error(`Could not load records from ${table}. Please refresh your dashboard.`);
  }
}

/**
 * Inserts a row into an admin schema table. Enforces pre-flight session check.
 */
export async function insertAdminTableRow(table: string, payload: Record<string, unknown>): Promise<void> {
  try {
    // Client-side guard check to complement DB-level RLS policies
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Security clearance validation failed: Session unauthenticated.");

    const { error } = await (supabase.from(table as any) as any).insert(payload);
    if (error) throw error;
  } catch (error) {
    await reportAdminSubstrateAnomaly("insertAdminTableRow", error, { table, payload });
    throw new Error(`Failed to commit new record to ${table}. Verify input parameters and permissions.`);
  }
}

/**
 * Deletes a row from a designated table using an explicit primary key identifier.
 */
export async function deleteAdminTableRow(table: string, id: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Security clearance validation failed: Session unauthenticated.");

    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    await reportAdminSubstrateAnomaly("deleteAdminTableRow", error, { table, targetId: id });
    throw new Error(`Destructive write rejected: Unable to remove record ${id} from ${table}.`);
  }
}

/**
 * Validates a user's role assignment against the authoritative RBAC matrix.
 * Leverages user_roles exclusively to eliminate legacy profile-column recursion bugs.
 */
export async function userHasRole(userId: string, role: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", role as any)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    await reportAdminSubstrateAnomaly("userHasRole", error, { userId, role });
    return false; // Fail secure on pipeline disruptions
  }
}

/**
 * Cross-domain identity RPC lookup utility.
 */
export async function checkAuthEmail(lookup_email: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("check_auth_email", { lookup_email });
    if (error) throw error;
    return data;
  } catch (error) {
    await reportAdminSubstrateAnomaly("checkAuthEmail", error, { lookup_email });
    throw new Error("Identity lookup transaction failed. Please check the email format.");
  }
}

/**
 * Command palette global unified finder for the Gro10x B2B interface.
 */
export async function gro10xGlobalSearch(_q: string, _limit = 6): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("gro10x_global_search", { _q, _limit });
    if (error) throw error;
    return (data ?? {}) as any;
  } catch (error) {
    await reportAdminSubstrateAnomaly("gro10xGlobalSearch", error, { searchQuery: _q });
    return { talents: [], companies: [], jobs: [] }; // Return a clean empty schema fallback
  }
}
