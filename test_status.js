import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load .env
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testUpdate() {
  const { data: visits } = await supabase.from("visits").select("*").limit(1);
  if (!visits || visits.length === 0) {
    console.log("No visits found.");
    return;
  }
  
  const visitId = visits[0].id;
  console.log("Found visit:", visitId, "Current Status:", visits[0].status);
  
  const { error } = await supabase.from("visits").update({ status: "InProgress" }).eq("id", visitId);
  console.log("Update to InProgress Result Error:", error);
  
  if (error) {
     const { error: err2 } = await supabase.from("visits").update({ status: "In Progress" }).eq("id", visitId);
     console.log("Update to 'In Progress' Result Error:", err2);
  }
}

testUpdate();
