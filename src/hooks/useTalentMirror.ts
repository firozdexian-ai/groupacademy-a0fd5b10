import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TalentMirrorCourse {
  content_id: string;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  modules: number;
  topics: number;
  avg_mastery: number;
  due_now: number;
  weakest: { topic_tag: string; module_title: string | null; mastery: number }[];
}
export interface TalentMirrorTopic {
  topic_tag: string; module_title: string | null; course_title: string | null;
  content_id: string; mastery: number;
}
export interface TalentMirror {
  talent_id: string;
  summary: { courses: number; modules: number; topics: number; avg_mastery: number | null; due_now: number };
  signal_split: { quiz: number; scenario: number };
  courses: TalentMirrorCourse[];
  weakest_topics: TalentMirrorTopic[];
  strongest_topics: TalentMirrorTopic[];
}

export function useTalentMirror() {
  const [data, setData] = useState<TalentMirror | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("learner-talent-mirror", { body: {} });
      if (error) throw error;
      setData(data as TalentMirror);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load talent mirror");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
