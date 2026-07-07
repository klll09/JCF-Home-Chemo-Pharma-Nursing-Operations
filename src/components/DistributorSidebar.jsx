import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Activity
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/distributor/dashboard"
  }
];

export default function DistributorSidebar() {
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
          <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900">
              JaruratCare
            </p>
            <p className="text-[10px] text-gray-400">
              Distributor Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {NAV.map(({ icon: Icon, label, path }) => (
          <Link
            key={label}
            to={path}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              location.pathname === path
                ? "bg-orange-50 text-orange-700 font-semibold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">

        <Link
          to="/distributor/settings"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
        >
          <Settings size={15} />
          Settings
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
        >
          <LogOut size={15} />
          Sign Out
        </button>

      </div>
    </aside>
  );
}