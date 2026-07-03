import { useState, useEffect } from "react";
import { Users, RefreshCw, Search, ChevronRight, FileText } from "lucide-react";
import { supabase } from "../../superbase";
import { useAuth } from "../../hooks/useAuth";

const CONSENT_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  Signed: "bg-green-100 text-green-700",
  Expired: "bg-red-100 text-red-700",
};

export default function DoctorPatients() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchPatients() {
    if (!profile?.id) return;
    const { data } = await supabase.from("patients")
      .select(`id, patient_code, name, age, diagnosis, cancer_type, address, consent_status, feedback, created_at, high_risk_flags`)
      .eq("primary_doctor_id", profile.id)
      .order("created_at", { ascending: false });
    setPatients(data || []);
  }

  useEffect(() => {
    if (profile?.id) {
      setLoading(true);
      fetchPatients().finally(() => setLoading(false));
    }
  }, [profile]);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.patient_code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">My Patients</h1>
          <p className="text-xs text-gray-400">{patients.length} patients under your care</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 bg-gray-50" />
          </div>
          <button onClick={() => { setLoading(true); fetchPatients().finally(() => setLoading(false)); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={18} className="text-gray-300 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Users size={32} className="text-gray-200" />
              <p className="text-sm text-gray-400">No patients assigned to you yet.</p>
            </div>
          ) : filtered.map((p, idx) => (
            <div key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors flex items-center justify-between ${
                selected?.id === p.id ? "bg-teal-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50"
              }`}>
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                <p className="text-xs text-teal-600 font-mono">{p.patient_code}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.diagnosis || "No diagnosis on record"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${CONSENT_COLORS[p.consent_status] || CONSENT_COLORS.Pending}`}>
                  {p.consent_status}
                </span>
                <ChevronRight size={14} className={`text-gray-300 transition-transform ${selected?.id === p.id ? "rotate-90 text-teal-500" : ""}`} />
              </div>

              {selected?.id === p.id && (
                <div className="absolute" /> // placeholder, expand below instead
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className="bg-white rounded-xl border border-gray-200 mt-4 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-teal-600" />
              <p className="text-sm font-semibold text-gray-800">Patient Details — {selected.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Age</p>
                <p className="text-xs text-gray-700">{selected.age}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Cancer Type</p>
                <p className="text-xs text-gray-700">{selected.cancer_type || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Address</p>
                <p className="text-xs text-gray-700">{selected.address || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Notes / Feedback</p>
                <p className="text-xs text-gray-700">{selected.feedback || "—"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}