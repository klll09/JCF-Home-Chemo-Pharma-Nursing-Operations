import DistributorSidebar from "./DistributorSidebar";

export default function DistributorLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DistributorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}