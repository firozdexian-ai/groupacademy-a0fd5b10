import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function testQueries() {
  console.log("--- Querying talents ---");
  const { data, error, count } = await supabase
    .from('talents')
    .select('id, email, full_name, learner_status, onboarding_step', { count: 'exact' });
  
  console.log("Query result:", { success: !error, error, count, data });
}

testQueries().catch(console.error);
