import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../superbase";
import { User, Mail, Phone, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

export default function Settings() {
  const { profile, user, role } = useAuth();
  const [form, setForm] = useState({ area: "", availability_status: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        area: profile.area || "",
        availability_status: profile.availability_status || "Available",
      });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (role !== "Nurse") return;

    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("nurses")
      .update({ area: form.area, availability_status: form.availability_status })
      .eq("id", profile.id);
    setSaving(false);

    if (err) return setError("Failed to update: " + err.message);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const roleColor = role === "Admin" ? "teal" : role === "Doctor" ? "blue" : "purple";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 shrink-0">
        <h1 className="text-base font-semibold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-400">Manage your account preferences</p>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto flex flex-col gap-5">

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-${roleColor}-500 to-${roleColor}-700 flex items-center justify-center text-white text-xl font-bold`}>
              {profile?.name?.[0] || "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{profile?.name || "User"}</h2>
              <p className="text-sm text-gray-500">{role}</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Mail size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Email</p>
                  <p className="text-sm text-gray-700">{user?.email}</p>
                </div>
              </div>

              {role === "Doctor" && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Specialization</p>
                    <p className="text-sm text-gray-700">{profile?.specialization || "—"}</p>
                  </div>
                </div>
              )}

              {role === "Nurse" && profile?.skills?.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s, i) => (
                        <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editable fields — only for nurses for now */}
          {role === "Nurse" && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Availability Settings</h3>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Area</label>
                  <input type="text" value={form.area}
                    onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                    placeholder="e.g. Bandra, Mumbai"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-gray-300 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Availability Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Available", "Unavailable", "On Visit"].map(status => (
                      <button key={status} type="button"
                        onClick={() => setForm(p => ({ ...p, availability_status: status }))}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                          form.availability_status === status
                            ? "bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-300"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">Settings updated successfully.</p>
                  </div>
                )}

                <button type="submit" disabled={saving}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-all disabled:opacity-60">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}