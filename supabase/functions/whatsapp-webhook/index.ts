// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const META_API_URL = Deno.env.get("META_API_URL") || "https://graph.facebook.com/v19.0"
const PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID")
const ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN")

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Received webhook payload:", payload)
    
    if (!payload.record) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    const { table, record, old_record } = payload
    let phone_number = null
    let template_name = null
    let components = []

    // 1. SCENARIO: Delivery Status Update
    if (table === "medicine_requisitions") {
      if (old_record && old_record.status === record.status) {
        return new Response(JSON.stringify({ message: "Status unchanged, ignoring." }), { status: 200 })
      }
      
      // Fallback to the developer test number if patient phone is not properly joined
      phone_number = record.patient_phone || "+918141657999" // Fallback to test number
      
      if (record.status === "OutForDelivery") {
        template_name = "delivery_out_for_delivery"
        components = [{ type: "body", parameters: [{ type: "text", text: "Patient" }] }]
      } else if (record.status === "Delivered") {
        template_name = "delivery_completed"
      }
    }

    // 2. SCENARIO: Visit Completed (PDF Generated)
    if (table === "resources" && record.resource_type === "Summary Report") {
      
      // Initialize Supabase client to fetch the patient's phone number
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://vfdglckuyzbnnntmdziy.supabase.co"
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz" // using public key as fallback just for test
      
      try {
          const supabase = createClient(supabaseUrl, supabaseKey)
          const { data } = await supabase.from('patients').select('phone, secondary_phone').eq('id', record.patient_id).single()
          if (data && data.phone) {
             phone_number = data.phone
          }
      } catch (e) {
          console.error("Could not fetch phone:", e)
      }
      
      // Fallback for Developer Mode (Meta blocks unverified numbers anyway, so force it to a verified test number if it fails)
      // We'll just strip spaces and +, or fallback to your verified test number
      if (!phone_number) phone_number = "+918141657999" // Fallback to your test number
      phone_number = phone_number.replace(/[^0-9]/g, '') // Format for WhatsApp (e.g., 918019065612)

      template_name = "visit_report_generated"
      components = [
        { type: "body", parameters: [{ type: "text", text: record.pdf_url }] }
      ]
    }

    if (!template_name || !phone_number) {
      return new Response(JSON.stringify({ message: "No template mapped for this event." }), { status: 200 })
    }

    console.log(`Sending to ${phone_number} using template ${template_name}`);

    // Call Meta API
    const res = await fetch(`${META_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone_number,
        type: "template",
        template: {
          name: template_name,
          language: { code: "en_US" },
          components: components
        }
      })
    })

    const data = await res.json()
    console.log("Meta API Response:", data)

    return new Response(JSON.stringify({ success: true, meta_response: data }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
