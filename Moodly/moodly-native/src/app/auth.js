// Retour de la connexion Microsoft (lien moodly://auth).
// La fenêtre de connexion récupère elle-même le code : cet écran ne fait que revenir en arrière.
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function AuthRedirect() {
  const { c } = useTheme();
  useEffect(() => {
    const t = setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/')), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <ActivityIndicator color={c.primary} />
    </View>
  );
}
