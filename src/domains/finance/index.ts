/**
 * GroUp Academy: Finance Domain Central Module Entry (Barrel Index)
 * Centralizes re-exports for admin billing consoles, consumer credit widgets, infrastructure states, and data query hooks.
 */

// Global API endpoints and contract manifests
export * from "./api/manifest";

// Administrative Billing and Operational Tabs
export { default as CompanyCreditsTab } from "./components/admin/CompanyCreditsTab";
export { default as FinOverviewTab } from "./components/admin/FinOverviewTab";
export { default as Gro10xCreditsTab } from "./components/admin/Gro10xCreditsTab";
export { default as InvoicesTab } from "./components/admin/InvoicesTab";
export { default as PaymentInfraTab } from "./components/admin/PaymentInfraTab";
export { default as PaymentSettingsTab } from "./components/admin/PaymentSettingsTab";
export { default as TalentCreditsTab } from "./components/admin/TalentCreditsTab";
export { default as TransactionsTab } from "./components/admin/TransactionsTab";
export { default as WithdrawalsTab } from "./components/admin/WithdrawalsTab";
export { useFinOpsGraph } from "./components/admin/hooks/useFinOpsGraph";

// Candidate and Employer Credit Workspace Interfaces
export { CreditBalance } from "./components/talent/CreditBalance";
export { CreditGateModal } from "./components/talent/CreditGateModal";
export { CreditPurchaseSheet } from "./components/talent/CreditPurchaseSheet";
export { MyInvoicesList } from "./components/talent/MyInvoicesList";
export { ServiceHistoryCard } from "./components/talent/ServiceHistoryCard";
export { ServiceUsageBadge } from "./components/talent/ServiceUsageBadge";

// Platform Wallet state sensors, parameters, and visibility hooks
export * from "./hooks/useCredits";
export * from "./hooks/useCreditPurchase";
export * from "./hooks/usePaymentConfig";
