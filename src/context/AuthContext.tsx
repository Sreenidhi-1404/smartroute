import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; message?: string; role?: UserRole };
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // CRITICAL REQUIREMENT: Initialized to null! Do not default to any user.
  // Only restore if an explicit, valid session exists in storage.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return authService.getCurrentUser();
  });

  const login = useCallback((email: string, password: string) => {
    const res = authService.login(email, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      return { success: true, role: res.user.role };
    }
    return { success: false, message: res.message || 'Invalid credentials' };
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  const requestPasswordReset = useCallback((email: string) => {
    return authService.requestPasswordReset(email);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
