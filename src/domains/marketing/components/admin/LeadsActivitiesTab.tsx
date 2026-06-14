import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Briefcase, MessageSquare, TrendingUp, Folder } from "lucide-react";
import { LeadHunterManager } from "./leads/LeadHunterManager";
import { MockInterviewLeadsManager } from "./leads/MockInterviewLeadsManager";
import { SalaryAnalysisLeadsManager } from "./leads/SalaryAnalysisLeadsManager";
import PortfolioRequestsManager from "@/domains/talent/components/admin/PortfolioRequestsTab";

/**
 * Platform Logic: Unified Service Funnel
 * 2026 Standard: Blended Phase 6 UI (Sub-Manager Orchestrator)
 */

export function LeadsActivitiesTab() {
  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-accent">
            <ClipboardList className="h-8 w-8 text-accent fill-accent/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Leads
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Unified Service Funnel
          </p>
        </div>
      </header>

      <Tabs defaultValue="hunts" className="w-full">
        <TabsList className="h-14 w-full max-w-2xl mx-auto grid grid-cols-4 bg-muted/20 border border-border/40 p-1.5 rounded-2xl mb-8">
          <TabsTrigger
            value="hunts"
            className="rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <Briefcase className="w-4 h-4" /> <span className="hidden lg:inline">Job Hunts</span>
          </TabsTrigger>
          <TabsTrigger
            value="mocks"
            className="rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <MessageSquare className="w-4 h-4" /> <span className="hidden lg:inline">Mocks</span>
          </TabsTrigger>
          <TabsTrigger
            value="salary"
            className="rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <TrendingUp className="w-4 h-4" /> <span className="hidden lg:inline">Salary</span>
          </TabsTrigger>
          <TabsTrigger
            value="portfolio"
            className="rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <Folder className="w-4 h-4" /> <span className="hidden lg:inline">Portfolio</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hunts" className="mt-0">
          <LeadHunterManager />
        </TabsContent>

        <TabsContent value="mocks" className="mt-0">
          <MockInterviewLeadsManager />
        </TabsContent>

        <TabsContent value="salary" className="mt-0">
          <SalaryAnalysisLeadsManager />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-0">
          <PortfolioRequestsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LeadsActivitiesTab;

