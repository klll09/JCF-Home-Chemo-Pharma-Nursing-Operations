import { useState, useEffect } from "react";
import { FileText, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  DraftGenerated: "bg-gray-100 text-gray-600",
  DoctorReview: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Sent: "bg-teal-100 text-teal-700",
};

export default function DoctorSummaries() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    const { data } = await supabase.from("summaries")
      .select(`id, status, created_at, final_pdf_url, approved_at,
        visits(care_requests(patients(name, patient_code)))`)
      .order("created_at", { ascending: false });
    setSummaries(data || []);
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Summaries</h1>
          <p className="text-xs text-gray-400">Review and approve visit summaries</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={18} className="text-gray-300 animate-spin" />
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <FileText size={32} className="text-gray-200" />
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
      </div>
    </div>
  );
}