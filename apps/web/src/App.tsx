import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";

const CreateMeetingPage = lazy(() => import("./pages/CreateMeetingPage").then((module) => ({ default: module.CreateMeetingPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const JoinMeetingPage = lazy(() => import("./pages/JoinMeetingPage").then((module) => ({ default: module.JoinMeetingPage })));
const HostMeetingPage = lazy(() => import("./pages/HostMeetingPage").then((module) => ({ default: module.HostMeetingPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const VirtualEventsPage = lazy(() => import("./pages/VirtualEventsPage").then((module) => ({ default: module.VirtualEventsPage })));

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="site-shell"><div className="loading-card">Checking your host session...</div></main>;
  return user ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<main className="site-shell"><div className="loading-card">Loading SyncoraXP...</div></main>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/virtual-events-platform" element={<VirtualEventsPage />} />
            <Route path="/webinar-service" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/meetings/new" element={<ProtectedRoute><CreateMeetingPage /></ProtectedRoute>} />
            <Route path="/meetings/:meetingId/host" element={<ProtectedRoute><HostMeetingPage /></ProtectedRoute>} />
            <Route path="/join/:joinCode" element={<JoinMeetingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
