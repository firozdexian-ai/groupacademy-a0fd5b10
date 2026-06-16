import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const firstEqIndex = trimmedLine.indexOf('=');
    if (firstEqIndex === -1) return;
    const key = trimmedLine.substring(0, firstEqIndex).trim();
    let val = trimmedLine.substring(firstEqIndex + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  });
} catch (e) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runBootstrapTest() {
  const testEmail = `test_bootstrap_${Math.floor(Math.random() * 1000000)}@example.com`;
  const testPassword = 'zP8!vL#9qX$mW2_@T';
  
  console.log(`1. Signing up test user: ${testEmail}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test Bootstrap Seeker'
      }
    }
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError);
    return;
  }

  const user = signUpData.user;
  console.log("Sign up successful. User ID:", user?.id);

  console.log("2. Querying talents table first...");
  const { data: initialTalent, error: initialError } = await supabase
    .from('talents')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  console.log("Initial talent query result:", { initialTalent, initialError });

  if (initialTalent) {
    console.log("Talent row already exists (probably created by trigger on auth signup)!");
    return;
  }

  console.log("3. Attempting to insert into talents table under user session...");
  const startTime = Date.now();
  const { data: talentData, error: talentError } = await supabase
    .from('talents')
    .insert({
      user_id: user.id,
      email: user.email,
      full_name: 'Test Bootstrap Seeker',
      learner_status: 'free_learner',
      onboarding_step: 4
    })
    .select()
    .single();

  const duration = Date.now() - startTime;
  console.log(`Insert completed in ${duration}ms`);
  
  if (talentError) {
    console.error("Insert failed:", talentError);
    if (talentError.code === '23505') {
      console.log("Duplicate key! Let's query talents table again to see if it exists now...");
      const { data: secondaryTalent, error: secondaryError } = await supabase
        .from('talents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      console.log("Secondary query result:", { secondaryTalent, secondaryError });
    }
  } else {
    console.log("Insert successful! Row data:", talentData);
  }
}

runBootstrapTest().catch(console.error);
