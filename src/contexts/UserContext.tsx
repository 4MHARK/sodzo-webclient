// src/context/UserContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface User {
  id: string;
  userId: string;
  tenantId: string;
  haloId: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar: string;
  roles: string[];
  isOwner: boolean;
  isSuper: boolean;
  isAgreed: boolean;
  status: boolean;
  createdBy: string | null;
  phoneNumber: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  otp?: string | null;
  otpExpires?: string | null;
  otpVerified?: boolean;
  deletedAt?: string | null;
  createdAt: string;
}


interface UserContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <UserContext.Provider value={{ user, token, setUser, setToken, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
