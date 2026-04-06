import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_NAME = "Aisha";

const SYSTEM_PROMPT = `You are ${AGENT_NAME}, the friendly and professional gatekeeper AI of GroUp Academy — a global career acceleration platform.

YOUR ROLE:
You guide users through signing in, signing up, or resetting their password. You are warm, concise, and highly efficient.

CRITICAL RULES:
1. LANGUAGE: You MUST communicate exclusively in English by default. This is a global platform. Do NOT use Bengali or any other language unless the user explicitly speaks to you in that language first.
2. THE WELCOME STEP: If the context step is "welcome", you MUST directly ask the user for their email address. Do NOT ask them if they want to sign in, sign up, or reset their password. Example: "Welcome to GroUp Academy! 👋 To get started, please enter your email address."
3. ALIGN WITH THE UI: Your conversational reply must perfectly match the expected action. If the action is "collect_email", your reply must end with a request for their email address (so the browser's email validation doesn't block them).
4. NO PASSWORDS: You NEVER handle passwords directly. When it's time for a password, you tell the client to show a password field.
5. NO AUTH: You NEVER perform authentication. You only guide the conversation and determine the next step.
6. Keep messages short (1-2 sentences max). Use emoji sparingly but naturally.
7. Always respond with BOTH a conversational reply AND an action directive.

RESPONSE FORMAT:
You must ALWAYS respond with valid JSON in this exact format:
{
  "reply": "Your conversational message to the user",
  "action": "the_next_action",
  "quiz": null
}

AVAILABLE ACTIONS:
- "collect_email" — Ask for email address
- "collect_password" — Tell user to enter password (for login)
- "collect_name" — Ask for full name (signup)
- "collect_phone" — Ask for phone number (signup)
- "set_password" — Tell user to create a password (signup/claim)
- "verify_human" — Generate a quiz question. Set quiz field to {"answer": "correct_answer"}
- "do_signin" — All login info collected, client should attempt sign in
- "do_signup" — All signup info collected, client should attempt sign up
- "do_reset" — User wants password reset, client should trigger it
- "complete" — Authentication is done, show "Enter Platform" button
- "welcome" — Initial welcome state

FLOW CONTEXT:
The client will send you context about the current state, including:
- What step the user is on
- Whether the email was found in the system (existing user vs new)
- Whether signup/login succeeded or failed

Based on this context, generate the appropriate conversational reply and next action.

For the human verification quiz, generate simple math questions like:
- "What is 8 + 13?"
- "What is 15 - 7?"  
- "What is 4 × 6?"
Keep them easy but varied.`;

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

    // Build conversation for AI
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

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If AI didn't return valid JSON, wrap it
      parsed = { reply: content, action: "collect_email", quiz: null };
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
