/**
 * Client de l'API Moodly pour le front Expo (exemple prêt à copier).
 *
 * - Utilise fetch (aucune dépendance en plus) et expo-secure-store pour garder le token.
 * - Mêmes noms de fonctions que le type `Api` du front (src/services/types.ts),
 *   plus getProfile() et getTags().
 *
 * À copier dans le front : src/services/moodly-api.js
 *
 * Configuration : l'adresse vient de API_URL dans src/config.ts (comme realApi.ts),
 *   ex. export const API_URL = 'http://192.168.1.42:1337/api';
 * On peut aussi la surcharger avec EXPO_PUBLIC_API_URL dans le .env du projet Expo.
 *   ⚠️ L'IP locale du Mac qui fait tourner Strapi, PAS « localhost » : sur le téléphone,
 *   localhost désigne le téléphone lui-même. Téléphone et Mac sur le même wifi.
 *   (Pour trouver l'IP du Mac : `ipconfig getifaddr en0` dans le Terminal.)
 */

import * as SecureStore from 'expo-secure-store';
import { API_URL as CONFIG_API_URL } from '../config';

const API_URL = process.env.EXPO_PUBLIC_API_URL || CONFIG_API_URL;
const TOKEN_KEY = 'moodly-token';

/** Erreur avec le code HTTP, pour que l'écran puisse réagir (401 → login, 409 → déjà répondu…). */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Connexion au serveur impossible (même wifi ? bonne IP ?)');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token expiré ou invalide : on l'oublie, l'app doit revenir à l'écran de login
    if (res.status === 401 && auth) await SecureStore.deleteItemAsync(TOKEN_KEY);
    throw new ApiError(res.status, data?.error?.message || `Erreur ${res.status}`);
  }

  return data;
}

/** Connexion → { token, role: 'employee' | 'manager', name }. Le token est sauvegardé. */
export async function login(email, password) {
  const session = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  return session;
}

/** Déconnexion : on oublie simplement le token (un JWT ne se « révoque » pas côté serveur). */
export async function logout() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** → { name, role, team: { documentId, name } | null, managedTeams: [...] } */
export function getProfile() {
  return request('/profile');
}

/** → [{ documentId, label, slug, emoji }] : les tags à proposer dans l'écran de saisie */
export async function getTags() {
  const res = await request('/tags?fields[0]=label&fields[1]=slug&fields[2]=emoji');
  return res.data;
}

/**
 * Envoie le moral du jour.
 * @param {{ score: number, tags?: string[] }} answer  score de 1 à 5, 0 à 3 slugs de tags
 * Erreurs possibles : 400 (données invalides), 409 (déjà répondu aujourd'hui).
 */
export async function sendMood({ score, tags = [] }) {
  await request('/moods', { method: 'POST', body: { score, tags } });
}

/** → true si l'employé a déjà répondu aujourd'hui */
export async function hasAnsweredToday() {
  const res = await request('/moods/today');
  return res.hasAnswered;
}

/**
 * Stats de l'équipe du manager connecté.
 * → {
 *     team: { documentId, name },
 *     daily: [{ date, mood (null si 0 réponse, masqué ou aujourd'hui), count, weekend, masked, open }],
 *     summary: { mood, responseRate (en %), responses },
 *     tags: [{ slug, label, emoji, count }],
 *     minResponses
 *   }
 */
export function getTeamStats(days = 30) {
  return request(`/team/stats?days=${days}`);
}
