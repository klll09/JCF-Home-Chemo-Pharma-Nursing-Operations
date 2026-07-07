import { useState, useEffect } from "react";
import {
  Truck, PlusCircle, AlertTriangle, CheckCircle2,
  RefreshCw, Phone, MapPin, Package, Mail
} from "lucide-react";
import { supabase } from "../../superbase";

export default function Distributors() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", contact_phone: "", service_area: "" });

  async function fetchDistributors() {
    // email lives on public.users, not on distributors — join through
    // user_id to display it without duplicating/desyncing the data.
    const { data } = await supabase
      .from("distributors")
      .select("*, users(email, phone)")
      .order("name");
    setDistributors(data || []);
  }

  useEffect(() => {
    setLoading(true);
    fetchDistributors().finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Distributor name is required.");
    if (!form.email.trim()) return setFormError("Email is required for login access.");
    if (!form.contact_phone.trim()) return setFormError("Phone number is required.");
    if (!form.service_area.trim()) return setFormError("Service area is required.");

    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("create-staff", {
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.contact_phone.trim(),
        area: form.service_area.trim(),
        role:"distributor"
      },
    });

    setSubmitting(false);

    if (error) {
      let errorMessage = "Failed to create distributor.";
      try {
        const responseText = await error.context.text();
        const parsed = JSON.parse(responseText);
        errorMessage = parsed.message || errorMessage;
      } catch {
        errorMessage = error.message || errorMessage;
      }
      return setFormError(errorMessage);
    }

setForm({ name: "", email: "", contact_phone: "", service_area: "" });

setSuccess(true);

alert("Distributor registered successfully.");

setTimeout(() => setSuccess(false), 4000);

await fetchDistributors();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Distributors</h1>
            <p className="text-xs text-gray-400">Manage pharma and supply partners — only admins can create logins</p>
          </div>
          <button onClick={() => { setLoading(true); fetchDistributors().finally(() => setLoading(false)); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={12} />Refresh
          </button>
        </header>

        <div className="flex-1 flex gap-5 p-6 overflow-hidden">

          {/* DISTRIBUTORS LIST */}
          <div className="flex-1 grid grid-cols-3 gap-4 content-start overflow-y-auto">
            {loading ? (
              <div className="col-span-3 flex items-center justify-center py-16">
                <RefreshCw size={18} className="text-gray-300 animate-spin" />
              </div>
            ) : distributors.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 gap-2">
                <Truck size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">No distributors added yet.</p>
              </div>
            ) : distributors.map(d => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-orange-50 rounded-lg">
                    <Package size={16} className="text-orange-600" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    d.user_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {d.user_id ? "Login Active" : "No Login"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {d.users?.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={11} className="text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-600">{d.users.email}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone size={11} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-600">{d.contact_phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={11} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-600">{d.service_area}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FORM */}
          <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Add Distributor</h2>
              <p className="text-xs text-gray-400 mt-0.5">Creates a login-enabled account, same as staff</p>
            </div>

            <div className="flex-1 px-5 py-4 overflow-y-auto">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Distributor Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. MediSupply India Pvt Ltd"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Login Email <span className="text-red-400">*</span>
                  </label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="e.g. orders@medisupply.com"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Contact Phone <span className="text-red-400">*</span>
                  </label>
                  <input type="tel" name="contact_phone" value={form.contact_phone} onChange={handleChange}
                    placeholder="+91 98XXXXXXXX" maxLength={10}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Service Area <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="service_area" value={form.service_area} onChange={handleChange}
                    placeholder="e.g. Mumbai, Pune, Thane"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-300 bg-gray-50" />
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
                    <p className="text-xs text-green-700 font-medium">Distributor account created.</p>
                  </div>
                )}


                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60">
                  <PlusCircle size={13} />
                  {submitting ? "Creating..." : "Add Distributor"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
