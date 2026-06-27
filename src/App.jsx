import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DoctorLayout from './components/DoctorLayout'
import AdminDashboard from './AdminDashboard'
import CareRequests from './pages/admin/CareRequests'
import NurseAssignment from './pages/admin/NurseAssignment'
import Distributors from './pages/admin/Distributors'
import DoctorDashboard from './pages/doctor/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/admin/dashboard" element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/admin/care-requests" element={<Layout><CareRequests /></Layout>} />
        <Route path="/admin/nurse-assignment" element={<Layout><NurseAssignment /></Layout>} />
        <Route path="/admin/distributors" element={<Layout><Distributors /></Layout>} />
        <Route path="/doctor/dashboard" element={<DoctorLayout><DoctorDashboard /></DoctorLayout>} />
      </Routes>
    </Router>
  )
}

export default App