// Écrans d'introduction : splash animé, chargement, onboarding (3 slides), bienvenue.
// Mêmes animations que le prototype (pop, anneaux, lettres, points, blobs flottants).
import { Animated, Easing, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight } from 'lucide-react-native';
import { alpha, shadowPop, useTheme } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { Pattern } from '@/components/Pattern';
import { Bob, FadeIn, useAnim } from '@/components/anim';
import { Press, T } from '@/components/ui';

// ---------------------------------------------------------------- Splash
function Ring({ delay, color }) {
  const t = useAnim({ duration: 1800, delay, easing: Easing.out(Easing.ease) });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 999,
        borderWidth: 4,
        borderColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.85] }) }],
      }}
    />
  );
}

function Float({ style, delay = 0, children }) {
  const t = useAnim({ duration: 5400, delay, easing: Easing.inOut(Easing.ease) });
  const k = { inputRange: [0, 0.5, 1] };
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          transform: [
            { translateX: t.interpolate({ ...k, outputRange: [0, 6, 0] }) },
            { translateY: t.interpolate({ ...k, outputRange: [0, -22, 0] }) },
            { rotate: t.interpolate({ ...k, outputRange: ['0deg', '14deg', '0deg'] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function Letter({ ch, delay, color }) {
  const t = useAnim({ duration: 540, delay, loop: false, easing: Easing.out(Easing.back(2)) });
  return (
    <Animated.View
      style={{
        opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['10deg', '0deg'] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
        ],
      }}
    >
      <T font="display800" size={60} color={color} upper style={{ lineHeight: 64 }}>
        {ch}
      </T>
    </Animated.View>
  );
}

function Rise({ delay, children, style }) {
  return (
    <FadeIn from="bottom" distance={16} duration={620} delay={delay} style={style}>
      {children}
    </FadeIn>
  );
}

function Dot({ delay, color }) {
  const t = useAnim({ duration: 950, delay, easing: Easing.inOut(Easing.ease) });
  const k = { inputRange: [0, 0.5, 1] };
  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: color,
        opacity: t.interpolate({ ...k, outputRange: [0.55, 1, 0.55] }),
        transform: [{ translateY: t.interpolate({ ...k, outputRange: [0, -9, 0] }) }],
      }}
    />
  );
}

export function Splash({ onSkip }) {
  const { c } = useTheme();
  // « splash-pop » : la mascotte apparaît en rebondissant
  const pop = useAnim({ duration: 780, loop: false, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });

  const blob = (size, color) => ({ width: size, height: size, borderRadius: 999, backgroundColor: color, filter: 'blur(24px)' });
  const confetti = [
    { l: '14%', t: '16%', c: c.mood3, s: 12, d: 0 },
    { l: '78%', t: '20%', c: c.mood1, s: 10, d: 600 },
    { l: '22%', t: '68%', c: c.mood5, s: 9, d: 1100 },
    { l: '84%', t: '62%', c: c.mood4, s: 13, d: 300 },
    { l: '60%', t: '12%', c: c.mood2, s: 8, d: 1600 },
  ];

  return (
    <Pressable onPress={onSkip} accessibilityLabel="Passer l'écran d'accueil" style={{ flex: 1 }}>
      <LinearGradient
        colors={[c.mood1, c.mood3, c.mood4, c.primary]}
        locations={[0, 0.35, 0.55, 1]}
        start={{ x: 0.41, y: 0 }}
        end={{ x: 0.59, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 32 }}
      >
        {/* blobs flottants */}
        <Float style={{ position: 'absolute', left: -48, top: 96 }}>
          <View style={blob(160, alpha(c.mood3, 0.5))} />
        </Float>
        <Float style={{ position: 'absolute', right: -56, top: '33%' }} delay={1200}>
          <View style={blob(192, alpha(c.mood1, 0.45))} />
        </Float>
        <Float style={{ position: 'absolute', bottom: 64, left: '25%' }} delay={2400}>
          <View style={blob(128, alpha(c.mood5, 0.4))} />
        </Float>

        {/* confettis */}
        {confetti.map((b, i) => (
          <Float key={i} delay={b.d} style={{ position: 'absolute', left: b.l, top: b.t }}>
            <View style={{ width: b.s, height: b.s, borderRadius: 999, backgroundColor: b.c }} />
          </Float>
        ))}

        {/* mascotte + anneaux qui pulsent */}
        <View style={{ width: 208, height: 208, alignItems: 'center', justifyContent: 'center' }}>
          <Ring delay={0} color={alpha(c.background, 0.6)} />
          <Ring delay={600} color={alpha(c.background, 0.4)} />
          <Animated.View
            style={[
              { borderRadius: 999, backgroundColor: c.background, padding: 20 },
              shadowPop,
              {
                opacity: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
                transform: [
                  { translateY: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [40, -8, 0] }) },
                  { scale: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.25, 1.14, 1] }) },
                ],
              },
            ]}
          >
            <Bob>
              <Mascot mood={5} size={120} />
            </Bob>
          </Animated.View>
        </View>

        {/* le nom, lettre par lettre */}
        <View style={{ marginTop: 24, flexDirection: 'row' }}>
          {'Moodly'.split('').map((ch, i) => (
            <Letter key={i} ch={ch} delay={700 + i * 90} color={c.background} />
          ))}
        </View>
        <Rise delay={1250} style={{ marginTop: 16 }}>
          <T font="sans600" size={14} color={alpha(c.background, 0.9)} center>
            Ton moral du jour, en quelques secondes.
          </T>
        </Rise>

        {/* points qui rebondissent */}
        <View style={{ marginTop: 32, flexDirection: 'row', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <Dot key={i} delay={i * 160} color={c.background} />
          ))}
        </View>

        <Rise delay={1600} style={{ position: 'absolute', bottom: 32 }}>
          <T font="sans700" size={11} color={alpha(c.background, 0.7)} upper style={{ letterSpacing: 2.2 }}>
            Appuie pour continuer
          </T>
        </Rise>
      </LinearGradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------- Chargement
