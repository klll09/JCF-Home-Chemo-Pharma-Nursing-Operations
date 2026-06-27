import { useState, useEffect } from "react";
import {
  AlertTriangle, PlusCircle, CheckCircle2,
  RefreshCw, ChevronRight, Clock, ShieldAlert
} from "lucide-react";
import { supabase } from "../../superbase";

const SEVERITY_COLORS = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  Open: "bg-red-100 text-red-700",
  UnderReview: "bg-amber-100 text-amber-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    visit_id: "",
    incident_type: "Clinical",
    severity: "Medium",
    description: "",
    immediate_action_taken: "",
  });

  async function fetchAll() {
    const [inc, vis] = await Promise.all([
      supabase.from("incidents")
        .select(`id, incident_type, severity, description, immediate_action_taken, status, created_at,
          visits(care_requests(service_type, scheduled_date, patients(name, patient_code)))`)
        .order("created_at", { ascending: false }),
      supabase.from("visits")
        .select(`id, status, care_requests(service_type, scheduled_date, patients(name, patient_code))`)
        .order("created_at", { ascending: false }),
    ]);
    setIncidents(inc.data || []);
    setVisits(vis.data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.visit_id) return setFormError("Please select a visit.");
    if (!form.description.trim()) return setFormError("Description is required.");

    setSubmitting(true);
    const { error } = await supabase.from("incidents").insert({
      visit_id: form.visit_id,
      incident_type: form.incident_type,
      severity: form.severity,
      description: form.description.trim(),
      immediate_action_taken: form.immediate_action_taken.trim() || null,
      status: "Open",
    });
    setSubmitting(false);

    if (error) return setFormError("Failed to log: " + error.message);

    setForm({ visit_id: "", incident_type: "Clinical", severity: "Medium", description: "", immediate_action_taken: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    await fetchAll();
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdating(id);
    await supabase.from("incidents").update({ status: newStatus }).eq("id", id);
    setUpdating(null);
    await fetchAll();
  };

  const open = incidents.filter(i => i.status === "Open").length;
  const underReview = incidents.filter(i => i.status === "UnderReview").length;
  const resolved = incidents.filter(i => i.status === "Resolved").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Incidents</h1>
          <p className="text-xs text-gray-400">Log and track clinical and operational incidents</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} />Refresh
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-5 p-6 overflow-auto">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Open", value: open, color: "bg-red-50 text-red-600", icon: AlertTriangle },
            { label: "Under Review", value: underReview, color: "bg-amber-50 text-amber-600", icon: ShieldAlert },
            { label: "Resolved", value: resolved, color: "bg-green-50 text-green-600", icon: CheckCircle2 },
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

          {/* INCIDENTS LIST */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">All Incidents</h2>
              <p className="text-xs text-gray-400">{incidents.length} total</p>
            </div>

            <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              {["Patient", "Type", "Severity", "Status", "Date", "Action", ""].map((h, i) => (
                <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider
                  ${i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 2 ? "col-span-1" : i === 3 ? "col-span-2" : i === 4 ? "col-span-1" : i === 5 ? "col-span-2" : "col-span-1"}`}>
                  {h}
                </span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw size={18} className="text-gray-300 animate-spin" />
                </div>
              ) : incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <ShieldAlert size={32} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No incidents logged.</p>
                </div>
              ) : incidents.map((inc, idx) => (
                <div key={inc.id}
                  onClick={() => setSelected(selected?.id === inc.id ? null : inc)}
                  className={`grid grid-cols-12 px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                    selected?.id === inc.id ? "bg-red-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
                  }`}>
                  <div className="col-span-3 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-800">
                      {inc.visits?.care_requests?.patients?.name || "—"}
                    </p>
                    <p className="text-[10px] text-teal-600 font-mono">
                      {inc.visits?.care_requests?.patients?.patient_code || "—"}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-xs text-gray-600">{inc.incident_type}</p>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.Medium}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${STATUS_COLORS[inc.status] || STATUS_COLORS.Open}`}>
                      {inc.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <p className="text-[10px] text-gray-400">
                      {new Date(inc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    {inc.status === "Open" && (
                      <button onClick={e => { e.stopPropagation(); handleStatusUpdate(inc.id, "UnderReview"); }}
                        disabled={updating === inc.id}
                        className="text-[10px] font-semibold px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition disabled:opacity-60">
                        {updating === inc.id ? "..." : "Review"}
                      </button>
                    )}
                    {inc.status === "UnderReview" && (
                      <button onClick={e => { e.stopPropagation(); handleStatusUpdate(inc.id, "Resolved"); }}
                        disabled={updating === inc.id}
                        className="text-[10px] font-semibold px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition disabled:opacity-60">
                        {updating === inc.id ? "..." : "Resolve"}
                      </button>
                    )}
                    {inc.status === "Resolved" && (
                      <span className="text-[10px] text-green-600 font-semibold">✓ Done</span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <ChevronRight size={13} className={`text-gray-300 transition-transform ${selected?.id === inc.id ? "rotate-90 text-red-400" : ""}`} />
                  </div>

                  {selected?.id === inc.id && (
                    <div className="col-span-12 mt-2 pt-3 border-t border-red-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg border border-red-100 p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Description</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{inc.description}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-red-100 p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Immediate Action Taken</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{inc.immediate_action_taken || "None recorded"}</p>
                        </div>
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
              <h2 className="text-sm font-semibold text-gray-800">Log Incident</h2>
              <p className="text-xs text-gray-400 mt-0.5">Record a new clinical or operational incident</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Visit <span className="text-red-400">*</span>
                  </label>
                  <select name="visit_id" value={form.visit_id} onChange={handleChange}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                    <option value="">Select visit</option>
                    {visits.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.care_requests?.patients?.name} — {v.care_requests?.service_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Incident Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Clinical", "Operational", "Medication", "Safety"].map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(p => ({ ...p, incident_type: t }))}
                        className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          form.incident_type === t
                            ? "bg-teal-50 text-teal-700 border-teal-300 ring-1 ring-teal-300"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Severity</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Low", "Medium", "High", "Critical"].map(s => (
                      <button key={s} type="button"
                        onClick={() => setForm(p => ({ ...p, severity: s }))}
                        className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          form.severity === s
                            ? `${SEVERITY_COLORS[s]} border-transparent ring-1 ring-offset-1 ${s === "Critical" ? "ring-red-300" : s === "High" ? "ring-orange-300" : s === "Medium" ? "ring-amber-300" : "ring-gray-300"}`
                            : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea name="description" value={form.description} onChange={handleChange}
                    placeholder="Describe what happened in detail..."
                    rows={3}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Immediate Action Taken <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea name="immediate_action_taken" value={form.immediate_action_taken} onChange={handleChange}
                    placeholder="What was done immediately after the incident..."
                    rows={2}
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
                    <p className="text-xs text-green-700 font-medium">Incident logged successfully.</p>
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                  <PlusCircle size={13} />
                  {submitting ? "Logging..." : "Log Incident"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}