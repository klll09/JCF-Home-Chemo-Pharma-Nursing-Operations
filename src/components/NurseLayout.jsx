import NurseSidebar from "./NurseSidebar";

export default function NurseLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <NurseSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}