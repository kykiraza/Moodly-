// Mon espace : calendrier d'humeurs personnel.
// Les données viennent UNIQUEMENT du téléphone (journal local) : le serveur ne sait pas qui a répondu quoi.
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { LEVELS, factorById, getHistory, longDate, mood as moodInfo, parseDay } from '@/lib/moods';
import { useAuth } from '@/lib/session';
import { shadowSm, useTheme } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { MoodCalendar } from '@/components/MoodCalendar';
import { Screen } from '@/components/Screen';
import { IconButton, ThemeToggle } from '@/components/ThemeToggle';
import { T } from '@/components/ui';
import { RoleGate } from '@/components/RoleGate';

function EspaceSalarieScreen() {
  const { c } = useTheme();
  const { session } = useAuth();
  const [hist, setHist] = useState({});
  const [sel, setSel] = useState(null);

  const userId = session?.user.id; // undefined pendant une déconnexion
  useEffect(() => {
    if (userId) getHistory(userId).then(setHist);
  }, [userId]);

  // Les saisies des 30 derniers jours
  const last30 = useMemo(() => {
    const lim = new Date();
    lim.setDate(lim.getDate() - 30);
    return Object.entries(hist)
      .filter(([k]) => parseDay(k) >= lim)
      .map(([, v]) => v);
  }, [hist]);
  const avg = last30.length ? last30.reduce((s, e) => s + e.mood, 0) / last30.length : 0;
  const counts = LEVELS.map((l) => last30.filter((e) => e.mood === l).length);
  const frequent = last30.length ? moodInfo(c, counts.indexOf(Math.max(...counts)) + 1).label : '–';
  const e = sel ? hist[sel] : undefined;

  const stat = (value, label) => (
    <View style={[{ flex: 1, borderRadius: 28, backgroundColor: c.card, padding: 12, alignItems: 'center' }, shadowSm]}>
      <T font="display800" size={18} center>
        {value}
      </T>
      <T font="sans600" size={10} color={c.mutedForeground} center style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 }}>
        <IconButton icon={ArrowLeft} label="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/salarie'))} />
        <ThemeToggle />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <View style={{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: c.accent, paddingHorizontal: 10, paddingVertical: 2 }}>
          <T font="sans700" size={11} color={c.accentForeground}>
            Mon espace
          </T>
        </View>
        <T font="display800" size={30} style={{ marginTop: 8 }}>
          {"Mon calendrier d'humeurs"}
        </T>
        <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Lock size={11} color={c.mutedForeground} />
          <T size={12} color={c.mutedForeground}>
            Visible par toi seul·e
          </T>
        </View>
        <T size={11} color={c.mutedForeground} style={{ marginTop: 2 }}>
          Stocké uniquement sur ce téléphone
        </T>
      </View>

      <View style={{ marginHorizontal: 24, marginTop: 20, flexDirection: 'row', gap: 8 }}>
        {stat(avg ? avg.toFixed(1) : '–', 'Moyenne 30 j')}
        {stat(String(last30.length), 'Check-ins')}
        {stat(frequent, 'Humeur la + fréquente')}
      </View>

      <View style={{ marginHorizontal: 24, marginTop: 16 }}>
        <MoodCalendar getDay={(k) => (hist[k] ? { mood: hist[k].mood } : undefined)} selected={sel} onSelect={setSel} />
      </View>

      <View style={[{ marginHorizontal: 24, marginTop: 16, borderRadius: 32, backgroundColor: c.card, padding: 16 }, shadowSm]}>
        {!sel ? (
          <T size={14} color={c.mutedForeground} center>
            Touche un jour pour voir ton humeur.
          </T>
        ) : e ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ borderRadius: 999, padding: 4, backgroundColor: moodInfo(c, e.mood).soft }}>
              <Mascot mood={e.mood} size={52} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={12} color={c.mutedForeground} style={{ textTransform: 'capitalize' }}>
                {longDate(sel)}
              </T>
              <T font="display800" size={20}>
                {moodInfo(c, e.mood).label}
              </T>
              <View style={{ marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {e.factors.map((id) => {
                  const f = factorById(id);
                  if (!f) return null;
                  const Icon = f.icon;
                  return (
                    <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: c.secondary, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Icon size={11} strokeWidth={1.5} color={c.mutedForeground} />
                      <T font="sans600" size={11}>
                        {f.label}
                      </T>
                    </View>
                  );
                })}
              </View>
              {/* Le message libre n'existe que sur ce téléphone */}
              {!!e.note && (
                <T size={14} color={c.foreground} style={{ marginTop: 8, fontStyle: 'italic', opacity: 0.8 }}>
                  « {e.note} »
                </T>
              )}
              {e.demo && (
                <T size={10} color={c.mutedForeground} style={{ marginTop: 4 }}>
                  Exemple de démo
                </T>
              )}
            </View>
          </View>
        ) : (
          <T size={14} color={c.mutedForeground} center>
            Pas de check-in ce jour-là.
          </T>
        )}
      </View>
    </Screen>
  );
}

// Réservé : salarié
export default function EspaceSalarie() {
  return (
    <RoleGate role="salarie">
      <EspaceSalarieScreen />
    </RoleGate>
  );
}
