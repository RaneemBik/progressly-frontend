/**
 * App.tsx — Root Application Component
 *
 * Sets up the two global providers and the client-side router:
 *
 *  StoreProvider   — React Context + useReducer global state
 *                    (user, projects, tasks, members)
 *  ToastProvider   — Toast notification system (replaces window.alert)
 *  BrowserRouter   — React Router v6 for client-side navigation
 *
 * Route map:
 *  /             → LandingPage  (public)
 *  /login        → LoginPage    (public)
 *  /register     → RegisterPage (public)
 *  /dashboard    → Dashboard    (redirects to /login if not authenticated)
 *  /projects/:id → ProjectPage  (redirects to /login if not authenticated)
 *  *             → redirect to /
 *
 * Footer is rendered only on the landing page (/).
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './src/store/useStore';
import { ToastProvider } from './src/components/ui/Toast';
import { Navbar } from './src/components/layout/Navbar';
import { Footer } from './src/components/layout/Footer';
import { LandingPage } from './src/pages/LandingPage';
import { LoginPage } from './src/pages/LoginPage';
import { RegisterPage } from './src/pages/RegisterPage';
import { Dashboard } from './src/pages/Dashboard';
import { ProjectPage } from './src/pages/ProjectPage';

export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-brand-dark text-brand-text font-sans">
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/"             element={<LandingPage />} />
                <Route path="/login"        element={<LoginPage />} />
                <Route path="/register"     element={<RegisterPage />} />
                <Route path="/dashboard"    element={<Dashboard />} />
                <Route path="/projects/:id" element={<ProjectPage />} />
                <Route path="*"             element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Routes>
              <Route path="/"  element={<Footer />} />
              <Route path="*"  element={null} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </StoreProvider>
  );
}
