import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vfdglckuyzbnnntmdziy.supabase.co',
  'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz'
);

async function run() {
  console.log("Fetching resources...");
  const { data, error } = await supabase.from('resources').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
