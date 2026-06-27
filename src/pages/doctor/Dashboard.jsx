import { useState, useEffect } from "react";
import {
  ClipboardList, CheckCircle2, AlertTriangle, ChevronRight,
  RefreshCw, FileText, User, Calendar, Clock, Activity
} from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  DoctorApproved: "bg-blue-100 text-blue-700",
  Scheduled: "bg-teal-100 text-teal-700",
  Completed: "bg-green-100 text-green-700",
};

export default function DoctorDashboard() {
  const [requests, setRequests] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [stats, setStats] = useState({ draft: 0, approved: 0, completed: 0, pendingSummaries: 0 });

  async function fetchAll() {
    const [reqs, sums, draft, approved, completed, pendingSums] = await Promise.all([
      supabase.from("care_requests")
        .select(`id, service_type, scheduled_date, duration, location, status, medicine_required, created_at,
          patients(name, patient_code, age, diagnosis)`)
        .order("created_at", { ascending: false }),
      supabase.from("summaries")
        .select(`id, status, created_at, final_pdf_url,
          visits(care_request_id,
            care_requests(patients(name, patient_code)))`)
        .eq("status", "DoctorReview"),
      supabase.from("care_requests").select("id", { count: "exact", head: true }).eq("status", "Draft"),
      supabase.from("care_requests").select("id", { count: "exact", head: true }).eq("status", "DoctorApproved"),
      supabase.from("care_requests").select("id", { count: "exact", head: true }).eq("status", "Completed"),
      supabase.from("summaries").select("id", { count: "exact", head: true }).eq("status", "DoctorReview"),
    ]);

    setRequests(reqs.data || []);
    setSummaries(sums.data || []);
    setStats({
      draft: draft.count || 0,
      approved: approved.count || 0,
      completed: completed.count || 0,
      pendingSummaries: pendingSums.count || 0,
    });
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const handleApprove = async (requestId) => {
    setApproving(requestId);
    const { error } = await supabase.from("care_requests")
      .update({ status: "DoctorApproved" })
      .eq("id", requestId);
    setApproving(null);
    if (!error) await fetchAll();
  };

  const handleApproveSummary = async (summaryId) => {
    const { error } = await supabase.from("summaries")
      .update({ status: "Approved", approved_at: new Date().toISOString() })
      .eq("id", summaryId);
    if (!error) await fetchAll();
  };

  const draftRequests = requests.filter(r => r.status === "Draft");
  const otherRequests = requests.filter(r => r.status !== "Draft");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Doctor Dashboard</h1>
          <p className="text-xs text-gray-400">Review and approve care requests</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

        {/* STATS */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Pending Approval", value: stats.draft, color: "bg-amber-50 text-amber-600", icon: ClipboardList },
            { label: "Approved", value: stats.approved, color: "bg-blue-50 text-blue-600", icon: CheckCircle2 },
            { label: "Completed", value: stats.completed, color: "bg-green-50 text-green-600", icon: Activity },
            { label: "Summaries to Review", value: stats.pendingSummaries, color: "bg-purple-50 text-purple-600", icon: FileText },
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

          {/* PENDING APPROVAL */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">

            {/* DRAFT REQUESTS — need approval */}
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <h2 className="text-sm font-semibold text-gray-800">Approval Pending</h2>
                <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{draftRequests.length}</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw size={18} className="text-gray-300 animate-spin" />
                </div>
              ) : draftRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <CheckCircle2 size={28} className="text-gray-200" />
                  <p className="text-sm text-gray-400">All caught up — no pending requests.</p>
                </div>
              ) : draftRequests.map(r => (
                <div key={r.id}
                  className="px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-800">{r.patients?.name}</p>
                        <span className="text-[10px] font-mono text-teal-600">{r.patients?.patient_code}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{r.patients?.diagnosis || "No diagnosis on record"}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Activity size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{r.service_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(r.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{r.duration}</span>
                        </div>
                      </div>
                      {r.medicine_required && (
                        <span className="inline-block mt-2 text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">
                          Medicine Required
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={approving === r.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60 shrink-0">
                      <CheckCircle2 size={12} />
                      {approving === r.id ? "Approving..." : "Approve"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* SUMMARIES TO REVIEW */}
            {summaries.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <h2 className="text-sm font-semibold text-gray-800">Summaries Awaiting Review</h2>
                  <span className="ml-auto text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{summaries.length}</span>
                </div>
                {summaries.map(s => (
                  <div key={s.id} className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {s.visits?.care_requests?.patients?.name || "Patient"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Generated {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.final_pdf_url && (
                        <a href={s.final_pdf_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50">
                          <FileText size={12} />View PDF
                        </a>
                      )}
                      <button onClick={() => handleApproveSummary(s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-all">
                        <CheckCircle2 size={12} />Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ALL REQUESTS */}
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">All Care Requests</h2>
                <p className="text-xs text-gray-400">{otherRequests.length} requests</p>
              </div>

              <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                {["Patient", "Service", "Date", "Status", ""].map((h, i) => (
                  <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider
                    ${i === 0 ? "col-span-4" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : "col-span-1"}`}>
                    {h}
                  </span>
                ))}
              </div>

              <div className="overflow-y-auto max-h-64">
                {otherRequests.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-400">No other requests.</p>
                  </div>
                ) : otherRequests.map((r, idx) => (
                  <div key={r.id}
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className={`grid grid-cols-12 px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                      selected?.id === r.id ? "bg-teal-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50"
                    }`}>
                    <div className="col-span-4 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-gray-800">{r.patients?.name}</p>
                      <p className="text-[10px] text-teal-600 font-mono">{r.patients?.patient_code}</p>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <p className="text-xs text-gray-600">{r.service_type}</p>
                    </div>
                    <div className="col-span-2 flex items-center">
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
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-lg border border-teal-100 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Location</p>
                            <p className="text-xs text-gray-700">{r.location || "—"}</p>
                          </div>
                          <div className="bg-white rounded-lg border border-teal-100 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Duration</p>
                            <p className="text-xs text-gray-700">{r.duration}</p>
                          </div>
                          <div className="bg-white rounded-lg border border-teal-100 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Medicine</p>
                            <p className="text-xs text-gray-700">{r.medicine_required ? "Required" : "Not required"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}