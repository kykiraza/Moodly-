# Moodly — Backend (Strapi 5)

API de l'app **Moodly** : les salariés donnent leur moral du jour (une note de 1 à 5 et 0 à 3 raisons),
le manager voit le moral de son équipe, **sans jamais savoir qui a répondu quoi**.

- Strapi **5.58**, en JavaScript
- Base **SQLite** (un simple fichier : `.tmp/data.db`)
- Node.js **22 ou 24**
- L'app mobile (Vue 3 + Capacitor) est dans [`../moodly-vue`](../moodly-vue)

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
- `npm run seed` **efface et recrée** les données de démo (et tous les comptes salariés/managers).
  À relancer juste avant la démo : les dates sont calculées à partir d'aujourd'hui.
- Pour arrêter le serveur : `Ctrl + C` dans le terminal.

### Données de démo

- Agence **`AG-0001`** (« Agence démo Moodly »), une **Équipe Produit** de 12 personnes.
- Mot de passe de tous les comptes : **`Moodly2026!`**

| Rôle    | Email                                                                                        |
| ------- | -------------------------------------------------------------------------------------------- |
| Manager | `julien.moreau@entreprise.fr`                                                                |
| Salarié | `camille.durand@entreprise.fr` (+ lea.martin, hugo.bernard, ines.petit, theo.robert, chloe.richard, nathan.dubois, emma.laurent, lucas.simon, jade.michel, adam.lefebvre @entreprise.fr) |

Le seed crée ~360 saisies sur les 60 derniers jours (30 jours pour le graphe + 30 pour calculer la
tendance), avec un **creux de moral il y a 2 semaines**. **Aujourd'hui est vide** : on peut se
connecter en salarié et faire une saisie en direct pendant la démo.

---

## 2. Les routes de l'API

Toutes les routes commencent par `http://localhost:1337/api`. Sauf le login et l'inscription, il faut
envoyer **deux en-têtes** :

```
Authorization: Bearer <jwt>
X-Agency-Id: AG-0001
```

| Méthode | Route                      | Qui ?          | Rôle                                                              |
| ------- | -------------------------- | -------------- | ----------------------------------------------------------------- |
| POST    | `/auth/login`              | tout le monde  | `{ agencyId, email, password }` → session                         |
| POST    | `/auth/register`           | tout le monde  | `{ agencyId, name, email, password }` → session (compte salarié)  |
| GET     | `/profile`                 | connecté       | `{ name, email, role, agency, team, managedTeams }`               |
| GET     | `/tags`                    | connecté       | les 8 raisons proposées                                           |
| POST    | `/moods`                   | salarié        | `{ level: 1..5, factors: ["charge", ...] }` → 201                 |
| GET     | `/moods/today`             | salarié        | `{ hasAnswered, day }`                                            |
| GET     | `/team/stats?days=30`      | manager        | stats de **son** équipe (days entre 7 et 90)                      |
| GET     | `/teams/:id/stats?days=30` | manager de l'équipe | même calcul, format Strapi `{ data: ... }`                   |

La **session** renvoyée par le login et l'inscription :

```json
{
  "jwt": "eyJhbGciOi…",
  "agencyId": "AG-0001",
  "role": "employee",
  "user": { "id": "tip4f65…", "email": "camille.durand@entreprise.fr", "username": "Camille Durand", "role": "employee" }
}
```

Pour `POST /moods`, `score` / `mood` sont acceptés à la place de `level`, et `tags` à la place de
`factors`. Tout autre champ (par exemple un message libre) est **ignoré**.

Codes d'erreur : **400** données invalides, **401** mauvais identifiants ou token invalide/expiré
(7 jours), **403** pas de token, mauvaise agence ou pas le droit, **409** déjà répondu aujourd'hui
(ou email déjà utilisé à l'inscription), **429** trop de tentatives de connexion.

👉 Pour tester sans l'app : ouvre [`requests.http`](requests.http) dans VS Code avec l'extension
**REST Client**, puis clique sur « Send Request » au-dessus de chaque requête.

### Exemple de réponse de `GET /team/stats?days=30`

```json
{
  "team": { "documentId": "if7nz…", "name": "Équipe Produit" },
  "members": 11,
  "minResponses": 3,
  "daily": [
    { "date": "2026-10-14", "mood": null, "count": 2, "weekend": false, "masked": true, "open": false },
    { "date": "2026-10-15", "mood": 3.8, "count": 9, "weekend": false, "masked": false, "open": false },
    { "date": "2026-10-16", "mood": null, "count": 3, "weekend": false, "masked": false, "open": true }
  ],
  "summary": { "mood": 3.5, "previousMood": 3.3, "trend": 6, "responseRate": 71, "responses": 186, "countedResponses": 179 },
  "distribution": { "1": 6, "2": 18, "3": 67, "4": 63, "5": 25 },
  "tags": [{ "slug": "equilibre", "label": "Équilibre vie pro/perso", "count": 54, "pct": 30 }]
}
```

- `mood` = moyenne des notes du jour. Elle vaut `null` quand : il n'y a aucune réponse,
  il y a moins de 3 réponses (`masked: true`), ou c'est **aujourd'hui** (`open: true`).
- `trend` = évolution de la moyenne en % par rapport à la période précédente de même durée.
- `responseRate` = taux de participation en %, sur les jours ouvrés (lundi → vendredi) terminés.
- `distribution` et `tags` ne comptent que les jours publiés (`countedResponses`).

---

## 3. Anonymat et RGPD (comment c'est garanti)

1. **Aucun lien entre un Mood et un User.** Une saisie contient seulement : le jour, la note, les
   raisons, l'équipe et une empreinte `dailyKey`. **Aucun texte libre.**
2. **`dailyKey` = HMAC(userId:jour, MOOD_SALT)** : une empreinte calculée avec une clé secrète. Elle
   sert uniquement à refuser une 2e saisie le même jour (index unique en base) et n'est jamais
   renvoyée par l'API. Sans la clé, on ne peut pas remonter à la personne.
3. **Personne ne peut relire les saisies** : seule la création (`POST /moods`) est ouverte. Le manager
   ne reçoit que des **agrégats** (moyennes, nombres, raisons comptées).
4. **Seuil d'anonymat** : une moyenne calculée sur moins de `MOOD_MIN_RESPONSES` (3) réponses est
   masquée. Les jours masqués sont **aussi exclus** de la moyenne globale, de la répartition et des
   raisons : sinon, en comparant deux périodes, on pourrait retrouver les réponses d'un seul jour par
   soustraction.
5. **La journée en cours n'est jamais publiée** (seul le nombre de réponses l'est). Sinon le manager
   pourrait rafraîchir avant et après qu'un collègue réponde (3 → 4 réponses) et en déduire sa note.
