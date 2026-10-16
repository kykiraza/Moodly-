// ⚙️ Réglages de l'app

// Adresse de l'API Strapi (avec /api à la fin), lue dans le fichier .env (VITE_API_URL).
// Sur téléphone : l'IP locale du Mac, pas « localhost » (voir .env.example).
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:1337/api').replace(/\/$/, '');

// Comptes de démo créés par `npm run seed` côté back (bouton « Prototype : se connecter en tant que »)
export const DEMO = {
  agencyId: 'AG-0001',
  password: 'Moodly2026!',
  salarie: 'camille.durand@entreprise.fr',
  manager: 'julien.moreau@entreprise.fr',
};

// Le calendrier personnel est stocké sur le téléphone. Pour la démo, on peut le compléter
// avec des jours d'exemple (affichés « Exemple de démo »). Mettre false pour les retirer.
export const SHOW_DEMO_HISTORY = true;

// En dessous de ce nombre de réponses, une journée est masquée (même règle que le back)
export const MIN_ANSWERS = 3;
