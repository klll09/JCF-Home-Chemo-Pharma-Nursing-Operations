const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";
const PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID"; // replace with real one
const ACCESS_TOKEN = "YOUR_ACCESS_TOKEN"; // replace with real one

export async function sendWhatsAppMessage(toPhone, patientName, serviceType, date, pdfUrl) {
  const formattedPhone = toPhone.replace(/\D/g, "").replace(/^0/, "91");

  if (PHONE_NUMBER_ID === "YOUR_PHONE_NUMBER_ID" || ACCESS_TOKEN === "YOUR_ACCESS_TOKEN") {
    console.warn("WhatsApp credentials not set — using mock mode");
    return { ok: true, data: { mock: true } };
  }

  const body = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "template",
    template: {
      name: "visit_summary",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: patientName },
            { type: "text", text: serviceType },
            { type: "text", text: date },
            { type: "text", text: pdfUrl || "Not available" },
          ],
        },
      ],
    },
  };

  const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

export async function sendWhatsAppText(toPhone, message) {
  const formattedPhone = toPhone.replace(/\D/g, "").replace(/^0/, "91");

  // Check if credentials are still dummy
  if (PHONE_NUMBER_ID === "YOUR_PHONE_NUMBER_ID" || ACCESS_TOKEN === "YOUR_ACCESS_TOKEN") {
    console.warn("WhatsApp credentials not set — using mock mode");
    return { ok: true, data: { mock: true } }; // mock success for testing
  }

  const body = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "text",
    text: { body: message },
  };

  const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  console.log("WhatsApp API response:", data);
  return { ok: response.ok, data };
}