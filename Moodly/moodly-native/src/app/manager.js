// Vue manager : la « météo » de l'équipe, uniquement à partir d'agrégats anonymes (GET /api/team/stats).
// Un jour avec moins de 3 réponses, un week-end sans réponse ou la journée en cours n'a pas de moyenne.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { CalendarDays, Lightbulb, Lock, LogOut, Settings, TrendingDown, TrendingUp } from 'lucide-react-native';
import { api } from '@/lib/api';
import { LEVELS, factorById, levelOf, mood as moodInfo } from '@/lib/moods';
import { useAuth } from '@/lib/session';
import { alpha, shadowSm, useTheme } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { Screen } from '@/components/Screen';
import { IconButton, ThemeToggle } from '@/components/ThemeToggle';
import { Bob } from '@/components/anim';
import { Press, T } from '@/components/ui';
import { RoleGate } from '@/components/RoleGate';

const RANGES = [
  { label: '7 j', days: 7 },
  { label: '30 j', days: 30 },
  { label: 'Trimestre', days: 90 },
];

// Le conseil Moodly : une suggestion selon la raison sensible la plus citée
const TIPS = {
  charge: "La charge de travail revient souvent : un point d'équipe sur les priorités pourrait aider.",
  management: "Le management est souvent cité : des points individuels réguliers peuvent rassurer l'équipe.",
  conditions: "Les conditions de travail reviennent : vérifie le matériel et l'environnement de l'équipe.",
  perso: 'Des raisons personnelles pèsent sur le moral : rappelle les dispositifs d’écoute et de soutien.',
  equilibre: "L'équilibre vie pro/perso est souvent cité : veille au respect des horaires et au droit à la déconnexion.",
};

// Dimensions du graphe (mêmes que le SVG du prototype)
const W = 320;
const H = 150;
const P = 10;

