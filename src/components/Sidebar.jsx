import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ClipboardList, UserCheck,
  Truck, Settings, LogOut, Activity, Package, ShieldAlert
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Patients", path: "/admin/patients" },
  { icon: ClipboardList, label: "Care Requests", path: "/admin/care-requests" },
  { icon: UserCheck, label: "Nurse Assignment", path: "/admin/nurse-assignment" },
  { icon: Truck, label: "Distributors", path: "/admin/distributors" },
  { icon: Package, label: "Requisitions", path: "/admin/requisitions" },
  { icon: ShieldAlert, label: "Incidents", path: "/admin/incidents" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">JaruratCare</p>
            <p className="text-[10px] text-gray-400">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Main Menu</p>
        {NAV.map(({ icon: Icon, label, path }) => (
          <Link key={label} to={path}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              location.pathname === path
                ? "bg-teal-50 text-teal-700 font-semibold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}>
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link to="/admin/settings"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <Settings size={15} />Settings
        </Link>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <LogOut size={15} />Sign Out
        </button>
      </div>
    </aside>
  );
}