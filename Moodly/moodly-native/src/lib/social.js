// 🔑 « Continuer avec Google / Apple / Microsoft » : obtenir l'ID token du fournisseur.
// Le serveur vérifie ensuite ce jeton (signature, app destinataire, email vérifié).
// Identifiants à mettre dans .env.local → voir GUIDE-CONNEXION-SOCIALE.md.
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession(); // referme la fenêtre de connexion au retour (web)

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const MICROSOFT_CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;

/** Erreur « affichable » (message en français pour l'écran de connexion). */
export class SocialLoginError extends Error {}

// ---------- Google (bibliothèque native : nécessite l'app compilée avec EAS) ----------
async function google() {
  if (Platform.OS === 'web') throw new SocialLoginError("Google : disponible dans l'app iPhone / Android");
  if (!GOOGLE_WEB_CLIENT_ID) throw new SocialLoginError('Connexion Google pas encore configurée (voir le guide)');

  let lib;
  try {
    // Chargé seulement maintenant : le module natif n'existe pas dans Expo Go
    lib = require('@react-native-google-signin/google-signin');
  } catch {
    throw new SocialLoginError("Google nécessite l'app compilée (EAS Build), pas Expo Go");
  }
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = lib;

  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  try {
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null; // annulé
    if (!res.data.idToken) throw new SocialLoginError('Google n\'a pas renvoyé de jeton (ID client Web ?)');
    return { idToken: res.data.idToken, name: res.data.user.name ?? undefined };
  } catch (err) {
    if (err instanceof SocialLoginError) throw err;
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw new SocialLoginError('Connexion Google impossible');
  }
}

// ---------- Apple (iPhone uniquement) ----------
async function apple() {
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
    throw new SocialLoginError("Se connecter avec Apple n'est disponible que sur iPhone");
  }
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!cred.identityToken) throw new SocialLoginError("Apple n'a pas renvoyé de jeton");
    // Apple ne donne le nom qu'à la 1re connexion : on l'envoie pour créer le compte
    const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
    return { idToken: cred.identityToken, name: name || undefined };
  } catch (err) {
    if (err instanceof SocialLoginError) throw err;
    if (err?.code === 'ERR_REQUEST_CANCELED') return null;
    throw new SocialLoginError('Connexion Apple impossible');
  }
}

// ---------- Microsoft (OpenID Connect + PKCE via le navigateur) ----------
async function microsoft() {
  if (!MICROSOFT_CLIENT_ID) throw new SocialLoginError('Connexion Microsoft pas encore configurée (voir le guide)');

  const discovery = await AuthSession.fetchDiscoveryAsync('https://login.microsoftonline.com/common/v2.0');
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'moodly', path: 'auth' }); // moodly://auth
  const request = new AuthSession.AuthRequest({
    clientId: MICROSOFT_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') {
    if (result.type === 'error') throw new SocialLoginError('Connexion Microsoft refusée');
    return null; // annulé / fenêtre fermée
  }

  const tokens = await AuthSession.exchangeCodeAsync(
    {
      clientId: MICROSOFT_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier },
    },
    discovery,
  );
  if (!tokens.idToken) throw new SocialLoginError("Microsoft n'a pas renvoyé de jeton");
  return { idToken: tokens.idToken };
}

const PROVIDERS = { google, apple, microsoft };

/** → { idToken, name? } ou null si l'utilisateur a annulé. Lance SocialLoginError sinon. */
export function getSocialIdToken(provider) {
  return PROVIDERS[provider]();
}
