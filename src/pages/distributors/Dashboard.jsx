import { useState, useEffect } from "react";
import {
  Package, RefreshCw, ChevronRight, Clock, MapPin,
  Truck, CheckCircle2, ClipboardList, AlertTriangle
} from "lucide-react";
import { supabase } from "../../superbase";
import { useAuth } from "../../hooks/useAuth";
import DistributorProfileMenu from "../../components/DistributorProfileMenu";

const STATUS_FLOW = ["RequisitionCreated", "Accepted", "Packed", "Dispatched", "OutForDelivery", "Delivered"];

const STATUS_COLORS = {
  RequisitionCreated: "bg-gray-100 text-gray-600",
  Accepted: "bg-blue-100 text-blue-700",
  Packed: "bg-purple-100 text-purple-700",
  Dispatched: "bg-amber-100 text-amber-700",
  OutForDelivery: "bg-orange-100 text-orange-700",
  Delivered: "bg-green-100 text-green-700",
};

const NEXT_ACTION_LABEL = {
  RequisitionCreated: "Accept Order",
  Accepted: "Mark as Packed",
  Packed: "Mark as Dispatched",
  Dispatched: "Mark Out for Delivery",
  OutForDelivery: "Mark as Delivered",
};

function getNextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

export default function DistributorDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [actionError, setActionError] = useState("");

  async function fetchOrders() {
  if (!profile?.id) return;

  // First get the distributor record linked to this user
  const { data: distData } = await supabase
    .from("distributors")
    .select("id")
    .eq("user_id", profile.id)
    .single();

  // If no distributor record, just fetch all for now
  const query = supabase
    .from("medicine_requisitions")
    .select(`id, status, delivery_deadline,
      accepted_at, packed_at, dispatch_time,
      out_for_delivery_at, delivered_at,
      cold_chain_confirmation, created_at,
      care_requests(service_type, scheduled_date, location, required_medicines,
        patients(name, patient_code, address, phone))`)
    .order("created_at", { ascending: false });

  if (distData?.id) {
    query.eq("distributor_id", distData.id);
  }

  const { data, error } = await query;
  if (!error) setOrders(data || []);
}

  useEffect(() => {
    if (profile?.id) {
      setLoading(true);
      fetchOrders().finally(() => setLoading(false));
    }
  }, [profile]);

  const handleAdvanceStatus = async (order) => {
    const next = getNextStatus(order.status);
    if (!next) return;

    setActionError("");
    setUpdating(order.id);

    const updateData = { status: next };

  if (next === "Accepted")
    updateData.accepted_at = new Date().toISOString();

  if (next === "Packed")
    updateData.packed_at = new Date().toISOString();

  if (next === "Dispatched")
    updateData.dispatch_time = new Date().toISOString();

  if (next === "OutForDelivery")
    updateData.out_for_delivery_at = new Date().toISOString();

  if (next === "Delivered")
    updateData.delivered_at = new Date().toISOString();

    const { error } = await supabase
      .from("medicine_requisitions")
      .update(updateData)
      .eq("id", order.id);

    setUpdating(null);

    if (error) {
      setActionError("Couldn't update status: " + error.message);
      return;
    }
    await fetchOrders();
    if (selected?.id === order.id) setSelected(p => ({ ...p, status: next }));
  };

  const stats = {
    awaitingAcceptance: orders.filter(o => o.status === "RequisitionCreated").length,
    inProgress: orders.filter(o => !["RequisitionCreated", "Delivered"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "Delivered").length,
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Distributor Dashboard</h1>
          <p className="text-xs text-gray-400">Orders assigned to {profile?.name || "you"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setLoading(true); fetchOrders().finally(() => setLoading(false)); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
          </button>
          <DistributorProfileMenu />
        </div>
      </header>

    <div className="flex-1 overflow-hidden p-6 flex flex-col gap-5 min-h-0">

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 bg-gray-50 rounded-lg"><ClipboardList size={16} className="text-gray-500" /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.awaitingAcceptance}</p>
              <p className="text-xs text-gray-400">Awaiting Acceptance</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-lg"><Truck size={16} className="text-orange-600" /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-xs text-gray-400">In Progress</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle2 size={16} className="text-green-600" /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.delivered}</p>
              <p className="text-xs text-gray-400">Delivered</p>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{actionError}</p>
          </div>
        )}

        {/* ORDERS LIST */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden flex-1 min-h-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">My Orders</h2>
            <p className="text-xs text-gray-400">{orders.length} total</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={18} className="text-gray-300 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Package size={32} className="text-gray-200" />
              <p className="text-sm text-gray-400">No orders assigned to you yet.</p>
            </div>
          ) : orders.map((o, idx) => {
            const next = getNextStatus(o.status);
            return (
              <div key={o.id}
                onClick={() => setSelected(selected?.id === o.id ? null : o)}
                className={`px-5 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                  selected?.id === o.id ? "bg-orange-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50"
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {o.care_requests?.patients?.name || "—"}
                    </p>
                    <p className="text-xs text-teal-600 font-mono">{o.care_requests?.patients?.patient_code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{o.care_requests?.service_type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock size={11} />
                      <span className="text-xs">
                        {o.delivery_deadline
                          ? new Date(o.delivery_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : "—"}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${STATUS_COLORS[o.status] || STATUS_COLORS.RequisitionCreated}`}>
                      {o.status}
                    </span>
                    {next && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(o); }}
                        disabled={updating === o.id}
                        className="text-[10px] font-semibold px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition disabled:opacity-60 whitespace-nowrap">
                        {updating === o.id ? "..." : NEXT_ACTION_LABEL[o.status]}
                      </button>
                    )}
                    <ChevronRight size={14} className={`text-gray-300 transition-transform ${selected?.id === o.id ? "rotate-90 text-orange-500" : ""}`} />
                  </div>
                </div>

                {selected?.id === o.id && (
                  <div className="mt-3 pt-3 border-t border-orange-100 grid grid-cols-3 gap-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 col-span-3">
  <p className="text-[10px] font-semibold text-orange-700 uppercase mb-1">
    Required Medicines
  </p>
  <p className="text-xs text-gray-700 whitespace-pre-line">
    {o.care_requests?.required_medicines || "Not Provided"}
  </p>
</div>
                    <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                        <MapPin size={9} />Delivery Address
                      </p>
                      <p className="text-xs text-gray-700">
                        {o.care_requests?.location || o.care_requests?.patients?.address || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Cold Chain</p>
                      <p className="text-xs text-gray-700">{o.cold_chain_confirmation}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
    Accepted At
  </p>
  <p className="text-xs text-gray-700">
    {o.accepted_at
      ? new Date(o.accepted_at).toLocaleString("en-IN")
      : "—"}
  </p>
</div>

<div className="bg-gray-50 rounded-lg p-3">
  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
    Packed At
  </p>
  <p className="text-xs text-gray-700">
    {o.packed_at
      ? new Date(o.packed_at).toLocaleString("en-IN")
      : "—"}
  </p>
</div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Dispatched At</p>
                      <p className="text-xs text-gray-700">
                        {o.dispatch_time ? new Date(o.dispatch_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Out for Delivery</p>
                      <p className="text-xs text-gray-700">
                        {o.out_for_delivery_at ? new Date(o.out_for_delivery_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Delivered At</p>
                      <p className="text-xs text-gray-700">
                        {o.delivered_at ? new Date(o.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}
