import React from "react";

/**
 * Group Academy — Career Abroad Administrative Routing Map
 * Purpose: Dynamically maps, splits, and lazy-loads the 8 strategic vertical panels
 * managing university programs, destination operations, and language components.
 */

export const ROUTES: Record<string, React.LazyExoticComponent<unknown>> = {
  "abroad-overview": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadOverviewTab").then((m) => ({
      default: (m as unknown).AbroadOverviewTab ?? m.default,
    })),
  ),
  "abroad-destinations": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadDestinationsTab").then((m) => ({
      default: (m as unknown).AbroadDestinationsTab ?? m.default,
    })),
  ),
  "abroad-applications": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadApplicationsTab").then((m) => ({
      default: (m as unknown).AbroadApplicationsTab ?? m.default,
    })),
  ),
  "abroad-programs": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadProgramsTab").then((m) => ({
      default: (m as unknown).AbroadProgramsTab ?? m.default,
    })),
  ),
  "abroad-ielts-prompts": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadIELTSPromptsTab").then((m) => ({
      default: (m as unknown).AbroadIELTSPromptsTab ?? m.default,
    })),
  ),
  "abroad-ielts-resources": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadIELTSResourcesTab").then((m) => ({
      default: (m as unknown).AbroadIELTSResourcesTab ?? m.default,
    })),
  ),
  "abroad-language-lab": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadLanguageLabTab").then((m) => ({
      default: (m as unknown).AbroadLanguageLabTab ?? m.default,
    })),
  ),
  "abroad-roadmap-leads": React.lazy(() =>
    import("@/domains/abroad/components/admin/AbroadRoadmapLeadsTab").then((m) => ({
      default: (m as unknown).AbroadRoadmapLeadsTab ?? m.default,
    })),
  ),
};

export const TITLES: Record<string, string> = {
  "abroad-overview": "Study abroad overview",
  "abroad-destinations": "Destination agents",
  "abroad-applications": "Applications",
  "abroad-programs": "University programs",
  "abroad-ielts-prompts": "IELTS prompts",
  "abroad-ielts-resources": "IELTS resources",
  "abroad-language-lab": "Language lab",
  "abroad-roadmap-leads": "Roadmap leads",
};


