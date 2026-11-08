import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dbService, getDhakaDateString } from '../services/supabase/dbService.js';
import { supabase, isSupabaseConfigured } from '../services/supabase/supabaseClient.js';
import { ROLES, COMMUNITY_STATUS, DEFAULT_DAILY_FREE_SECONDS } from '../config/constants.js';

const AuthContext = createContext();

const DEMO_USERS = {
  student: {
    id: 'user_student_1',
    email: 'amina.student@speakmate.com',
    full_name: 'Amina Rahman',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    native_language: 'Bengali',
    target_level: 'Intermediate',
    bio: 'Software engineer preparing for IELTS and international team presentations.',
    country: 'Bangladesh',
    role: ROLES.STUDENT,
    status: COMMUNITY_STATUS.APPROVED,
  },
  mentor: {
    id: 'user_mentor_1',
    email: 'david.mentor@speakmate.com',
    full_name: 'David Miller',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    native_language: 'English (US)',
    target_level: 'Advanced',
    bio: 'CELTA-certified English instructor specializing in pronunciation and fluency.',
    country: 'United States',
    role: ROLES.MENTOR,
    status: COMMUNITY_STATUS.APPROVED,
  },
  admin: {
    id: 'user_admin_1',
    email: 'tariq.admin@speakmate.com',
    full_name: 'Tariq Ahmed',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    native_language: 'Bengali',
    target_level: 'Advanced',
    bio: 'SpeakMate platform administrator & community director.',
    country: 'Bangladesh',
    role: ROLES.ADMIN,
    status: COMMUNITY_STATUS.APPROVED,
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speakmate_auth_user');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return DEMO_USERS.student;
  });

  const [usage, setUsage] = useState({
    usedSeconds: 0,
    maxAllowanceSeconds: DEFAULT_DAILY_FREE_SECONDS,
    date: getDhakaDateString(),
  });

  const [loading, setLoading] = useState(false);

  // Refresh daily speaking usage from storage
  const refreshUsage = useCallback(async (userId = currentUser?.id) => {
    if (!userId) return;
    const currentUsage = await dbService.getDailySpeakingUsage(userId);
    setUsage(currentUsage);
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshUsage(currentUser.id);
    }
  }, [currentUser?.id, refreshUsage]);

  // Subscribe to usage updates or profile updates across tabs
  useEffect(() => {
    const unsubscribe = dbService.subscribe(msg => {
      if (msg.type === 'usage_update' && msg.userId === currentUser?.id) {
        setUsage(prev => ({ ...prev, usedSeconds: msg.usedSeconds }));
      }
      if (msg.type === 'table_update' && msg.table === 'profiles') {
        dbService.getProfile(currentUser.id).then(p => {
          if (p) setCurrentUser(prev => ({ ...prev, ...p }));
        });
      }
    });
    return unsubscribe;
  }, [currentUser?.id]);

  // Record active connected speaking seconds to Asia/Dhaka daily bucket
  const recordSpeakingTime = useCallback(async (seconds) => {
    if (!currentUser?.id || seconds <= 0) return;
    const updatedUsed = await dbService.addSpeakingUsage(currentUser.id, seconds);
    setUsage(prev => ({ ...prev, usedSeconds: updatedUsed }));
  }, [currentUser?.id]);

  // Fast demo role switcher for comprehensive testing of Student, Mentor, and Admin features
  const switchDemoRole = useCallback((roleKey) => {
    const selected = DEMO_USERS[roleKey] || DEMO_USERS.student;
    setCurrentUser(selected);
    if (typeof window !== 'undefined') {
      localStorage.setItem('speakmate_auth_user', JSON.stringify(selected));
    }
    refreshUsage(selected.id);
  }, [refreshUsage]);

  // Real login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const profile = await dbService.getProfile(data.user.id);
          const userObj = {
            id: data.user.id,
            email: data.user.email,
            ...profile,
          };
          setCurrentUser(userObj);
          localStorage.setItem('speakmate_auth_user', JSON.stringify(userObj));
          return userObj;
        }
      }
      // Demo authentication simulation
      const found = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        id: `user_${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        native_language: 'English',
        target_level: 'Intermediate',
        role: ROLES.STUDENT,
        status: COMMUNITY_STATUS.APPROVED,
      };
      setCurrentUser(found);
      localStorage.setItem('speakmate_auth_user', JSON.stringify(found));
      return found;
    } finally {
      setLoading(false);
    }
  };

  // Real registration handler
  const register = async (email, password, fullName, targetLevel = 'Intermediate') => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, target_level: targetLevel }
          }
        });
        if (error) throw error;
        if (data.user) {
          const profile = await dbService.getProfile(data.user.id);
          const userObj = { id: data.user.id, email, ...profile };
          setCurrentUser(userObj);
          return userObj;
        }
      }
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        native_language: 'Bengali',
        target_level: targetLevel,
        bio: 'New member excited to practice speaking English.',
        country: 'Bangladesh',
        role: ROLES.STUDENT,
        status: COMMUNITY_STATUS.PENDING, // requires approval as per requirements
      };
      await dbService.updateProfile(newUser.id, newUser);
      setCurrentUser(newUser);
      localStorage.setItem('speakmate_auth_user', JSON.stringify(newUser));
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('speakmate_auth_user');
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    if (!currentUser?.id) return;
    const updated = await dbService.updateProfile(currentUser.id, updates);
    setCurrentUser(prev => ({ ...prev, ...updated }));
    localStorage.setItem('speakmate_auth_user', JSON.stringify({ ...currentUser, ...updated }));
    return updated;
  };

  const remainingSeconds = Math.max(0, (usage.maxAllowanceSeconds || DEFAULT_DAILY_FREE_SECONDS) - usage.usedSeconds);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        usage,
        remainingSeconds,
        maxAllowanceSeconds: usage.maxAllowanceSeconds || DEFAULT_DAILY_FREE_SECONDS,
        login,
        register,
        logout,
        updateProfile,
        switchDemoRole,
        recordSpeakingTime,
        refreshUsage,
        isApproved: currentUser?.status === COMMUNITY_STATUS.APPROVED,
        isMentor: currentUser?.role === ROLES.MENTOR || currentUser?.role === ROLES.ADMIN,
        isAdmin: currentUser?.role === ROLES.ADMIN,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