export function Loading({ progress }) {
  const { c } = useTheme();
  const moodLevel = Math.min(5, Math.floor(progress / 20) + 1); // de triste (1) à contente (5)
  return (
    <FadeIn duration={500} style={{ flex: 1, backgroundColor: c.background }}>
      <Pattern cols={7} rows={8} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', width: '100%' }} />
      <View style={{ marginTop: 'auto', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 64 }}>
        <View style={{ marginTop: -96, borderRadius: 999, backgroundColor: c.background, padding: 16 }}>
          <Bob>
            <Mascot mood={moodLevel} size={130} />
          </Bob>
        </View>
        <T font="display800" size={48} style={{ marginTop: 16 }}>
          Moodly
        </T>
        <T size={14} color={alpha(c.foreground, 0.7)} style={{ marginTop: 8 }}>
          Ton moral du jour, en quelques secondes.
        </T>
        <View style={{ marginTop: 40, height: 8, width: 192, overflow: 'hidden', borderRadius: 999, backgroundColor: alpha(c.foreground, 0.15) }}>
          <View style={{ height: '100%', width: `${progress}%`, borderRadius: 999, backgroundColor: c.mood4 }} />
        </View>
        <T font="sans600" size={12} color={alpha(c.foreground, 0.6)} style={{ marginTop: 12 }}>
          Chargement… {progress}%
        </T>
      </View>
    </FadeIn>
  );
}

// ---------------------------------------------------------------- Onboarding
export const SLIDES = [
  { mood: 4, bg: 'mood1', soft: 'mood1Soft', title: 'Check-in avec ton moral du jour.', sub: 'Quelques secondes pour dire comment tu vas.' },
  { mood: 5, bg: 'mood5', soft: 'mood5Soft', title: '100 % anonyme, vraiment.', sub: "Ton manager ne voit que la météo de l'équipe." },
  { mood: 3, bg: 'primary', soft: 'accent', title: 'Une équipe qui va mieux.', sub: 'Des tendances claires pour agir au bon moment.' },
];

