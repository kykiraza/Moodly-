# Moodly — Front mobile

App mobile de suivi du moral des salariés (projet Epitech Digital School, 3e année).
React Native + Expo (TypeScript).

## Lancer l'app

1. Installer [Node.js](https://nodejs.org) (version LTS) et l'app **Expo Go** sur ton téléphone.
2. Dans ce dossier :
   ```
   npm install
   npx expo start
   ```
3. Scanner le QR code avec le téléphone (appareil photo sur iPhone, Expo Go sur Android).

## Comptes de test (mode fausses données)

| Rôle | Email | Mot de passe |
|---|---|---|
| Employé | employe@moodly.fr | moodly |
| Manager | manager@moodly.fr | moodly |

## Brancher le vrai back

Dans `src/config.ts` :
- `USE_MOCK = false`
- `API_URL = 'http://<IP du PC qui fait tourner le back>:3000'` (pas `localhost`, même wifi que le téléphone)

## Organisation du code

```
App.tsx                      → choisit l'écran selon la connexion et le rôle
src/
  config.ts                  → réglages (fausses données / vrai back, IP, seuil d'anonymat)
  theme.ts                   → couleurs de la maquette
  context/AuthContext.tsx    → connexion, déconnexion, session gardée (SecureStore)
  services/
    types.ts                 → formats de données = contrat d'API
    api.ts                   → choisit mockApi ou realApi
    mockApi.ts               → faux back pour développer sans attendre
    realApi.ts               → appels HTTP au vrai back (axios + token JWT)
  components/                → Button, Input, Face, MoodQuestion, MoodChart
  screens/
    LoginScreen.tsx          → écran 1
    MoodScreen.tsx           → écran 2 (3 questions)
    ThanksScreen.tsx         → écran 3
    EmployeeHome.tsx         → enchaîne écran 2 / écran 3 selon "déjà répondu ?"
    DashboardScreen.tsx      → écran 4 (manager)
```

## Anonymat

- Le manager ne reçoit et n'affiche que des **moyennes d'équipe**.
- Une journée avec **moins de 3 réponses** n'est pas affichée sur le graphe (`MIN_ANSWERS` dans `src/config.ts`).
- Un employé ne peut pas accéder au dashboard (le rôle décide de l'écran affiché).
