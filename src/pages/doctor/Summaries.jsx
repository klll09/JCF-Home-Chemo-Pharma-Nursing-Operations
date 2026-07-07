import { useState, useEffect } from "react";
import { FileText, RefreshCw, CheckCircle2, ExternalLink, FolderOpen } from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  DraftGenerated: "bg-gray-100 text-gray-600",
  DoctorReview: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Sent: "bg-teal-100 text-teal-700",
};

const RESOURCE_TYPE_COLORS = {
  "Summary Report": "bg-teal-50 text-teal-700",
  "Invoice": "bg-blue-50 text-blue-700",
  "Prescription": "bg-purple-50 text-purple-700",
  "Pharmacy List": "bg-amber-50 text-amber-700",
};

export default function DoctorSummaries() {
  const [summaries, setSummaries] = useState([]);
  const [resources, setResources] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    const [sumRes, resRes, visRes] = await Promise.all([
      supabase.from("summaries")
        .select(`id, status, created_at, final_pdf_url, approved_at,
          visits(care_requests(patients(name, patient_code)))`)
        .order("created_at", { ascending: false }),
      supabase.from("resources")
        .select(`id, resource_type, pdf_url, notes, created_at, visit_id`)
        .order("created_at", { ascending: false }),
      supabase.from("visits")
        .select(`id, care_requests(patients(name, patient_code))`),
    ]);
    setSummaries(sumRes.data || []);
    setResources(resRes.data || []);
    setVisits(visRes.data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    const { error } = await supabase.from("summaries")
      .update({ status: "Approved", approved_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) await fetchAll();
  };

  const getPatientFromVisit = (visitId) => {
    const visit = visits.find(v => v.id === visitId);
    return visit?.care_requests?.patients;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Summaries & Reports</h1>
          <p className="text-xs text-gray-400">Review visit summaries and nurse-generated reports</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

        {/* SUMMARIES SECTION */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText size={14} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-800">Visit Summaries</h2>
            <span className="ml-auto text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {summaries.length}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw size={18} className="text-gray-300 animate-spin" />
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <FileText size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No summaries yet.</p>
            </div>
          ) : summaries.map(s => (
            <div key={s.id} className="px-5 py-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {s.visits?.care_requests?.patients?.name || "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.visits?.care_requests?.patients?.patient_code} · {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${STATUS_COLORS[s.status] || STATUS_COLORS.DraftGenerated}`}>
                  {s.status}
                </span>
                {s.final_pdf_url && s.final_pdf_url !== "pending-upload" && (
                  <a href={s.final_pdf_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline">
                    <ExternalLink size={11} />View PDF
                  </a>
                )}
                {s.status === "DoctorReview" && (
                  <button onClick={() => handleApprove(s.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition">
                    <CheckCircle2 size={12} />Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* NURSE-GENERATED RESOURCES SECTION */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FolderOpen size={14} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-800">Nurse Generated Reports</h2>
            <span className="ml-auto text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {resources.length}
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
            {["Patient", "Type", "Date", ""].map((h, i) => (
              <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider
                ${i === 0 ? "col-span-4" : i === 1 ? "col-span-4" : i === 2 ? "col-span-2" : "col-span-2"}`}>
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw size={18} className="text-gray-300 animate-spin" />
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <FolderOpen size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No reports generated yet.</p>
            </div>
          ) : resources.map((r, idx) => {
            const patient = getPatientFromVisit(r.visit_id);
            return (
              <div key={r.id}
                className={`grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center ${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}>
                <div className="col-span-4">
                  <p className="text-xs font-semibold text-gray-800">{patient?.name || "—"}</p>
                  <p className="text-[10px] text-teal-600 font-mono">{patient?.patient_code || "—"}</p>
                </div>
                <div className="col-span-4">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${RESOURCE_TYPE_COLORS[r.resource_type] || "bg-gray-100 text-gray-600"}`}>
                    {r.resource_type}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="col-span-2 flex justify-end">
                  <a href={r.pdf_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-semibold rounded-md transition">
                    <ExternalLink size={10} />Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}