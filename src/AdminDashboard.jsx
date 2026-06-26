import { useState, useEffect, useRef } from "react";
import {
  Users, RefreshCw, UserCheck, ClipboardList,
  Activity, ChevronRight, AlertTriangle, CheckCircle2,
  Stethoscope, PlusCircle, FileText, Search, X
} from "lucide-react";
import { supabase } from "./superbase";

const CONSENT_COLORS = {
  Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Signed: { bg: "bg-green-100", text: "text-green-700" },
  Expired: { bg: "bg-red-100", text: "text-red-700" },
};

const RISK_COLORS = {
  Critical: { bg: "bg-red-100", text: "text-red-700" },
  High: { bg: "bg-orange-100", text: "text-orange-700" },
  Medium: { bg: "bg-blue-100", text: "text-blue-700" },
  Low: { bg: "bg-gray-100", text: "text-gray-600" },
};

function Badge({ label, colorMap }) {
  const cfg = colorMap[label] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({ sessions: 0, pending: 0, ready: 0, nurses: 0 });
  const [form, setForm] = useState({
    name: "", age: "", phone: "", address: "",
    diagnosis: "", cancer_type: "", doctor_id: "", riskTier: "Medium", notes: "",
  });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchAll() {
    const [pats, docs, sessions, pending, ready, nurses] = await Promise.all([
      supabase.from("patients").select(`id, patient_code, name, age, diagnosis, consent_status, created_at, feedback, high_risk_flags, doctors(name)`).order("created_at", { ascending: false }),
      supabase.from("doctors").select("id, name, specialization"),
      supabase.from("visits").select("id", { count: "exact", head: true }).eq("status", "InProgress"),
      supabase.from("patients").select("id", { count: "exact", head: true }).eq("consent_status", "Pending"),
      supabase.from("care_requests").select("id", { count: "exact", head: true }).eq("status", "DoctorApproved"),
      supabase.from("nurses").select("id", { count: "exact", head: true }).eq("availability_status", "Available"),
    ]);
    setPatients(pats.data || []);
    setDoctors(docs.data || []);
    setStats({ sessions: sessions.count || 0, pending: pending.count || 0, ready: ready.count || 0, nurses: nurses.count || 0 });
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Patient name is required.");
    if (!form.age || isNaN(form.age) || +form.age < 1 || +form.age > 120) return setFormError("Enter a valid age.");
    if (!form.phone.trim()) return setFormError("Phone number is required.");
    if (!form.address.trim()) return setFormError("Address is required.");
    if (!form.diagnosis.trim()) return setFormError("Diagnosis is required.");
    if (!form.doctor_id) return setFormError("Please select a doctor.");

    setSubmitting(true);
    const { error } = await supabase.from("patients").insert({
      name: form.name.trim(),
      age: +form.age,
      phone: form.phone.trim(),
      address: form.address.trim(),
      diagnosis: form.diagnosis.trim(),
      cancer_type: form.cancer_type.trim() || null,
      primary_doctor_id: form.doctor_id,
      high_risk_flags: [form.riskTier],
      feedback: form.notes.trim() || null,
      consent_status: "Pending",
    });
    setSubmitting(false);

    if (error) return setFormError("Failed to save: " + error.message);

    setForm({ name: "", age: "", phone: "", address: "", diagnosis: "", cancer_type: "", doctor_id: "", riskTier: "Medium", notes: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    await fetchAll();
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.patient_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">JaruratCare</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
          <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">A</div>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col gap-6">

        {/* STATS */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Active Sessions" value={stats.sessions} color="bg-emerald-500" />
          <StatCard icon={ClipboardList} label="Pending Doctor Sign-off" value={stats.pending} color="bg-amber-500" />
          <StatCard icon={Users} label="Ready to Assign" value={stats.ready} color="bg-teal-500" />
          <StatCard icon={UserCheck} label="Available Nurses" value={stats.nurses} color="bg-blue-500" />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex gap-6 flex-1">

          {/* PATIENT LIST */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Patient Registry</h2>
                <p className="text-xs text-gray-400 mt-0.5">{patients.length} patients registered</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-52"
                />
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span className="col-span-4">Patient</span>
              <span className="col-span-3">Diagnosis</span>
              <span className="col-span-2">Doctor</span>
              <span className="col-span-1">Risk</span>
              <span className="col-span-2">Status</span>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No patients found.</div>
              ) : filtered.map(p => (
                <div key={p.id}
                  onClick={() => setSelectedPatient(selectedPatient?.id === p.id ? null : p)}
                  className={`grid grid-cols-12 px-5 py-3 cursor-pointer transition-colors ${selectedPatient?.id === p.id ? "bg-teal-50" : "hover:bg-gray-50"}`}
                >
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-teal-600 font-mono">{p.patient_code || "—"}</p>
                    <p className="text-xs text-gray-400">Age {p.age} · {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <p className="text-xs text-gray-600 line-clamp-2">{p.diagnosis || "—"}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-xs text-gray-700">{p.doctors?.name || "—"}</p>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Badge label={p.high_risk_flags?.[0] || "Low"} colorMap={RISK_COLORS} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <Badge label={p.consent_status || "Pending"} colorMap={CONSENT_COLORS} />
                    <ChevronRight size={14} className={`text-gray-300 transition-transform ${selectedPatient?.id === p.id ? "rotate-90 text-teal-500" : ""}`} />
                  </div>

                  {selectedPatient?.id === p.id && (
                    <div className="col-span-12 mt-2 pt-2 border-t border-teal-100">
                      <div className="bg-teal-50 rounded-lg p-3 flex gap-2">
                        <FileText size={13} className="text-teal-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Clinical Notes</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{p.feedback || "No additional notes."}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* INTAKE FORM */}
          <div className="w-96 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Add New Patient</h2>
              <p className="text-xs text-gray-400 mt-0.5">Fill in patient details to register</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Rajiv Shankar Pillai"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Age <span className="text-red-400">*</span></label>
                    <input type="number" name="age" value={form.age} onChange={handleChange}
                      placeholder="e.g. 58" min={1} max={120}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone <span className="text-red-400">*</span></label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+91 98XXXXXXXX"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address <span className="text-red-400">*</span></label>
                  <input type="text" name="address" value={form.address} onChange={handleChange}
                    placeholder="e.g. 12, Marine Lines, Mumbai"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Diagnosis <span className="text-red-400">*</span></label>
                  <textarea name="diagnosis" value={form.diagnosis} onChange={handleChange}
                    placeholder="e.g. Stage III Lung Carcinoma — Protocol Carboplatin"
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cancer Type</label>
                  <input type="text" name="cancer_type" value={form.cancer_type} onChange={handleChange}
                    placeholder="e.g. Adenocarcinoma"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assigned Doctor <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Stethoscope size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select name="doctor_id" value={form.doctor_id} onChange={handleChange}
                      className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none bg-white">
                      <option value="">Select a doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Risk Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Low", "Medium", "High", "Critical"].map(tier => {
                      const cfg = RISK_COLORS[tier];
                      return (
                        <button key={tier} type="button"
                          onClick={() => setForm(p => ({ ...p, riskTier: tier }))}
                          className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            form.riskTier === tier
                              ? `${cfg.bg} ${cfg.text} border-transparent ring-2 ring-offset-1 ${tier === "Critical" ? "ring-red-300" : tier === "High" ? "ring-orange-300" : tier === "Medium" ? "ring-blue-300" : "ring-gray-300"}`
                              : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                          }`}>
                          {tier}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea name="notes" value={form.notes} onChange={handleChange}
                    placeholder="Any additional clinical or operational notes..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 resize-none" />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{formError}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">Patient registered successfully.</p>
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-3 rounded-xl transition-all disabled:opacity-60">
                  <PlusCircle size={15} />
                  {submitting ? "Saving..." : "Register Patient"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}