import './virtual-events.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard
import DashboardLayout from './components/layout/DashboardLayout';
import Lobby from './pages/dashboard/Lobby';
import Auditorium from './pages/dashboard/Auditorium';
import Lounge from './pages/dashboard/Lounge';
import RoundTables from './pages/dashboard/RoundTables';
import MeetingRoom from './pages/dashboard/MeetingRoom';
import Survey from './pages/dashboard/Survey';
import Placeholder from './pages/dashboard/Placeholder';
import Games from './pages/dashboard/Games';
import ExpoHall from './pages/dashboard/ExpoHall';
import Hall from './pages/dashboard/Hall';
import Booth from './pages/dashboard/Booth';

// Admin
import AdminLayout from './components/layout/AdminLayout';
import AdminAuditorium from './pages/admin/AdminAuditorium';
import AdminLounge from './pages/admin/AdminLounge';
import AdminRoundTables from './pages/admin/AdminRoundTables';
import AdminExpoHall from './pages/admin/AdminExpoHall';
import AdminPlaceholder from './pages/admin/AdminPlaceholder';
import AdminSurvey from './pages/admin/AdminSurvey';
import AdminLobby from './pages/admin/AdminLobby';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMeetingRoom from './pages/admin/AdminMeetingRoom';
import AdminPoints from './pages/admin/AdminPoints';
import AdminRegSettings from './pages/admin/AdminRegSettings';
import AdminGameSettings from './pages/admin/AdminGameSettings';

// Base path for all VE routes
const BASE = '/virtual-events-platform/app';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to={`${BASE}/login`} />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user) {
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectUrl');
      return <Navigate to={redirectUrl} />;
    }
    return <Navigate to={`${BASE}/dashboard`} />;
  }
  return children;
};

function VERoutes() {
  return (
    <Routes>
      {/* Default: redirect to login */}
      <Route index element={<Navigate to={`${BASE}/login`} replace />} />

      {/* Auth */}
      <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Dashboard */}
      <Route path="dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="lobby" replace />} />
        <Route path="lobby" element={<Lobby />} />
        <Route path="expo-hall" element={<ExpoHall />} />
        <Route path="expo-hall/:hallId" element={<Hall />} />
        <Route path="expo-hall/:hallId/booth/:boothId" element={<Booth />} />
        <Route path="expo-hall/:hallId/:boothId" element={<Booth />} />
        <Route path="auditorium" element={<Auditorium />} />
        <Route path="lounge" element={<Lounge />} />
        <Route path="round-tables" element={<RoundTables />} />
        <Route path="meeting-room" element={<MeetingRoom />} />
        <Route path="games" element={<Games />} />
        <Route path="survey" element={<Survey />} />
        <Route path="placeholder" element={<Placeholder />} />
      </Route>

      {/* Admin */}
      <Route path="admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="auditorium" replace />} />
        <Route path="auditorium" element={<AdminAuditorium />} />
        <Route path="lounge" element={<AdminLounge />} />
        <Route path="round-tables" element={<AdminRoundTables />} />
        <Route path="lobby" element={<AdminLobby />} />
        <Route path="expo-hall" element={<AdminExpoHall />} />
        <Route path="meeting-room" element={<AdminMeetingRoom />} />
        <Route path="games" element={<AdminPoints />} />
        <Route path="survey" element={<AdminSurvey />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reg-settings" element={<AdminRegSettings />} />
        <Route path="game-settings" element={<AdminGameSettings />} />
        <Route path="placeholder" element={<AdminPlaceholder />} />
      </Route>
    </Routes>
  );
}

/**
 * VirtualEventsApp — isolated entry point for the Virtual Events Platform module.
 * Mounted at /virtual-events-platform/app/* in SyncoraXP's router.
 * Uses its own AuthContext and ToastContext (no conflict with SyncoraXP providers).
 */
export default function VirtualEventsApp() {
  return (
    <ToastProvider>
      <AuthProvider>
        <VERoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
