/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useNavigate,
  useLocation,
  Outlet
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { platformService } from './services/platform';
import { App as CapacitorApp } from '@capacitor/app';

// Import Screens/Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import AddDonation from './pages/AddDonation';
import DonationList from './pages/DonationList';
import DonationDetails from './pages/DonationDetails';
import NgoDashboard from './pages/NgoDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// Import Layout Components
import Sidebar from './components/Sidebar';
import { Loader } from 'lucide-react';

// Wrapper to redirect to appropriate dashboard depending on role
function RoleBasedHome() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'Donor':
      return <DonorDashboard />;
    case 'NGO':
      return <NgoDashboard />;
    case 'Volunteer':
      return <VolunteerDashboard />;
    case 'Admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/profile" replace />;
  }
}

// Public-only route wrapper (redirects to / if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Authorizing secure FoodBridge connection...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Protected layout requiring user authentication and injecting global notifications sidebar
function ProtectedLayout() {
  const { user, loading, notifications } = useAuth();
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string } | null>(null);
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // On mount, cache the latest notification ID so it doesn't pop up immediately on page refresh
      if (!lastNotifId) {
        setLastNotifId(latest.id);
        return;
      }
      
      // Trigger Toast alert on new unread notifications
      if (latest.id !== lastNotifId && !latest.read) {
        setActiveToast({
          id: latest.id,
          title: latest.title,
          body: latest.body
        });
        setLastNotifId(latest.id);
        
        // Auto-dismiss after 6 seconds
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, lastNotifId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Authorizing secure FoodBridge connection...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen" id="app-authenticated-wrapper">
      {/* Platform Sidebar */}
      <Sidebar />
      
      {/* Dynamic Screen Viewport Container */}
      <main className="flex-1 overflow-x-hidden flex flex-col justify-between" id="app-viewport">
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>

      {/* Floating In-App Toast Notification */}
      {activeToast && (
        <div 
          className="fixed bottom-20 right-4 md:top-4 md:bottom-auto z-50 max-w-sm w-full bg-emerald-600 border border-emerald-500 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-toast cursor-pointer hover:bg-emerald-700 transition-all"
          onClick={() => setActiveToast(null)}
        >
          <div className="bg-white/20 p-2 rounded-xl text-white">
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-black uppercase tracking-wider">{activeToast.title}</h4>
            <p className="text-2xs font-medium leading-relaxed opacity-90">{activeToast.body}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveToast(null); }} 
            className="text-white/60 hover:text-white text-xs font-bold leading-none p-1 font-sans"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Setup Status Bar on boot
    platformService.setupStatusBar();

    // 2. Setup Back Button Listener
    if (platformService.isNative()) {
      const handleBackButton = async () => {
        // If we are on login, register, or role-based home (/), exit the app
        if (
          location.pathname === '/' ||
          location.pathname === '/login' ||
          location.pathname === '/register'
        ) {
          CapacitorApp.exitApp();
        } else {
          // Otherwise navigate back
          navigate(-1);
        }
      };

      const listenerPromise = CapacitorApp.addListener('backButton', handleBackButton);

      return () => {
        listenerPromise.then(l => l.remove());
      };
    }
  }, [navigate, location.pathname]);

  return null;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Authentication routes (Redirects if user logged in) */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Secure Layout wrapping all dashboard screens */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<RoleBasedHome />} />
        <Route path="/add-donation" element={user && user.role === 'Donor' ? <AddDonation /> : <Navigate to="/" replace />} />
        <Route path="/donations" element={<DonationList />} />
        <Route path="/donations/:donationId" element={<DonationDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={user && user.role === 'Admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <BackButtonHandler />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
