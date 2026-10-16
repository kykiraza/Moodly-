// 🔑 Règles du mot de passe à l'inscription (le back vérifie les mêmes :
// moodly-back/src/api/session/controllers/session.js → passwordIsStrong).
export const PASSWORD_RULES = [
  { label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { label: '1 majuscule', test: (p) => /\p{Lu}/u.test(p) },
  { label: '1 chiffre', test: (p) => /\d/.test(p) },
  { label: '1 caractère spécial (! ? @ # …)', test: (p) => /[^\p{L}\p{N}]/u.test(p) },
];

export const passwordIsStrong = (p) => PASSWORD_RULES.every((r) => r.test(p));
