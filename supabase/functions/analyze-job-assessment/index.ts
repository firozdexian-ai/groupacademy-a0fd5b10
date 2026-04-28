import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * GroUp Academy: Neural Talent Analyzer
 * CTO Reference: Authoritative Edge Function for bimodal candidate evaluation.
 * Logic: Implements signed-url transcription and weighted AI synthesis.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentId } = await req.json();
    if (!assessmentId) throw new Error("ASSESSMENT_ID_REQUIRED");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // PHASE 1: Data Ingress & Identity Resolution
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from("job_assessments")
      .select(`*, jobs (title, requirements), talents (user_id, full_name, email)`)
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) throw new Error("REGISTRY_NOT_FOUND");

    const questions = (assessment.questions as any) || {};
    const mcqQuestions = questions.mcq_questions || [];
    const voiceQuestions = questions.voice_questions || [];
    const answers = (assessment.answers as any) || {};
    const mcqAnswers = answers.mcq || answers;

    // PHASE 2: Deterministic MCQ Audit
    let mcqCorrect = 0;
    const mcqResults = mcqQuestions.map((q: any, i: number) => {
      const userAnswer = mcqAnswers[q.id] ?? mcqAnswers[String(i)];
      const isCorrect = String(userAnswer) === String(q.correct_index);
      if (isCorrect) mcqCorrect++;
      return { questionId: q.id, isCorrect, userAnswer, correctAnswer: q.correct_index };
    });
    const mcqScore = mcqQuestions.length > 0 ? Math.round((mcqCorrect / mcqQuestions.length) * 100) : 0;

    // PHASE 3: Voice Ingress & Transcription
    let voiceScore = 0;
    const voiceAnalysis = [];

    if (voiceQuestions.length > 0) {
      const transcribedResponses = await Promise.all(
        voiceQuestions.map(async (vq: any) => {
          const ans = answers[vq.id];
          let transcript = "[No response artifact found]";

          if (ans?.storagePath) {
            // HUD: Generate short-lived signed URL for Whisper
            const { data: urlData } = await supabaseAdmin.storage
              .from("assessment-audio")
              .createSignedUrl(ans.storagePath, 60);

            if (urlData?.signedUrl) {
              try {
                const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
                  body: JSON.stringify({ file: urlData.signedUrl, model: "whisper-1" }),
                });
                const whisperData = await whisperRes.json();
                transcript = whisperData.text || transcript;
              } catch (e) {
                console.error("TRANSCRIPTION_FAULT:", ans.storagePath);
              }
            }
          }
          return { question: vq.question, expected: vq.expected_points, answer: transcript };
        }),
      );

      // PHASE 4: Qualitative AI Synthesis
      const evaluationPrompt = `
        Role: ${assessment.jobs?.title}
        Requirements: ${JSON.stringify(assessment.jobs?.requirements)}
        Candidate Responses: ${JSON.stringify(transcribedResponses)}
        Analyze depth, technical accuracy, and professional communication.
        Return JSON ONLY: { "score": number, "feedback": "string", "details": [] }
      `;

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash",
            messages: [{ role: "user", content: evaluationPrompt }],
          }),
        });
        const aiData = await aiRes.json();
        const cleanContent = aiData.choices[0].message.content.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanContent);
        voiceScore = parsed.score || 50;
        voiceAnalysis.push(parsed);
      } catch (err) {
        voiceScore = 50;
      }
    }

    // PHASE 5: Monotonic Final Synthesis
    const weight = voiceQuestions.length > 0 ? 0.5 : 1.0;
    const overallScore = Math.round(mcqScore * weight + voiceScore * (1 - weight));

    const finalResult = {
      overallScore,
      mcq: { score: mcqScore, results: mcqResults },
      voice: voiceQuestions.length > 0 ? { score: voiceScore, analysis: voiceAnalysis } : null,
      recommendation: overallScore >= 75 ? "Strong Hire" : overallScore >= 50 ? "Consider" : "Pass",
    };

    // HUD: Update institutional assessment ledger
    await supabaseAdmin
      .from("job_assessments")
      .update({
        ai_score: overallScore,
        ai_analysis: finalResult,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", assessmentId);

    return new Response(JSON.stringify({ success: true, score: overallScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Sentinel] FATAL_ANALYZER_ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
