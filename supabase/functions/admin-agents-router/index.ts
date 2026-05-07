import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent_key, message, history = [] } = await req.json();

    if (!agent_key || !message) {
      throw new Error('Missing required parameters: agent_key and message are required.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || (roleData?.role !== 'admin' && roleData?.role !== 'talent_exec')) {
      throw new Error('Forbidden: Insufficient privileges to access the Agent OS');
    }

    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('system_prompt, name, model_preference')
      .eq('agent_key', agent_key)
      .single();

    if (agentError || !agentData) {
      throw new Error(`Agent configuration not found for key: ${agent_key}`);
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Server configuration error: LOVABLE_API_KEY missing');
    }

    const systemMessage = {
      role: 'system',
      content: agentData.system_prompt || `You are ${agentData.name}, an expert internal assistant for GroUp Academy. Keep answers concise, operational, and highly professional.`
    };

    const conversation = [systemMessage, ...history, { role: 'user', content: message }];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agentData.model_preference || 'google/gemini-2.5-flash',
        messages: conversation,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('AI Gateway Error:', errBody);
      throw new Error('Failed to generate response from AI Gateway');
    }

    const aiData = await response.json();
    const replyText = aiData.choices[0].message.content;

    await supabase.from('agent_chat_sessions').insert({
      user_id: user.id,
      agent_key: agent_key,
      prompt_tokens: aiData.usage?.prompt_tokens || 0,
      completion_tokens: aiData.usage?.completion_tokens || 0,
    });

    return new Response(
      JSON.stringify({ reply: replyText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Admin Agent Router Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
