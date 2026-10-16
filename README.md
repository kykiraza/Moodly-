# Moodly

MVP d'une app mobile de suivi du moral des salariés (projet Epitech Digital School, démarche RSE /
bien-être au travail). Les salariés partagent leur moral du jour de façon **anonyme** ; le manager
voit le moral de son équipe sur 30 jours, uniquement en données agrégées.

| Dossier                                   | Contenu                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| [`Moodly/moodly-back`](Moodly/moodly-back) | API **Strapi 5** (SQLite) : auth, rôles, saisies anonymes, stats |
| [`Moodly/moodly-native`](Moodly/moodly-native) | App **React Native (Expo)** pour iPhone et Android, connexion Google / Apple / Microsoft |
| [`Moodly/moodly-vue`](Moodly/moodly-vue)   | App **Vue 3 + Capacitor** (version conforme à la stack imposée par le sujet) |

## Démarrage rapide

```bash
# 1. Le back (terminal 1)
cd Moodly/moodly-back
npm install && npm run setup && npm run seed
npm run develop                      # http://localhost:1337

# 2. L'app React Native (terminal 2)
cd Moodly/moodly-native
npm install && cp .env.example .env.local
npx expo start --web                 # navigateur ; --go pour Expo Go sur téléphone
```

Connexion : agence **AG-0001**, `camille.durand@entreprise.fr` (salarié) ou
`julien.moreau@entreprise.fr` (manager), mot de passe **`Moodly2026!`**.

Les détails (routes de l'API, anonymat / RGPD, Capacitor) sont dans le README de chaque dossier.
