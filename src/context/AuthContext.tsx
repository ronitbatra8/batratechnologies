"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  approved?: boolean;
  createdAt?: string;
  savedAddresses?: SavedAddress[];
}

interface StoredAccount {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accounts: StoredAccount[];
  currentIndex: number;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  login: (identifier: string, password: string, addMode?: boolean) => Promise<User>;
  logout: () => void;
  switchAccount: (index: number) => void;
  addAccount: (token: string, user: User) => void;
  removeAccount: (index: number) => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem("bt-accounts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem("bt-accounts", JSON.stringify(accounts));
}

function loadCurrentIndex(): number {
  const raw = localStorage.getItem("bt-current");
  return raw ? parseInt(raw, 10) : 0;
}

function saveCurrentIndex(i: number) {
  localStorage.setItem("bt-current", String(i));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadUser = useCallback(async () => {
    const stored = loadAccounts();
    const idx = loadCurrentIndex();
    setAccounts(stored);
    setCurrentIndex(idx);

    if (stored.length === 0 || !stored[idx]) {
      setLoading(false);
      return;
    }

    const token = stored[idx].token;
    localStorage.setItem("bt-token", token);
    localStorage.setItem("bt-current-user-id", stored[idx].user.id);
    try {
      const data = await apiFetch("/auth/me");
      const updated = [...stored];
      updated[idx] = { ...updated[idx], user: data };
      setAccounts(updated);
      saveAccounts(updated);
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const register = async (data: { name: string; email: string; password: string; phone?: string; role?: string }) => {
    const res = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) });
    addAccount(res.token, res.user);
    localStorage.setItem("bt-token", res.token);
    setUser(res.user);
  };

  const login = async (identifier: string, password: string, addMode = false) => {
    const isEmail = identifier.includes("@");
    const body = isEmail ? { email: identifier, password } : { phone: identifier, password };
    const res = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) });

    if (addMode) {
      addAccount(res.token, res.user);
    } else {
      const stored = loadAccounts();
      const exists = stored.findIndex((a) => a.user.id === res.user.id);
      if (exists >= 0) {
        const updated = [...stored];
        updated[exists] = { token: res.token, user: res.user };
        saveAccounts(updated);
        saveCurrentIndex(exists);
        setAccounts(updated);
        setCurrentIndex(exists);
      } else {
        const updated = [...stored, { token: res.token, user: res.user }];
        saveAccounts(updated);
        saveCurrentIndex(updated.length - 1);
        setAccounts(updated);
        setCurrentIndex(updated.length - 1);
      }
    }
    localStorage.setItem("bt-token", res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    const stored = loadAccounts();
    const idx = loadCurrentIndex();
    const updated = stored.filter((_, i) => i !== idx);
    saveAccounts(updated);
    const newIdx = Math.min(idx, updated.length - 1);
    if (newIdx >= 0 && updated[newIdx]) {
      saveCurrentIndex(newIdx);
      setAccounts(updated);
      setCurrentIndex(newIdx);
      localStorage.setItem("bt-token", updated[newIdx].token);
      localStorage.setItem("bt-current-user-id", updated[newIdx].user.id);
      setUser(updated[newIdx].user);
      window.dispatchEvent(new Event("bt-account-switch"));
    } else {
      saveCurrentIndex(0);
      setAccounts([]);
      setCurrentIndex(0);
      localStorage.removeItem("bt-token");
      localStorage.removeItem("bt-current-user-id");
      setUser(null);
    }
  };

  const switchAccount = (index: number) => {
    const stored = loadAccounts();
    if (stored[index]) {
      saveCurrentIndex(index);
      setCurrentIndex(index);
      localStorage.setItem("bt-token", stored[index].token);
      localStorage.setItem("bt-current-user-id", stored[index].user.id);
      setUser(stored[index].user);
      window.dispatchEvent(new Event("bt-account-switch"));
      window.location.reload();
    }
  };

  const addAccount = (token: string, newUser: User) => {
    const stored = loadAccounts();
    const exists = stored.findIndex((a) => a.user.id === newUser.id);
    if (exists >= 0) {
      const updated = [...stored];
      updated[exists] = { token, user: newUser };
      saveAccounts(updated);
      setAccounts(updated);
    } else {
      const updated = [...stored, { token, user: newUser }];
      saveAccounts(updated);
      setAccounts(updated);
    }
  };

  const removeAccount = (index: number) => {
    const stored = loadAccounts();
    const updated = stored.filter((_, i) => i !== index);
    saveAccounts(updated);
    setAccounts(updated);

    if (index === currentIndex) {
      if (updated.length > 0) {
        const newIdx = Math.min(index, updated.length - 1);
        saveCurrentIndex(newIdx);
        setCurrentIndex(newIdx);
        localStorage.setItem("bt-token", updated[newIdx].token);
        setUser(updated[newIdx].user);
      } else {
        saveCurrentIndex(0);
        setCurrentIndex(0);
        localStorage.removeItem("bt-token");
        setUser(null);
      }
    } else if (index < currentIndex) {
      const newIdx = currentIndex - 1;
      saveCurrentIndex(newIdx);
      setCurrentIndex(newIdx);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    const updated = await apiFetch("/auth/me", { method: "PUT", body: JSON.stringify(data) });
    setUser(updated);
    const stored = loadAccounts();
    const idx = loadCurrentIndex();
    if (stored[idx]) {
      stored[idx] = { ...stored[idx], user: updated };
      saveAccounts(stored);
      setAccounts(stored);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, accounts, currentIndex, register, login, logout, switchAccount, addAccount, removeAccount, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { SavedAddress, StoredAccount };
