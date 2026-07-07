import { useState, useEffect } from "react";
import { FolderOpen, RefreshCw, ExternalLink, Search } from "lucide-react";
import { supabase } from "../../superbase";

const RESOURCE_TYPE_COLORS = {
  "Summary Report": "bg-teal-50 text-teal-700",
  "Invoice": "bg-blue-50 text-blue-700",
  "Prescription": "bg-purple-50 text-purple-700",
  "Pharmacy List": "bg-amber-50 text-amber-700",
};

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  async function fetchAll() {
    const [resRes, visRes] = await Promise.all([
      supabase.from("resources")
        .select(`id, resource_type, pdf_url, notes, created_at, visit_id, patient_id`)
        .order("created_at", { ascending: false }),
      supabase.from("visits")
        .select(`id, care_requests(patients(name, patient_code), service_type)`),
    ]);
    setResources(resRes.data || []);
    setVisits(visRes.data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const getPatientFromVisit = (visitId) => {
    const visit = visits.find(v => v.id === visitId);
    return visit?.care_requests?.patients;
  };

  const getServiceFromVisit = (visitId) => {
    const visit = visits.find(v => v.id === visitId);
    return visit?.care_requests?.service_type;
  };

  const filtered = resources.filter(r => {
    const patient = getPatientFromVisit(r.visit_id);
    const matchesSearch =
      (patient?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (patient?.patient_code || "").toLowerCase().includes(search.toLowerCase()) ||
      r.resource_type.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || r.resource_type === filterType;
    return matchesSearch && matchesType;
  });

  const TYPES = ["All", "Summary Report", "Invoice", "Prescription", "Pharmacy List"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Resources</h1>
          <p className="text-xs text-gray-400">All nurse-generated patient reports and documents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient or type..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 bg-gray-50"
            />
          </div>
          <button
            onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">

        {/* TYPE FILTER TABS */}
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filterType === t
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* RESOURCES TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FolderOpen size={14} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-800">All Resources</h2>
            <span className="ml-auto text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {filtered.length} {filterType !== "All" ? filterType : "total"}
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
            {["Patient", "Service", "Type", "Date", "Notes", ""].map((h, i) => (
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
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <FolderOpen size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">No resources found.</p>
              </div>
            ) : filtered.map((r, idx) => {
              const patient = getPatientFromVisit(r.visit_id);
              const service = getServiceFromVisit(r.visit_id);
              return (
                <div key={r.id}
                  className={`grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}>
                  <div className="col-span-3">
                    <p className="text-xs font-semibold text-gray-800">{patient?.name || "—"}</p>
                    <p className="text-[10px] text-teal-600 font-mono">{patient?.patient_code || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600">{service || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${RESOURCE_TYPE_COLORS[r.resource_type] || "bg-gray-100 text-gray-600"}`}>
                      {r.resource_type}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-400 truncate">{r.notes || "—"}</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <a
                      href={r.pdf_url}
                      target="_blank"
                      rel="noreferrer"
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
    </div>
  );
}
