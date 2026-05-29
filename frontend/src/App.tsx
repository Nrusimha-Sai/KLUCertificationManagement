import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useSocket } from '@/hooks/useSocket';

// Lazy-loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const StudentCertificationsPage = lazy(() => import('@/pages/student/StudentCertificationsPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const CoursesPage = lazy(() => import('@/pages/admin/CoursesPage'));
const StudentsPage = lazy(() => import('@/pages/admin/StudentsPage'));

// TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Loading screen
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-klu-darker flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Socket initializer — always call the hook (hook handles the condition internally)
function SocketInitializer() {
  useSocket();
  return null;
}

function AppRoutes() {
  return (
    <>
      <SocketInitializer />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Protected */}
          <Route element={<ProtectedRoute requiredRole="STUDENT" />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/certifications" element={<StudentCertificationsPage />} />
          </Route>

          {/* Admin Protected */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<CoursesPage />} />
            <Route path="/admin/students" element={<StudentsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
