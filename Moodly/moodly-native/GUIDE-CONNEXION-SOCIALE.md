# Guide : activer Google, Apple et Microsoft + installer l'app sur les téléphones

Le code est prêt : il ne manque que **tes identifiants** (gratuits sauf Apple). Tant qu'ils ne sont
pas renseignés, les boutons affichent « Connexion … pas encore configurée ».

Où vont les identifiants :

| Variable                              | Fichier                          | Rôle                                   |
| ------------------------------------- | -------------------------------- | -------------------------------------- |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`    | app : `.env.local` + EAS         | ID client Google **Web**               |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`    | app : `.env.local` + EAS         | ID client Google **iOS**               |
| `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`   | app : `.env.local` + EAS         | « iOS URL scheme » de Google           |
| `EXPO_PUBLIC_MICROSOFT_CLIENT_ID`     | app : `.env.local` + EAS         | ID d'application Azure / Entra ID      |
| `GOOGLE_CLIENT_IDS`                   | back : `moodly-back/.env`        | les ID Google Web, iOS **et** Android, séparés par des virgules |
| `MICROSOFT_CLIENT_ID`                 | back : `moodly-back/.env`        | le même ID d'application Azure         |
| `APPLE_CLIENT_IDS`                    | back : `moodly-back/.env`        | `fr.moodly.app` (déjà rempli)          |

> Le back vérifie que chaque jeton a bien été créé **pour ces identifiants** : si un ID manque côté
> back, la connexion est refusée même si elle marche côté app. Redémarre le back après avoir modifié
> son `.env`.

---

## 0. Compte Expo et EAS (pour compiler l'app)

1. Crée un compte gratuit sur https://expo.dev.
2. Dans le dossier de l'app :
   ```bash
   cd Moodly/moodly-native
   npx eas-cli@latest login
   npx eas-cli@latest init        # crée le projet sur expo.dev et affiche son ID
   ```
3. Copie l'ID affiché (« projectId ») dans `.env.local` : `EAS_PROJECT_ID=…`.

## 1. Google (gratuit)

1. Va sur https://console.cloud.google.com → **Créer un projet** « Moodly ».
2. Menu **Google Auth Platform** (ou « API et services → Écran de consentement OAuth ») :
   - type **Externe**, nom de l'app « Moodly », ton email d'assistance ;
   - tant que l'app est « en test », ajoute les comptes Google qui vont tester dans **Utilisateurs test**.
3. **Clients → Créer un client OAuth**, trois fois :
   - **Application Web** (nom « Moodly Web ») → copie l'ID → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   - **iOS** : ID de bundle `fr.moodly.app` → copie l'ID → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`,
     et l'« iOS URL scheme » affiché (`com.googleusercontent.apps.…`) → `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`.
   - **Android** : nom de package `fr.moodly.app` + **empreinte SHA-1**. Pour l'obtenir :
     ```bash
     npx eas-cli@latest credentials -p android
     ```
     (choisis le profil `preview`, laisse EAS créer la clé de signature, puis copie « SHA1 Fingerprint »).
4. Dans `moodly-back/.env` : `GOOGLE_CLIENT_IDS=<id web>,<id ios>,<id android>`.

## 2. Microsoft (gratuit)

1. Va sur https://entra.microsoft.com → **Applications → Inscriptions d'applications → Nouvelle inscription**.
2. Nom « Moodly » ; types de comptes : **Comptes dans un annuaire d'organisation et comptes Microsoft personnels**.
3. URI de redirection : plateforme **Client public / natif (mobile et bureau)**, valeur **`moodly://auth`**.
4. Copie l'**ID d'application (client)** → `EXPO_PUBLIC_MICROSOFT_CLIENT_ID` (app) et `MICROSOFT_CLIENT_ID` (back).
5. **Autorisations d'API** → Microsoft Graph → autorisations déléguées : coche `openid`, `profile`, `email`.
6. (Conseillé) **Configuration du jeton → Ajouter une revendication facultative** → ID → `email`.

> Pour la sécurité, un compte Microsoft n'est jamais relié à un compte Moodly créé autrement
> (mot de passe, Google, Apple) : le back répond « connecte-toi avec ton mot de passe ».

## 3. Apple (payant : Apple Developer Program, 99 $/an)

« Se connecter avec Apple » n'existe **que sur iPhone** (sur Android, le bouton explique que ce n'est
pas disponible).

1. Inscris-toi à l'Apple Developer Program : https://developer.apple.com/programs/.
2. C'est tout côté code : `usesAppleSignIn: true` est déjà dans `app.config.js`, et **EAS Build active
   la capacité « Sign In with Apple »** sur l'identifiant `fr.moodly.app` lors de la première build iOS.
3. Côté back, `APPLE_CLIENT_IDS=fr.moodly.app` est déjà rempli.

Apple ne donne le nom de la personne qu'à sa **toute première** connexion : l'app l'envoie alors au
back pour créer le compte.

## 4. Donner les variables à EAS (les builds ne lisent pas `.env.local`)

`.env.local` n'est pas envoyé sur les serveurs d'EAS. Déclare chaque variable une fois :

```bash
npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_API_URL --value http://192.168.1.42:1337/api
npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <id web>
npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value <id ios>
npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME --value <scheme>
npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_MICROSOFT_CLIENT_ID --value <id microsoft>
npx eas-cli@latest env:create --environment preview --visibility plaintext --name EAS_PROJECT_ID --value <project id>
```

⚠️ `EXPO_PUBLIC_API_URL` est **gravée dans l'app** au moment de la build : c'est l'adresse que le
téléphone utilisera. Avec le back sur ton Mac, mets l'IP du Mac (`ipconfig getifaddr en0`), garde
le même Wi-Fi le jour de la démo, et refais une build si l'IP change.

## 5. Compiler et installer

```bash
npm run build:android   # → lien vers un fichier .apk : ouvre-le sur le téléphone Android pour l'installer
npm run build:ios       # → demande ton compte Apple Developer ; pour installer sur ton iPhone,
                        #   enregistre-le d'abord avec : npx eas-cli@latest device:create
```

La build prend 10 à 20 minutes dans le cloud ; le lien d'installation apparaît dans le terminal et sur
https://expo.dev.

## 6. Tester rapidement sans compiler (Expo Go)

```bash
npx expo start --go   # puis scanne le QR code avec l'app Expo Go (même Wi-Fi)
```

Tout marche dans Expo Go **sauf** Google et Microsoft (ils ont besoin de l'app compilée). Apple
fonctionne dans Expo Go sur iPhone.
