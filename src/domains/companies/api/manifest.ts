/**
 * Companies domain API manifest.
 *
 * No edge functions yet — companies data flows through Postgres RPCs
 * consumed directly by hooks. Stub kept for parity with other domains
 * and for future endpoints (enrichment, bulk unlock, outreach).
 */
export const companiesApi = {} as const;

export type CompaniesApi = typeof companiesApi;
