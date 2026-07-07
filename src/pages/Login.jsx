import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle } from "lucide-react";
import { supabase } from "../superbase";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Please enter email and password.");
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const authId = authData.user.id;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role_id")
      .eq("auth_id", authId)
      .single();

    console.log("userData:", userData, "userError:", userError);

    if (!userData?.role_id) {
      setError("No role found. Contact admin.");
      setLoading(false);
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", userData.role_id)
      .single();

    console.log("roleData:", roleData, "roleError:", roleError);

    const role = roleData?.name;

    if (role === "Admin") navigate("/admin/dashboard");
    else if (role === "Doctor") navigate("/doctor/dashboard");
    else if (role === "Nurse") navigate("/nurse/dashboard");
    else if (role === "Distributor") navigate("/distributor/dashboard");
    else {
      setError("No role assigned. Contact admin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-3 shadow-sm">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">JaruratCare</h1>
          <p className="text-sm text-gray-500 mt-1">Home Chemo & Nursing Operations</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Sign in</h2>
          <p className="text-xs text-gray-400 mb-6">Enter your credentials to access your dashboard</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. admin@jcf.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <input type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-all disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">JaruratCare v1.0 · Restricted Access</p>
      </div>
    </div>
  );
}