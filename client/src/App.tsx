import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Site from './pages/public/Site';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Exams from './pages/Exams';
import Materials from './pages/Materials';
import Enquiries from './pages/Enquiries';
import Website from './pages/Website';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Site />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="exams" element={<Exams />} />
        <Route path="materials" element={<Materials />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="website" element={<Website />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