export function Onboarding({ index, onNext, onSkip }) {
  const { c } = useTheme();
  const s = SLIDES[index];
  const last = index === SLIDES.length - 1;
  const bg = c[s.bg];
  return (
    <View style={{ flex: 1, backgroundColor: c[s.soft] }}>
      <T font="display800" size={18} center style={{ paddingTop: 40 }}>
        Moodly
      </T>
      <FadeIn key={index} from="right" distance={32} duration={500} style={{ marginTop: 40, flex: 1 }}>
        <View style={{ flex: 1, borderTopLeftRadius: 48, borderTopRightRadius: 48, backgroundColor: bg }}>
          {/* bosses de nuage */}
          <View style={{ position: 'absolute', top: -40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ height: 96, width: 128, borderRadius: 999, backgroundColor: bg, marginHorizontal: -16, marginTop: i === 1 ? -24 : 0 }} />
            ))}
          </View>
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Bob>
              <Mascot mood={s.mood} size={190} />
            </Bob>
          </View>
          <View style={{ marginTop: 'auto', paddingHorizontal: 28, paddingBottom: 32 }}>
            <View style={{ marginBottom: 20, flexDirection: 'row', gap: 6 }}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={{ height: 6, borderRadius: 999, backgroundColor: c.card, width: i === index ? 32 : 8, opacity: i === index ? 1 : 0.5 }}
                />
              ))}
            </View>
            <T font="display800" size={36} upper color={c.card} style={{ lineHeight: 36 * 0.95 }}>
              {s.title}
            </T>
            <T font="sans500" size={14} color={alpha(c.card, 0.9)} style={{ marginTop: 12 }}>
              {s.sub}
            </T>
            <View style={{ marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Press onPress={onSkip}>
                <T font="sans600" size={14} color={alpha(c.card, 0.8)}>
                  Passer
                </T>
              </Press>
              <Press onPress={onNext} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <T font="sans600" size={14} color={c.card}>
                  {last ? "C'est parti" : 'Continuer'}
                </T>
                <View
                  style={{
                    height: 56,
                    width: 56,
                    borderRadius: 999,
                    backgroundColor: c.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0px 0px 0px 4px ${alpha(c.card, 0.3)}`,
                  }}
                >
                  <ArrowUpRight size={22} color={c.primaryForeground} />
                </View>
              </Press>
            </View>
          </View>
        </View>
      </FadeIn>
    </View>
  );
}

// ---------------------------------------------------------------- Bienvenue
export function Welcome({ onLogin, onSignup }) {
  const { c } = useTheme();
  return (
    <FadeIn style={{ flex: 1, backgroundColor: c.background }}>
      <Pattern cols={7} rows={8} style={{ height: '50%', width: '100%' }} />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32 }}>
        <Bob style={{ marginTop: -48 }}>
          <Mascot mood={5} size={90} />
        </Bob>
        <T font="display800" size={30} center style={{ marginTop: 16 }}>
          Bienvenue sur Moodly
        </T>
        <T size={14} center color={alpha(c.foreground, 0.7)} style={{ marginTop: 12 }}>
          Partage ton moral en quelques secondes, en toute simplicité et en toute confidentialité.
        </T>
        <View style={{ marginTop: 'auto', marginBottom: 40, flexDirection: 'row', gap: 12, width: '100%' }}>
          <Press onPress={onSignup} style={{ flex: 1 }}>
            <View style={{ borderRadius: 28, backgroundColor: c.primary, paddingVertical: 14, alignItems: 'center' }}>
              <T font="sans700" size={16} color={c.primaryForeground}>
                Créer un compte
              </T>
            </View>
          </Press>
          <Press onPress={onLogin} style={{ flex: 1 }}>
            <View style={{ borderRadius: 28, borderWidth: 2, borderColor: alpha(c.foreground, 0.4), paddingVertical: 12, alignItems: 'center' }}>
              <T font="sans700" size={16}>
                Se connecter
              </T>
            </View>
          </Press>
        </View>
      </View>
    </FadeIn>
  );
}
