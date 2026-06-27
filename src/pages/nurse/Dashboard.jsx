import { useState, useEffect } from "react";
import {
  UserCheck, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, MapPin, Activity, ClipboardList, FileText,
  ChevronRight, Shield
} from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  Pending: "bg-gray-100 text-gray-600",
  NurseEnRoute: "bg-blue-100 text-blue-700",
  OTPVerified: "bg-purple-100 text-purple-700",
  InProgress: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
};

export default function NurseDashboard() {
  const [visits, setVisits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 });

  // Checklist state
  const [checklist, setChecklist] = useState({
    doctor_order_available: false,
    identity_verified: false,
    allergy_checked: false,
    vitals_checked: false,
  });

  // Vitals state
  const [vitals, setVitals] = useState({
    stage: "Before", bp: "", pulse: "", temp: "", spo2: ""
  });

  // Notes state
  const [notes, setNotes] = useState({
    free_text_notes: "", visit_outcome: "Completed",
    adverse_event: false, waste_disposal_status: "Not applicable",
    next_visit_needed: "DoctorToDecide"
  });

  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  async function fetchAll() {
    const [vis, pending, inProg, completed] = await Promise.all([
      supabase.from("visits")
        .select(`id, status, start_time, end_time, created_at,
          care_requests(service_type, scheduled_date, location, duration,
            patients(name, patient_code, age, diagnosis, allergies, high_risk_flags)),
          nurses(name)`)
        .order("created_at", { ascending: false }),
      supabase.from("visits").select("id", { count: "exact", head: true }).eq("status", "Pending"),
      supabase.from("visits").select("id", { count: "exact", head: true }).eq("status", "InProgress"),
      supabase.from("visits").select("id", { count: "exact", head: true }).eq("status", "Completed"),
    ]);
    setVisits(vis.data || []);
    setStats({ pending: pending.count || 0, inProgress: inProg.count || 0, completed: completed.count || 0 });
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (visitId, newStatus) => {
    setUpdating(visitId);
    const { error } = await supabase.from("visits")
      .update({ status: newStatus })
      .eq("id", visitId);
    setUpdating(null);
    if (!error) await fetchAll();
  };

  const handleSaveChecklist = async () => {
    if (!selected) return;
    setSavingChecklist(true);
    const { error } = await supabase.from("visit_checklists").upsert({
      visit_id: selected.id,
      ...checklist,
    });
    setSavingChecklist(false);
    if (!error) { setSaveSuccess("checklist"); setTimeout(() => setSaveSuccess(""), 2000); }
  };

  const handleSaveVitals = async () => {
    if (!selected) return;
    setSavingVitals(true);
    const { error } = await supabase.from("vitals").insert({
      visit_id: selected.id,
      stage: vitals.stage,
      bp: vitals.bp || null,
      pulse: vitals.pulse ? +vitals.pulse : null,
      temp: vitals.temp ? +vitals.temp : null,
      spo2: vitals.spo2 ? +vitals.spo2 : null,
    });
    setSavingVitals(false);
    if (!error) { setSaveSuccess("vitals"); setTimeout(() => setSaveSuccess(""), 2000); }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const { error } = await supabase.from("visit_notes").upsert({
      visit_id: selected.id,
      nurse_id: selected.nurses?.id || null,
      free_text_notes: notes.free_text_notes,
      visit_outcome: notes.visit_outcome,
      adverse_event: notes.adverse_event,
      waste_disposal_status: notes.waste_disposal_status,
      next_visit_needed: notes.next_visit_needed,
    });
    setSavingNotes(false);
    if (!error) { setSaveSuccess("notes"); setTimeout(() => setSaveSuccess(""), 2000); }
  };

  const getNextStatus = (current) => {
    const flow = ["Pending", "NurseEnRoute", "OTPVerified", "InProgress", "Completed"];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const getNextStatusLabel = (current) => {
    const labels = {
      Pending: "Mark En Route",
      NurseEnRoute: "Mark OTP Verified",
      OTPVerified: "Mark In Progress",
      InProgress: "Mark Completed",
    };
    return labels[current] || null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Nurse Dashboard</h1>
          <p className="text-xs text-gray-400">Manage your assigned visits</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending Visits", value: stats.pending, color: "bg-gray-50 text-gray-600", icon: Clock },
            { label: "In Progress", value: stats.inProgress, color: "bg-amber-50 text-amber-600", icon: Activity },
            { label: "Completed", value: stats.completed, color: "bg-green-50 text-green-600", icon: CheckCircle2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-5 flex-1 min-h-0">

          {/* VISITS LIST */}
          <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">My Visits</h2>
              <p className="text-xs text-gray-400">{visits.length} total visits</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw size={18} className="text-gray-300 animate-spin" />
                </div>
              ) : visits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <UserCheck size={28} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No visits assigned yet.</p>
                </div>
              ) : visits.map(v => (
                <div key={v.id}
                  onClick={() => setSelected(selected?.id === v.id ? null : v)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    selected?.id === v.id ? "bg-teal-50 border-l-2 border-l-teal-500" : "hover:bg-gray-50"
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {v.care_requests?.patients?.name || "—"}
                      </p>
                      <p className="text-[10px] text-teal-600 font-mono">
                        {v.care_requests?.patients?.patient_code || "—"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {v.care_requests?.service_type}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={10} className="text-gray-400" />
                        <p className="text-[10px] text-gray-400">
                          {new Date(v.care_requests?.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${STATUS_COLORS[v.status] || STATUS_COLORS.Pending}`}>
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VISIT DETAIL */}
          {!selected ? (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <ClipboardList size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">Select a visit to view details</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">

              {/* VISIT INFO */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">{selected.care_requests?.patients?.name}</h2>
                    <p className="text-xs text-teal-600 font-mono">{selected.care_requests?.patients?.patient_code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Age {selected.care_requests?.patients?.age}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Service</p>
                    <p className="text-xs text-gray-700">{selected.care_requests?.service_type}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Location</p>
                    <p className="text-xs text-gray-700">{selected.care_requests?.location || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Duration</p>
                    <p className="text-xs text-gray-700">{selected.care_requests?.duration}</p>
                  </div>
                </div>

                {/* Diagnosis + Allergies */}
                {selected.care_requests?.patients?.diagnosis && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Diagnosis</p>
                    <p className="text-xs text-blue-800">{selected.care_requests?.patients?.diagnosis}</p>
                  </div>
                )}
                {selected.care_requests?.patients?.allergies?.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 mb-4">
                    <p className="text-[10px] font-semibold text-red-600 uppercase mb-1">⚠ Allergies</p>
                    <p className="text-xs text-red-800">{selected.care_requests?.patients?.allergies?.join(", ")}</p>
                  </div>
                )}

                {/* Status Update Button */}
                {getNextStatus(selected.status) && (
                  <button
                    onClick={() => handleStatusUpdate(selected.id, getNextStatus(selected.status))}
                    disabled={updating === selected.id}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                    <Activity size={13} />
                    {updating === selected.id ? "Updating..." : getNextStatusLabel(selected.status)}
                  </button>
                )}
              </div>

              {/* CHECKLIST */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Visit Checklist</h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { key: "doctor_order_available", label: "Doctor order available" },
                    { key: "identity_verified", label: "Patient identity verified" },
                    { key: "allergy_checked", label: "Allergies checked" },
                    { key: "vitals_checked", label: "Vitals checked" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={checklist[key]}
                        onChange={e => setChecklist(p => ({ ...p, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-400" />
                      <span className={`text-xs ${checklist[key] ? "text-gray-800 font-medium" : "text-gray-500"}`}>{label}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleSaveChecklist} disabled={savingChecklist}
                  className="mt-4 w-full flex items-center justify-center gap-2 border border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold text-xs py-2 rounded-lg transition-all disabled:opacity-60">
                  {saveSuccess === "checklist" ? <><CheckCircle2 size={12} />Saved!</> : savingChecklist ? "Saving..." : "Save Checklist"}
                </button>
              </div>

              {/* VITALS */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Record Vitals</h3>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stage</label>
                  <div className="flex gap-2">
                    {["Before", "During", "After"].map(s => (
                      <button key={s} type="button"
                        onClick={() => setVitals(p => ({ ...p, stage: s }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          vitals.stage === s
                            ? "bg-teal-50 text-teal-700 border-teal-300"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "bp", label: "BP", placeholder: "e.g. 120/80" },
                    { key: "pulse", label: "Pulse (bpm)", placeholder: "e.g. 72" },
                    { key: "temp", label: "Temp (°C)", placeholder: "e.g. 37.2" },
                    { key: "spo2", label: "SpO2 (%)", placeholder: "e.g. 98" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                      <input type="text" value={vitals[key]}
                        onChange={e => setVitals(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveVitals} disabled={savingVitals}
                  className="mt-4 w-full flex items-center justify-center gap-2 border border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold text-xs py-2 rounded-lg transition-all disabled:opacity-60">
                  {saveSuccess === "vitals" ? <><CheckCircle2 size={12} />Saved!</> : savingVitals ? "Saving..." : "Save Vitals"}
                </button>
              </div>

              {/* VISIT NOTES */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Visit Notes</h3>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Clinical Notes</label>
                  <textarea value={notes.free_text_notes}
                    onChange={e => setNotes(p => ({ ...p, free_text_notes: e.target.value }))}
                    placeholder="Describe what was done, patient condition, any observations..."
                    rows={3}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Visit Outcome</label>
                    <select value={notes.visit_outcome}
                      onChange={e => setNotes(p => ({ ...p, visit_outcome: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                      {["Completed", "Partial", "Cancelled", "Escalated"].map(o => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Next Visit Needed</label>
                    <select value={notes.next_visit_needed}
                      onChange={e => setNotes(p => ({ ...p, next_visit_needed: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                      {["Yes", "No", "DoctorToDecide"].map(o => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Waste Disposal</label>
                    <select value={notes.waste_disposal_status}
                      onChange={e => setNotes(p => ({ ...p, waste_disposal_status: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                      {["Confirmed", "Returned", "Not applicable"].map(o => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={notes.adverse_event}
                        onChange={e => setNotes(p => ({ ...p, adverse_event: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
                      <span className="text-xs font-semibold text-red-600">Adverse Event</span>
                    </label>
                  </div>
                </div>

                <button onClick={handleSaveNotes} disabled={savingNotes}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                  {saveSuccess === "notes" ? <><CheckCircle2 size={12} />Saved!</> : savingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}