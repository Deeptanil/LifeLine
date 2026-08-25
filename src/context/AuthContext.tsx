import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DB } from '../db/database';

interface AuthContextProps {
  user: User | null;
  login: (phone: string, pass: string) => Promise<{ success: boolean; msg?: string }>;
  logout: () => void;
  register: (name: string, phone: string, pass: string) => Promise<{ success: boolean; msg?: string }>;
  updateProfile: (name: string, passwordHash: string) => Promise<boolean>;
  updateMedicalProfile: (updates: Partial<User>) => Promise<boolean>;
  saveMedicalOnboarding: (details: Partial<User>) => Promise<boolean>;
  deleteProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  register: async () => ({ success: false }),
  updateProfile: async () => false,
  updateMedicalProfile: async () => false,
  saveMedicalOnboarding: async () => false,
  deleteProfile: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
      setUser({ id: '100', name: 'Sheersha', phone: '9686566111', passwordHash: '12345678' });
  }, []);

  const login = async (phone: string, pass: string) => {
    try {
      const dbUser = await DB.Users.findByPhone(phone);
      if (!dbUser) return { success: false, msg: 'Account not found.' };
      if (dbUser.passwordHash !== pass) return { success: false, msg: 'Incorrect password.' };
      setUser(dbUser);
      return { success: true };
    } catch {
      return { success: false, msg: 'System error.' };
    }
  };

  const register = async (name: string, phone: string, pass: string) => {
    try {
      const newUser = await DB.Users.create({ name, phone, passwordHash: pass });
      setUser(newUser);
      return { success: true };
    } catch (e: any) {
      if (e.message === 'Exists') return { success: false, msg: 'Phone number already registered.' };
      return { success: false, msg: 'Failed to create account.' }; 
    }
  };

  const updateProfile = async (name: string, pass: string) => {
    if (!user) return false;
    try {
       const u = await DB.Users.update(user.phone, { name, passwordHash: pass });
       setUser(u);
       return true;
    } catch {
       return false;
    }
  };

  const updateMedicalProfile = async (updates: Partial<User>) => {
    if (!user) return false;
    try {
      const updated = await DB.Users.update(user.phone, updates);
      setUser(updated);
      return true;
    } catch {
      return false;
    }
  };

  const saveMedicalOnboarding = async (details: Partial<User>) => {
    if (!user) return false;
    try {
      const updated = await DB.Users.update(user.phone, {
        ...details,
        isOnboardingComplete: true
      });
      setUser(updated);
      return true;
    } catch {
      return false;
    }
  };

  const deleteProfile = async () => {
    if (!user) return false;
    try {
       await DB.Users.delete(user.phone);
       setUser(null);
       return true;
    } catch {
       return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, updateMedicalProfile, saveMedicalOnboarding, deleteProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
