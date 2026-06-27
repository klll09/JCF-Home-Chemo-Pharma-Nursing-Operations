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

        {/* Doctor */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRoles={["Doctor"]}>
            <DoctorLayout><DoctorDashboard /></DoctorLayout>
          </ProtectedRoute>
        } />

        {/* Nurse */}
        <Route path="/nurse/dashboard" element={
          <ProtectedRoute allowedRoles={["Nurse"]}>
            <NurseLayout><NurseDashboard /></NurseLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App