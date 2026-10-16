// Écran salarié : humeur (1-5) → raisons (0 à 3) → message libre → merci → « déjà partagé ».
// - La note et les raisons sont envoyées au back (anonymes : aucun lien vers la personne).
// - Le message libre n'est JAMAIS envoyé : il reste dans le journal local du téléphone.
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Lock, LogOut, Settings } from 'lucide-react-native';
import { api } from '@/lib/api';
import { FACTORS, LEVELS, getToday, mood as moodInfo, saveToday } from '@/lib/moods';
import { useAuth } from '@/lib/session';
import { alpha, FONTS, shadowPop, useTheme } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { Screen, TopBar } from '@/components/Screen';
import { IconButton, ThemeToggle } from '@/components/ThemeToggle';
import { Bob, FadeIn, useAnim } from '@/components/anim';
import { Press, T } from '@/components/ui';
import { RoleGate } from '@/components/RoleGate';

function SalarieScreen() {
  const { c } = useTheme();
  const { session, signOut } = useAuth();
  const userId = session?.user.id; // undefined pendant une déconnexion

  // 'checking' | 'error' | 'mood' | 'factors' | 'note' | 'thanks' | 'done'
  const [step, setStep] = useState('checking');
  const [level, setLevel] = useState(3);
  const [factors, setFactors] = useState([]);
  const [note, setNote] = useState('');
  const [knownMood, setKnownMood] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const m = moodInfo(c, level);
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const showDone = useCallback(async () => {
    const local = await getToday(userId);
    setKnownMood(Boolean(local));
    if (local) setLevel(local.mood);
    setStep('done');
  }, [userId]);

  // Au démarrage : a-t-on déjà répondu aujourd'hui ? (le serveur fait foi)
  const check = useCallback(
    () =>
      api.hasAnsweredToday().then(
        (answered) => (answered ? showDone() : setStep('mood')),
        (err) => {
          setError(err.message);
          setStep('error');
        },
      ),
    [showDone],
  );
  useEffect(() => {
    if (userId) check();
  }, [check, userId]);

  // Bouton « Réessayer »
  const retry = () => {
    setStep('checking');
    setError('');
    check();
  };

  const toggle = (id) =>
    setFactors((f) => (f.includes(id) ? f.filter((x) => x !== id) : f.length < 3 ? [...f, id] : f));

  async function send() {
    setError('');
    setSending(true);
    try {
      // Seuls la note et les raisons partent au serveur, PAS le message
      await api.sendMood({ level, factors });
      await saveToday(userId, level, factors, note);
      setStep('thanks');
    } catch (err) {
      if (err.status === 409) await showDone(); // déjà répondu (ex. depuis un autre appareil)
      else setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const header = (
    <TopBar
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ThemeToggle compact />
          <IconButton icon={Settings} label="Paramètres" filled={false} onPress={() => router.push('/parametres')} />
          <IconButton icon={CalendarDays} label="Mon calendrier" filled={false} onPress={() => router.push('/espace-salarie')} />
          <IconButton icon={LogOut} label="Se déconnecter" filled={false} onPress={signOut} />
        </View>
      }
    />
  );

  const anon = (
    <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Lock size={12} color={c.mutedForeground} />
      <T font="sans600" size={12} color={c.mutedForeground}>
        Ta réponse est anonyme
      </T>
    </View>
  );

  const primaryBtn = (label, onPress, disabled) => (
    <Press onPress={onPress} disabled={disabled}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: c.primary, paddingVertical: 16 }}>
        <T font="sans700" size={16} color={c.primaryForeground}>
          {label}
        </T>
        {label === 'Suivant' && <ArrowRight size={18} color={c.primaryForeground} />}
      </View>
    </Press>
  );

  const stepHeader = (n, back) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 }}>
      <IconButton icon={ArrowLeft} label="Retour" onPress={back} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={{ height: 8, borderRadius: 999, width: s <= n ? 24 : 8, backgroundColor: s <= n ? c.primary : c.border }} />
        ))}
      </View>
      <T font="sans600" size={12} color={c.mutedForeground}>
        Étape {n} sur 3
      </T>
    </View>
  );

  if (!session) return null; // déconnexion en cours : la garde de routes redirige

  // ---------------- Vérification / erreur
  if (step === 'checking' || step === 'error') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          {step === 'checking' ? (
            <>
              <Bob>
                <Mascot mood={3} size={110} />
              </Bob>
              <T font="sans600" size={14} color={c.mutedForeground}>
                Chargement…
              </T>
            </>
          ) : (
            <>
              <Mascot mood={2} size={110} />
              <T font="sans600" size={14} color={c.destructive} center>
                {error}
              </T>
              <Press onPress={retry}>
                <View style={{ borderRadius: 999, backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12 }}>
                  <T font="sans700" size={16} color={c.primaryForeground}>
                    Réessayer
                  </T>
                </View>
              </Press>
            </>
          )}
        </View>
      </Screen>
    );
  }

  // ---------------- Étape 1 : humeur (le fond prend la couleur de l'humeur)
  if (step === 'mood') {
    return (
      <Screen bg={m.fill}>
        <FadeIn style={{ flex: 1 }}>
          {header}
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <T font="sans600" size={14} color={alpha(c.ink, 0.7)} style={{ textTransform: 'capitalize' }}>
              {date}
            </T>
            <T font="display800" size={36} upper color={c.ink} style={{ marginTop: 4, lineHeight: 36 * 0.95 }}>
              {"Comment tu te sens aujourd'hui ?"}
            </T>
          </View>
          <View style={{ marginHorizontal: 24, marginTop: 24, alignItems: 'center', borderRadius: 32, backgroundColor: alpha(c.card, 0.25), paddingVertical: 32 }}>
            <Bob>
              <Mascot mood={level} size={170} />
            </Bob>
            <T font="display800" size={24} color={c.ink} style={{ marginTop: 8 }}>
              {m.label}
            </T>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
            <Slider
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={level}
              onValueChange={(v) => setLevel(Math.round(v))}
              minimumTrackTintColor={c.ink}
              maximumTrackTintColor={alpha(c.ink, 0.25)}
              thumbTintColor={c.card}
              accessibilityLabel="Ton moral"
            />
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              {LEVELS.map((l) => (
                <Press key={l} onPress={() => setLevel(l)} style={{ flex: 1 }} accessibilityLabel={moodInfo(c, l).label}>
                  <View
                    style={[
                      { alignItems: 'center', gap: 4, borderRadius: 28, paddingVertical: 8 },
                      level === l ? [{ backgroundColor: c.card, transform: [{ translateY: -2 }] }, shadowPop] : { backgroundColor: alpha(c.card, 0.4) },
                    ]}
                  >
                    <Mascot mood={l} size={32} />
                    <T font="sans700" size={11} color={c.ink}>
                      {moodInfo(c, l).label}
                    </T>
                  </View>
                </Press>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 'auto', paddingHorizontal: 24, paddingBottom: 32 }}>{primaryBtn('Suivant', () => setStep('factors'))}</View>
        </FadeIn>
      </Screen>
    );
  }

  // ---------------- Étape 2 : raisons
  if (step === 'factors') {
    return (
      <Screen>
        <FadeIn from="right" style={{ flex: 1 }}>
          {stepHeader(2, () => setStep('mood'))}
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
              <T font="display800" size={30} style={{ lineHeight: 34 }}>
                {"Qu'est-ce qui joue sur ton moral ?"}
              </T>
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <T size={14} color={c.mutedForeground}>
                  {"Jusqu'à 3 choix · facultatif"}
                </T>
                <View style={{ borderRadius: 999, backgroundColor: c.accent, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <T font="sans700" size={12} color={c.accentForeground}>
                    {factors.length} / 3
                  </T>
                </View>
              </View>
              <View style={{ marginTop: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: m.soft, paddingVertical: 4, paddingLeft: 4, paddingRight: 12 }}>
                <Mascot mood={level} size={28} />
                <T font="sans600" size={14}>
                  Ton moral : {m.label}
                </T>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24, paddingTop: 24 }}>
              {FACTORS.map((f) => {
                const on = factors.includes(f.id);
                const Icon = f.icon;
                return (
                  <Press key={f.id} onPress={() => toggle(f.id)} accessibilityState={{ selected: on }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: on ? c.primary : c.border,
                        backgroundColor: on ? c.accent : c.card,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                      }}
                    >
                      <Icon size={15} strokeWidth={1.5} color={on ? c.primary : c.mutedForeground} />
                      <T font="sans600" size={14} color={on ? c.accentForeground : c.foreground}>
                        {f.label}
                      </T>
                      {on && <Check size={14} strokeWidth={2} color={c.accentForeground} />}
                    </View>
                  </Press>
                );
              })}
            </View>
            <View style={{ marginTop: 'auto', paddingHorizontal: 24, paddingBottom: 32, paddingTop: 24 }}>
              {anon}
              {primaryBtn('Suivant', () => setStep('note'))}
            </View>
          </ScrollView>
        </FadeIn>
      </Screen>
    );
  }

  // ---------------- Étape 3 : message (reste sur le téléphone)
  if (step === 'note') {
    return (
      <Screen>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <FadeIn from="right" style={{ flex: 1 }}>
            {stepHeader(3, () => setStep('factors'))}
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
                <T font="display800" size={30}>
                  {"Envie d'en dire plus ?"}
                </T>
                <T size={14} color={c.mutedForeground} style={{ marginTop: 8 }}>
                  {"Écris ce qui te passe par la tête. Facultatif : ce texte reste sur ton téléphone, il n'est jamais envoyé."}
                </T>
              </View>
              <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  multiline
                  maxLength={400}
                  placeholder="Aujourd'hui, j'ai l'impression que…"
                  placeholderTextColor={c.mutedForeground}
                  textAlignVertical="top"
                  style={{
                    minHeight: 170,
                    borderRadius: 32,
                    borderWidth: 2,
                    borderColor: c.border,
                    backgroundColor: c.card,
                    padding: 20,
                    fontSize: 16,
                    fontFamily: FONTS.sans400,
                    color: c.foreground,
                  }}
                />
                <T size={12} color={c.mutedForeground} style={{ marginTop: 4, textAlign: 'right' }}>
                  {note.length}/400
                </T>
              </View>
              <View style={{ marginTop: 'auto', paddingHorizontal: 24, paddingBottom: 32, paddingTop: 24 }}>
                {!!error && (
                  <T font="sans600" size={12} color={c.destructive} center style={{ marginBottom: 12 }}>
                    {error}
                  </T>
                )}
                {anon}
                {primaryBtn(sending ? 'Envoi…' : 'Envoyer', send, sending)}
              </View>
            </ScrollView>
          </FadeIn>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  // ---------------- Merci !
  if (step === 'thanks') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Confetti />
          <Bob>
            <Mascot mood={5} size={180} />
          </Bob>
          <T font="display800" size={48} style={{ marginTop: 16 }}>
            Merci !
          </T>
          <T font="sans600" size={18} style={{ marginTop: 4 }}>
            À demain 👋
          </T>
          <View style={{ marginTop: 16 }}>{anon}</View>
          <View style={{ position: 'absolute', left: 24, right: 24, bottom: 32, gap: 12 }}>
            <Press onPress={() => router.push('/espace-salarie')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: c.primary, paddingVertical: 14 }}>
                <CalendarDays size={18} color={c.primaryForeground} />
                <T font="sans700" size={16} color={c.primaryForeground}>
                  Voir mon calendrier
                </T>
              </View>
            </Press>
            <Press onPress={() => setStep('done')}>
              <View style={{ alignItems: 'center', borderRadius: 999, borderWidth: 2, borderColor: c.foreground, backgroundColor: c.card, paddingVertical: 12 }}>
                <T font="sans700" size={16}>
                  Fermer
                </T>
              </View>
            </Press>
          </View>
        </View>
      </Screen>
    );
  }

  // ---------------- Déjà partagé aujourd'hui
  return (
    <Screen>
      <FadeIn style={{ flex: 1 }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ height: 224, width: 224, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: m.soft }}>
            <Bob>
              <Mascot mood={level} size={150} />
            </Bob>
          </View>
          {knownMood && (
            <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: c.card, paddingHorizontal: 12, paddingVertical: 4 }}>
              <View style={{ height: 8, width: 8, borderRadius: 999, backgroundColor: m.fill }} />
              <T font="sans600" size={12}>
                Ton moral du jour : <T font="sans700" size={12}>{m.label}</T>
              </T>
            </View>
          )}
          <T font="display800" size={24} center style={{ marginTop: 16 }}>
            {"Tu as déjà partagé ton moral aujourd'hui."}
          </T>
          <T size={16} color={c.mutedForeground} style={{ marginTop: 4 }}>
            Reviens demain !
          </T>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>{anon}</View>
      </FadeIn>
    </Screen>
  );
}

/** Pluie de confettis de l'écran « Merci ! ». */
function Confetti() {
  const { c } = useTheme();
  const colors = [c.mood1, c.mood2, c.mood3, c.mood4, c.mood5, c.primary];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <Piece key={i} color={colors[i % colors.length]} left={`${(i * 37) % 100}%`} delay={(i % 9) * 120} />
      ))}
    </View>
  );
}

function Piece({ color, left, delay }) {
  const t = useAnim({ duration: 2600, delay, loop: false, easing: Easing.in(Easing.ease) });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left,
        height: 12,
        width: 6,
        borderRadius: 2,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-20, 520] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) },
        ],
      }}
    />
  );
}

// Réservé : salarié
export default function Salarie() {
  return (
    <RoleGate role="salarie">
      <SalarieScreen />
    </RoleGate>
  );
}
