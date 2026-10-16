// 🌐 Client de l'API Strapi : tous les appels réseau de l'app passent par ici.
// Il ajoute automatiquement le token (Authorization) et l'agence (X-Agency-Id).
import { API_URL } from '@/config';
import { getSession, clearSession } from '@/lib/session';

// Événement envoyé quand le serveur répond 401 (token expiré) → App.vue renvoie au login
export const SESSION_EXPIRED_EVENT = 'moodly:session-expired';

/** Erreur avec le code HTTP, pour que l'écran puisse réagir (409 = déjà répondu…). */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const session = getSession();
    if (session) {
      headers.Authorization = `Bearer ${session.jwt}`;
      headers['X-Agency-Id'] = session.agencyId;
    }
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Connexion au serveur impossible (le back tourne ? bonne adresse ?)');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token expiré ou invalide : on oublie la session et on revient à la connexion
    if (res.status === 401 && auth) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, data?.error?.message || `Erreur ${res.status}`);
  }

  return data;
}

export const api = {
  /** → { jwt, agencyId, role, user } */
  login: ({ agencyId, email, password }) =>
    request('/auth/login', { method: 'POST', body: { agencyId, email, password }, auth: false }),

  /** Inscription d'un salarié avec le code de son agence → même réponse que login */
  register: ({ agencyId, name, email, password }) =>
    request('/auth/register', { method: 'POST', body: { agencyId, name, email, password }, auth: false }),

  /** → { name, email, role, agency, team, managedTeams } */
  profile: () => request('/profile'),

  /** Envoie le moral du jour : level 1..5 et 0 à 3 raisons. (Le message libre n'est JAMAIS envoyé.) */
  sendMood: ({ level, factors }) => request('/moods', { method: 'POST', body: { level, factors } }),

  /** → true si le salarié a déjà répondu aujourd'hui */
  hasAnsweredToday: async () => (await request('/moods/today')).hasAnswered,

  /** Stats de l'équipe du manager (days : 7 à 90) */
  teamStats: (days = 30) => request(`/team/stats?days=${days}`),
};
