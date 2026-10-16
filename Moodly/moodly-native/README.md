# Moodly — App mobile React Native (Expo)

L'app de Moodly pour **iPhone et Android** : les salariés partagent leur moral du jour en quelques
secondes, le manager suit la « météo » de son équipe en données anonymes. Elle reproduit le prototype
(design, textes, animations, parcours) et parle au vrai back Strapi ([`../moodly-back`](../moodly-back)).

- **Expo SDK 58** (React Native 0.88), **Expo Router** (un fichier = un écran), JavaScript
- Connexion **email / Google / Apple / Microsoft**, rappel quotidien (notifications locales)
- Compilation dans le cloud avec **EAS Build** (pas besoin de Xcode ni d'Android Studio)

---

## 1. Lancer l'app

Le back doit tourner (`npm run develop` dans `moodly-back`).

```bash
cd Moodly/moodly-native
npm install                 # une seule fois
cp .env.example .env.local  # une seule fois, puis mets l'IP du Mac dans EXPO_PUBLIC_API_URL
npx expo start --web        # dans le navigateur (le plus rapide pour vérifier)
npx expo start --go         # sur téléphone avec l'app Expo Go (scanne le QR code, même Wi-Fi)
```

Comptes de démo (agence **AG-0001**, mot de passe **`Moodly2026!`**) : salarié
`camille.durand@entreprise.fr`, manager `julien.moreau@entreprise.fr`. Le sélecteur
« Prototype : se connecter en tant que » remplit le bon email.

## 2. Installer la vraie app sur iPhone / Android + boutons Google, Apple, Microsoft

👉 Tout est expliqué pas à pas dans **[GUIDE-CONNEXION-SOCIALE.md](GUIDE-CONNEXION-SOCIALE.md)** :
comptes développeur, identifiants à recopier, `eas build`, installation sur les téléphones.

| Bouton    | Marche dans…                       | Ce qu'il faut                                   |
| --------- | ---------------------------------- | ----------------------------------------------- |
| Google    | app compilée (EAS), iPhone + Android | projet Google Cloud (gratuit)                  |
| Apple     | iPhone (Expo Go ou app compilée)   | Apple Developer Program (99 $/an)               |
| Microsoft | app compilée (EAS), iPhone + Android | inscription d'app Azure / Entra ID (gratuit)  |

Comment ça marche : l'app obtient un **ID token** signé par Google / Apple / Microsoft et l'envoie à
`POST /api/auth/social`. Le back vérifie la signature et que le jeton a été créé pour Moodly, puis
connecte le compte (ou crée un compte salarié dans l'agence saisie).

## 3. Vie privée

| Donnée                              | Où ?                                      |
| ----------------------------------- | ----------------------------------------- |
| Note du jour (1 à 5) + raisons      | serveur, **sans lien** vers la personne   |
| Message libre (400 caractères)      | **téléphone uniquement**, jamais envoyé   |
| Calendrier d'humeurs personnel      | **téléphone uniquement** (AsyncStorage)   |
| Session (token, agence)             | téléphone, stockage **chiffré** (SecureStore) |

Chaque appel envoie `Authorization: Bearer <jwt>` et `X-Agency-Id`. Si le token expire (401), l'app
déconnecte et revient à l'accueil.

## 4. Organisation du code

```
moodly-native/
├── app.config.js            config Expo (bundle fr.moodly.app, plugins, identifiants via .env.local)
├── eas.json                 profils de build EAS (development, preview, production)
├── GUIDE-CONNEXION-SOCIALE.md
├── assets/                  icône et écran de démarrage (la mascotte du prototype)
└── src/
    ├── app/                 les écrans (Expo Router)
    │   ├── _layout.js       polices, thème, session
    │   ├── index.js         splash, onboarding, connexion, inscription, boutons sociaux
    │   ├── salarie.js       humeur → raisons → message → merci / déjà partagé
    │   ├── espace-salarie.js  calendrier perso (stocké sur le téléphone)
    │   ├── manager.js       météo, tendance, graphe 7 j / 30 j / trimestre, répartition, conseil
    │   ├── espace-manager.js  calendrier d'équipe (90 j)
    │   ├── parametres.js    compte, agence, thème, rappel 10 h, effacer mes données
    │   └── auth.js          retour de la connexion Microsoft (moodly://auth)
    ├── components/          Mascot, MoodMark, Pattern, MoodCalendar, SocialRow, RoleGate (garde par rôle)…
    └── lib/
        ├── api.js           tous les appels HTTP (jwt + X-Agency-Id)
        ├── session.js       connexion / inscription / connexion sociale / déconnexion
        ├── social.js        obtenir l'ID token Google, Apple, Microsoft
        ├── moods.js         humeurs, raisons, journal local
        ├── notifications.js rappel quotidien de 10 h
        ├── theme.js         couleurs du prototype (clair / sombre), polices
        └── storage.js       SecureStore + AsyncStorage
```

## 5. Vérifications faites

- `npx expo lint` : 0 problème · `npx expo-doctor` : 20/20
- `npx expo export --platform ios --platform android` : le code se compile pour les deux plateformes
- Parcours complets testés dans un navigateur piloté (connexion, saisie, calendriers, manager,
  inscription, déconnexion, thème sombre). **Pas encore testé sur un vrai téléphone** : il faut
  d'abord créer les comptes et lancer une build EAS (voir le guide).
