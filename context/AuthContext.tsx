import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('kavins_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, pass: string): boolean => {
    let role: UserRole | null = null;

    if (username === 'kavinsadmin' && pass === 'admka2026') {
      role = UserRole.ADMIN;
    } else if (username === 'repre.kavins' && pass === 'repre@kavins') {
      role = UserRole.REPRESENTATIVE;
    } else if (username === 'sacoleira.kavins' && pass === 'kavins@sacoleira') {
      role = UserRole.SACOLEIRA;
    }

    if (role) {
      const newUser = { username, role };
      setUser(newUser);
      localStorage.setItem('kavins_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kavins_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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