6. **Période minimale de 7 jours** pour les stats : sur une période trop courte, la répartition des
   notes deviendrait presque individuelle.
7. **Le message libre et l'historique personnel restent sur le téléphone** : l'app les garde en
   local, ils ne sont jamais envoyés au serveur.
8. **L'équipe et l'agence viennent toujours de la base** (via le token), jamais de la requête. En plus,
   l'en-tête `X-Agency-Id` doit correspondre à l'agence du compte (policy `global::agency-match`).
9. **Durée de conservation limitée** : chaque nuit à 3h, les saisies de plus de `MOOD_RETENTION_DAYS`
   (90) jours sont supprimées (`config/cron-tasks.js`).
10. **Inscription contrôlée** : seulement avec un code agence valide, et toujours comme salarié. Les
    managers sont créés par l'admin.

**Limites connues (à dire honnêtement à l'oral)** :
- c'est une *pseudonymisation* forte, pas un anonymat absolu : quelqu'un qui aurait à la fois la base
  ET la clé `MOOD_SALT` pourrait recalculer les empreintes (d'où `MOOD_SALT` dans `.env`, jamais sur Git) ;
- le code agence est un secret partagé : quelqu'un qui le connaît peut créer un compte salarié dans
  l'équipe. En production, on enverrait plutôt une invitation par email.

---

## 4. Organisation du code

```
moodly-back/
├── config/
│   ├── cron-tasks.js          purge nocturne des vieilles saisies
│   ├── middlewares.js         CORS (autorise l'en-tête X-Agency-Id)
│   ├── plugins.js             JWT simple valable 7 jours (adapté au mobile)
│   └── server.js              active le cron
├── scripts/
│   ├── seed.js                données de démo (npm run seed)
│   └── setup-env.js           crée/complète le .env (npm run setup)
├── src/
│   ├── index.js               au démarrage : vérifie les secrets, rôles, index unique
│   ├── bootstrap/
│   │   ├── permissions.js     rôles Employee/Manager et leurs permissions
│   │   └── database.js        index unique sur moods.daily_key
│   ├── policies/agency-match.js   vérifie l'en-tête X-Agency-Id
│   ├── utils/moodly.js        today() (Europe/Paris), addDays(), dailyKey()…
│   ├── api/
│   │   ├── agency/            les agences (code AG-0001…), gérées dans l'admin
│   │   ├── mood/              saisie du moral (POST /moods, GET /moods/today)
│   │   ├── team/              stats manager (+ policy is-team-manager)
│   │   ├── tag/               GET /tags (les 8 raisons)
│   │   ├── profile/           GET /profile (+ service réutilisé partout)
│   │   └── session/           POST /auth/login et /auth/register
│   └── extensions/users-permissions/content-types/user/schema.json
│                              ajoute agency, team et managedTeams au User
└── requests.http              tests des routes (extension REST Client)
```

### Règles pour ajouter du code

- Strapi 5 : utiliser `strapi.documents('api::…')` (Document Service) et les `documentId`,
  **pas** l'ancienne API v4 (`entityService`, `data.attributes`).
- **Toute nouvelle route** doit avoir sa permission ajoutée dans `src/bootstrap/permissions.js`
  (sinon : 403) et la policy `global::agency-match` si elle est réservée aux connectés.
  Les permissions des rôles Employee/Manager sont remises comme dans ce fichier à chaque démarrage.
- Ne **jamais** ajouter de relation Mood ↔ User, ni de champ texte libre dans Mood.

### Variables d'environnement (`.env`)

| Variable              | Défaut          | Rôle                                                  |
| --------------------- | --------------- | ----------------------------------------------------- |
| `MOOD_SALT`           | (secret)        | clé du HMAC `dailyKey` — ne jamais la partager         |
| `MOOD_MIN_RESPONSES`  | `3`             | seuil en dessous duquel une moyenne est masquée       |
| `MOOD_RETENTION_DAYS` | `90`            | durée de conservation des saisies                     |
| `APP_TIMEZONE`        | `Europe/Paris`  | fuseau qui définit « aujourd'hui »                    |
| `DATABASE_FILENAME`   | `.tmp/data.db`  | fichier SQLite                                        |
