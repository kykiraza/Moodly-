# Moodly — Backend (Strapi 5)

API de l'app **Moodly** : les salariés donnent leur moral du jour (une note de 1 à 5 et 0 à 3 tags),
le manager voit le moral de son équipe sur 30 jours, **sans jamais savoir qui a répondu quoi**.

- Strapi **5.58**, en JavaScript
- Base **SQLite** (un simple fichier : `.tmp/data.db`)
- Node.js **22 ou 24**

---

## 1. Lancer le projet

```bash
cd Moodly/moodly-back
npm install        # installe les dépendances (une seule fois)
npm run setup      # crée le fichier .env avec des secrets aléatoires (une seule fois)
npm run seed       # crée les données de démo (serveur ARRÊTÉ)
npm run develop    # démarre l'API → http://localhost:1337
```

- Admin Strapi : http://localhost:1337/admin (au 1er lancement, Strapi demande de créer un compte admin).
- `npm run seed` **efface et recrée** toutes les données de démo. À relancer juste avant la démo :
  les dates sont calculées à partir d'aujourd'hui.
- Pour arrêter le serveur : `Ctrl + C` dans le terminal.

### Comptes de démo (mot de passe `Moodly2026!`)

| Équipe         | Manager             | Employés                                                       |
| -------------- | ------------------- | -------------------------------------------------------------- |
| Équipe Produit | `sarah@moodly.test` | `lea`, `hugo`, `ines`, `theo`, `chloe`, `nathan` @moodly.test  |
| Équipe Support | `karim@moodly.test` | `emma`, `lucas`, `jade`, `adam` @moodly.test                   |

Le seed crée ~170 saisies sur les 30 derniers jours. L'Équipe Produit a un **creux de moral au milieu
du mois** (pour que le graphe raconte quelque chose). **Aujourd'hui est vide** : on peut se connecter
en employé et faire une saisie en direct pendant la démo.

---

## 2. Les routes de l'API

Toutes les routes commencent par `http://localhost:1337/api`. Sauf le login, il faut envoyer
le header `Authorization: Bearer <token>`.

| Méthode | Route                    | Qui ?    | Rôle                                                       |
| ------- | ------------------------ | -------- | ---------------------------------------------------------- |
| POST    | `/auth/login`            | tout le monde | `{ email, password }` → `{ token, role, name }`       |
| GET     | `/profile`               | connecté | `{ name, role, team, managedTeams }`                       |
| GET     | `/tags`                  | connecté | la liste des tags proposés                                 |
| POST    | `/moods`                 | employé  | `{ score: 1..5, tags: ["fatigue", ...] }` → 201            |
| GET     | `/moods/today`           | employé  | `{ hasAnswered, day }`                                     |
| GET     | `/team/stats?days=30`    | manager  | stats de **son** équipe, au format du front                |
| GET     | `/teams/:id/stats?days=30` | manager de l'équipe | même calcul, format Strapi `{ data: ... }`  |

Codes d'erreur utilisés : **400** données invalides, **401** pas connecté / token expiré,
**403** pas le droit, **409** déjà répondu aujourd'hui.

La route Strapi standard `POST /auth/local` (`{ identifier, password }` → `{ jwt, user }`) marche aussi.

👉 Pour tester sans le front : ouvre [`requests.http`](requests.http) dans VS Code avec l'extension
**REST Client**, puis clique sur « Send Request » au-dessus de chaque requête.

### Exemple de réponse de `GET /team/stats?days=30`

```json
{
  "team": { "documentId": "cjg1…", "name": "Équipe Produit" },
  "minResponses": 3,
  "daily": [
    { "date": "2026-10-15", "mood": 4, "count": 4, "weekend": false, "masked": false },
    { "date": "2026-10-16", "mood": null, "count": 1, "weekend": false, "masked": true }
  ],
  "summary": { "mood": 3.5, "responseRate": 74, "responses": 102 },
  "tags": [{ "slug": "reconnaissance", "label": "Reconnaissance", "emoji": "🏆", "count": 30 }]
}
```

- `mood` = moyenne des notes du jour, **`null` si moins de 3 réponses** (`masked: true`).
- `responseRate` = taux de participation en %, calculé sur les jours ouvrés (lundi → vendredi).

---

## 3. Anonymat et RGPD (comment c'est garanti)

1. **Aucun lien entre un Mood et un User.** Une saisie contient seulement : le jour, la note, les tags,
   l'équipe et une empreinte `dailyKey`. Pas de champ texte libre.
