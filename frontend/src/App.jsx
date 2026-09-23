import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WelcomeBanner from './components/WelcomeBanner';
import StatCards from './components/StatCards';
import Charts from './components/Charts';
import RecentActivityTables from './components/RecentActivityTables';
import StudentsPage from './pages/StudentsPage';
import StaffPage from './pages/StaffPage';
import StaffRegistrationPage from './pages/StaffRegistrationPage';
import ComplaintsPage from './pages/ComplaintsPage';
import StudentComplaintsPage from './pages/StudentComplaintsPage';
import RaiseComplaintPage from './pages/RaiseComplaintPage';
import RoomsPage from './pages/RoomsPage';
import BlockDetailPage from './pages/BlockDetailPage';
import RoomAllocationPage from './pages/RoomAllocationPage';
import ViewStudentDetailsPage from './pages/ViewStudentDetailsPage';
import EditStudentPage from './pages/EditStudentPage';
import ViewStaffDetailsPage from './pages/ViewStaffDetailsPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StaffAttendancePage from './pages/StaffAttendancePage';
import FinancesPage from './pages/FinancesPage';
import StudentFinancePage from './pages/StudentFinancePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { RoomProvider } from './contexts/RoomContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function DashboardView() {
  return (
    <>
      <WelcomeBanner />
      <StatCards />
      <Charts />
      <RecentActivityTables />
    </>
  );
}

/** Routes /complaints to the correct page based on role */
function ComplaintsRoute() {
  const { user } = useAuth();
  return user?.role === 'student' ? <StudentComplaintsPage /> : <ComplaintsPage />;
}

/** Routes /finances to the correct page based on role */
function FinancesRoute() {
  const { user } = useAuth();
  return user?.role === 'student' ? <StudentFinancePage /> : <FinancesPage />;
}

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <RoomProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header handleDrawerToggle={handleDrawerToggle} />
          <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, animation: 'fadeIn 0.5s ease-out' }}>
            <Routes>
              <Route path="/dashboard" element={<DashboardView />} />
              <Route path="/admin/dashboard" element={<DashboardView />} />
              <Route path="/rector/dashboard" element={<DashboardView />} />
              <Route path="/student/dashboard" element={<DashboardView />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<ViewStudentDetailsPage />} />
              <Route path="/students/:id/edit" element={<EditStudentPage />} />
              <Route path="/students/edit/:id" element={<EditStudentPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/staff/:id" element={<ViewStaffDetailsPage />} />
              <Route path="/staff/add" element={<StaffRegistrationPage />} />
              <Route path="/complaints" element={<ComplaintsRoute />} />
              <Route path="/complaints/my" element={<StudentComplaintsPage />} />
              <Route path="/complaints/raise" element={<RaiseComplaintPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/rooms/block/:blockId" element={<BlockDetailPage />} />
              <Route path="/room-allocation" element={<RoomAllocationPage />} />
              <Route path="/attendance/student" element={<StudentAttendancePage />} />
              <Route path="/attendance/staff" element={<StaffAttendancePage />} />
              <Route path="/finances" element={<FinancesRoute />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </RoomProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
