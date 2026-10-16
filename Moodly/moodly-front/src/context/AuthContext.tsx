// 🔐 Gère la connexion : qui est connecté, avec quel rôle.
// La session est gardée dans le stockage sécurisé du téléphone (SecureStore),
// donc l'utilisateur reste connecté quand il rouvre l'app.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { setToken } from '../services/realApi';
import { LoginResponse } from '../services/types';

const KEY = 'moodly-session';

type AuthState = {
  user: LoginResponse | null; // null = pas connecté
  loading: boolean; // true pendant qu'on relit la session au démarrage
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// SecureStore n'existe pas sur le web : on ignore simplement la sauvegarde
async function save(value: string | null) {
  if (Platform.OS === 'web') return;
  if (value) await SecureStore.setItemAsync(KEY, value);
  else await SecureStore.deleteItemAsync(KEY);
}
async function read() {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage : on relit la session sauvegardée
  useEffect(() => {
    read()
      .then((raw) => {
        if (raw) {
          const session: LoginResponse = JSON.parse(raw);
          setToken(session.token);
          setUser(session);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const session = await api.login(email, password);
    setToken(session.token);
    setUser(session);
    await save(JSON.stringify(session));
  }

  async function logout() {
    setToken(null);
    setUser(null);
    await save(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
