import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vfdglckuyzbnnntmdziy.supabase.co',
  'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz'
);

async function run() {
  console.log("Fetching users and nurses...");
  const { data: users } = await supabase.from('users').select('id, name, email, auth_id');
  const { data: nurses } = await supabase.from('nurses').select('id, name, user_id');

  console.log("\n--- USERS ---");
  users.forEach(u => console.log(`- ${u.name} (ID: ${u.id}) (AuthID: ${u.auth_id})`));

  console.log("\n--- NURSES ---");
  nurses.forEach(n => console.log(`- ${n.name} (user_id: ${n.user_id})`));

  // The user said the AuthID is: 66d1c9cc-8053-409b-80fc-152b5bc46692
  const loggedInUser = users.find(u => u.auth_id === '66d1c9cc-8053-409b-80fc-152b5bc46692');
  console.log("\nLogged in user found:", loggedInUser);

  if (loggedInUser) {
    // Find the Bandra nurse (or any unlinked nurse that might match)
    const brokenNurse = nurses.find(n => !n.user_id && n.name.toLowerCase().includes('bandra'));
    if (brokenNurse) {
      console.log(`\nLinking nurse '${brokenNurse.name}' to user '${loggedInUser.name}'...`);
      const { error } = await supabase.from('nurses').update({ user_id: loggedInUser.id }).eq('id', brokenNurse.id);
      if (error) {
        console.error("Failed to link:", error);
      } else {
        console.log("Successfully linked!");
      }
    } else {
        // Just link to ANY unlinked nurse for debug purposes if there's only one
        const unlinked = nurses.filter(n => !n.user_id);
        if (unlinked.length === 1) {
            console.log(`\nLinking nurse '${unlinked[0].name}' to user '${loggedInUser.name}'...`);
            await supabase.from('nurses').update({ user_id: loggedInUser.id }).eq('id', unlinked[0].id);
            console.log("Successfully linked!");
        } else {
            console.log("Could not auto-determine which nurse to link. Unlinked nurses:", unlinked);
        }
    }
  }
}

run();
