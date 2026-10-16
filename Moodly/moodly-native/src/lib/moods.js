// 😊 Les 5 humeurs, les 8 raisons, et le journal personnel gardé SUR LE TÉLÉPHONE.
import { Briefcase, Coffee, Compass, Heart, Scale, Star, Target, Users } from 'lucide-react-native';
import { readJSON, removeKey, writeJSON } from '@/lib/storage';

export const LEVELS = [1, 2, 3, 4, 5];

/** Infos d'une humeur pour les couleurs du thème courant : mood(c, 3) */
export const mood = (c, l) => ({
  label: { 1: 'Pas bien', 2: 'Bof', 3: 'Ça va', 4: 'Bien', 5: 'Super' }[l],
  fill: c[`mood${l}`],
  soft: c[`mood${l}Soft`],
});

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

/** Date locale AAAA-MM-JJ */
export function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const todayKey = () => ymd(new Date());
/** "2026-10-16" → objet Date à midi local (évite les décalages de fuseau) */
export const parseDay = (k) => new Date(`${k}T12:00:00`);
/** Note moyenne (ex. 3.6) → humeur entière 1..5 */
export const levelOf = (avg) => Math.min(5, Math.max(1, Math.round(avg)));
export const longDate = (k) => parseDay(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// ---------------------------------------------------------------------------
// Journal personnel : { "2026-10-16": { mood, factors, note } } — sur le téléphone uniquement.
// Le serveur ne reçoit que la note et les raisons, sans savoir qui les a données.
// ---------------------------------------------------------------------------
const journalKey = (userId) => `moodly-history:${userId}`;

export async function saveToday(userId, moodLevel, factors, note) {
  const journal = await readJSON(journalKey(userId), {});
  journal[todayKey()] = { mood: moodLevel, factors, note: note.trim() };
  await writeJSON(journalKey(userId), journal);
}

export async function getToday(userId) {
  return (await readJSON(journalKey(userId), {}))[todayKey()] || null;
}

export const clearHistory = (userId) => removeKey(journalKey(userId));

// Jours d'exemple inventés (marqués « Exemple de démo »). Désactivé : le calendrier
// n'affiche que les vrais check-ins faits sur ce téléphone. Mettre true pour une démo.
export const SHOW_DEMO_HISTORY = false;

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

export async function getHistory(userId) {
  return { ...(SHOW_DEMO_HISTORY ? demoHistory() : {}), ...(await readJSON(journalKey(userId), {})) };
}
