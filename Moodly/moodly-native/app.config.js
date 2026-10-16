// Configuration de l'app Expo (remplace app.json pour pouvoir lire les variables d'environnement).
// Les identifiants Google / Microsoft se mettent dans .env.local (voir .env.example et
// GUIDE-CONNEXION-SOCIALE.md). Après un changement ici : nouvelle build EAS.

const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

module.exports = {
  expo: {
    name: 'Moodly',
    slug: 'moodly',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'moodly', // liens profonds : moodly://… (retour de la connexion Microsoft)
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic', // thème clair / sombre selon le téléphone
    ios: {
      bundleIdentifier: 'fr.moodly.app',
      supportsTablet: true,
      usesAppleSignIn: true, // « Se connecter avec Apple »
      infoPlist: {
        // Démo : l'API tourne en http sur le Mac (réseau local). À retirer en production (HTTPS).
        NSAppTransportSecurity: { NSAllowsLocalNetworking: true, NSAllowsArbitraryLoads: true },
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'fr.moodly.app',
      adaptiveIcon: {
        backgroundColor: '#FBF6EC',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      'expo-router',
      // Écran de démarrage natif : la mascotte sur le fond crème du prototype
      ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 180, backgroundColor: '#FBF6EC', dark: { backgroundColor: '#130E0A' } }],
      'expo-font',
      'expo-secure-store',
      'expo-web-browser',
      'expo-apple-authentication',
      ['expo-notifications', { enableRemoteNotifications: false, defaultChannel: 'daily' }],
      // Démo : autorise l'API en http sur Android. À retirer en production (HTTPS).
      ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
      // Google Sign-In : activé seulement quand l'identifiant iOS est renseigné
      // (sans lui, le plugin ferait échouer la build ; le bouton Google affiche alors « non configuré »)
      ...(googleIosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }]] : []),
    ],
    experiments: { typedRoutes: false },
    extra: {
      eas: { projectId: process.env.EAS_PROJECT_ID },
    },
  },
};
