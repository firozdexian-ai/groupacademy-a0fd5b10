/**
 * Currency formatting helpers — USD is the base unit across the platform.
 *
 * Founder/admin views call `formatUSD()` (USD only).
 * Talent + company views call `formatMoney()` which appends a localized equivalent
 *   like "$5.00 (≈ ৳550)" based on the user's country.
 *
 * Rates are loaded once from `public.currency_rates` via `useCurrencyRates()`.
 */

export interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  usd_rate: number; // 1 USD = N units
  country_codes: string[];
}

const FALLBACK_RATE: CurrencyRate = {
  code: "USD",
  symbol: "$",
  name: "US Dollar",
  usd_rate: 1,
  country_codes: [],
};

export function formatUSD(usdAmount: number, opts?: { fractionDigits?: number }): string {
  const fd = opts?.fractionDigits ?? (usdAmount < 10 ? 2 : 0);
  return `$${usdAmount.toLocaleString("en-US", { minimumFractionDigits: fd, maximumFractionDigits: fd })}`;
}

export function rateForCountry(country: string | null | undefined, rates: CurrencyRate[]): CurrencyRate | null {
  if (!country) return null;
  const norm = country.trim().toLowerCase();
  for (const r of rates) {
    if (r.country_codes.some((c) => c.toLowerCase() === norm)) return r;
  }
  return null;
}

export function formatLocal(usdAmount: number, rate: CurrencyRate): string {
  const local = usdAmount * rate.usd_rate;
  // No decimals for high-rate currencies (IDR, VND, KRW, JPY); 0 for any > 100, 2 otherwise.
  const fd = rate.usd_rate > 100 ? 0 : local < 10 ? 2 : 0;
  return `${rate.symbol}${local.toLocaleString("en-US", { minimumFractionDigits: fd, maximumFractionDigits: fd })}`;
}

/**
 * Returns "$5.00 (≈ ৳550)" for talent/company users.
 * If country has no matching rate (or is USD), returns just the USD form.
 */
export function formatMoney(usdAmount: number, country: string | null | undefined, rates: CurrencyRate[]): string {
  const usd = formatUSD(usdAmount);
  const rate = rateForCountry(country, rates);
  if (!rate || rate.code === "USD") return usd;
  return `${usd} (≈ ${formatLocal(usdAmount, rate)})`;
}

/**
 * Credit ↔ USD conversion. Standardized at $1 = 1 credit (founder economy)
 * for the new USD-base era. Legacy memory mentions 1 credit = 2 BDT (~ $0.018);
 * that older rule applied only to the talent-side BDT pricing surface and is
 * superseded for new B2B/admin surfaces. Keep one constant so future repricing
 * is a single edit.
 */
export const USD_PER_CREDIT = 1;

export function creditsToUSD(credits: number): number {
  return credits * USD_PER_CREDIT;
}

export function usdToCredits(usd: number): number {
  return usd / USD_PER_CREDIT;
}

export { FALLBACK_RATE };
