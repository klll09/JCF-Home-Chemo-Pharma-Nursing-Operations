import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, FileText,
  Users, Settings, LogOut, Activity
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/doctor/dashboard" },
  { icon: ClipboardList, label: "Care Requests", path: "/doctor/care-requests" },
  { icon: FileText, label: "Summaries", path: "/doctor/summaries" },
  { icon: Users, label: "My Patients", path: "/doctor/patients" },
];

export default function DoctorSidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">JaruratCare</p>
            <p className="text-[10px] text-gray-400">Doctor Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Menu</p>
        {NAV.map(({ icon: Icon, label, path }) => (
          <Link key={label} to={path}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              location.pathname === path
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}>
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <Settings size={15} />Settings
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <LogOut size={15} />Sign Out
        </button>
      </div>
    </aside>
  );
}