2. **`dailyKey` = HMAC(userId:jour, MOOD_SALT)** : une empreinte calculée avec une clé secrète.
   Elle sert uniquement à refuser une 2e saisie le même jour (index unique en base), et elle est
   marquée `private` (jamais renvoyée par l'API). Sans la clé, on ne peut pas remonter à la personne.
3. **Personne ne peut relire les saisies** : seule la création (`POST /moods`) est ouverte. Le manager
   ne reçoit que des **agrégats** (moyennes, nombres, tags comptés).
4. **Seuil d'anonymat** : une moyenne calculée sur moins de `MOOD_MIN_RESPONSES` (3) réponses est
   masquée. Les jours masqués sont **aussi exclus de la moyenne globale et des tags** : sinon, en
   comparant les stats d'aujourd'hui et d'hier, on pourrait retrouver les réponses d'un seul jour
   par soustraction.
5. **L'équipe vient toujours de la base** (via le token), jamais du body de la requête : un employé ne
   peut pas « polluer » les stats d'une autre équipe.
6. **Durée de conservation limitée** : chaque nuit à 3h, les saisies de plus de `MOOD_RETENTION_DAYS`
   (90) jours sont supprimées (`config/cron-tasks.js`).
7. **Pas d'inscription libre** : les comptes sont créés par l'admin.

**Limite connue (à dire honnêtement à l'oral)** : c'est une *pseudonymisation* forte, pas un anonymat
absolu. Quelqu'un qui aurait à la fois la base de données ET la clé `MOOD_SALT` pourrait recalculer
les empreintes. C'est pour ça que `MOOD_SALT` est dans `.env`, jamais sur Git.

---

## 4. Organisation du code

```
moodly-back/
├── config/
│   ├── cron-tasks.js          purge nocturne des vieilles saisies
│   ├── plugins.js             JWT simple valable 7 jours (adapté au mobile)
│   └── server.js              active le cron
├── scripts/
│   ├── seed.js                données de démo (npm run seed)
│   └── setup-env.js           crée/complète le .env (npm run setup)
├── src/
│   ├── index.js               au démarrage : vérifie MOOD_SALT, rôles, index unique
│   ├── bootstrap/
│   │   ├── permissions.js     rôles Employee/Manager et leurs permissions
│   │   └── database.js        index unique sur moods.daily_key
│   ├── utils/moodly.js        today() (Europe/Paris), addDays(), dailyKey()…
│   ├── api/
│   │   ├── mood/              saisie du moral (POST /moods, GET /moods/today)
│   │   ├── team/              stats manager (+ policy is-team-manager)
│   │   ├── tag/               GET /tags
│   │   ├── profile/           GET /profile (+ service réutilisé partout)
│   │   └── session/           POST /auth/login au format du front
│   └── extensions/users-permissions/content-types/user/schema.json
│                              ajoute team et managedTeams au User
├── docs/moodly-api.js         client prêt à copier pour le front Expo
└── requests.http              tests des routes (extension REST Client)
```

### Règles pour ajouter du code

- Strapi 5 : utiliser `strapi.documents('api::…')` (Document Service) et les `documentId`,
  **pas** l'ancienne API v4 (`entityService`, `data.attributes`).
- **Toute nouvelle route** doit avoir sa permission ajoutée dans `src/bootstrap/permissions.js`
  (sinon : 403). Les permissions des rôles Employee/Manager sont remises comme dans ce fichier à
  chaque démarrage : les cocher dans l'admin ne sert à rien.
- Ne **jamais** ajouter de relation Mood ↔ User, ni de champ texte libre dans Mood.

### Variables d'environnement (`.env`)

| Variable              | Défaut          | Rôle                                                  |
| --------------------- | --------------- | ----------------------------------------------------- |
| `MOOD_SALT`           | (secret)        | clé du HMAC `dailyKey` — ne jamais la partager         |
| `MOOD_MIN_RESPONSES`  | `3`             | seuil en dessous duquel une moyenne est masquée       |
| `MOOD_RETENTION_DAYS` | `90`            | durée de conservation des saisies                     |
| `APP_TIMEZONE`        | `Europe/Paris`  | fuseau qui définit « aujourd'hui »                    |
| `DATABASE_FILENAME`   | `.tmp/data.db`  | fichier SQLite                                        |

---

## 5. Brancher le front Expo

Le front (branche `front`, dossier `Moodly/moodly-front`) a été écrit pour 3 questions. L'API suit le
sujet : **une note + des tags**. Les routes reprennent les noms du front, il reste à adapter :

1. **`src/config.ts`** : `USE_MOCK = false` et `API_URL = 'http://<IP du Mac>:1337/api'`
   (port **1337** et **`/api`** à la fin ; l'IP du Mac, pas `localhost`).
2. **`types.ts` → `MoodAnswer`** : `{ score: number; tags: string[] }`. (L'API accepte aussi `mood`
   à la place de `score` ; `workload` et `atmosphere` sont ignorés.)
3. **Écran de saisie** : une seule question (1 à 5) + une liste de tags à cocher (0 à 3),
   chargée avec `GET /tags`.
4. **`types.ts` → `DailyStat`** : `{ date, mood: number | null, count, weekend, masked }` et
   `summary: { mood: number | null, responseRate: number | null, responses }`. Afficher « pas assez
   de réponses » quand `mood` vaut `null`.
5. **Vue manager** : un seul graphe (`mood` par jour) + éventuellement la liste `tags`.
6. Erreurs à gérer : **409** à l'envoi → « déjà répondu aujourd'hui » ; **401** n'importe où →
   token expiré (7 jours), revenir à l'écran de login.

Un client complet prêt à copier est dans [`docs/moodly-api.js`](docs/moodly-api.js).
