import { useAuth } from "../../hooks/useAuth";
import { User, MapPin, Award, Activity } from "lucide-react";

const STATUS_COLORS = {
  Available: "bg-green-100 text-green-700",
  Unavailable: "bg-red-100 text-red-700",
  "On Visit": "bg-amber-100 text-amber-700",
};

export default function NurseProfile() {
  const { profile, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 shrink-0">
        <h1 className="text-base font-semibold text-gray-900">My Profile</h1>
        <p className="text-xs text-gray-400">Your account and assignment details</p>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-bold">
              {profile?.name?.[0] || "N"}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{profile?.name || "Nurse"}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[profile?.availability_status] || "bg-gray-100 text-gray-600"}`}>
              {profile?.availability_status || "Unknown"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-teal-600" />
                <p className="text-xs font-semibold text-gray-600">Area</p>
              </div>
              <p className="text-sm text-gray-800">{profile?.area || "Not set"}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-teal-600" />
                <p className="text-xs font-semibold text-gray-600">Availability Status</p>
              </div>
              <p className="text-sm text-gray-800">{profile?.availability_status || "Not set"}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Award size={14} className="text-teal-600" />
                <p className="text-xs font-semibold text-gray-600">Skills</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.length > 0 ? (
                  profile.skills.map((skill, i) => (
                    <span key={i} className="text-xs font-medium bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No skills listed</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}