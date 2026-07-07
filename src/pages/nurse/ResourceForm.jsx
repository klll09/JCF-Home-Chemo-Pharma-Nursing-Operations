import { useState, useEffect } from "react";
import {
  FileText, AlertTriangle, CheckCircle2,
  Download, RefreshCw, ExternalLink
} from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "../../superbase";

const RESOURCE_TYPES = ["Invoice", "Pharmacy List", "Prescription", "Summary Report"];

const CHECKLIST_FIELDS = [
  { key: "doctor_order_available", label: "Doctor order available" },
  { key: "identity_verified", label: "Patient identity verified" },
  { key: "allergy_checked", label: "Allergies checked" },
  { key: "vitals_checked", label: "Vitals checked" },
];

export default function ResourceForm() {
  const [visits, setVisits] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    visit_id: "",
    resource_type: "Summary Report",
    checklist: {
      doctor_order_available: false,
      identity_verified: false,
      allergy_checked: false,
      vitals_checked: false,
    },
    vitals: { bp: "", pulse: "", temp: "", spo2: "" },
    medicines_administered: "",
    visit_outcome: "Completed",
    adverse_event: false,
    next_visit_needed: "DoctorToDecide",
    notes: "",
  });

  async function fetchAll() {
    const [vis, res] = await Promise.all([
      supabase.from("visits")
        .select(`id, status, start_time, end_time,
          care_requests(service_type, scheduled_date, location,
            patients(id, name, patient_code, age, diagnosis, cancer_type, address)),
          nurses(name)`)
        .order("created_at", { ascending: false }),
      supabase.from("resources")
        .select(`id, resource_type, pdf_url, notes, created_at, visit_id`)
        .order("created_at", { ascending: false }),
    ]);
    setVisits(vis.data || []);
    console.log(vis.data);
    setResources(res.data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const selectedVisit = visits.find(v => v.id === form.visit_id);

  const handleChecklistToggle = (key) => {
    setForm(p => ({ ...p, checklist: { ...p.checklist, [key]: !p.checklist[key] } }));
  };

  const handleVitalsChange = (key, value) => {
    setForm(p => ({ ...p, vitals: { ...p.vitals, [key]: value } }));
  };

  const generatePDF = (visit, resourceType, formData) => {
    const doc = new jsPDF();
    const patient = visit.care_requests?.patients;
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(26, 82, 118);
    doc.text("JaruratCare", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(resourceType, 14, y);
    y += 4;
    doc.setDrawColor(220);
    doc.line(14, y, 196, y);
    y += 10;

    const addLine = (label, value) => {
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont(undefined, "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont(undefined, "normal");
      doc.text(String(value || "—"), 65, y);
      y += 7;
    };

    const addSectionTitle = (title) => {
      y += 3;
      doc.setFontSize(11);
      doc.setTextColor(26, 82, 118);
      doc.setFont(undefined, "bold");
      doc.text(title, 14, y);
      y += 6;
      doc.setDrawColor(230);
      doc.line(14, y - 3, 196, y - 3);
    };

    // Patient Info
    addSectionTitle("Patient Information");
    addLine("Name", patient?.name);
    addLine("Patient Code", patient?.patient_code);
    addLine("Age", patient?.age);
    addLine("Diagnosis", patient?.diagnosis);
    addLine("Cancer Type", patient?.cancer_type);
    addLine("Address", patient?.address);

    // Visit Info
    addSectionTitle("Visit Details");
    addLine("Service Type", visit.care_requests?.service_type);
    addLine("Location", visit.care_requests?.location);
    addLine("Visit Date", visit.care_requests?.scheduled_date ?
      new Date(visit.care_requests.scheduled_date).toLocaleDateString("en-IN") : "—");
    addLine("Attending Nurse", visit.nurses?.name);
    addLine("Status", visit.status);

    // Checklist
    addSectionTitle("Pre-Visit Checklist");
    CHECKLIST_FIELDS.forEach(({ key, label }) => {
      const checked = formData.checklist[key] ? "✓ Yes" : "✗ No";
      doc.setFontSize(10);
      doc.setTextColor(formData.checklist[key] ? 22 : 180, formData.checklist[key] ? 130 : 0, formData.checklist[key] ? 80 : 0);
      doc.setFont(undefined, "normal");
      doc.text(`${label}: ${checked}`, 14, y);
      y += 7;
    });
    doc.setTextColor(0);

    // Vitals
    addSectionTitle("Vitals");
    addLine("Blood Pressure", formData.vitals.bp);
    addLine("Pulse (bpm)", formData.vitals.pulse);
    addLine("Temperature (°C)", formData.vitals.temp);
    addLine("SpO2 (%)", formData.vitals.spo2);

    // Medicines
    if (formData.medicines_administered) {
      addSectionTitle("Medicines Administered");
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const splitMeds = doc.splitTextToSize(formData.medicines_administered, 180);
      doc.text(splitMeds, 14, y);
      y += splitMeds.length * 6 + 4;
    }

    // Outcome
    addSectionTitle("Visit Outcome");
    addLine("Outcome", formData.visit_outcome);
    addLine("Adverse Event", formData.adverse_event ? "Yes — escalation required" : "No");
    addLine("Next Visit Needed", formData.next_visit_needed);

    // Notes
    if (formData.notes) {
      addSectionTitle("Clinical Notes");
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const splitNotes = doc.splitTextToSize(formData.notes, 180);
      doc.text(splitNotes, 14, y);
      y += splitNotes.length * 6 + 4;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, 14, 285);

    return doc;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.visit_id) return setFormError("Please select a visit.");
    if (!selectedVisit) return setFormError("Visit not found.");

    setSubmitting(true);
    setFormError("");

    try {
      const doc = generatePDF(selectedVisit, form.resource_type, form);
      const patient = selectedVisit.care_requests?.patients;
      const fileName = `${form.resource_type.replace(/\s+/g, "_")}_${patient?.patient_code || "patient"}.pdf`;
      const filePath = `${Date.now()}_${fileName}`;

      // Upload PDF blob to Supabase Storage
      const pdfBlob = doc.output("blob");
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      // Generate a long-lived signed URL (10 years)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("reports")
        .createSignedUrl(filePath, 315360000);
      if (signedError) throw signedError;

      // Also download locally for nurse's own copy
      doc.save(fileName);

      // Save resource record with real URL
      const { error } = await supabase.from("resources").insert({
        patient_id: patient?.id,
        visit_id: form.visit_id,
        resource_type: form.resource_type,
        pdf_url: signedData.signedUrl,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;

      setSuccess(true);
      setForm({
        visit_id: "", resource_type: "Summary Report",
        checklist: { doctor_order_available: false, identity_verified: false, allergy_checked: false, vitals_checked: false },
        vitals: { bp: "", pulse: "", temp: "", spo2: "" },
        medicines_administered: "", visit_outcome: "Completed",
        adverse_event: false, next_visit_needed: "DoctorToDecide", notes: "",
      });
      setTimeout(() => setSuccess(false), 4000);
      await fetchAll();
    } catch (err) {
      setFormError("Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Resources & Reports</h1>
          <p className="text-xs text-gray-400">Generate visit summary PDFs for patients</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} />Refresh
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6 flex gap-5">

        {/* GENERATED RESOURCES LIST */}
        <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shrink-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Generated Resources</h2>
            <p className="text-xs text-gray-400">{resources.length} total</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={18} className="text-gray-300 animate-spin" />
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <FileText size={28} className="text-gray-200" />
                <p className="text-xs text-gray-400">No resources yet.</p>
              </div>
            ) : resources.map(r => (
              <div key={r.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start gap-2 mb-2">
                  <div className="p-1.5 bg-teal-50 rounded-md mt-0.5">
                    <FileText size={12} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {visits.find(v => v.id === r.visit_id)?.care_requests?.patients?.name || "—"}
                    </p>
                    <p className="text-[10px] text-gray-400">{r.resource_type}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <a href={r.pdf_url} target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1 text-[10px] font-semibold bg-teal-100 text-teal-700 px-2 py-1.5 rounded-md hover:bg-teal-200 transition">
                  <ExternalLink size={10} />Open PDF
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Generate New Resource</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill the form to create a visit summary PDF</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Select Visit <span className="text-red-400">*</span>
                  </label>
                  <select value={form.visit_id}
                    onChange={e => { setForm(p => ({ ...p, visit_id: e.target.value })); setFormError(""); }}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                    <option value="">Choose a visit</option>
                    {visits.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.care_requests?.patients?.name} — {v.care_requests?.patients?.patient_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Resource Type</label>
                  <select value={form.resource_type}
                    onChange={e => setForm(p => ({ ...p, resource_type: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                    {RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {selectedVisit && (
                <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-teal-700">{selectedVisit.care_requests?.patients?.name}</p>
                    <p className="text-[10px] text-teal-600">{selectedVisit.care_requests?.service_type} · {selectedVisit.care_requests?.patients?.diagnosis}</p>
                  </div>
                </div>
              )}

              {/* CHECKLIST */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Pre-Visit Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHECKLIST_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer">
                      <input type="checkbox" checked={form.checklist[key]}
                        onChange={() => handleChecklistToggle(key)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-400" />
                      <span className="text-xs text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* VITALS */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Vitals</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "bp", label: "BP", placeholder: "120/80" },
                    { key: "pulse", label: "Pulse", placeholder: "72" },
                    { key: "temp", label: "Temp °C", placeholder: "37.2" },
                    { key: "spo2", label: "SpO2 %", placeholder: "98" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">{label}</label>
                      <input type="text" value={form.vitals[key]}
                        onChange={e => handleVitalsChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                    </div>
                  ))}
                </div>
              </div>

              {/* MEDICINES */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Medicines Administered</label>
                <textarea value={form.medicines_administered}
                  onChange={e => setForm(p => ({ ...p, medicines_administered: e.target.value }))}
                  placeholder="e.g. Carboplatin 450mg IV, Ondansetron 8mg IV"
                  rows={2}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 resize-none" />
              </div>

              {/* OUTCOME */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Visit Outcome</label>
                  <select value={form.visit_outcome}
                    onChange={e => setForm(p => ({ ...p, visit_outcome: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                    {["Completed", "Partial", "Cancelled", "Escalated"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Visit Needed</label>
                  <select value={form.next_visit_needed}
                    onChange={e => setForm(p => ({ ...p, next_visit_needed: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                    {["Yes", "No", "DoctorToDecide"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.adverse_event}
                  onChange={e => setForm(p => ({ ...p, adverse_event: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
                <span className="text-xs font-semibold text-red-600">Adverse Event Occurred</span>
              </label>

              {/* NOTES */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Clinical Notes</label>
                <textarea value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional observations or instructions..."
                  rows={3}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 resize-none" />
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 font-medium">
                    PDF uploaded and saved! Doctors and admins can now view it.
                  </p>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-3 rounded-lg transition-all disabled:opacity-60">
                <Download size={14} />
                {submitting ? "Generating..." : "Generate PDF Report"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}