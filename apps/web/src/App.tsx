import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RequestCallbackModal } from "./components/RequestCallbackModal";
import { ScrollToTop } from "./components/ScrollToTop";
import { ChatBot } from "./components/ChatBot";

const CreateMeetingPage = lazy(() => import("./pages/CreateMeetingPage").then((module) => ({ default: module.CreateMeetingPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const JoinMeetingPage = lazy(() => import("./pages/JoinMeetingPage").then((module) => ({ default: module.JoinMeetingPage })));
const HostMeetingPage = lazy(() => import("./pages/HostMeetingPage").then((module) => ({ default: module.HostMeetingPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const VirtualEventsPage = lazy(() => import("./pages/VirtualEventsPage").then((module) => ({ default: module.VirtualEventsPage })));
const VirtualEventsApp = lazy(() => import("./virtual-events/VirtualEventsApp"));
const BookDemoPage = lazy(() => import("./pages/BookDemoPage").then((m) => ({ default: m.BookDemoPage })));
const WebinarServicePage = lazy(() => import("./pages/WebinarServicePage").then((module) => ({ default: module.WebinarServicePage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((module) => ({ default: module.AboutPage })));
const EventRegistrationPage = lazy(() => import("./pages/EventRegistrationPage").then((module) => ({ default: module.EventRegistrationPage })));

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="site-shell"><div className="loading-card">Checking your host session...</div></main>;
  return user ? children : <Navigate to="/login" replace />;
}

// Show chatbot only on public marketing pages
function MarketingChatBot() {
  const location = useLocation();
  const hidden =
    location.pathname.includes("/meetings/") ||
    location.pathname.includes("/join/") ||
    location.pathname.includes("/virtual-events-platform/app") ||
    location.pathname === "/login" ||
    location.pathname === "/register";
  return hidden ? null : <ChatBot />;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <RequestCallbackModal />
        <MarketingChatBot />
        <Suspense fallback={<main className="site-shell"><div className="loading-card">Loading SyncoraXP...</div></main>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/virtual-events-platform" element={<VirtualEventsPage />} />
            <Route path="/book-demo" element={<BookDemoPage />} />
            <Route path="/contact" element={<Navigate to="/book-demo" replace />} />
            <Route path="/virtual-events-platform/book-demo" element={<Navigate to="/book-demo" replace />} />
            <Route path="/virtual-events-platform/app/*" element={<VirtualEventsApp />} />
            <Route path="/virtual events platform/app/*" element={<Navigate to="/virtual-events-platform/app/dashboard/expo-hall" replace />} />
            <Route path="/webinar-service" element={<WebinarServicePage />} />
            <Route path="/webinar-service/meetings" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/event-registration" element={<EventRegistrationPage />} />
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