function ManagerScreen() {
  const { c } = useTheme();
  const { signOut } = useAuth();
  const [range, setRange] = useState(RANGES[1]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [hover, setHover] = useState(null);
  const lastRequest = useRef(0);

  const load = useCallback((r) => {
    const id = ++lastRequest.current; // si on change vite de période, seule la dernière réponse compte
    return api.teamStats(r.days).then(
      (res) => {
        if (id !== lastRequest.current) return;
        setStats(res);
        setError('');
      },
      (err) => {
        if (id === lastRequest.current) setError(err.message);
      },
    );
  }, []);

  useEffect(() => {
    load(range);
  }, [load, range]);

  // Chargement en cours = les stats affichées ne correspondent pas encore à la période choisie
  const loading = !error && stats?.period.days !== range.days;
  const data = useMemo(() => stats?.daily ?? [], [stats]);
  const avg = stats?.summary.mood ?? null;
  const avgLevel = avg !== null ? levelOf(avg) : 3;
  const trend = stats?.summary.trend ?? null;

  // Participation moyenne par jour ouvré terminé
  const perDay = useMemo(() => {
    const days = data.filter((d) => !d.weekend && !d.open);
    return days.length ? Math.round(days.reduce((s, d) => s + d.count, 0) / days.length) : 0;
  }, [data]);

  // --- Graphe
  const x = (k) => P + (data.length > 1 ? k / (data.length - 1) : 0.5) * (W - 2 * P);
  const y = (v) => H - P - ((v - 1) / 4) * (H - 2 * P);
  const pts = data.map((d, k) => ({ ...d, k })).filter((d) => d.mood !== null);
  const path = pts.map((p, n) => `${n ? 'L' : 'M'}${x(p.k)},${y(p.mood)}`).join(' ');
  const grey = data.map((d, k) => ({ d, k })).filter(({ d }) => d.mood === null && (d.count > 0 || d.open || d.weekend));
  const hovered = hover !== null ? data[hover] : null;

  // --- Répartition et raisons
  const dist = stats?.distribution ?? {};
  const distTotal = Object.values(dist).reduce((a, b) => a + b, 0);
  const top = (stats?.tags ?? []).filter((t) => factorById(t.slug)).slice(0, 5);

  const advice = useMemo(() => {
    if (!stats || avg === null) return 'Pas encore assez de réponses pour donner un conseil.';
    if (avg >= 4 && (trend ?? 0) >= 0 && stats.tags.length) {
      return `Le moral est bon : continue de valoriser ce qui marche, notamment « ${stats.tags[0].label} ».`;
    }
    const prefix = trend !== null && trend <= -5 ? `Le moral baisse de ${-trend} % sur la période. ` : '';
    const sensitive = stats.tags.find((t) => TIPS[t.slug]);
    return prefix + (sensitive ? TIPS[sensitive.slug] : "Continue d'écouter ton équipe : les tendances seront plus claires avec plus de réponses.");
  }, [stats, avg, trend]);

  const card = [{ marginHorizontal: 24, marginTop: 16, borderRadius: 32, backgroundColor: c.card, padding: 16 }, shadowSm];
  const TrendIcon = trend !== null && trend < 0 ? TrendingDown : TrendingUp;

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 }}>
        <View style={{ flex: 1 }}>
          <View style={{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: c.accent, paddingHorizontal: 10, paddingVertical: 2 }}>
            <T font="sans700" size={11} color={c.accentForeground}>
              Vue manager
            </T>
          </View>
          <T font="display800" size={30} style={{ marginTop: 8 }}>
            {stats?.team.name ?? 'Mon équipe'}
          </T>
          <T size={12} color={c.mutedForeground}>
            {stats ? `${stats.members} personnes · données anonymes` : 'données anonymes'}
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ThemeToggle compact />
          <IconButton icon={Settings} label="Paramètres" onPress={() => router.push('/parametres')} />
          <IconButton icon={CalendarDays} label="Calendrier d'équipe" onPress={() => router.push('/espace-manager')} />
          <IconButton icon={LogOut} label="Se déconnecter" onPress={signOut} />
        </View>
      </View>

      {/* Choix de la période */}
      <View style={{ marginHorizontal: 24, marginTop: 16, flexDirection: 'row', gap: 4, borderRadius: 999, backgroundColor: c.secondary, padding: 4 }}>
        {RANGES.map((r) => (
          <Press key={r.label} style={{ flex: 1 }} onPress={() => { setHover(null); setRange(r); }}>
            <View style={{ borderRadius: 999, paddingVertical: 6, alignItems: 'center', backgroundColor: range === r ? c.ink : 'transparent' }}>
              <T font="sans700" size={12} color={range === r ? c.background : c.foreground}>
                {r.label}
              </T>
            </View>
          </Press>
        ))}
      </View>

      {!stats ? (
        <View style={{ marginHorizontal: 24, marginTop: 40, alignItems: 'center', gap: 12 }}>
          {error ? (
            <>
              <Mascot mood={2} size={100} />
              <T font="sans600" size={14} color={c.destructive} center>
                {error}
              </T>
              <Press onPress={() => { setError(''); load(range); }}>
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
          {!!error && (
            <T font="sans600" size={12} color={c.destructive} center style={{ marginTop: 12, marginHorizontal: 24 }}>
              {error}
            </T>
          )}

          {/* Météo de l'équipe */}
          <View style={{ marginHorizontal: 24, marginTop: 16, overflow: 'hidden', borderRadius: 32, padding: 20, backgroundColor: c[`mood${avgLevel}`], opacity: loading ? 0.7 : 1 }}>
            <T font="sans700" size={14} color={alpha(c.ink, 0.7)}>
              {"Météo de l'équipe"}
            </T>
            <T font="display800" size={48} color={c.ink}>
              {avg !== null ? avg.toFixed(1) : '–'}
              <T font="display800" size={20} color={c.ink}>
                /5
              </T>
            </T>
            <T font="display800" size={20} color={c.ink}>
              {avg !== null ? moodInfo(c, avgLevel).label : 'Pas assez de réponses'}
            </T>
            {trend !== null && (
              <View style={{ marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: alpha(c.card, 0.7), paddingHorizontal: 8, paddingVertical: 2 }}>
                <TrendIcon size={12} color={c.ink} />
                <T font="sans700" size={12} color={c.ink}>
                  {trend >= 0 ? '+' : ''}
                  {trend} % vs période précédente
                </T>
              </View>
            )}
            <Bob style={{ position: 'absolute', right: -12, bottom: -16 }}>
              <Mascot mood={avgLevel} size={130} />
            </Bob>
          </View>

          <View style={{ marginHorizontal: 24, marginTop: 12, flexDirection: 'row', gap: 12 }}>
            {[
              { label: 'Participation', value: stats.summary.responseRate !== null ? `${stats.summary.responseRate} %` : '–', sub: `≈ ${perDay} sur ${stats.members} par jour` },
              { label: 'Réponses', value: String(stats.summary.responses), sub: `sur ${range.label}` },
            ].map((s) => (
              <View key={s.label} style={[{ flex: 1, borderRadius: 32, backgroundColor: c.card, padding: 16 }, shadowSm]}>
                <T font="sans600" size={12} color={c.mutedForeground}>
                  {s.label}
                </T>
                <T font="display800" size={30}>
                  {s.value}
                </T>
                <T size={11} color={c.mutedForeground}>
                  {s.sub}
                </T>
              </View>
            ))}
          </View>

          {/* Le graphe principal : moral moyen par jour */}
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T font="display800" size={18}>
                Moral moyen par jour
              </T>
              {hovered && hovered.mood !== null && (
                <T font="sans700" size={12}>
                  {moodInfo(c, levelOf(hovered.mood)).label} · {hovered.mood.toFixed(1)}
                </T>
              )}
            </View>
            <View style={{ marginTop: 8, width: '100%', aspectRatio: W / H }}>
            <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
              {[1, 3, 5].map((v) => (
                <Line key={v} x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke={c.border} strokeDasharray="3 4" />
              ))}
              {grey.map((g) => (
                <Rect key={'g' + g.k} x={x(g.k) - 4} y={P} width={8} height={H - 2 * P} rx={3} fill={c.muted} />
              ))}
              {pts.length > 1 && <Path d={path} fill="none" stroke={c.ink} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
              {pts.map((p) => (
                <Circle
                  key={p.k}
                  cx={x(p.k)}
                  cy={y(p.mood)}
                  r={hover === p.k ? 7 : 4.5}
                  fill={c[`mood${levelOf(p.mood)}`]}
                  stroke={c.ink}
                  strokeWidth={1.5}
                  // Toucher un point affiche sa valeur (onClick sur le web, onPress sur téléphone)
                  {...(Platform.OS === 'web' ? { onClick: () => setHover(p.k) } : { onPress: () => setHover(p.k) })}
                />
              ))}
            </Svg>
            </View>
            <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={10} color={c.foreground}>
                Super ↑
              </T>
              <T size={10} color={c.foreground}>
                Pas bien ↓
              </T>
            </View>
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ height: 12, width: 8, borderRadius: 2, backgroundColor: c.muted }} />
              <T size={11} color={c.mutedForeground} style={{ flex: 1 }}>
                Masqué : moins de 3 réponses, week-end ou journée en cours (anonymat)
              </T>
            </View>
          </View>

          {/* Répartition */}
          <View style={card}>
            <T font="display800" size={18}>
              Comment ça va, vraiment ?
            </T>
            {!distTotal ? (
              <T size={14} color={c.mutedForeground} style={{ marginTop: 12 }}>
                Pas encore assez de réponses.
              </T>
            ) : (
              <>
                <View style={{ marginTop: 12, flexDirection: 'row', height: 16, overflow: 'hidden', borderRadius: 999 }}>
                  {LEVELS.map((l) => (
                    <View key={l} style={{ backgroundColor: c[`mood${l}`], width: `${((dist[l] ?? 0) / distTotal) * 100}%` }} />
                  ))}
                </View>
                <View style={{ marginTop: 12, flexDirection: 'row' }}>
                  {LEVELS.map((l) => (
                    <View key={l} style={{ flex: 1, alignItems: 'center' }}>
                      <Mascot mood={l} size={34} />
                      <T font="sans600" size={10}>
                        {moodInfo(c, l).label}
                      </T>
                      <T font="sans700" size={12}>
                        {Math.round(((dist[l] ?? 0) / distTotal) * 100)}%
                      </T>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Raisons les plus citées */}
          <View style={card}>
            <T font="display800" size={18}>
              Ce qui revient le plus
            </T>
            {!top.length ? (
              <T size={14} color={c.mutedForeground} style={{ marginTop: 12 }}>
                Pas encore assez de réponses.
              </T>
            ) : (
              <View style={{ marginTop: 12, gap: 12 }}>
                {top.map((t) => {
                  const f = factorById(t.slug);
                  const Icon = f.icon;
                  return (
                    <View key={t.slug}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Icon size={15} strokeWidth={1.5} color={c.mutedForeground} />
                          <T font="sans600" size={14}>
                            {f.label}
                          </T>
                        </View>
                        <T font="sans600" size={14}>
                          {t.pct} %
                        </T>
                      </View>
                      <View style={{ marginTop: 4, height: 8, borderRadius: 999, backgroundColor: c.secondary }}>
                        <View style={{ height: 8, borderRadius: 999, backgroundColor: c.primary, width: `${Math.min(100, t.pct * 2.5)}%` }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            <T size={11} color={c.mutedForeground} style={{ marginTop: 12 }}>
              {"Part des réponses citant chaque raison. Aucune réponse individuelle n'est visible."}
            </T>
          </View>

          {/* Conseil */}
          <View style={{ marginHorizontal: 24, marginTop: 16, flexDirection: 'row', gap: 12, borderRadius: 32, backgroundColor: c.mood3Soft, padding: 16 }}>
            <Lightbulb size={20} color={c.foreground} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <T font="sans700" size={16}>
                Le conseil Moodly
              </T>
              <T size={14} color={alpha(c.foreground, 0.8)}>
                {advice}
              </T>
            </View>
          </View>
        </>
      )}

      <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Lock size={12} color={c.mutedForeground} />
        <T font="sans600" size={12} color={c.mutedForeground}>
          Données agrégées dès 3 réponses
        </T>
      </View>
    </Screen>
  );
}

// Réservé : manager
export default function Manager() {
  return (
    <RoleGate role="manager">
      <ManagerScreen />
    </RoleGate>
  );
}
