import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vfdglckuyzbnnntmdziy.supabase.co',
  'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz'
);

async function run() {
  console.log("Checking if resources insert times out...");
  
  // Try to insert a dummy record to see if it times out
  const start = Date.now();
  const { error } = await supabase.from('resources').insert({
    patient_id: "00000000-0000-0000-0000-000000000000",
    visit_id: "00000000-0000-0000-0000-000000000000",
    resource_type: "Test",
    pdf_url: "http://test.com"
  });
  
  const duration = Date.now() - start;
  console.log(`Insert completed in ${duration}ms`);
  console.log("Error:", error);
}

run();
