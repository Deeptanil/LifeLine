import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, DB } from '../db/database';

const STORAGE_KEY = '@lifeline_user';

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

  // Restore persisted user on app start
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          // Default demo user — includes full medical profile
          const defaultUser = await DB.Users.findByPhone('7760343724');
          if (defaultUser) {
            setUser(defaultUser);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
          }
        }
      } catch {
        // Fallback: load default demo user without persistence
        const defaultUser = await DB.Users.findByPhone('7760343724');
        if (defaultUser) setUser(defaultUser);
      }
    };
    restoreUser();
  }, []);

  const persist = async (u: User) => {
    setUser(u);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
  };

  const login = async (phone: string, pass: string) => {
    try {
      const dbUser = await DB.Users.findByPhone(phone);
      if (!dbUser) return { success: false, msg: 'Account not found.' };
      if (dbUser.passwordHash !== pass) return { success: false, msg: 'Incorrect password.' };
      await persist(dbUser);
      return { success: true };
    } catch {
      return { success: false, msg: 'System error.' };
    }
  };

  const register = async (name: string, phone: string, pass: string) => {
    try {
      const newUser = await DB.Users.create({ name, phone, passwordHash: pass });
      await persist(newUser);
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
      await persist(u);
      return true;
    } catch {
      return false;
    }
  };

  const updateMedicalProfile = async (updates: Partial<User>) => {
    if (!user) return false;
    try {
      const updated = await DB.Users.update(user.phone, updates);
      await persist(updated);
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
      await persist(updated);
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
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, updateMedicalProfile, saveMedicalOnboarding, deleteProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
