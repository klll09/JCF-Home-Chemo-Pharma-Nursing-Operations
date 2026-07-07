import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import DoctorLayout from './components/DoctorLayout'
import NurseLayout from './components/NurseLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './AdminDashboard'
import CareRequests from './pages/admin/CareRequests'
import NurseAssignment from './pages/admin/NurseAssignment'
import Distributors from './pages/admin/Distributors'
import MedicineRequisitions from './pages/admin/MedicineRequisitions'
import DoctorDashboard from './pages/doctor/Dashboard'
import NurseDashboard from './pages/nurse/Dashboard'
import Incidents from './pages/admin/Incidents'
import Patients from './pages/admin/Patients'
import Staff from './pages/admin/Staff'
import ResourceForm from './pages/nurse/ResourceForm'
import DoctorCareRequests from './pages/doctor/CareRequests'
import DoctorSummaries from './pages/doctor/Summaries'
import DoctorPatients from './pages/doctor/Patients'
import Settings from './pages/Settings'
import AdminResources from './pages/admin/Resources'
import DistributorDashboard from "./pages/distributors/Dashboard";
import DistributorLayout from "./components/DistributorLayout";
function RoleRedirect() {
  const { role, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );
  if (role === "Admin") return <Navigate to="/admin/dashboard" />;
  if (role === "Doctor") return <Navigate to="/doctor/dashboard" />;
  if (role === "Nurse") return <Navigate to="/nurse/dashboard" />;
  if (role === "Distributor") return <Navigate to="/distributor/dashboard" />;
  return <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/staff" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><Staff /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/patients" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><Patients /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/care-requests" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><CareRequests /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/nurse-assignment" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><NurseAssignment /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/incidents" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><Incidents /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/patients" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/distributors" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><Distributors /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/requisitions" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><MedicineRequisitions /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/resources" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Layout><AdminResources /></Layout>
          </ProtectedRoute>
        } />

        {/* Doctor */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRoles={["Doctor"]}>
            <DoctorLayout><DoctorDashboard /></DoctorLayout>
          </ProtectedRoute>
        } />
        <Route path="/doctor/care-requests" element={
          <ProtectedRoute allowedRoles={["Doctor"]}>
            <DoctorLayout><DoctorCareRequests /></DoctorLayout>
          </ProtectedRoute>
        } />
        <Route path="/doctor/summaries" element={
          <ProtectedRoute allowedRoles={["Doctor"]}>
            <DoctorLayout><DoctorSummaries /></DoctorLayout>
          </ProtectedRoute>
        } />
        <Route path="/doctor/patients" element={
          <ProtectedRoute allowedRoles={["Doctor"]}>
            <DoctorLayout><DoctorPatients /></DoctorLayout>
          </ProtectedRoute>
        } />
        <Route path="/doctor/settings" element={
          <ProtectedRoute allowedRoles={["Doctor"]}>
            <DoctorLayout><Settings /></DoctorLayout>
          </ProtectedRoute>
        } />

        {/* Nurse */}
        <Route path="/nurse/dashboard" element={
          <ProtectedRoute allowedRoles={["Nurse"]}>
            <NurseLayout><NurseDashboard /></NurseLayout>
          </ProtectedRoute>
        } />
        <Route path="/nurse/reports" element={
          <ProtectedRoute allowedRoles={["Nurse"]}>
            <NurseLayout><ResourceForm /></NurseLayout>
          </ProtectedRoute>
        } />
        <Route path="/nurse/settings" element={
          <ProtectedRoute allowedRoles={["Nurse"]}>
            <NurseLayout><Settings /></NurseLayout>
          </ProtectedRoute>
        } />
<Route
  path="/distributor/dashboard"
  element={
    <ProtectedRoute allowedRoles={["Distributor"]}>
      <DistributorLayout>
        <DistributorDashboard />
      </DistributorLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/distributor/settings"
  element={
    <ProtectedRoute allowedRoles={["Distributor"]}>
      <DistributorLayout>
        <Settings />
      </DistributorLayout>
    </ProtectedRoute>
  }
/>
        
        
      </Routes>
    </Router>
  )
}

export default App