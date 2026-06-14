import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFinOpsGraphMaster,
  updateWithdrawalStatus as repoUpdateWithdrawalStatus,
  upsertPaymentConfig,
} from "@/domains/finance/repo/financeRepo";

// --- Global Type Definitions ---
export interface TalentWallet {
  id: string;
  balance: number;
  earned_balance: number;
  talent: { full_name: string; email: string };
}
export interface CompanyWallet {
  id: string;
  balance: number;
  earned_balance: number;
  company: { name: string; type: string };
}
export interface CreditInvoice {
  id: string;
  invoice_number: string;
  bundle_credits: number;
  currency: string;
  bundle_price_usd: number;
  bundle_price_local: number;
  status: string;
  payment_method: string;
  created_at: string;
  talent_id: string;
  talent: { full_name: string };
}
export interface WithdrawalRequest {
  id: string;
  talent_id: string;
  amount_credits: number;
  method: string;
  status: string;
  payout_details: string;
  created_at: string;
  talent: { full_name: string; email: string };
}
export interface PayInfraConfig {
  id: string;
  provider: string;
  status: string;
  created_at: string;
}

/**
 * GroUp Academy: Finance Overview Data Graph Hook
 * Orchestrates cross-portal financial data streaming, wallet structural formatting, and mutation state invalidations.
 */
export function useFinOpsGraph() {
  const queryClient = useQueryClient();

  // Fetches master transactional cache metrics across candidates, corporate entities, and invoices
  const finOpsGraphQuery = useQuery({
    queryKey: ["finops_graph_master"],
    queryFn: async () => {
      const master = await getFinOpsGraphMaster();

      // Safe hydration fallback routines protect array iterations from null values
      const talentWallets = (master.talentWallets as unknown[]).map((w) => ({
        ...w,
        talent: w.talent || { full_name: "User Account", email: "" },
      }));
      const companyWallets = (master.companyWallets as unknown[]).map((w) => ({
        ...w,
        company: w.company || { name: "Company Workspace", type: "Standard" },
      }));
      const creditInvoices = (master.invoices as unknown[]).map((i) => ({
        ...i,
        talent: i.talent || { full_name: "User Account" },
      }));
      const withdrawalRequests = (master.withdrawals as unknown[]).map((wr) => ({
        ...wr,
        talent: wr.talent || { full_name: "User Account", email: "" },
      }));

      // Segments global enterprise account buckets based on platform workspace configurations
      const gro10xWallets = companyWallets.filter(
        (w: unknown) => w.company.type === "agent" || w.company.name.toLowerCase().includes("gro10x"),
      );
      const standardCompanyWallets = companyWallets.filter(
        (w: unknown) => w.company.type !== "agent" && !w.company.name.toLowerCase().includes("gro10x"),
      );

      return {
        talentWallets: talentWallets as TalentWallet[],
        companyWallets: standardCompanyWallets as CompanyWallet[],
        gro10xWallets: gro10xWallets as CompanyWallet[],
        invoices: creditInvoices as CreditInvoice[],
        withdrawals: withdrawalRequests as WithdrawalRequest[],
        payInfraConfigs: (master.payInfraConfigs ?? []) as PayInfraConfig[],
      };
    },
  });

  // Updates cash disbursement request lines and forces cash balance re-validation loops
  const updateWithdrawalStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "completed" | "rejected" | "failed"; notes?: string }) => {
      await repoUpdateWithdrawalStatus({ id, status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["finops_graph_master"] });
      toast.success(`Payout request status successfully updated to ${variables.status}.`);
    },
    onError: (e: Error) => {
      console.error("[Disbursement Error] Payout update failure:", e);
      toast.error(`Could not update payout request status: ${e.message}`);
    },
  });

  // Programmatically upserts provider channel credentials and updates global payment configurations
  const upsertPayInfra = useMutation({
    mutationFn: async (payload: unknown) => {
      await upsertPaymentConfig(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finops_graph_master"] });
      toast.success("Payment infrastructure configuration updated successfully.");
    },
    onError: (e: Error) => {
      console.error("[Infrastructure Error] Gateway upsert failure:", e);
      toast.error(`Could not update payment configuration parameters: ${e.message}`);
    },
  });

  return {
    finOpsGraphQuery,
    mutations: {
      updateWithdrawalStatus,
      upsertPayInfra,
    },
  };
}


