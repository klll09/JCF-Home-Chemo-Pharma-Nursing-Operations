import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vfdglckuyzbnnntmdziy.supabase.co',
  'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz'
);

async function run() {
  console.log("Fetching visits...");
  const { data: visits } = await supabase.from('visits').select('*').limit(3);
  console.log("Found visits:", visits.map(v => ({ id: v.id, status: v.status })));
  
  if (visits.length > 0) {
      console.log("Attempting to update status to InProgress...");
      const { error } = await supabase.from('visits').update({ status: 'InProgress' }).eq('id', visits[0].id);
      console.log("Error for InProgress:", error);
      
      console.log("Attempting to update status to In Progress...");
      const { error: error2 } = await supabase.from('visits').update({ status: 'In Progress' }).eq('id', visits[0].id);
      console.log("Error for In Progress:", error2);
  }
}

run();
