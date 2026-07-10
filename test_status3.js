import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vfdglckuyzbnnntmdziy.supabase.co',
  'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz'
);

async function run() {
  const { data: visits } = await supabase.from('visits').select('*').limit(3);
  if (visits.length > 0) {
      console.log("Attempting to update status to OTPVerified...");
      const { error } = await supabase.from('visits').update({ status: 'OTPVerified' }).eq('id', visits[0].id);
      console.log("Error for OTPVerified:", error);
  }
}

run();
