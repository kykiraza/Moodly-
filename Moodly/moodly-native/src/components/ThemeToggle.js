// Bouton qui fait tourner le thème : Auto → Clair → Sombre → Auto…
import { View } from 'react-native';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { Press, T } from '@/components/ui';

const NEXT = { system: 'light', light: 'dark', dark: 'system' };
const LABEL = { system: 'Auto (téléphone)', light: 'Clair', dark: 'Sombre' };

export function ThemeToggle({ compact = false, style }) {
  const { c, pref, set } = useTheme();
  const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor;
  return (
    <Press onPress={() => set(NEXT[pref])} accessibilityLabel={`Thème : ${LABEL[pref]} — changer`} style={style}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          backgroundColor: c.secondary,
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: 8,
        }}
      >
        <Icon size={15} strokeWidth={1.75} color={c.foreground} />
        {!compact && (
          <T font="sans700" size={11}>
            {LABEL[pref]}
          </T>
        )}
      </View>
    </Press>
  );
}

/** Petit bouton rond avec une icône (paramètres, calendrier, déconnexion…). */
export function IconButton({ icon: Icon, label, onPress, filled = true }) {
  const { c } = useTheme();
  return (
    <Press onPress={onPress} accessibilityLabel={label}>
      <View style={{ borderRadius: 999, padding: 8, backgroundColor: filled ? c.secondary : 'transparent' }}>
        <Icon size={18} color={c.foreground} />
      </View>
    </Press>
  );
}
