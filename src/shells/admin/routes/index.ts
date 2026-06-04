import type React from "react";
import * as overview from "./overview";
import * as talent from "./talent";
import * as companies from "./companies";
import * as jobs from "./jobs";
import * as marketing from "./marketing";
import * as learning from "./learning";
import * as finance from "./finance";
import * as gigs from "./gigs";
import * as abroad from "./abroad";
import * as agents from "./agents";
import * as ir from "./ir";
import * as institutions from "./institutions";
import * as hr from "./hr";
import * as ugc from "./ugc";
import * as gtm from "./gtm";
import * as misc from "./misc";

/**
 * Group Academy — Administrative Core Tab Registry Matrix
 * Merges domain-specific dashboards into a unified lookup map driven by URL tab parameters.
 * Maintains chronological execution layers and configuration parameters safely.
 */
export const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  ...overview.ROUTES,
  ...talent.ROUTES,
  ...companies.ROUTES,
  ...jobs.ROUTES,
  ...marketing.ROUTES,
  ...learning.ROUTES,
  ...finance.ROUTES,
  ...gigs.ROUTES,
  ...abroad.ROUTES,
  ...agents.ROUTES,
  ...ir.ROUTES,
  ...institutions.ROUTES,
  ...hr.ROUTES,
  ...ugc.ROUTES,
  ...gtm.ROUTES,
  ...misc.ROUTES,
};

export const TAB_TITLES: Record<string, string> = {
  ...overview.TITLES,
  ...talent.TITLES,
  ...companies.TITLES,
  ...jobs.TITLES,
  ...marketing.TITLES,
  ...learning.TITLES,
  ...finance.TITLES,
  ...gigs.TITLES,
  ...abroad.TITLES,
  ...agents.TITLES,
  ...ir.TITLES,
  ...institutions.TITLES,
  ...hr.TITLES,
  ...ugc.TITLES,
  ...gtm.TITLES,
  ...misc.TITLES,
};
