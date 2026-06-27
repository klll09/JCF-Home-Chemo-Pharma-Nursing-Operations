import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import CareRequests from './pages/admin/CareRequests'
import NurseAssignment from './pages/admin/NurseAssignment'
import Distributors from './pages/admin/Distributors'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/care-requests" element={<CareRequests />} />
        <Route path="/admin/nurse-assignment" element={<NurseAssignment />} />
        <Route path="/admin/distributors" element={<Distributors />} />
      </Routes>
    </Router>
  )
}

export default App