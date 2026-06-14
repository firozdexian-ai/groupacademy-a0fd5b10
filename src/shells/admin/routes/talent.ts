import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<unknown>> = {
  "crm-overview": React.lazy(() => import("@/domains/talent/components/admin/TalentOverviewTab").then((m: unknown) => ({ default: m.TalentOverviewTab ?? m.default }))),
  "crm-talent-pool": React.lazy(() => import("@/domains/talent/components/admin/TalentPoolTab").then((m: unknown) => ({ default: m.TalentPoolTab ?? m.TalentPoolManager ?? m.default }))),
  "crm-professions": React.lazy(() => import("@/domains/talent/components/admin/ProfessionsTab").then((m: unknown) => ({ default: m.ProfessionsTab ?? m.ProfessionsManager ?? m.default }))),
  "crm-upload": React.lazy(() => import("@/domains/talent/components/admin/TalentUploadTab").then((m: unknown) => ({ default: m.TalentUploadTab ?? m.default }))),
  "crm-outreach": React.lazy(() => import("@/domains/talent/components/admin/TalentOutreachConsoleTab").then((m: unknown) => ({ default: m.TalentOutreachConsoleTab ?? m.default }))),
  "crm-wa-channel": React.lazy(() => import("@/domains/talent/components/admin/TalentMessagingChannelTab").then((m: unknown) => ({ default: m.TalentMessagingChannelTab ?? m.default }))),
  "crm-creator-economy": React.lazy(() => import("@/domains/talent/components/admin/CreatorEconomyTab").then((m: unknown) => ({ default: m.CreatorEconomyTab ?? m.default }))),
  "crm-notifications": React.lazy(() => import("@/domains/talent/components/admin/NotificationsTab").then((m: unknown) => ({ default: m.NotificationsTab ?? m.NotificationsManager ?? m.default }))),
  "crm-support-ai": React.lazy(() => import("@/domains/talent/components/admin/SupportAITab").then((m: unknown) => ({ default: m.SupportAITab ?? m.SupportAssistant ?? m.default }))),
  portfolios: React.lazy(() => import("@/domains/talent/components/admin/PortfolioRequestsTab").then((m: unknown) => ({ default: m.PortfolioRequestsTab ?? m.default ?? m.PortfolioRequestsManager }))),
};

export const TITLES: Record<string, string> = {
  "crm-overview": "CRM overview",
  "crm-talent-pool": "Talent pool",
  "crm-professions": "Professions & roles",
  "crm-upload": "Upload talents",
  "crm-outreach": "Outreach log",
  "crm-wa-channel": "WhatsApp line",
  "crm-creator-economy": "Creator economy",
  "crm-notifications": "Notifications",
  "crm-support-ai": "Support AI",
  portfolios: "Portfolios",
};


