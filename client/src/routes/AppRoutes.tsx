// src/routes/AppRoutes.tsx

import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAuthCheck } from "../hooks/useAuthCheck";

import Login from "../pages/auth/LoginPage";
import Register from "../pages/auth/SignupPage";
import Dashboard from "../pages/Dashboard/Dashboard";


//-----Timer Folder------

// import Timer from "@/pages/timerFolder/Timer";

// ── Protected Route ───────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthCheck(); // hits /api/auth/me on every mount

  if (status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <svg className="w-6 h-6 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ── Public Route ──────────────────────────────────────────────────────────────

function PublicRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

// ── Router ────────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Below route path is temp after testing the timer i have to remove this */}

      {/* <Route path="/timer" element={<Timer/>} /> */}

      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}