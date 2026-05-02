/**
 * Admin Overview — tabbed shell:
 *   Lifetime · This Month · This Quarter · Analyst · Reports
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LifetimeOverviewTab } from "@/components/dashboard/overview/LifetimeOverviewTab";
import { PeriodOverviewTab } from "@/components/dashboard/overview/PeriodOverviewTab";
import { AnalystChatTab } from "@/components/dashboard/overview/AnalystChatTab";
import { ReportsBuilderTab } from "@/components/dashboard/overview/ReportsBuilderTab";

export function DashboardOverview() {
  return (
    <Tabs defaultValue="lifetime" className="space-y-6">
      <TabsList className="flex flex-wrap gap-1 h-auto p-2">
        <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
        <TabsTrigger value="month">This Month</TabsTrigger>
        <TabsTrigger value="quarter">This Quarter</TabsTrigger>
        <TabsTrigger value="analyst">Analyst</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="lifetime"><LifetimeOverviewTab /></TabsContent>
      <TabsContent value="month"><PeriodOverviewTab mode="month" /></TabsContent>
      <TabsContent value="quarter"><PeriodOverviewTab mode="quarter" /></TabsContent>
      <TabsContent value="analyst"><AnalystChatTab /></TabsContent>
      <TabsContent value="reports"><ReportsBuilderTab /></TabsContent>
    </Tabs>
  );
}
