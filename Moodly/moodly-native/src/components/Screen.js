// Cadre d'écran : zones sûres (encoche, barre du bas), fond du thème, défilement optionnel.
// Dans un navigateur large, l'app s'affiche dans une colonne de 420 px façon téléphone.
import { Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/lib/theme';
import { MoodMark } from '@/components/MoodMark';
import { T } from '@/components/ui';

export function Screen({ children, bg, scroll = false, edges = ['top', 'bottom'], contentStyle }) {
  const { c, dark } = useTheme();
  const background = bg ?? c.background;
  const inner = scroll ? (
    <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingBottom: 32 }, contentStyle]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? c.secondary : background, alignItems: 'center' }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SafeAreaView edges={edges} style={{ flex: 1, width: '100%', maxWidth: 420, backgroundColor: background, overflow: 'hidden' }}>
        {inner}
      </SafeAreaView>
    </View>
  );
}

/** Barre du haut : logo Moodly à gauche, boutons à droite. */
export function TopBar({ right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MoodMark size={28} />
        <T font="display800" size={18}>
          Moodly
        </T>
      </View>
      {right}
    </View>
  );
}
