# Moodly — App mobile (Vue 3 + Capacitor)

L'app de Moodly : les salariés partagent leur moral du jour en quelques secondes, le manager suit la
« météo » de son équipe, en données anonymes. Elle reproduit le prototype de référence (design,
textes, parcours) et parle au vrai back Strapi ([`../moodly-back`](../moodly-back)).

- **Vue 3** (`<script setup>`, JavaScript) + **Vite** + **Tailwind CSS v4** + **vue-router**
- **Capacitor 8** pour Android et iOS (+ notifications locales pour le rappel de 10 h)
- Icônes **Lucide**, polices Bricolage Grotesque / DM Sans

---

## 1. Lancer l'app dans le navigateur

Le back doit tourner (`npm run develop` dans `moodly-back`, voir son README).

```bash
cd Moodly/moodly-vue
npm install          # une seule fois
cp .env.example .env # une seule fois (adresse de l'API)
npm run dev          # → http://localhost:5173
```

Comptes de démo (agence **AG-0001**, mot de passe **`Moodly2026!`**) :
- salarié : `camille.durand@entreprise.fr`
- manager : `julien.moreau@entreprise.fr`

Sur l'écran de connexion, le sélecteur « Prototype : se connecter en tant que » remplit le bon email.
Les boutons Google / Apple / Microsoft connectent le compte de démo (pas de vraie connexion sociale
dans le MVP).

## 2. Lancer l'app sur un téléphone (Capacitor)

1. Le téléphone et le Mac sont sur le **même Wi-Fi**.
2. Dans `.env`, mets l'IP du Mac (trouvée avec `ipconfig getifaddr en0`) :
   `VITE_API_URL=http://192.168.1.42:1337/api` (⚠️ pas `localhost` : sur le téléphone, c'est le téléphone).
3. Puis :
   ```bash
   npm run android   # construit, copie dans android/ et ouvre Android Studio → bouton ▶
   npm run ios       # pareil avec Xcode (Mac uniquement)
   ```
   Après chaque modification du code : `npm run cap:sync`.

> L'API de démo est en `http` (pas `https`). Pour que le téléphone accepte, on a autorisé le `http`
> en réseau local : `android:usesCleartextTraffic` (Android) et `NSAppTransportSecurity` (iOS).
> **À retirer en production**, où l'API serait en HTTPS.

Astuce démo sans installer l'app : `npm run dev` affiche aussi une adresse « Network »
(`http://192.168.x.x:5173`) qu'on peut ouvrir dans le navigateur du téléphone.

---

## 3. Ce que fait chaque écran

| Route             | Qui      | Ce qu'il fait                                                                 | API utilisée                     |
| ----------------- | -------- | ----------------------------------------------------------------------------- | -------------------------------- |
| `/`               | tous     | splash, chargement, onboarding, bienvenue, connexion, inscription             | `POST /auth/login`, `/auth/register` |
| `/salarie`        | salarié  | humeur 1–5 → raisons (max 3) → message → merci / « déjà partagé »             | `GET /moods/today`, `POST /moods` |
| `/espace-salarie` | salarié  | calendrier perso, stats 30 j, détail du jour (avec le message)                | aucune : **stocké sur le téléphone** |
| `/manager`        | manager  | météo de l'équipe, tendance, participation, graphe 7 j / 30 j / trimestre, répartition, raisons, conseil | `GET /team/stats?days=…` |
| `/espace-manager` | manager  | calendrier d'équipe (90 j), cadenas si moins de 3 réponses                    | `GET /team/stats?days=90`        |
| `/parametres`     | tous     | compte, agence, thème, rappel 10 h, effacer mes données, déconnexion          | `GET /profile`                   |

La **garde de routes** (`src/router.js`) envoie un salarié vers `/salarie`, un manager vers
`/manager`, et toute personne non connectée vers l'accueil.

## 4. Vie privée : ce qui part au serveur, ce qui reste sur le téléphone

| Donnée                              | Où ?                       |
| ----------------------------------- | -------------------------- |
| Note du jour (1 à 5) + raisons      | serveur, **sans lien** vers la personne |
| Message libre (400 caractères)      | **téléphone uniquement** (jamais envoyé) |
| Calendrier d'humeurs personnel      | **téléphone uniquement** (`localStorage`, une clé par compte) |
| Session (token, agence)             | téléphone (`localStorage`) |

Chaque appel à l'API envoie `Authorization: Bearer <jwt>` et `X-Agency-Id: AG-0001`
(voir `src/lib/api.js`). Si le serveur répond 401 (token expiré après 7 jours), l'app déconnecte
et revient à l'accueil. « Effacer mes données sur cet appareil » (Paramètres) vide le journal local.

Pour la démo, le calendrier perso est complété par des **jours d'exemple** marqués « Exemple de
démo » : mettre `SHOW_DEMO_HISTORY = false` dans `src/config.js` pour les retirer.

---

## 5. Organisation du code

```
moodly-vue/
├── index.html               polices + script anti-flash du thème sombre
├── capacitor.config.json    appId fr.moodly.app
├── android/  ios/           projets natifs générés par Capacitor
└── src/
    ├── main.js / App.vue    démarrage (+ retour à l'accueil si la session expire)
    ├── router.js            les routes et la garde par rôle
    ├── config.js            adresse de l'API, comptes de démo
    ├── style.css            le design du prototype (couleurs, animations)
    ├── lib/
    │   ├── api.js           tous les appels HTTP (token + X-Agency-Id)
    │   ├── session.js       connexion, inscription, déconnexion
    │   ├── moods.js         humeurs, raisons, journal local du téléphone
    │   ├── theme.js         thème Auto / Clair / Sombre
    │   └── notifications.js rappel quotidien à 10 h (Capacitor)
    ├── components/          Mascot, PhoneShell, TopBar, MoodMark, Pattern,
    │                        SocialRow, ThemeToggle, MoodCalendar
    └── views/               un fichier par écran (tableau ci-dessus)
```

**Écarts volontaires avec le prototype** : le bouton « Rejouer la démo » est retiré (le serveur
n'accepte qu'une saisie par jour) ; les textes précisent que le message et le calendrier restent sur
le téléphone ; la moyenne du jour en cours n'apparaît que le lendemain (règle d'anonymat du back).
