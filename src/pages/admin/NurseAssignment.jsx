import { useState, useEffect } from "react";
import {
  UserCheck, RefreshCw, CheckCircle2, AlertTriangle,
  ChevronRight, Clock, MapPin, User, Shield
} from "lucide-react";
import { supabase } from "../../superbase";

const AVAILABILITY_COLORS = {
  Available: "bg-green-100 text-green-700",
  Unavailable: "bg-red-100 text-red-700",
  "On Visit": "bg-amber-100 text-amber-700",
};

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  DoctorApproved: "bg-blue-100 text-blue-700",
  Scheduled: "bg-teal-100 text-teal-700",
  Completed: "bg-green-100 text-green-700",
};

export default function NurseAssignment() {
  const [careRequests, setCareRequests] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ primary_nurse_id: "", standby_nurse_id: "" });

  async function fetchAll() {
    const [reqs, nurs, assigns] = await Promise.all([
      supabase.from("care_requests")
        .select(`id, service_type, scheduled_date, location, status,
          patients(name, patient_code),
          doctors(name)`)
        .in("status", ["DoctorApproved", "Scheduled"])
        .order("scheduled_date", { ascending: true }),
      supabase.from("nurses")
        .select("id, name, skills, area, availability_status")
        .order("name"),
      supabase.from("visit_assignments")
        .select(`id, care_request_id, role, status, nurses(name)`),
    ]);
    setCareRequests(reqs.data || []);
    setNurses(nurs.data || []);
    setAssignments(assigns.data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const getAssignmentsForRequest = (requestId) =>
    assignments.filter(a => a.care_request_id === requestId);

  const handleSelectRequest = (req) => {
    setSelectedRequest(selectedRequest?.id === req.id ? null : req);
    setForm({ primary_nurse_id: "", standby_nurse_id: "" });
    setFormError("");
    setSuccess(false);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.primary_nurse_id) return setFormError("Please select a primary nurse.");
    if (!form.standby_nurse_id) return setFormError("Please select a standby nurse.");
    if (form.primary_nurse_id === form.standby_nurse_id) return setFormError("Primary and standby must be different nurses.");

    setSubmitting(true);

    // Delete existing assignments for this request first
    await supabase.from("visit_assignments")
      .delete()
      .eq("care_request_id", selectedRequest.id);

    // Insert primary + standby
    const { error } = await supabase.from("visit_assignments").insert([
      {
        care_request_id: selectedRequest.id,
        nurse_id: form.primary_nurse_id,
        role: "Primary",
        status: "PrimaryAssigned",
        assigned_by: null,
      },
      {
        care_request_id: selectedRequest.id,
        nurse_id: form.standby_nurse_id,
        role: "Standby",
        status: "StandbyAssigned",
        assigned_by: null,
      },
    ]);

    // Update care_request status to Scheduled
    if (!error) {
      await supabase.from("care_requests")
        .update({ status: "Scheduled" })
        .eq("id", selectedRequest.id);
    }

    setSubmitting(false);
    if (error) return setFormError("Failed to assign: " + error.message);

    setSuccess(true);
    setForm({ primary_nurse_id: "", standby_nurse_id: "" });
    setTimeout(() => setSuccess(false), 3000);
    await fetchAll();
  };

  const availableNurses = nurses.filter(n => n.availability_status === "Available");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Nurse Assignment</h1>
            <p className="text-xs text-gray-400">Assign primary and standby nurses to approved care requests</p>
          </div>
          <button onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={12} />Refresh
          </button>
        </header>

        <div className="flex-1 flex gap-5 p-6 overflow-hidden">

          {/* LEFT — CARE REQUESTS NEEDING ASSIGNMENT */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Approved Care Requests</h2>
              <p className="text-xs text-gray-400">Click a request to assign nurses</p>
            </div>

            <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              {["Patient", "Service", "Doctor", "Date", "Status", "Assigned"].map((h, i) => (
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
              ) : careRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <UserCheck size={32} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No approved care requests.</p>
                  <p className="text-xs text-gray-400">Care requests need to be approved by a doctor first.</p>
                </div>
              ) : careRequests.map((r, idx) => {
                const reqAssignments = getAssignmentsForRequest(r.id);
                const isAssigned = reqAssignments.length >= 2;
                return (
                  <div key={r.id}
                    onClick={() => handleSelectRequest(r)}
                    className={`grid grid-cols-12 px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                      selectedRequest?.id === r.id ? "bg-teal-50 border-l-2 border-l-teal-500" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
                    }`}>
                    <div className="col-span-3 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-gray-800">{r.patients?.name || "—"}</p>
                      <p className="text-[10px] text-teal-600 font-mono">{r.patients?.patient_code || "—"}</p>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <p className="text-xs text-gray-600">{r.service_type}</p>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <p className="text-xs text-gray-600 truncate">{r.doctors?.name || "—"}</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <Clock size={11} className="text-gray-400" />
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
                      {isAssigned
                        ? <CheckCircle2 size={14} className="text-green-500" />
                        : <ChevronRight size={13} className={`text-gray-300 transition-transform ${selectedRequest?.id === r.id ? "rotate-90 text-teal-500" : ""}`} />
                      }
                    </div>

                    {/* Expanded — show current assignments */}
                    {selectedRequest?.id === r.id && reqAssignments.length > 0 && (
                      <div className="col-span-12 mt-2 pt-3 border-t border-teal-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Current Assignments</p>
                        <div className="flex gap-3">
                          {reqAssignments.map(a => (
                            <div key={a.id} className="bg-white border border-teal-100 rounded-lg px-3 py-2 flex items-center gap-2">
                              <Shield size={12} className={a.role === "Primary" ? "text-teal-500" : "text-gray-400"} />
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500">{a.role}</p>
                                <p className="text-xs text-gray-800">{a.nurses?.name || "—"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto">
             {/* ASSIGN FORM */}
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden max-h-[60vh]">
              <div className="px-5 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-sm font-semibold text-gray-800">Assign Nurses</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedRequest
                    ? `For: ${selectedRequest.patients?.name}`
                    : "Select a care request first"}
                </p>
              </div>

              <div className="px-5 py-4 overflow-y-auto">
                {!selectedRequest ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <UserCheck size={28} className="text-gray-200" />
                    <p className="text-xs text-gray-400 text-center">Click a care request on the left to assign nurses</p>
                  </div>
                ) : (
                  <form onSubmit={handleAssign} className="flex flex-col gap-3.5">

                    {/* Selected request info */}
                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
                      <p className="text-xs font-semibold text-teal-700">{selectedRequest.service_type}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={10} className="text-teal-500" />
                        <p className="text-[10px] text-teal-600">{selectedRequest.location}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-teal-500" />
                        <p className="text-[10px] text-teal-600">
                          {new Date(selectedRequest.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    {/* Primary Nurse */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Primary Nurse <span className="text-red-400">*</span>
                      </label>
                      <select value={form.primary_nurse_id}
                        onChange={e => setForm(p => ({ ...p, primary_nurse_id: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                        <option value="">Select primary nurse</option>
                        {availableNurses.map(n => (
                          <option key={n.id} value={n.id}>
                            {n.name} {n.area ? `· ${n.area}` : ""}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Will conduct the visit</p>
                    </div>

                    {/* Standby Nurse */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Standby Nurse <span className="text-red-400">*</span>
                      </label>
                      <select value={form.standby_nurse_id}
                        onChange={e => setForm(p => ({ ...p, standby_nurse_id: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 appearance-none">
                        <option value="">Select standby nurse</option>
                        {availableNurses
                          .filter(n => n.id !== form.primary_nurse_id)
                          .map(n => (
                            <option key={n.id} value={n.id}>
                              {n.name} {n.area ? `· ${n.area}` : ""}
                            </option>
                          ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Backup if primary is unavailable</p>
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
                        <p className="text-xs text-green-700 font-medium">Nurses assigned successfully.</p>
                      </div>
                    )}

                    <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                      <UserCheck size={13} />
                      {submitting ? "Assigning..." : "Confirm Assignment"}
                    </button>
                  </form>
                )}
              </div>
            </div>


            {/* AVAILABLE NURSES LIST */}
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">Available Nurses</h2>
                <p className="text-xs text-gray-400">{availableNurses.length} ready for deployment</p>
              </div>
              <div className="overflow-y-auto max-h-64 divide-y divide-gray-50">
                {nurses.length === 0 ? (
                  <p className="text-xs text-gray-400 p-4 text-center">No nurses in system.</p>
                ) : nurses.map(n => (
                  <div key={n.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <User size={13} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{n.name}</p>
                        <p className="text-[10px] text-gray-400">{n.area || "No area set"}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${AVAILABILITY_COLORS[n.availability_status] || "bg-gray-100 text-gray-600"}`}>
                      {n.availability_status}
                    </span>
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