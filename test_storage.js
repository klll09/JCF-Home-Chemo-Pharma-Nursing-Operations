import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vfdglckuyzbnnntmdziy.supabase.co',
  'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz'
);

async function run() {
  console.log("Checking storage buckets...");
  const { data, error } = await supabase.storage.listBuckets();
  console.log("Buckets:", data?.map(b => b.name));
  console.log("Error:", error);
}

run();
