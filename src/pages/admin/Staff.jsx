import { useState, useEffect } from "react";
import {
  RefreshCw, Search, PlusCircle, AlertTriangle,
  CheckCircle2, Phone, Mail, Stethoscope, Users as UsersIcon, ChevronRight,
  User, MapPin, Award, Sparkles, ShieldCheck, UserPlus
} from "lucide-react";
import { supabase } from "../../superbase";

const STATUS_COLORS = {
  Available: "bg-green-100 text-green-700",
  Unavailable: "bg-gray-100 text-gray-500",
  "On Visit": "bg-blue-100 text-blue-700",
};

export default function AdminStaff() {
  const [tab, setTab] = useState("nurses"); // "nurses" | "doctors"
  const [nurses, setNurses] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState(null);

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "doctor",
    specialization: "",
    area: "",
    skills: "",
    certifications: ""
  });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchAll() {

    const [
      nursesRes,
      doctorsRes,
      usersRes
    ] = await Promise.all([

      supabase
        .from("nurses")
        .select("*")
        .order("created_at", {
          ascending: false
        }),

      supabase
        .from("doctors")
        .select("*")
        .order("created_at", {
          ascending: false
        }),

      supabase
        .from("users")
        .select("id,email,phone")
    ]);

    const usersMap = {};

    (usersRes.data || []).forEach(user => {
      usersMap[user.id] = user;
    });

    const nursesWithUsers =
      (nursesRes.data || []).map(nurse => ({
        ...nurse,
        users: usersMap[nurse.user_id] || null
      }));

    const doctorsWithUsers =
      (doctorsRes.data || []).map(doc => ({
        ...doc,
        users: usersMap[doc.user_id] || null
      }));

    setNurses(nursesWithUsers);

    setDoctors(doctorsWithUsers);


  }

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  };

  const switchTab = (t) => {
    setTab(t);
    setSelected(null);
    setSearch("");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {

      const payload = {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        specialization:
          staffForm.role === "doctor"
            ? staffForm.specialization.trim()
            : null,
        area:
          staffForm.role === "nurse"
            ? staffForm.area.trim()
            : null,
        skills:
          staffForm.role === "nurse"
            ? staffForm.skills.trim()
            : "",
        certifications:
          staffForm.role === "nurse"
            ? staffForm.certifications.trim()
            : ""
      };

      const { data, error } =
        await supabase.functions.invoke(
          "create-staff",
          {
            body: payload
          }
        );

      if (error) {

        let errorMessage = "Failed to create staff.";

        try {

          const responseText =
            await error.context.text();

          const parsed =
            JSON.parse(responseText);

          errorMessage =
            parsed.message || errorMessage;

        } catch {
          errorMessage =
            error.message || errorMessage;
        }

        alert(errorMessage);

        return;
      }

      alert(
        `${staffForm.name} has been successfully registered as a ${staffForm.role}.`
      );

      setSuccess(true);
      setStaffForm({
        name: "",
        email: "",
        phone: "",
        role: "doctor",
        specialization: "",
        area: "",
        skills: "",
        certifications: ""
      });

      await fetchAll();

    } catch (err) {

      console.error(err);

      alert(
        err.message ||
        "Something went wrong."
      );

      setFormError(
        err.message ||
        "Something went wrong."
      );

    } finally {

      setSubmitting(false);

    }
  };

  const list = tab === "nurses" ? nurses : doctors;
  const filtered = list.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.users?.phone || "").includes(search)
  );

  const inputClass =
    "w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 transition-colors";

  const inputWithIconClass =
    "w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50 transition-colors";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* TOP BAR */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Staff Management</h1>
          <p className="text-xs text-gray-400">{nurses.length} nurses · {doctors.length} doctors</p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-60">
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

        {/* TABS */}
        <div className="flex gap-2">
          <button onClick={() => switchTab("nurses")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "nurses" ? "bg-teal-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>
            <UsersIcon size={13} /> Nurses <span className={tab === "nurses" ? "text-teal-100" : "text-gray-400"}>({nurses.length})</span>
          </button>
          <button onClick={() => switchTab("doctors")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "doctors" ? "bg-teal-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>
            <Stethoscope size={13} /> Doctors <span className={tab === "doctors" ? "text-teal-100" : "text-gray-400"}>({doctors.length})</span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex gap-5 flex-1 min-h-0">

          {/* STAFF TABLE */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  {tab === "nurses" ? "Nurse Registry" : "Doctor Registry"}
                </h2>
                <p className="text-xs text-gray-400">{filtered.length} shown</p>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 bg-gray-50 placeholder:text-gray-300" />
              </div>
            </div>

            <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              {(tab === "nurses"
                ? ["Name", "Contact", "Skills / Certs", "Status", ""]
                : ["Name", "Contact", "Specialization", "", ""]
              ).map((h, i) => (
                <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider
                  ${i === 0 ? "col-span-3" : i === 1 ? "col-span-4" : i === 2 ? "col-span-3" : i === 3 ? "col-span-1" : "col-span-1"}`}>
                  {h}
                </span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw size={20} className="text-gray-300 animate-spin" />
                    <p className="text-xs text-gray-400">Loading staff...</p>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <UsersIcon size={16} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No {tab} found.</p>
                </div>
              ) : filtered.map((s, idx) => (
                <div key={s.id}
                  onClick={() => setSelected(selected?.id === s.id ? null : s)}
                  className={`grid grid-cols-12 px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                    selected?.id === s.id ? "bg-teal-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
                  }`}>
                  <div className="col-span-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {s.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                  </div>

                  <div className="col-span-4 flex flex-col justify-center gap-0.5">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <Phone size={10} className="shrink-0 text-gray-400" /> {s.users?.phone || "—"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Mail size={10} className="shrink-0 text-gray-300" /> {s.users?.email || "—"}
                    </span>
                  </div>

                  <div className="col-span-3 flex flex-col justify-center gap-1 py-0.5">
                    {tab === "nurses" ? (
                      <>
                        {s.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {s.skills.slice(0, 2).map((skill, i) => (
                              <span key={i} className="text-[9px] font-medium bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {skill}
                              </span>
                            ))}
                            {s.skills.length > 2 && (
                              <span className="text-[9px] text-gray-400 px-0.5 self-center">+{s.skills.length - 2}</span>
                            )}
                          </div>
                        )}
                        {s.certifications?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {s.certifications.slice(0, 2).map((cert, i) => (
                              <span key={i} className="text-[9px] font-medium bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {cert}
                              </span>
                            ))}
                            {s.certifications.length > 2 && (
                              <span className="text-[9px] text-gray-400 px-0.5 self-center">+{s.certifications.length - 2}</span>
                            )}
                          </div>
                        )}
                        {!s.skills?.length && !s.certifications?.length && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-600 truncate">{s.specialization || "—"}</p>
                    )}
                  </div>

                  {tab === "nurses" ? (
                    <div className="col-span-1 flex items-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${STATUS_COLORS[s.availability_status] || STATUS_COLORS.Unavailable}`}>
                        {s.availability_status || "Unavailable"}
                      </span>
                    </div>
                  ) : (
                    <div className="col-span-1 flex items-center">
                      {s.approval_rights && (
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          <ShieldCheck size={9} /> Approver
                        </span>
                      )}
                    </div>
                  )}

                  <div className="col-span-1 flex items-center justify-center">
                    <ChevronRight size={13} className={`text-gray-300 transition-transform ${selected?.id === s.id ? "rotate-90 text-teal-500" : ""}`} />
                  </div>

                  {selected?.id === s.id && (
                    <div className="col-span-12 mt-3 pt-3 border-t border-teal-100">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg border border-teal-100 p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <Phone size={9} /> Phone
                          </p>
                          <p className="text-xs text-gray-700">{s.users?.phone || "—"}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-teal-100 p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <Mail size={9} /> Email
                          </p>
                          <p className="text-xs text-gray-700">{s.users?.email || "—"}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-teal-100 p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Joined</p>
                          <p className="text-xs text-gray-700">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>

                        {tab === "nurses" && (
                          <>
                            <div className="bg-white rounded-lg border border-teal-100 p-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                <MapPin size={9} /> Area
                              </p>
                              <p className="text-xs text-gray-700">{s.area || "—"}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-teal-100 p-3 col-span-2">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                                <Sparkles size={9} /> Skills
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {s.skills?.length > 0
                                  ? s.skills.map((skill, i) => (
                                      <span key={i} className="text-[10px] font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                                        {skill}
                                      </span>
                                    ))
                                  : <span className="text-xs text-gray-300">—</span>}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg border border-teal-100 p-3 col-span-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                                <Award size={9} /> Certifications
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {s.certifications?.length > 0
                                  ? s.certifications.map((cert, i) => (
                                      <span key={i} className="text-[10px] font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                        {cert}
                                      </span>
                                    ))
                                  : <span className="text-xs text-gray-300">—</span>}
                              </div>
                            </div>
                          </>
                        )}

                        {tab === "doctors" && (
                          <div className="bg-white rounded-lg border border-teal-100 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                              <ShieldCheck size={9} /> Approval Rights
                            </p>
                            <p className="text-xs text-gray-700">{s.approval_rights ? "Yes" : "No"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ADD STAFF FORM */}
          <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shrink-0">

            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <UserPlus size={14} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Add Staff</h2>
                <p className="text-xs text-gray-400 mt-0.5">Register a doctor or nurse</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

                {/* ROLE TOGGLE */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: "doctor", label: "Doctor", icon: Stethoscope },
                      { value: "nurse", label: "Nurse", icon: UsersIcon },
                    ].map(({ value, label, icon: Icon }) => (
                      <button key={value} type="button"
                        onClick={() => setStaffForm(p => ({ ...p, role: value }))}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          staffForm.role === value
                            ? "bg-teal-600 text-white border-transparent shadow-sm"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}>
                        <Icon size={13} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="e.g. Anjali Mehta"
                      className={inputWithIconClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="email" value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      placeholder="e.g. name@example.com"
                      className={inputWithIconClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="+91 98XXXXXXXX" maxLength={10}
                      className={inputWithIconClass} />
                  </div>
                </div>

                {staffForm.role === "doctor" && (
                  <div className="pt-1 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-600 mb-1 mt-3">
                      Specialization <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Stethoscope size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="text" value={staffForm.specialization}
                        onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                        placeholder="e.g. Oncology"
                        className={inputWithIconClass} />
                    </div>
                  </div>
                )}

                {staffForm.role === "nurse" && (
                  <div className="flex flex-col gap-3.5 pt-1 border-t border-gray-100">
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Service Area</label>
                      <div className="relative">
                        <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" value={staffForm.area}
                          onChange={(e) => setStaffForm({ ...staffForm, area: e.target.value })}
                          placeholder="e.g. Dwarka, Delhi"
                          className={inputWithIconClass} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Skills <span className="text-gray-400 font-normal">(comma separated)</span>
                      </label>
                      <div className="relative">
                        <Sparkles size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" value={staffForm.skills}
                          onChange={(e) => setStaffForm({ ...staffForm, skills: e.target.value })}
                          placeholder="e.g. Wound care, IV therapy"
                          className={inputWithIconClass} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Certifications <span className="text-gray-400 font-normal">(comma separated)</span>
                      </label>
                      <div className="relative">
                        <Award size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" value={staffForm.certifications}
                          onChange={(e) => setStaffForm({ ...staffForm, certifications: e.target.value })}
                          placeholder="e.g. GNM, BLS Certified"
                          className={inputWithIconClass} />
                      </div>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{formError}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">Staff registered successfully.</p>
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60 mt-1">
                  <PlusCircle size={13} />
                  {submitting ? "Creating..." : "Register Staff"}
                </button>

              </form>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
