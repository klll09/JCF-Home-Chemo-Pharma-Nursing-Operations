import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ClipboardList, PlusCircle, AlertTriangle, CheckCircle2,
  ChevronRight, Calendar, Clock, MapPin, Stethoscope, RefreshCw
} from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  DoctorApproved: "bg-blue-100 text-blue-700",
  Scheduled: "bg-teal-100 text-teal-700",
  Completed: "bg-green-100 text-green-700",
};

const SERVICE_TYPES = [
  "Home chemo", "12hr care", "24hr care", "Injection", "Dressing", "Palliative"
];

const DURATIONS = ["2hr", "12hr", "24hr", "Custom"];

export default function CareRequests() {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    service_type: "Home chemo",
    scheduled_date: "",
    duration: "2hr",
    location: "",
    required_nurse_skill: "",
    medicine_required: false,
    required_medicines: "",
    notes: "",
  });

  async function fetchAll() {
    const [reqs, pats, docs] = await Promise.all([
      supabase.from("care_requests")
        .select(`id, service_type, scheduled_date, duration, location, status, medicine_required, created_at,
          patients(name, patient_code),
          doctors(name)`)
        .order("created_at", { ascending: false }),
      supabase.from("patients").select("id, name, patient_code, primary_doctor_id"),
      supabase.from("doctors").select("id, name, specialization"),
    ]);
    setRequests(reqs.data || []);
    setPatients(pats.data || []);
    setDoctors(docs.data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  // Auto-fill doctor when patient is selected
  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    const patient = patients.find(p => p.id === patientId);
    setForm(prev => ({
      ...prev,
      patient_id: patientId,
      doctor_id: patient?.primary_doctor_id || "",
    }));
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) return setFormError("Please select a patient.");
    if (!form.doctor_id) return setFormError("Please select a doctor.");
    if (!form.scheduled_date) return setFormError("Please set a scheduled date.");
    if (!form.location.trim()) return setFormError("Location is required.");

    setSubmitting(true);
    const { error } = await supabase.from("care_requests").insert({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      service_type: form.service_type,
      scheduled_date: form.scheduled_date,
      duration: form.duration,
      location: form.location.trim(),
      required_nurse_skill: form.required_nurse_skill.trim() || null,
      medicine_required: form.medicine_required,
      required_medicines: form.required_medicines,
      status: "Draft",
      created_by: null,
    });
    setSubmitting(false);

    if (error) return setFormError("Failed to save: " + error.message);

    setForm({
      patient_id: "", doctor_id: "", service_type: "Home chemo",
      scheduled_date: "", duration: "2hr", location: "",
      required_nurse_skill: "", medicine_required: false, notes: "",
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    await fetchAll();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Care Requests</h1>
            <p className="text-xs text-gray-400">Create and manage patient care sessions</p>
          </div>
          <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={12} />Refresh
          </button>
        </header>

        <div className="flex-1 flex gap-5 p-6 overflow-hidden">

          {/* REQUESTS LIST */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">All Care Requests</h2>
                <p className="text-xs text-gray-400">{requests.length} total requests</p>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              {["Patient", "Service", "Doctor", "Date", "Status", ""].map((h, i) => (
                <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider
                  ${i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-1"}`}>
                  {h}
                </span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw size={18} className="text-gray-300 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <ClipboardList size={32} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No care requests yet.</p>
                </div>
              ) : requests.map((r, idx) => (
                <div key={r.id}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  className={`grid grid-cols-12 px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                    selected?.id === r.id ? "bg-teal-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
                  }`}>
                  <div className="col-span-3 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-800">{r.patients?.name || "—"}</p>
                    <p className="text-[10px] text-teal-600 font-mono">{r.patients?.patient_code || "—"}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-xs text-gray-600">{r.service_type}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-xs text-gray-600 truncate">{r.doctors?.name || "—"}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <Calendar size={11} className="text-gray-400" />
                    <p className="text-xs text-gray-600">
                      {new Date(r.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${STATUS_COLORS[r.status] || STATUS_COLORS.Draft}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <ChevronRight size={13} className={`text-gray-300 transition-transform ${selected?.id === r.id ? "rotate-90 text-teal-500" : ""}`} />
                  </div>

                  {selected?.id === r.id && (
                    <div className="col-span-12 mt-2 pt-3 border-t border-teal-100">
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: "Duration", value: r.duration, icon: Clock },
                          { label: "Location", value: r.location, icon: MapPin },
                          { label: "Medicine Required", value: r.medicine_required ? "Yes" : "No", icon: null },
                          { label: "Created", value: new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), icon: Calendar },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="bg-white rounded-lg border border-teal-100 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{label}</p>
                            <p className="text-xs text-gray-700">{value || "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FORM */}
          <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">New Care Request</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create a new session for a patient</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

                {/* Patient */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Patient <span className="text-red-400">*</span>
                  </label>
                  <select name="patient_id" value={form.patient_id} onChange={handlePatientChange}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                    <option value="">Select patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.patient_code}</option>
                    ))}
                  </select>
                </div>

                {/* Doctor - auto filled */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Doctor <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Stethoscope size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select name="doctor_id" value={form.doctor_id} onChange={handleChange}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                      <option value="">Select doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                      ))}
                    </select>
                  </div>
                  {form.doctor_id && (
                    <p className="text-[10px] text-teal-600 mt-1">✓ Auto-filled from patient record</p>
                  )}
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Service Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SERVICE_TYPES.map(s => (
                      <button key={s} type="button"
                        onClick={() => setForm(p => ({ ...p, service_type: s }))}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition-all text-left ${
                          form.service_type === s
                            ? "bg-teal-50 text-teal-700 border-teal-300 ring-1 ring-teal-300"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date + Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input type="datetime-local" name="scheduled_date" value={form.scheduled_date}
                      onChange={handleChange}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                    <select name="duration" value={form.duration} onChange={handleChange}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                      {DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="location" value={form.location} onChange={handleChange}
                    placeholder="e.g. Patient's home, Mumbai"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                </div>

                {/* Nurse Skill */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Required Nurse Skill <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" name="required_nurse_skill" value={form.required_nurse_skill}
                    onChange={handleChange} placeholder="e.g. IV cannulation, Oncology"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                </div>

                {/* Medicine Required */}
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Medicine Required</p>
                    <p className="text-[10px] text-gray-400">Triggers distributor workflow</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, medicine_required: !p.medicine_required }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${form.medicine_required ? "bg-teal-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.medicine_required ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                {form.medicine_required && (
  <div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Required Medicines
  </label>

  <textarea
    name="required_medicines"
    value={form.required_medicines}
    onChange={handleChange}
    rows={4}
    placeholder={`Example:
Inj. Meropenem 1gm
NS 500ml
Ondansetron 4mg`}
    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 resize-none"
  />
</div>
)}

                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{formError}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">Care request created successfully.</p>
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                  <PlusCircle size={13} />
                  {submitting ? "Creating..." : "Create Care Request"}
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}