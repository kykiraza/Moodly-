// 🔐 La session de l'utilisateur connecté, gardée dans le stockage de l'appareil.
// Format : { jwt, agencyId, user: { id, email, username, role: 'salarie' | 'manager' }, createdAt }
import { api } from '@/lib/api';

const KEY = 'moodly-session';

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

// Le back parle de 'employee' / 'manager', l'app de 'salarie' / 'manager'
function toSession(res) {
  const session = {
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
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

/** Connexion (vrai back). Lance une ApiError si refusée (401 = mauvais identifiants). */
export async function login(email, password, agencyId) {
  return toSession(await api.login({ email, password, agencyId: agencyId.trim().toUpperCase() }));
}

/** Inscription d'un salarié avec le code agence (vrai back). */
export async function register(name, email, password, agencyId) {
  return toSession(await api.register({ name, email, password, agencyId: agencyId.trim().toUpperCase() }));
}

export function logout() {
  clearSession();
}

/** L'écran d'accueil de l'utilisateur selon son rôle */
export function homeFor(session) {
  return session?.user.role === 'manager' ? '/manager' : '/salarie';
}
