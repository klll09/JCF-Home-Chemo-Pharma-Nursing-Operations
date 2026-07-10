import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vfdglckuyzbnnntmdziy.supabase.co',
  'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz'
);

async function run() {
  console.log("Attempting to insert resource...");
  const { error } = await supabase.from("resources").insert({
    patient_id: "10714ed2-7b78-43d9-ab70-13f62dae3c04",
    visit_id: "15b6d08b-1b38-428e-a1d0-ab016beb5aa4",
    resource_type: "Summary Report",
    pdf_url: "https://example.com/test.pdf",
  });
  console.log("Error:", error);
}

run();
