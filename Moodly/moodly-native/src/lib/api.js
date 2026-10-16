// 🌐 Client de l'API Strapi : tous les appels réseau passent par ici.
// Il ajoute le token (Authorization) et l'agence (X-Agency-Id) de la session en cours.

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Adresse de l'API. Sur un téléphone, « localhost » désigne le téléphone lui-même :
 * en développement (Expo Go), on la remplace par l'IP du Mac qui fait tourner Expo
 * (Constants.expoConfig.hostUri, ex. « 192.168.1.42:8081 »). Le back doit être sur ce même Mac.
 */
function apiUrl() {
  const url = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:1337/api').replace(/\/$/, '');
  const macIp = Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && Platform.OS !== 'web' && macIp && /localhost|127\.0\.0\.1/.test(url)) {
    return url.replace(/localhost|127\.0\.0\.1/, macIp);
  }
  return url;
}
export const API_URL = apiUrl();

// La session courante est donnée par AuthProvider (src/lib/session.js)
let current = null;
let onExpired = () => {};
export function setApiSession(session, expiredHandler) {
  current = session;
  if (expiredHandler) onExpired = expiredHandler;
}

/** Erreur avec le code HTTP, pour que l'écran puisse réagir (409 = déjà répondu…). */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && current) {
    headers.Authorization = `Bearer ${current.jwt}`;
    headers['X-Agency-Id'] = current.agencyId;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'Connexion au serveur impossible (même Wi-Fi ? bonne IP dans .env.local ?)');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Token expiré ou invalide → déconnexion et retour à l'accueil
    if (res.status === 401 && auth) onExpired();
    throw new ApiError(res.status, data?.error?.message || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  login: ({ agencyId, email, password }) =>
    request('/auth/login', { method: 'POST', body: { agencyId, email, password }, auth: false }),
  register: ({ agencyId, name, email, password }) =>
    request('/auth/register', { method: 'POST', body: { agencyId, name, email, password }, auth: false }),
  /** provider = 'google' | 'apple' | 'microsoft', idToken = jeton signé par le fournisseur */
  social: ({ agencyId, provider, idToken, name }) =>
    request('/auth/social', { method: 'POST', body: { agencyId, provider, idToken, name }, auth: false }),
  /** Nom de l'entreprise pour un code : { code, name }, ou ApiError 404 si le code est inconnu. */
  agency: (code) => request(`/auth/agency?code=${encodeURIComponent(code)}`, { auth: false }),
  profile: () => request('/profile'),
  /** Note 1..5 + 0 à 3 raisons. Le message libre n'est JAMAIS envoyé. */
  sendMood: ({ level, factors }) => request('/moods', { method: 'POST', body: { level, factors } }),
  hasAnsweredToday: async () => (await request('/moods/today')).hasAnswered,
  teamStats: (days = 30) => request(`/team/stats?days=${days}`),
};
