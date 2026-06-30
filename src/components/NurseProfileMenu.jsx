import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const STATUS_COLORS = {
  Available: "bg-green-100 text-green-700",
  Unavailable: "bg-red-100 text-red-700",
  "On Visit": "bg-amber-100 text-amber-700",
};

export default function NurseProfileMenu() {
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition">
        {profile?.availability_status && (
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[profile.availability_status] || "bg-gray-100 text-gray-600"}`}>
            {profile.availability_status}
          </span>
        )}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
          {profile?.name?.[0] || "N"}
        </div>
        <div className="leading-none text-left">
          <p className="text-xs font-semibold text-gray-700">{profile?.name || "Nurse"}</p>
          <p className="text-[10px] text-gray-400">{profile?.area || "Nurse"}</p>
        </div>
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-11 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-800">{profile?.name || "Nurse"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail size={11} className="text-gray-400" />
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition">
            <LogOut size={13} />Sign Out
          </button>
        </div>
      )}
    </div>
  );
}