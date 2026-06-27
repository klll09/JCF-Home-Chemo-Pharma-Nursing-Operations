import { useState, useEffect } from "react";
import {
  Package, PlusCircle, AlertTriangle, CheckCircle2,
  RefreshCw, ChevronRight, Clock, Truck
} from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  RequisitionCreated: "bg-gray-100 text-gray-600",
  Accepted: "bg-blue-100 text-blue-700",
  Packed: "bg-purple-100 text-purple-700",
  Dispatched: "bg-amber-100 text-amber-700",
  Delivered: "bg-green-100 text-green-700",
};

export default function MedicineRequisitions() {
  const [requisitions, setRequisitions] = useState([]);
  const [careRequests, setCareRequests] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    care_request_id: "",
    distributor_id: "",
    delivery_deadline: "",
    cold_chain_confirmation: "Not applicable",
  });

  async function fetchAll() {
    const [reqs, careReqs, dists] = await Promise.all([
      supabase.from("medicine_requisitions")
        .select(`id, status, delivery_deadline, dispatch_time, delivered_at, cold_chain_confirmation, created_at,
          care_requests(service_type, scheduled_date, patients(name, patient_code)),
          distributors(name, contact_phone, service_area)`)
        .order("created_at", { ascending: false }),
      supabase.from("care_requests")
        .select("id, service_type, scheduled_date, patients(name, patient_code)")
        .eq("medicine_required", true)
        .in("status", ["DoctorApproved", "Scheduled"]),
      supabase.from("distributors").select("id, name, contact_phone, service_area").order("name"),
    ]);
    setRequisitions(reqs.data || []);
    setCareRequests(careReqs.data || []);
    setDistributors(dists.data || []);
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
    if (!form.care_request_id) return setFormError("Please select a care request.");
    if (!form.distributor_id) return setFormError("Please select a distributor.");
    if (!form.delivery_deadline) return setFormError("Please set a delivery deadline.");

    setSubmitting(true);
    const { error } = await supabase.from("medicine_requisitions").insert({
      care_request_id: form.care_request_id,
      distributor_id: form.distributor_id,
      delivery_deadline: form.delivery_deadline,
      cold_chain_confirmation: form.cold_chain_confirmation,
      status: "RequisitionCreated",
    });
    setSubmitting(false);

    if (error) return setFormError("Failed to create: " + error.message);

    setForm({ care_request_id: "", distributor_id: "", delivery_deadline: "", cold_chain_confirmation: "Not applicable" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    await fetchAll();
  };

  const handleStatusUpdate = async (reqId, newStatus) => {
    setUpdating(reqId);
    const updateData = { status: newStatus };
    if (newStatus === "Dispatched") updateData.dispatch_time = new Date().toISOString();
    if (newStatus === "Delivered") updateData.delivered_at = new Date().toISOString();

    await supabase.from("medicine_requisitions").update(updateData).eq("id", reqId);
    setUpdating(null);
    await fetchAll();
  };

  const getNextStatus = (current) => {
    const flow = ["RequisitionCreated", "Accepted", "Packed", "Dispatched", "Delivered"];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Medicine Requisitions</h1>
          <p className="text-xs text-gray-400">Manage distributor orders for care requests</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={12} />Refresh
        </button>
      </header>

      <div className="flex-1 flex gap-5 p-6 overflow-hidden">

        {/* REQUISITIONS LIST */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">All Requisitions</h2>
            <p className="text-xs text-gray-400">{requisitions.length} total</p>
          </div>

          <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
            {["Patient", "Distributor", "Deadline", "Status", "Action", ""].map((h, i) => (
              <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider
                ${i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-1"}`}>
                {h}
              </span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={18} className="text-gray-300 animate-spin" />
              </div>
            ) : requisitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Package size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">No requisitions yet.</p>
              </div>
            ) : requisitions.map((r, idx) => (
              <div key={r.id}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
                className={`grid grid-cols-12 px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                  selected?.id === r.id ? "bg-teal-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
                }`}>
                <div className="col-span-3 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-800">{r.care_requests?.patients?.name || "—"}</p>
                  <p className="text-[10px] text-teal-600 font-mono">{r.care_requests?.patients?.patient_code || "—"}</p>
                  <p className="text-[10px] text-gray-400">{r.care_requests?.service_type}</p>
                </div>
                <div className="col-span-2 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-700">{r.distributors?.name || "—"}</p>
                  <p className="text-[10px] text-gray-400">{r.distributors?.service_area}</p>
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <Clock size={11} className="text-gray-400" />
                  <p className="text-xs text-gray-600">
                    {new Date(r.delivery_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${STATUS_COLORS[r.status] || STATUS_COLORS.RequisitionCreated}`}>
                    {r.status}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  {getNextStatus(r.status) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(r.id, getNextStatus(r.status)); }}
                      disabled={updating === r.id}
                      className="text-[10px] font-semibold px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition disabled:opacity-60">
                      {updating === r.id ? "..." : `→ ${getNextStatus(r.status)}`}
                    </button>
                  )}
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <ChevronRight size={13} className={`text-gray-300 transition-transform ${selected?.id === r.id ? "rotate-90 text-teal-500" : ""}`} />
                </div>

                {selected?.id === r.id && (
                  <div className="col-span-12 mt-2 pt-3 border-t border-teal-100">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg border border-teal-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Distributor Phone</p>
                        <p className="text-xs text-gray-700">{r.distributors?.contact_phone || "—"}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-teal-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Cold Chain</p>
                        <p className="text-xs text-gray-700">{r.cold_chain_confirmation}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-teal-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Dispatched At</p>
                        <p className="text-xs text-gray-700">
                          {r.dispatch_time ? new Date(r.dispatch_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </p>
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
            <h2 className="text-sm font-semibold text-gray-800">New Requisition</h2>
            <p className="text-xs text-gray-400 mt-0.5">Only care requests with medicine required appear here</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Care Request <span className="text-red-400">*</span>
                </label>
                <select name="care_request_id" value={form.care_request_id} onChange={handleChange}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                  <option value="">Select care request</option>
                  {careRequests.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.patients?.name} — {r.service_type}
                    </option>
                  ))}
                </select>
                {careRequests.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">No care requests with medicine required found.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Distributor <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Truck size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select name="distributor_id" value={form.distributor_id} onChange={handleChange}
                    className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                    <option value="">Select distributor</option>
                    {distributors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.service_area}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Delivery Deadline <span className="text-red-400">*</span>
                </label>
                <input type="datetime-local" name="delivery_deadline" value={form.delivery_deadline}
                  onChange={handleChange}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cold Chain Required</label>
                <div className="flex gap-2">
                  {["Yes", "No", "Not applicable"].map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm(p => ({ ...p, cold_chain_confirmation: opt }))}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                        form.cold_chain_confirmation === opt
                          ? "bg-teal-50 text-teal-700 border-teal-300 ring-1 ring-teal-300"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
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
                  <p className="text-xs text-green-700 font-medium">Requisition created successfully.</p>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                <PlusCircle size={13} />
                {submitting ? "Creating..." : "Create Requisition"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}