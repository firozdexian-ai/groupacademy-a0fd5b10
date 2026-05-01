import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

/**
 * generate-application-answers
 * Drafts tailored answers to job-application questions using the talent's
 * profile and (optional) job context, via Lovable AI Gateway.
 */

interface Body {
  questions: string;
  jobContext?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.questions || body.questions.trim().length < 10) {
      return new Response(JSON.stringify({ error: "questions required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load talent profile
    const { data: talent } = await supabase
      .from("talents")
      .select("full_name, custom_profession, country, experience, education, skills, cv_text")
      .eq("user_id", user.id)
      .maybeSingle();

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI Gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileSummary = JSON.stringify({
      name: talent?.full_name,
      profession: talent?.custom_profession,
      country: talent?.country,
      experience: talent?.experience,
      education: talent?.education,
      skills: talent?.skills,
      cv_excerpt: talent?.cv_text?.slice(0, 2500),
    });

    const systemPrompt = `You are a career coach drafting application answers.
Use ONLY facts from the candidate's profile. If a fact is not in the profile, write a generic but professional answer.
Keep answers 80-180 words, first person, specific, and free of clichés.
Return STRICT JSON: {"answers":[{"question":"...","answer":"..."}]}`;

    const userPrompt = `Candidate profile:\n${profileSummary}\n\nJob context: ${body.jobContext || "(none)"}\n\nQuestions (one per line):\n${body.questions}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || "{}";
    let parsed: { answers?: { question: string; answer: string }[] } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    return new Response(JSON.stringify({ answers: parsed.answers || [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-application-answers error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
