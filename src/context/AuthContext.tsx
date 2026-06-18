import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { dbService } from '../services/db';
import { UserProfile, UserRole, NotificationItem } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  notifications: NotificationItem[];
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (fullName: string, email: string, phone: string, password: string, role: UserRole, city: string, area: string) => Promise<UserProfile>;
  updateProfile: (fullName: string, phone: string, city: string, area: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshNotifications: () => void;
  markNotificationsAsRead: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // 1. Subscribe to Auth state updates
    const unsubscribe = authService.subscribeAuthState((profile) => {
      setUser(profile);
      setLoading(false);
    });

    // 2. Request notification permissions from browser if API exists
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Poll or refresh notifications when user logged in
  useEffect(() => {
    if (user) {
      refreshNotifications();
      // Set an interval to look for new local notification claims
      const interval = setInterval(() => {
        refreshNotifications();
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  const refreshNotifications = async () => {
    if (!user) return;
    
    // Load existing notifications
    let allNotifs = dbService.getNotifications();

    if (user.role === 'NGO' || user.role === 'Volunteer') {
      try {
        const donations = await dbService.getAllDonations();
        
        // Find donations in the same city or area that are Available and not posted by current user
        const matchedDonations = donations.filter(d => 
          d.status === 'Available' &&
          d.donorId !== user.uid &&
          (d.city.toLowerCase() === user.city.toLowerCase() || 
           d.area.toLowerCase() === user.area.toLowerCase())
        );

        // Track seen donations to avoid duplicate alerts
        const seenKey = `foodbridge_seen_donations_${user.uid}`;
        const seenData = localStorage.getItem(seenKey);
        const seenIds: string[] = seenData ? JSON.parse(seenData) : [];
        
        let newSeenIds = [...seenIds];
        let hasNew = false;

        matchedDonations.forEach(d => {
          if (!seenIds.includes(d.donationId)) {
            hasNew = true;
            newSeenIds.push(d.donationId);

            const notifTitle = "New Nearby Food Donation";
            const notifBody = `"${d.foodName}" (${d.quantity}) is available in your area (${d.area})!`;
            
            // 1. Trigger HTML5 Native Notification
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(notifTitle, { 
                  body: notifBody, 
                  icon: '/assets/favicon.ico' 
                });
              } catch (_) {}
            }

            // 2. Add to notification alert history
            const newNotif = {
              id: 'notif_' + Math.random().toString(36).substr(2, 9),
              title: notifTitle,
              body: notifBody,
              createdAt: new Date().toISOString(),
              read: false
            };
            allNotifs.unshift(newNotif);
          }
        });

        if (hasNew) {
          localStorage.setItem(seenKey, JSON.stringify(newSeenIds));
          localStorage.setItem('foodbridge_notifications', JSON.stringify(allNotifs));
        }
      } catch (err) {
        console.warn('Real-time alerts sync error:', err);
      }
    }

    setNotifications(allNotifs);
  };

  const markNotificationsAsRead = () => {
    dbService.markNotificationsAsRead();
    refreshNotifications();
  };

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await authService.login(email, password);
      setUser(profile);
      return profile;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string, 
    email: string, 
    phone: string, 
    password: string, 
    role: UserRole,
    city: string,
    area: string
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await authService.register(fullName, email, phone, password, role, city, area);
      setUser(profile);
      return profile;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (fullName: string, phone: string, city: string, area: string): Promise<UserProfile> => {
    if (!user) throw new Error("No authenticated user.");
    setLoading(true);
    try {
      const profile = await authService.updateProfile(user.uid, fullName, phone, city, area);
      setUser(profile);
      return profile;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        notifications,
        login,
        register,
        updateProfile,
        logout,
        refreshNotifications,
        markNotificationsAsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
