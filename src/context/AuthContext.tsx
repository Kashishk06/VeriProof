import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/mockData';
import type { UserRole } from '../types';
import { apiRequest } from '../utils/documentRegistryApi';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  organizationId?: number;
  avatar?: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  authenticate: (email: string, password: string) => Promise<AuthUser | null>;
  demoLogin: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('veriproof_access_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('veriproof_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('veriproof_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('veriproof_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('veriproof_access_token', accessToken);
    else localStorage.removeItem('veriproof_access_token');
  }, [accessToken]);

  const authenticate = async (email: string, password: string): Promise<AuthUser | null> => {
    try {
      const tokenData = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const profile = await apiRequest<{
        id: number;
        email: string;
        full_name?: string | null;
        role: 'SUPER_ADMIN' | 'ISSUER' | 'VERIFIER';
        is_active: boolean;
        organization_id?: number | null;
        organization?: { name: string; org_type?: string | null; authorized_representative_role?: string | null } | null;
      }>('/auth/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const role: UserRole = profile.role === 'SUPER_ADMIN' ? 'super_admin' : profile.role.toLowerCase() as UserRole;
      const authenticatedUser: AuthUser = {
        id: String(profile.id),
        name: profile.full_name || profile.email.split('@')[0],
        email: profile.email,
        role,
        organization: profile.organization?.name || '',
        organizationId: profile.organization_id ?? undefined,
        department: profile.organization?.authorized_representative_role || profile.organization?.org_type || 'Operations',
        status: profile.is_active ? 'active' : 'inactive',
      };
      localStorage.setItem('veriproof_access_token', tokenData.access_token);
      setAccessToken(tokenData.access_token);
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch {
      return null;
    }
  };

  const demoLogin = (role: UserRole) => {
    const demo = DEMO_USERS.find(u => u.role === role) || DEMO_USERS[0];
    setAccessToken(null);
    setUser(demo as AuthUser);
  };

  const switchRole = (role: UserRole) => {
    demoLogin(role);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('veriproof_access_token');
    localStorage.removeItem('veriproof_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        authenticate,
        demoLogin,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
