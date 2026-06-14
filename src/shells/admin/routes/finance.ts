import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<unknown>> = {
  "finops-overview": React.lazy(() => import("@/domains/finance/components/admin/FinOverviewTab").then((m: unknown) => ({ default: m.FinOverviewTab ?? m.default }))),
  "finops-talent-credits": React.lazy(() => import("@/domains/finance/components/admin/TalentCreditsTab").then((m: unknown) => ({ default: m.TalentCreditsTab ?? m.default }))),
  "finops-gro10x-credits": React.lazy(() => import("@/domains/finance/components/admin/Gro10xCreditsTab").then((m: unknown) => ({ default: m.Gro10xCreditsTab ?? m.default }))),
  "finops-company-credits": React.lazy(() => import("@/domains/finance/components/admin/CompanyCreditsTab").then((m: unknown) => ({ default: m.CompanyCreditsTab ?? m.default }))),
  "finops-transactions": React.lazy(() => import("@/domains/finance/components/admin/TransactionsTab").then((m: unknown) => ({ default: m.TransactionsTab ?? m.default }))),
  "finops-pay-infra": React.lazy(() => import("@/domains/finance/components/admin/PaymentInfraTab").then((m: unknown) => ({ default: m.PaymentInfraTab ?? m.default }))),
  "finops-invoices": React.lazy(() => import("@/domains/finance/components/admin/InvoicesTab").then((m: unknown) => ({ default: m.InvoicesTab ?? m.default }))),
  "finops-withdrawals": React.lazy(() => import("@/domains/finance/components/admin/WithdrawalsTab").then((m: unknown) => ({ default: m.WithdrawalsTab ?? m.default }))),
};

export const TITLES: Record<string, string> = {
  "finops-overview": "Finance overview",
  "finops-talent-credits": "Talent credits",
  "finops-gro10x-credits": "Gro10x credits",
  "finops-company-credits": "Company credits",
  "finops-transactions": "Transactions",
  "finops-pay-infra": "Payment settings",
  "finops-invoices": "Invoices",
  "finops-withdrawals": "Withdrawals",
};


