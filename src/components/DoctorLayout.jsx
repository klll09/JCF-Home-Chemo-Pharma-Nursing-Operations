import DoctorSidebar from "./DoctorSidebar";

export default function DoctorLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}