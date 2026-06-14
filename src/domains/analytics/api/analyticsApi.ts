/**
 * Analytics domain — typed edge function wrappers (Phase 9g - Hardened).
 * Houses edge contract dispatchers for the Report Builder and Business Analyst (Nia) agents.
 * Automates token propagation, schemas parsing, and React Query cache invalidation mapping.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AdminReportBuilderResponseSchema,
  type AdminReportBuilderRequest,
  type AdminReportBuilderResponse,
  // Assuming these are seeded in our contracts registry for Nia
  AdminAnalystResponseSchema,
  type AdminAnalystRequest,
  type AdminAnalystResponse,
} from "@/edge/contracts/analytics";

export interface AnalyticsEdgeExecutionResult<T> {
  data: T;
  /** React Query keys that must be invalidated on completion to auto-refresh the dashboard views */
  invalidate: string[];
}

/**
 * Dispatches a payload to the admin-report-builder engine.
 * Automatically appends system session authorization tokens.
 */
export async function adminReportBuilder(
  req: AdminReportBuilderRequest,
): Promise<AnalyticsEdgeExecutionResult<AdminReportBuilderResponse>> {
  try {
    // Acquire active session token to maintain hard architectural token verification checks
    const session = await getCurrentSession();

    const { data, error } = await supabase.functions.invoke("admin-report-builder", {
      body: req,
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    if (error) throw new EdgeFunctionError("admin-report-builder", error);

    const parsedData = parseEdgeResponse("admin-report-builder", AdminReportBuilderResponseSchema, data ?? {});

    return {
      data: parsedData,
      invalidate: ["admin-report-builder", "admin-reports", "overview-reports"],
    };
  } catch (err: unknown) {
    console.error("[Digital Workforce Anomaly] Report builder generation failure:", err);
    throw new Error(err.message || "Something went wrong while compiling your report. Please check parameters.");
  }
}

/**
 * Dispatches a tracking query payload to Nia (Business Analyst Chat Engine backend).
 */
export async function adminAnalystQuery(
  req: AdminAnalystRequest,
): Promise<AnalyticsEdgeExecutionResult<AdminAnalystResponse>> {
  try {
    const session = await getCurrentSession();

    const { data, error } = await supabase.functions.invoke("admin-analyst", {
      body: req,
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    if (error) throw new EdgeFunctionError("admin-analyst", error);

    const parsedData = parseEdgeResponse("admin-analyst", AdminAnalystResponseSchema, data ?? {});

    return {
      data: parsedData,
      invalidate: ["admin-analyst", "platform-metrics", "overview-analyst"],
    };
  } catch (err: unknown) {
    console.error("[Digital Workforce Anomaly] Business analyst processing failure:", err);
    throw new Error("The analytics engine couldn't calculate these platform metrics right now.");
  }
}

// Re-export repo helpers for manifest consumers
export {
  getLifetimeOverviewMaster,
  insertPlatformEvent,
  trackServiceClick,
  trackContentClick,
  trackCourseReferralClick,
  analystMetricsBulk,
  type LifetimeOverviewPayload,
  type AnalystMetricPeriod,
} from "../repo/analyticsRepo";



