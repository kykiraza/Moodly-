// 🔐 La session de l'utilisateur connecté, partagée dans toute l'app (contexte React).
// Format : { jwt, agencyId, user: { id, email, username, role: 'salarie' | 'manager' }, createdAt }
// Gardée dans le stockage sécurisé du téléphone : on reste connecté en rouvrant l'app.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setApiSession } from '@/lib/api';
import { secureStore } from '@/lib/storage';
import { getSocialIdToken } from '@/lib/social';

const KEY = 'moodly-session';
const AuthContext = createContext(null);

// Le back parle de 'employee' / 'manager', l'app de 'salarie' / 'manager'
function toSession(res) {
  return {
    jwt: res.jwt,
    agencyId: res.agencyId,
    user: {
      id: res.user.id,
      email: res.user.email,
      username: res.user.username,
      role: res.role === 'manager' ? 'manager' : 'salarie',
    },
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false); // false pendant qu'on relit la session au démarrage

  const save = useCallback(async (s) => {
    setApiSession(s);
    setSession(s);
    if (s) await secureStore.set(KEY, JSON.stringify(s));
    else await secureStore.remove(KEY);
  }, []);

  const signOut = useCallback(() => save(null), [save]);

  // Au démarrage : relire la session sauvegardée
  useEffect(() => {
    secureStore
      .get(KEY)
      .then((raw) => {
        const s = raw ? JSON.parse(raw) : null;
        setApiSession(s, () => save(null)); // 401 → déconnexion automatique
        setSession(s);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [save]);

  const value = useMemo(
    () => ({
      session,
      ready,
      signOut,
      /** Connexion email + mot de passe + ID agence. Lance une ApiError si refusée. */
      signIn: async (email, password, agencyId) =>
        save(toSession(await api.login({ email, password, agencyId: agencyId.trim().toUpperCase() }))),
      /** Inscription d'un salarié avec le code agence. */
      signUp: async (name, email, password, agencyId) =>
        save(toSession(await api.register({ name, email, password, agencyId: agencyId.trim().toUpperCase() }))),
      /**
       * Connexion Google / Apple / Microsoft : on récupère l'ID token du fournisseur,
       * puis le serveur le vérifie. Renvoie false si l'utilisateur a annulé.
       */
      signInSocial: async (provider, agencyId) => {
        const result = await getSocialIdToken(provider);
        if (!result) return false;
        const res = await api.social({ provider, agencyId: agencyId.trim().toUpperCase(), ...result });
        await save(toSession(res));
        return true;
      },
    }),
    [session, ready, save, signOut],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export const useAuth = () => useContext(AuthContext);
