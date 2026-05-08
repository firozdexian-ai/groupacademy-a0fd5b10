import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

export interface TalentPitch {
  id: string;
  company_id: string;
  message: string;
  phone: string | null;
  dispatched: boolean;
  created_at: string;
  company_name: string | null;
  company_logo: string | null;
}

export function useTalentPitches(limit = 20) {
  const { talent } = useTalent();
  const talentId = talent?.id;
  const [pitches, setPitches] = useState<TalentPitch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!talentId) {
      setPitches([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("agent_pitch_log")
      .select("id, company_id, message, phone, dispatched, created_at, companies(name, logo_url)")
      .eq("talent_id", talentId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[Pitches] fetch error", error);
      setPitches([]);
    } else {
      setPitches(
        (data || []).map((r: any) => ({
          id: r.id,
          company_id: r.company_id,
          message: r.message,
          phone: r.phone,
          dispatched: r.dispatched,
          created_at: r.created_at,
          company_name: r.companies?.name ?? null,
          company_logo: r.companies?.logo_url ?? null,
        })),
      );
    }
    setIsLoading(false);
  }, [talentId, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!talentId) return;
    const ch = supabase
      .channel(`talent-pitches-${talentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_pitch_log", filter: `talent_id=eq.${talentId}` },
        () => fetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [talentId, fetch]);

  return { pitches, isLoading, refresh: fetch };
}
