// Adaptive sampler: picks quiz items from module_quiz_pool weighted by
// learner weakness (low-mastery topics) and a difficulty mix derived from
// the learner's average module mastery.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PoolItem {
  id: string;
  question: string;
  options: unknown;
  correct_index: number;
  explanation: string | null;
  difficulty: string | null;
  topic_tags: string[] | null;
}

type Difficulty = "easy" | "medium" | "hard";

function difficultyMix(avgMastery: number): Record<Difficulty, number> {
  // Map avg mastery → target proportions
  if (avgMastery < 0.4) return { easy: 0.6, medium: 0.3, hard: 0.1 };
  if (avgMastery < 0.7) return { easy: 0.3, medium: 0.5, hard: 0.2 };
  return { easy: 0.1, medium: 0.4, hard: 0.5 };
}

function bucketCounts(total: number, mix: Record<Difficulty, number>) {
  const easy = Math.round(total * mix.easy);
  const hard = Math.round(total * mix.hard);
  const medium = Math.max(0, total - easy - hard);
  return { easy, medium, hard };
}

function scoreItem(
  item: PoolItem,
  masteryByTopic: Map<string, number>,
): number {
  const tags = item.topic_tags ?? [];
  if (tags.length === 0) return 0.5; // neutral
  // Lower avg mastery → higher score (prioritize weak topics).
  let sum = 0;
  let count = 0;
  for (const t of tags) {
    const m = masteryByTopic.get(t);
    if (m !== undefined) {
      sum += m;
      count += 1;
    } else {
      sum += 0.5; // unknown topic → neutral
      count += 1;
    }
  }
  const avg = count > 0 ? sum / count : 0.5;
  // Add small jitter so equal scores don't always pick the same items.
  return (1 - avg) + Math.random() * 0.05;
}

function pickWeighted(items: PoolItem[], n: number): PoolItem[] {
  const sorted = [...items].sort(
    (a, b) =>
      (b as PoolItem & { _score: number })._score -
      (a as PoolItem & { _score: number })._score,
  );
  return sorted.slice(0, n);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const moduleId: string | undefined = body.module_id;
    const requestedCount: number = Math.min(
      Math.max(Number(body.count ?? 10), 1),
      30,
    );

    if (!moduleId || typeof moduleId !== "string") {
      return new Response(
        JSON.stringify({ error: "module_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1. Pull pool items for the module
    const { data: pool, error: poolErr } = await supabase
      .from("module_quiz_pool")
      .select(
        "id, question, options, correct_index, explanation, difficulty, topic_tags",
      )
      .eq("module_id", moduleId);

    if (poolErr) {
      return new Response(
        JSON.stringify({ error: poolErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const items = (pool ?? []) as PoolItem[];
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ items: [], avg_mastery: 0.5, mix: difficultyMix(0.5) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Pull learner mastery for this module
    const { data: skills } = await supabase
      .from("talent_skill_profile")
      .select("topic_tag, mastery")
      .eq("talent_id", user.id)
      .eq("module_id", moduleId);

    const masteryByTopic = new Map<string, number>();
    for (const s of skills ?? []) {
      masteryByTopic.set(s.topic_tag as string, Number(s.mastery));
    }

    const avgMastery = masteryByTopic.size
      ? [...masteryByTopic.values()].reduce((a, b) => a + b, 0) /
        masteryByTopic.size
      : 0.5;

    // 3. Determine difficulty bucket counts
    const mix = difficultyMix(avgMastery);
    const counts = bucketCounts(requestedCount, mix);

    // 4. Score each item by weakness, then pick per bucket
    const scored = items.map((it) => ({
      ...it,
      _score: scoreItem(it, masteryByTopic),
    })) as Array<PoolItem & { _score: number }>;

    const buckets: Record<Difficulty, Array<PoolItem & { _score: number }>> = {
      easy: scored.filter((i) => (i.difficulty ?? "medium") === "easy"),
      medium: scored.filter((i) => (i.difficulty ?? "medium") === "medium"),
      hard: scored.filter((i) => (i.difficulty ?? "medium") === "hard"),
    };

    const picked: Array<PoolItem & { _score: number }> = [];
    const order: Difficulty[] = ["hard", "medium", "easy"];
    for (const diff of order) {
      const want = counts[diff];
      if (want <= 0) continue;
      picked.push(...pickWeighted(buckets[diff], want));
    }

    // Backfill from leftovers if buckets were short
    if (picked.length < requestedCount) {
      const usedIds = new Set(picked.map((p) => p.id));
      const leftovers = scored
        .filter((i) => !usedIds.has(i.id))
        .sort((a, b) => b._score - a._score);
      picked.push(...leftovers.slice(0, requestedCount - picked.length));
    }

    // Strip internal score before returning
    const result = picked.slice(0, requestedCount).map(
      ({ _score: _s, ...rest }) => rest,
    );

    return new Response(
      JSON.stringify({
        items: result,
        avg_mastery: Number(avgMastery.toFixed(2)),
        mix,
        counts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
