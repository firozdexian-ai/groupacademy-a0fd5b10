import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_NAME = "Aisha";

// Hardcoded deterministic quizzes to guarantee they always appear
const QUIZZES = [
  { q: "What is the opposite of hot?", a: "cold" },
  { q: "Which common pet animal meows?", a: "cat" },
  { q: "What color is a clear daytime sky?", a: "blue" },
  { q: "If you freeze water, what does it become?", a: "ice" },
  { q: "What is the opposite of up?", a: "down" },
  { q: "What is 10 plus 5? (Type the number)", a: "15" },
];

const SYSTEM_PROMPT = `You are ${AGENT_NAME}, the gatekeeper AI of GroUp Academy.

ABSOLUTE RULES:
1. ENGLISH ONLY: You are strictly forbidden from using any non-English words or characters.
2. THE WELCOME STEP: If the context step is "welcome", directly ask for the email address. Do not ask what they want to do.
3. FOR HUMAN VERIFICATION: If the action is "verify_human", ONLY say something like "Let's do a quick human check!" or "That wasn't right, let's try another check." DO NOT generate the actual question yourself. The system will add it automatically. 
4. NO PASSWORDS: You NEVER handle passwords directly.

RESPONSE FORMAT:
You must ALWAYS respond with valid JSON in this exact format:
{
  "reply": "Your conversational message to the user",
  "action": "the_next_action",
  "quiz": null
}

AVAILABLE ACTIONS:
- "collect_email"
- "collect_password"
- "collect_name"
- "collect_phone"
- "set_password"
- "verify_human"
- "do_signin"
- "do_signup"
- "do_reset"
- "complete"
- "welcome"

FLOW CONTEXT:
The client will send you context about the current state, including:
- What step the user is on
- Whether the email was found in the system (existing user vs new)
- Whether signup/login succeeded or failed

Based on this context, generate the appropriate conversational reply and next action.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, messages } = await req.json();

    if (!context) {
      return new Response(JSON.stringify({ error: "context is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(messages || []),
      { role: "user", content: `CONTEXT: ${JSON.stringify(context)}\n\nGenerate your response as JSON.` },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        response_format: { type: "json_object" },
        temperature: 0.1, // Highly deterministic
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { reply: content, action: "collect_email", quiz: null };
    }

    // CTO OVERRIDE: Deterministically inject the quiz if the action is verify_human
    if (parsed.action === "verify_human") {
      const randomQuiz = QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
      parsed.quiz = { answer: randomQuiz.a };
      parsed.reply = `${parsed.reply}\n\nQuestion: ${randomQuiz.q}`;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Auth Agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
