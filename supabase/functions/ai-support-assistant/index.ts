import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * GroUp Academy: Vision-Enabled Support Sentinel
 * CTO Reference: Authoritative Edge Function for multimodal conversation analysis.
 * Logic: Decodes chat screenshots into structured institutional responses.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, context } = await req.json();
    if (!image) throw new Error("IMAGE_ARTIFACT_REQUIRED");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const systemPrompt = `You are the GroUp Academy Support Assistant. 
    Analyze the chat screenshot and map customer needs to our services:
    - AI Scorecard (50 credits)
    - AI Agents (1 credit/msg)
    - Study Abroad Roadmaps (100 credits)
    - Gigs Marketplace (Earn credits)
    
    Return JSON ONLY: { "reply": "string", "suggestions": [], "tone": "string", "actions": [] }`;

    // HUD: Prepare Multimodal Payload
    const imageData = image.startsWith("data:") ? image : `data:image/png;base64,${image}`;
    const userContent = [
      { type: "image_url", image_url: { url: imageData } },
      { type: "text", text: context ? `Context: ${context}` : "Analyze this conversation." },
    ];

    // ACTION: Initiate Multimodal Handshake
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.2, // Lower temperature for institutional consistency
      }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "GATEWAY_THROTTLED" }), { status: 429, headers: corsHeaders });
      throw new Error(`AI_GATEWAY_FAULT: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // PHASE: Atomic JSON Extraction
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: content };
    } catch {
      parsed = { reply: content, suggestions: [], tone: "Unknown", actions: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Sentinel] SUPPORT_SENTINEL_FAULT:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
