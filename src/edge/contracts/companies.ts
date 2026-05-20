/**
 * Companies domain — edge function contracts.
 *
 * No edge functions are invoked from the companies admin or hooks today.
 * All server interaction is direct table reads + Postgres RPCs
 * (`get_companies_with_signal`, `get_company_detail`, follow/unfollow RPCs).
 *
 * Reserve this namespace for future company-scoped edge endpoints
 * (e.g. enrichment, bulk contact unlock, employer outreach drips).
 */
export type CompaniesEdgeContracts = Record<string, never>;
