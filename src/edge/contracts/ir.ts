/**
 * IR (Investor Relations) domain â€” edge function contracts.
 *
 * No edge functions today. IR persistence flows through direct table
 * writes + Postgres RPCs (investor pipeline, dataroom telemetry, unit
 * economics, MRR targets).
 */
export type IrEdgeContracts = Record<string, never>;

