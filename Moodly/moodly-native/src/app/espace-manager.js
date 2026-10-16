// Calendrier d'équipe : moral moyen par jour sur les 90 derniers jours (agrégats anonymes).
// Cadenas = moins de 3 réponses ce jour-là. Aujourd'hui = journée en cours (moyenne visible demain).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { api } from '@/lib/api';
import { levelOf, longDate, mood as moodInfo } from '@/lib/moods';
import { shadowSm, useTheme } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { MoodCalendar } from '@/components/MoodCalendar';
import { Screen } from '@/components/Screen';
import { IconButton, ThemeToggle } from '@/components/ThemeToggle';
import { Bob } from '@/components/anim';
import { Press, T } from '@/components/ui';
import { RoleGate } from '@/components/RoleGate';

function EspaceManagerScreen() {
  const { c } = useTheme();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(null);

  const load = useCallback(
    () =>
      api.teamStats(90).then(
        (res) => {
          setStats(res);
          setError('');
        },
        (err) => setError(err.message),
      ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  // "AAAA-MM-JJ" → la journée renvoyée par l'API
  const byDate = useMemo(() => Object.fromEntries((stats?.daily ?? []).map((d) => [d.date, d])), [stats]);

  const getDay = (key) => {
    const d = byDate[key];
    if (!d || d.open || (d.count === 0 && d.mood === null)) return undefined;
    if (d.masked) return { hidden: true };
    return d.mood !== null ? { mood: levelOf(d.mood) } : undefined;
  };

  const t = sel ? byDate[sel] : undefined;

  let detail;
  if (!sel) detail = "Touche un jour pour voir le moral de l'équipe.";
  else if (!t || (t.count === 0 && !t.open)) detail = 'Pas de données ce jour-là.';
  else if (t.open) detail = `Journée en cours : la moyenne sera visible demain (${t.count} réponse${t.count > 1 ? 's' : ''} pour l'instant).`;

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 }}>
        <IconButton icon={ArrowLeft} label="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/manager'))} />
        <ThemeToggle />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <View style={{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: c.accent, paddingHorizontal: 10, paddingVertical: 2 }}>
          <T font="sans700" size={11} color={c.accentForeground}>
            Espace manager
          </T>
        </View>
        <T font="display800" size={30} style={{ marginTop: 8 }}>
          {"Calendrier d'équipe"}
        </T>
        <T size={12} color={c.mutedForeground}>
          {stats ? `${stats.team.name} · moral moyen par jour` : 'Moral moyen par jour'}
        </T>
      </View>

      {!stats ? (
        <View style={{ marginHorizontal: 24, marginTop: 40, alignItems: 'center', gap: 12 }}>
          {error ? (
            <>
              <Mascot mood={2} size={100} />
              <T font="sans600" size={14} color={c.destructive} center>
                {error}
              </T>
              <Press onPress={() => { setError(''); load(); }}>
                <View style={{ borderRadius: 999, backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12 }}>
                  <T font="sans700" size={16} color={c.primaryForeground}>
                    Réessayer
                  </T>
                </View>
              </Press>
            </>
          ) : (
            <>
              <Bob>
                <Mascot mood={3} size={100} />
              </Bob>
              <T font="sans600" size={14} color={c.mutedForeground}>
                Chargement…
              </T>
            </>
          )}
        </View>
      ) : (
        <>
          <View style={{ marginHorizontal: 24, marginTop: 20 }}>
            <MoodCalendar getDay={getDay} selected={sel} onSelect={setSel} />
          </View>

          <View style={[{ marginHorizontal: 24, marginTop: 16, borderRadius: 32, backgroundColor: c.card, padding: 16 }, shadowSm]}>
            {detail ? (
              <T size={14} color={c.mutedForeground} center>
                {detail}
              </T>
            ) : t.masked ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Lock size={13} color={c.mutedForeground} />
                <T size={14} color={c.mutedForeground} center style={{ flexShrink: 1 }}>
                  {"Moins de 3 réponses : masqué pour protéger l'anonymat."}
                </T>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ borderRadius: 999, padding: 4, backgroundColor: moodInfo(c, levelOf(t.mood)).soft }}>
                  <Mascot mood={levelOf(t.mood)} size={52} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size={12} color={c.mutedForeground} style={{ textTransform: 'capitalize' }}>
                    {longDate(sel)}
                  </T>
                  <T font="display800" size={20}>
                    {t.mood.toFixed(1)} / 5 · {moodInfo(c, levelOf(t.mood)).label}
                  </T>
                  <T size={12} color={c.mutedForeground}>
                    {t.count} réponses sur {stats.members}
                  </T>
                </View>
              </View>
            )}
          </View>
          <T size={10} color={c.mutedForeground} center style={{ marginTop: 12, marginHorizontal: 24 }}>
            Les 90 derniers jours · moyenne visible dès 3 réponses
          </T>
        </>
      )}
    </Screen>
  );
}

// Réservé : manager
export default function EspaceManager() {
  return (
    <RoleGate role="manager">
      <EspaceManagerScreen />
    </RoleGate>
  );
}
