import { useState, useEffect } from "react";
import {
  ClipboardList, RefreshCw, CheckCircle2, AlertTriangle,
  ChevronRight, Calendar, Clock, Activity
} from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  DoctorApproved: "bg-blue-100 text-blue-700",
  Scheduled: "bg-teal-100 text-teal-700",
  Completed: "bg-green-100 text-green-700",
};

export default function DoctorCareRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  async function fetchAll() {
    const { data } = await supabase.from("care_requests")
      .select(`id, service_type, scheduled_date, duration, location, status, medicine_required, created_at,
        patients(name, patient_code, age, diagnosis)`)
      .order("created_at", { ascending: false });
    setRequests(data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setApproving(id);
    const { error } = await supabase.from("care_requests")
      .update({ status: "DoctorApproved" })
      .eq("id", id);
    setApproving(null);
    if (!error) await fetchAll();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Care Requests</h1>
          <p className="text-xs text-gray-400">All patient care requests</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
            {["Patient", "Service", "Date", "Status", "Action", ""].map((h, i) => (
              <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider
                ${i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-1"}`}>
                {h}
              </span>
            ))}
          </div>

          <div className="overflow-y-auto">
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
                  selected?.id === r.id ? "bg-blue-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50"
                }`}>
                <div className="col-span-3 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-800">{r.patients?.name}</p>
                  <p className="text-[10px] text-blue-600 font-mono">{r.patients?.patient_code}</p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-xs text-gray-600">{r.service_type}</p>
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
                <div className="col-span-2 flex items-center">
                  {r.status === "Draft" && (
                    <button onClick={(e) => { e.stopPropagation(); handleApprove(r.id); }}
                      disabled={approving === r.id}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded-md transition disabled:opacity-60">
                      <CheckCircle2 size={10} />
                      {approving === r.id ? "..." : "Approve"}
                    </button>
                  )}
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <ChevronRight size={13} className={`text-gray-300 transition-transform ${selected?.id === r.id ? "rotate-90 text-blue-500" : ""}`} />
                </div>

                {selected?.id === r.id && (
                  <div className="col-span-12 mt-2 pt-3 border-t border-blue-100">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Diagnosis</p>
                        <p className="text-xs text-gray-700">{r.patients?.diagnosis || "—"}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Location</p>
                        <p className="text-xs text-gray-700">{r.location || "—"}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Medicine Required</p>
                        <p className="text-xs text-gray-700">{r.medicine_required ? "Yes" : "No"}</p>
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
  );
}