import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  List, 
  User, 
  LogOut, 
  Shield, 
  Bell, 
  Heart, 
  Truck,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout, notifications, markNotificationsAsRead } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 font-semibold'
        : 'text-slate-500 hover:bg-gray-50'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-slate-500'
    }`;

  return (
    <>
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:flex flex-col min-h-screen" id="app-sidebar">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">FoodBridge</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {/* Role-Specific Dashboard redirection */}
        <NavLink 
          to="/" 
          end
          className={navLinkClass}
        >
          <Home className="w-5 h-5" />
          Dashboard
        </NavLink>

        {/* Donor Links */}
        {user.role === 'Donor' && (
          <NavLink 
            to="/add-donation" 
            className={navLinkClass}
          >
            <PlusCircle className="w-5 h-5" />
            Add Donation
          </NavLink>
        )}

        {/* Link to view all donations */}
        <NavLink 
          to="/donations" 
          className={navLinkClass}
        >
          <List className="w-5 h-5" />
          Browse Donations
        </NavLink>

        {/* Profile Link */}
        <NavLink 
          to="/profile" 
          className={navLinkClass}
        >
          <User className="w-5 h-5" />
          My Profile
        </NavLink>

        {/* Administration Links */}
        {user.role === 'Admin' && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-rose-50 text-rose-700 font-semibold' 
                  : 'text-slate-500 hover:bg-gray-50'
              }`
            }
          >
            <Shield className="w-5 h-5" />
            Admin Portal
          </NavLink>
        )}
      </nav>

      {/* Alerts / Notifications Trigger */}
      <div className="relative px-4 py-2 border-t border-gray-100">
        <button 
          onClick={() => {
            setShowNotifications(!showNotifications);
            if (!showNotifications && unreadCount > 0) {
              markNotificationsAsRead();
            }
          }}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-gray-50 hover:text-slate-900 transition-colors"
          id="btn-sidebar-notifs"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-400" />
            <span>Alerts</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-amber-500 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full" id="unread-count-badge">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Popover list of notifications */}
        {showNotifications && (
          <div className="absolute bottom-12 left-4 right-4 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-50 max-h-80 overflow-y-auto" id="sidebar-notifs-panel">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold uppercase text-slate-400">Area Alerts</h3>
              <button 
                onClick={() => {
                  markNotificationsAsRead();
                  setShowNotifications(false);
                }} 
                className="text-2xs text-emerald-600 hover:underline"
              >
                Clear
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No alerts in your region.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs">
                    <h4 className="font-semibold text-slate-700">{notif.title}</h4>
                    <p className="text-slate-500 mt-0.5 text-2xs leading-relaxed">{notif.body}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Capsule section / info badge at the bottom */}
      <div className="p-4 border-t border-gray-150 bg-gray-50/50">
        <div className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block truncate">
              {user.fullName}
            </span>
          </div>
          <div>
            <p className="text-2xs text-slate-400 font-medium">Operating Role</p>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {user.role === 'Donor' && <Heart className="w-3.5 h-3.5 text-emerald-500" />}
              {user.role === 'NGO' && <Building className="w-3.5 h-3.5 text-blue-500" />}
              {user.role === 'Volunteer' && <Truck className="w-3.5 h-3.5 text-amber-550" />}
              {user.role === 'Admin' && <Shield className="w-3.5 h-3.5 text-rose-500" />}
              {user.role === 'NGO' ? 'NGO Partner' : user.role === 'Donor' ? 'Surplus Donor' : user.role === 'Volunteer' ? 'Logistics Volunteer' : user.role}
            </p>
          </div>
        </div>

        {/* Logout minimal link */}
        <button 
          onClick={handleLogout}
          className="w-full mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          id="btn-logout-sidebar"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      id="app-mobile-nav"
    >
      <div className="mx-auto flex max-w-md items-center gap-1">
        <NavLink to="/" end className={mobileNavLinkClass}>
          <Home className="h-5 w-5" />
          <span className="truncate">Home</span>
        </NavLink>

        {user.role === 'Donor' ? (
          <NavLink to="/add-donation" className={mobileNavLinkClass}>
            <PlusCircle className="h-5 w-5" />
            <span className="truncate">Add</span>
          </NavLink>
        ) : (
          <NavLink to="/donations" className={mobileNavLinkClass}>
            <List className="h-5 w-5" />
            <span className="truncate">Browse</span>
          </NavLink>
        )}

        <NavLink to="/donations" className={mobileNavLinkClass}>
          <Heart className="h-5 w-5" />
          <span className="truncate">Food</span>
        </NavLink>

        <NavLink to="/profile" className={mobileNavLinkClass}>
          <User className="h-5 w-5" />
          <span className="truncate">Profile</span>
        </NavLink>

        {user.role === 'Admin' && (
          <NavLink to="/admin" className={mobileNavLinkClass}>
            <Shield className="h-5 w-5" />
            <span className="truncate">Admin</span>
          </NavLink>
        )}
      </div>
    </nav>
    </>
  );
}
