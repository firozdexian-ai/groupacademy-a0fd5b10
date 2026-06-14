import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMarketingGraphMaster,
  upsertGraphRow,
  deleteGraphRow,
} from "@/domains/marketing/repo/marketingRepo";

export interface MktChannel { id: string; name: string; type: string; notes?: string; created_at: string; }
export interface CommunityGroup { id: string; name: string; platform: string; member_count: number; link?: string; created_at: string; }
export interface TalentOutreach { id: string; talent_id: string; channel: string; campaign_name?: string; sent_at: string; }
export interface CompanyOutreach { id: string; company_id: string; contact_id?: string; channel: string; sent_at: string; }
export interface Banner { id: string; placement: string; media_url: string; link_url?: string; is_active: boolean; created_at: string; }
export interface ProfileTheme { id: string; name: string; priority: number; media_type: string; gradient_css: string; media_url?: string; poster_url?: string; overlay_opacity: number; text_color: string; start_at?: string; end_at?: string; is_active: boolean; created_at: string; }
export interface AccessCode { id: string; code: string; content_id?: string; max_uses: number; current_uses: number; expires_at?: string; content?: { title: string }; }

export function useMarketingGraph() {
  const queryClient = useQueryClient();

  const marketingGraphQuery = useQuery({
    queryKey: ["marketing_graph_master"],
    queryFn: async () => {
      const master = await getMarketingGraphMaster();
      const banners: Banner[] = (master.banners ?? []).map((b: unknown) => ({
        id: b.id, placement: b.placement, media_url: b.image_url, link_url: b.link_url,
        is_active: !!b.is_active, created_at: b.created_at,
      }));
      return {
        channels: master.channels as unknown as MktChannel[],
        communityGroups: master.communityGroups as unknown as CommunityGroup[],
        talentOutreach: master.talentOutreach as unknown as TalentOutreach[],
        companyOutreach: master.companyOutreach as unknown as CompanyOutreach[],
        banners,
        themes: master.themes as unknown as ProfileTheme[],
        accessCodes: master.accessCodes as unknown as AccessCode[],
      };
    },
  });

  const useCreateUpsertMutation = (table: string, entityName: string) =>
    useMutation({
      mutationFn: (payload: unknown) => upsertGraphRow(table, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["marketing_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });

  const useCreateDeleteMutation = (table: string, entityName: string) =>
    useMutation({
      mutationFn: (id: string) => deleteGraphRow(table, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["marketing_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });

  return {
    marketingGraphQuery,
    mutations: {
      upsertChannel: useCreateUpsertMutation("mkt_channels", "Marketing Channel"),
      deleteChannel: useCreateDeleteMutation("mkt_channels", "Marketing Channel"),
      upsertGroup: useCreateUpsertMutation("mkt_community_groups", "Community Group"),
      deleteGroup: useCreateDeleteMutation("mkt_community_groups", "Community Group"),
      upsertBanner: useCreateUpsertMutation("banners", "Display Banner"),
      deleteBanner: useCreateDeleteMutation("banners", "Display Banner"),
      upsertTheme: useCreateUpsertMutation("profile_card_themes", "Profile Theme"),
      deleteTheme: useCreateDeleteMutation("profile_card_themes", "Profile Theme"),
      upsertAccessCode: useCreateUpsertMutation("access_codes", "Access Code"),
      deleteAccessCode: useCreateDeleteMutation("access_codes", "Access Code"),
    },
  };
}


