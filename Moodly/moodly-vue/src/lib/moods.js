// 😊 Les 5 humeurs, les 8 raisons, et le journal personnel gardé SUR LE TÉLÉPHONE.
import { Briefcase, Coffee, Compass, Heart, Scale, Star, Target, Users } from 'lucide-vue-next';
import { SHOW_DEMO_HISTORY } from '@/config';

export const MOODS = {
  1: { label: 'Pas bien', fill: 'var(--mood-1)', soft: 'var(--mood-1-soft)', bg: 'bg-mood-1', bgSoft: 'bg-mood-1-soft', text: 'text-mood-1' },
  2: { label: 'Bof', fill: 'var(--mood-2)', soft: 'var(--mood-2-soft)', bg: 'bg-mood-2', bgSoft: 'bg-mood-2-soft', text: 'text-mood-2' },
  3: { label: 'Ça va', fill: 'var(--mood-3)', soft: 'var(--mood-3-soft)', bg: 'bg-mood-3', bgSoft: 'bg-mood-3-soft', text: 'text-mood-3' },
  4: { label: 'Bien', fill: 'var(--mood-4)', soft: 'var(--mood-4-soft)', bg: 'bg-mood-4', bgSoft: 'bg-mood-4-soft', text: 'text-mood-4' },
  5: { label: 'Super', fill: 'var(--mood-5)', soft: 'var(--mood-5-soft)', bg: 'bg-mood-5', bgSoft: 'bg-mood-5-soft', text: 'text-mood-5' },
};

export const LEVELS = [1, 2, 3, 4, 5];

// Les « id » sont les slugs des tags côté back (GET /api/tags)
export const FACTORS = [
  { id: 'charge', icon: Briefcase, label: 'Charge de travail' },
  { id: 'ambiance', icon: Users, label: "Ambiance d'équipe" },
  { id: 'management', icon: Compass, label: 'Management' },
  { id: 'reco', icon: Star, label: 'Reconnaissance' },
  { id: 'equilibre', icon: Scale, label: 'Équilibre vie pro/perso' },
  { id: 'conditions', icon: Coffee, label: 'Conditions de travail' },
  { id: 'missions', icon: Target, label: 'Missions / projets' },
  { id: 'perso', icon: Heart, label: 'Personnel' },
];

export const factorById = (id) => FACTORS.find((f) => f.id === id);

/** Date locale au format AAAA-MM-JJ (pas toISOString, qui est en UTC et décale le jour la nuit). */
export function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const todayKey = () => ymd(new Date());

/** Note moyenne (ex. 3.6) → niveau d'humeur entier entre 1 et 5 */
export const levelOf = (avg) => Math.min(5, Math.max(1, Math.round(avg)));

// ---------------------------------------------------------------------------
// Journal personnel : { "2026-10-16": { mood, factors, note } }
// Stocké uniquement sur l'appareil (localStorage), une clé par utilisateur.
// Le serveur ne reçoit que la note et les raisons, sans savoir qui les a données.
// ---------------------------------------------------------------------------
const journalKey = (userId) => `moodly-history:${userId}`;

function readJournal(userId) {
  try {
    return JSON.parse(localStorage.getItem(journalKey(userId)) || '{}');
  } catch {
    return {};
  }
}

/** Enregistre la saisie du jour dans le journal local (avec le message libre). */
export function saveToday(userId, mood, factors, note) {
  const journal = readJournal(userId);
  journal[todayKey()] = { mood, factors, note: note.trim() };
  localStorage.setItem(journalKey(userId), JSON.stringify(journal));
}

/** La saisie d'aujourd'hui si elle a été faite depuis cet appareil, sinon null. */
export function getToday(userId) {
  return readJournal(userId)[todayKey()] || null;
}

/** Efface tout le journal de cet utilisateur sur cet appareil. */
export function clearHistory(userId) {
  localStorage.removeItem(journalKey(userId));
}

// Jours d'exemple pour la démo (60 derniers jours ouvrés, avant aujourd'hui)
function demoHistory() {
  const out = {};
  const now = new Date();
  for (let i = 1; i <= 60; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const wd = d.getDay();
    if (wd === 0 || wd === 6 || i % 9 === 4) continue;
    const v = Math.round(3 + Math.sin(i / 3.1) * 1.3 + Math.cos(i / 1.9) * 0.5);
    out[ymd(d)] = { mood: Math.max(1, Math.min(5, v)), factors: [FACTORS[(i * 3) % FACTORS.length].id], demo: true };
  }
  return out;
}

/** Le calendrier personnel : vraies saisies (+ exemples de démo si activés). */
export function getHistory(userId) {
  return { ...(SHOW_DEMO_HISTORY ? demoHistory() : {}), ...readJournal(userId) };
}
