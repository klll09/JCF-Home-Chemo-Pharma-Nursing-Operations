import { useState, useEffect } from "react";
import {
  Users, RefreshCw, UserCheck, ClipboardList, Activity,
  ChevronRight, AlertTriangle, CheckCircle2, Stethoscope,
  PlusCircle, FileText, Search, LayoutDashboard, Calendar,
  Truck, Settings, LogOut, Bell
} from "lucide-react";
import { supabase } from "./superbase";
import { Link, useLocation } from "react-router-dom";

const CONSENT_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  Signed: "bg-green-100 text-green-700",
  Expired: "bg-red-100 text-red-700",
};

const RISK_COLORS = {
  Critical: { pill: "bg-red-100 text-red-700", ring: "ring-red-300" },
  High: { pill: "bg-orange-100 text-orange-700", ring: "ring-orange-300" },
  Medium: { pill: "bg-blue-100 text-blue-700", ring: "ring-blue-300" },
  Low: { pill: "bg-gray-100 text-gray-600", ring: "ring-gray-300" },
};

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Patients", path: "/admin/dashboard" },
  { icon: ClipboardList, label: "Care Requests", path: "/admin/care-requests" },
  { icon: UserCheck, label: "Nurse Assignment", path: "/admin/nurse-assignment" },
  { icon: Truck, label: "Distributors", path: "/admin/distributors" },
  { icon: Calendar, label: "Schedule", path: "/admin/schedule" },
];

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">JaruratCare</p>
              <p className="text-[10px] text-gray-400">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Main Menu</p>
          {NAV.map(({ icon: Icon, label, path }) => (
            <Link key={label} to={path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === path
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
            <Settings size={15} />Settings
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
            <LogOut size={15} />Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP BAR */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync"}
            </button>
            <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold">A</div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Admin</p>
                <p className="text-[10px] text-gray-400">Operations</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

          {/* STATS */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Activity, label: "Active Sessions", value: stats.sessions, sub: "Currently in progress", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-600" },
              { icon: ClipboardList, label: "Pending Sign-off", value: stats.pending, sub: "Awaiting doctor approval", color: "bg-amber-500", light: "bg-amber-50 text-amber-600" },
              { icon: Users, label: "Ready to Assign", value: stats.ready, sub: "Nurse not yet assigned", color: "bg-teal-500", light: "bg-teal-50 text-teal-600" },
              { icon: UserCheck, label: "Available Nurses", value: stats.nurses, sub: "Ready for deployment", color: "bg-indigo-500", light: "bg-indigo-50 text-indigo-600" },
            ].map(({ icon: Icon, label, value, sub, color, light }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                  <div className={`p-2 rounded-lg ${light}`}>
                    <Icon size={14} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* CONTENT */}
          <div className="flex gap-5 flex-1 min-h-0">

            {/* PATIENT TABLE */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Patient Registry</h2>
                  <p className="text-xs text-gray-400">{patients.length} total patients</p>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-48 bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                {["Patient", "Diagnosis", "Doctor", "Risk", "Status", ""].map((h, i) => (
                  <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider ${i === 0 ? "col-span-3" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-1" : i === 4 ? "col-span-2" : "col-span-1"}`}>{h}</span>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={20} className="text-gray-300 animate-spin" />
                      <p className="text-xs text-gray-400">Loading patients...</p>
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-sm text-gray-400">No patients found.</p>
                  </div>
                ) : filtered.map((p, idx) => {
                  const risk = p.high_risk_flags?.[0] || "Low";
                  const riskCfg = RISK_COLORS[risk] || RISK_COLORS.Low;
                  return (
                    <div key={p.id}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                      className={`grid grid-cols-12 px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                        selected?.id === p.id ? "bg-teal-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
                      }`}>
                      <div className="col-span-3 flex flex-col justify-center">
                        <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                        <p className="text-[10px] text-teal-600 font-mono">{p.patient_code || "—"}</p>
                        <p className="text-[10px] text-gray-400">Age {p.age}</p>
                      </div>
                      <div className="col-span-3 flex items-center pr-2">
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{p.diagnosis || "—"}</p>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <p className="text-xs text-gray-600 truncate">{p.doctors?.name || "—"}</p>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${riskCfg.pill}`}>{risk}</span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${CONSENT_COLORS[p.consent_status] || CONSENT_COLORS.Pending}`}>
                          {p.consent_status || "Pending"}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <ChevronRight size={13} className={`text-gray-300 transition-transform ${selected?.id === p.id ? "rotate-90 text-teal-500" : ""}`} />
                      </div>

                      {selected?.id === p.id && (
                        <div className="col-span-12 mt-2 pt-3 border-t border-teal-100">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-lg border border-teal-100 p-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Cancer Type</p>
                              <p className="text-xs text-gray-700">{p.cancer_type || "Not specified"}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-teal-100 p-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Registered</p>
                              <p className="text-xs text-gray-700">{new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-teal-100 p-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Notes</p>
                              <p className="text-xs text-gray-700">{p.feedback || "—"}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INTAKE FORM */}
            <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shrink-0">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">Register Patient</h2>
                <p className="text-xs text-gray-400 mt-0.5">Add a new patient to the system</p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

                  {[
                    { label: "Full Name", name: "name", type: "text", placeholder: "e.g. Rajiv Shankar Pillai", required: true },
                    { label: "Address", name: "address", type: "text", placeholder: "e.g. 12, Marine Lines, Mumbai", required: true },
                    { label: "Cancer Type", name: "cancer_type", type: "text", placeholder: "e.g. Adenocarcinoma" },
                  ].map(({ label, name, type, placeholder, required }) => (
                    <div key={name}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {label} {required && <span className="text-red-400">*</span>}
                      </label>
                      <input type={type} name={name} value={form[name]} onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Age <span className="text-red-400">*</span></label>
                      <input type="number" name="age" value={form.age} onChange={handleChange}
                        placeholder="e.g. 58" min={1} max={120}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Phone <span className="text-red-400">*</span></label>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+91 98XXXXXXXX"
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Diagnosis <span className="text-red-400">*</span></label>
                    <textarea name="diagnosis" value={form.diagnosis} onChange={handleChange}
                      placeholder="e.g. Stage III Lung Carcinoma — Protocol Carboplatin" rows={2}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 resize-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Doctor <span className="text-red-400">*</span></label>
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
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Risk Level</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["Low", "Medium", "High", "Critical"].map(tier => {
                        const cfg = RISK_COLORS[tier];
                        return (
                          <button key={tier} type="button"
                            onClick={() => setForm(p => ({ ...p, riskTier: tier }))}
                            className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                              form.riskTier === tier
                                ? `${cfg.pill} border-transparent ring-2 ${cfg.ring}`
                                : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                            }`}>
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea name="notes" value={form.notes} onChange={handleChange}
                      placeholder="Additional clinical or operational notes..." rows={2}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 resize-none" />
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
                      <p className="text-xs text-green-700 font-medium">Patient registered successfully.</p>
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                    <PlusCircle size={13} />
                    {submitting ? "Saving..." : "Register Patient"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}