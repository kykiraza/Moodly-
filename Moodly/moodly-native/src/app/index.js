// Accueil : splash → chargement → onboarding → bienvenue → connexion / inscription.
// Connexion, inscription et boutons Google / Apple / Microsoft appellent le VRAI back.
// Une fois connecté, on est redirigé vers l'écran du rôle (salarié ou manager).
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { homeFor } from '@/components/RoleGate';
import { ArrowLeft, Building2, Check, Circle, Eye, EyeOff, Lock } from 'lucide-react-native';
import { api } from '@/lib/api';
import { PASSWORD_RULES } from '@/lib/password';
import { useAuth } from '@/lib/session';
import { alpha, FONTS, useTheme } from '@/lib/theme';
import { Screen } from '@/components/Screen';
import { Loading, Onboarding, SLIDES, Splash, Welcome } from '@/components/Intro';
import { Pattern } from '@/components/Pattern';
import { SocialRow } from '@/components/SocialRow';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FadeIn } from '@/components/anim';
import { Press, T } from '@/components/ui';

// Comptes de démo créés par `npm run seed` côté back
const DEMO = { agencyId: 'AG-0001', password: 'Moodly2026!', salarie: 'camille.durand@entreprise.fr', manager: 'julien.moreau@entreprise.fr' };

export default function Index() {
  const { session, signedOut } = useAuth();
  // 'splash' | 'loading' | 'onboarding' | 'welcome' | 'login' | 'signup'
  // Après une déconnexion : directement le formulaire de connexion.
  const [screen, setScreen] = useState(signedOut ? 'login' : 'splash');
  const [slide, setSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (screen !== 'splash') return;
    const t = setTimeout(() => setScreen('loading'), 2600);
    return () => clearTimeout(t);
  }, [screen]);
  useEffect(() => {
    if (screen !== 'loading') return;
    const id = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 60);
    return () => clearInterval(id);
  }, [screen]);
  useEffect(() => {
    if (progress < 100) return;
    const t = setTimeout(() => setScreen('onboarding'), 250);
    return () => clearTimeout(t);
  }, [progress]);

  // L'accueil reste ouvert « en dessous » pendant qu'on est connecté : si on se déconnecte,
  // on bascule sur le formulaire de connexion (mise à jour pendant le rendu, méthode conseillée par React).
  const [prevSignedOut, setPrevSignedOut] = useState(signedOut);
  if (signedOut !== prevSignedOut) {
    setPrevSignedOut(signedOut);
    if (signedOut) setScreen('login');
  }

  // Déjà connecté (ou connexion qui vient de réussir) → l'écran du rôle
  if (session) return <Redirect href={homeFor(session)} />;

  if (screen === 'splash') {
    return (
      <Screen edges={[]}>
        <Splash onSkip={() => setScreen('loading')} />
      </Screen>
    );
  }

  return (
    <Screen edges={screen === 'onboarding' ? ['bottom'] : ['top', 'bottom']}>
      {screen === 'loading' && <Loading progress={progress} />}
      {screen === 'onboarding' && (
        <Onboarding
          index={slide}
          onNext={() => (slide < SLIDES.length - 1 ? setSlide(slide + 1) : setScreen('welcome'))}
          onSkip={() => setScreen('welcome')}
        />
      )}
      {screen === 'welcome' && <Welcome onLogin={() => setScreen('login')} onSignup={() => setScreen('signup')} />}
      {(screen === 'login' || screen === 'signup') && (
        <AuthForm mode={screen} onBack={() => setScreen('welcome')} onSwitch={(m) => setScreen(m)} />
      )}
      {['welcome', 'login', 'signup'].includes(screen) && (
        <View style={{ position: 'absolute', right: 16, top: 20, zIndex: 20 }}>
          <ThemeToggle />
        </View>
      )}
    </Screen>
  );
}

/** Champ de saisie au style du prototype (fond « secondary », coins arrondis). */
function Field({ icon: Icon, right, style, ...props }) {
  const { c } = useTheme();
  return (
    <View style={[{ justifyContent: 'center' }, style]}>
      {Icon && <Icon size={16} color={c.mutedForeground} style={{ position: 'absolute', left: 16, zIndex: 1 }} />}
      <TextInput
        placeholderTextColor={c.mutedForeground}
        style={{
          borderRadius: 24,
          backgroundColor: c.secondary,
          paddingVertical: 14,
          paddingLeft: Icon ? 44 : 20,
          paddingRight: right ? 48 : 20,
          fontSize: 14,
          fontFamily: FONTS.sans400,
          color: c.foreground,
        }}
        {...props}
      />
      {right && <View style={{ position: 'absolute', right: 16 }}>{right}</View>}
    </View>
  );
}

function AuthForm({ mode, onBack, onSwitch }) {
  const { c } = useTheme();
  const { signIn, signUp, signInSocial } = useAuth();
  const isLogin = mode === 'login';

  const [role, setRole] = useState('salarie'); // « Prototype : se connecter en tant que »
  const [agency, setAgency] = useState(DEMO.agencyId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(isLogin ? DEMO.salarie : '');
  const [password, setPassword] = useState(isLogin ? DEMO.password : '');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(null); // 'form' | 'google' | 'apple' | 'microsoft' | null
  const [error, setError] = useState('');

  // Inscription : nom de l'entreprise retrouvé à partir du code, pour vérifier qu'on rejoint la bonne.
  // lookup = { code, name } (trouvée) ou { code, error } ; ne s'affiche que s'il correspond au code tapé.
  const [lookup, setLookup] = useState(null);
  const codeComplete = /^AG-\d{4}$/.test(agency.trim());
  useEffect(() => {
    if (isLogin || !codeComplete) return;
    const code = agency.trim();
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .agency(code)
        .then((a) => !cancelled && setLookup({ code, name: a.name }))
        .catch((e) =>
          !cancelled &&
          setLookup({ code, error: e.status === 404 ? 'Code entreprise inconnu' : e.status === 429 ? 'Trop d\'essais, réessaie dans une minute' : e.message }),
        );
    }, 300); // on attend que la personne ait fini de taper
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isLogin, codeComplete, agency]);
  const company = !isLogin && codeComplete && lookup?.code === agency.trim() ? lookup : null;

  // Changer de rôle de démo remplit l'email du compte correspondant
  const pickRole = (r) => {
    setRole(r);
    setEmail(r === 'salarie' ? DEMO.salarie : DEMO.manager);
    setPassword(DEMO.password);
    setError('');
  };

  async function run(kind, action) {
    setError('');
    setBusy(kind);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const submit = () => {
    if (!isLogin && company?.error) return setError(company.error);
    return run('form', () => (isLogin ? signIn(email.trim(), password, agency) : signUp(name, email.trim(), password, agency)));
  };

  // Google / Apple / Microsoft : vraie connexion, l'ID agence du formulaire est utilisé
  const social = (provider) => run(provider, () => signInSocial(provider, agency));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <FadeIn from="bottom" style={{ flex: 1 }}>
        <Pattern cols={6} rows={6} fade style={{ position: 'absolute', right: -8, top: 0, width: 256, height: 256 }} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <Press onPress={onBack} accessibilityLabel="Retour" style={{ alignSelf: 'flex-start', padding: 4 }}>
              <ArrowLeft size={20} color={c.foreground} />
            </Press>
            <T font="display800" size={30} style={{ marginTop: 112, lineHeight: 36 }}>
              {isLogin ? 'Content de\nte revoir !' : 'Créer un\ncompte'}
            </T>
            <T size={14} color={alpha(c.foreground, 0.7)} style={{ marginTop: 8 }}>
              {isLogin ? 'Entre tes informations pour te connecter.' : 'Entre tes informations pour créer ton compte.'}
            </T>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <Field
              icon={Building2}
              value={agency}
              onChangeText={(v) => {
                setAgency(v.toUpperCase());
                setError('');
              }}
              placeholder="ID agence"
              accessibilityLabel="ID agence"
              autoCapitalize="characters"
              autoCorrect={false}
              style={{ marginBottom: company ? 6 : 12 }}
            />
            {/* Inscription : « ✓ Agence démo Moodly » sous le code */}
            {company && (
              <View style={{ marginBottom: 12, marginLeft: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
                {company.name && <Check size={14} color={c.mood5} strokeWidth={3} />}
                <T font="sans700" size={12} color={company.name ? c.mood5 : c.destructive}>
                  {company.name ?? company.error}
                </T>
              </View>
            )}
            {!isLogin && (
              <Field value={name} onChangeText={setName} placeholder="Nom complet (facultatif)" autoComplete="name" style={{ marginBottom: 12 }} />
            )}
            <Field
              value={email}
              onChangeText={setEmail}
              placeholder="Email professionnel"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              style={{ marginBottom: 12 }}
            />
            <Field
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(''); // l'ancien message d'erreur ne correspond plus
              }}
              placeholder="Mot de passe"
              secureTextEntry={!show}
              autoCapitalize="none"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              onSubmitEditing={submit}
              style={{ marginBottom: isLogin || !password ? 20 : 10 }}
              right={
                <Press onPress={() => setShow(!show)} accessibilityLabel="Afficher le mot de passe">
                  {show ? <EyeOff size={18} color={c.mutedForeground} /> : <Eye size={18} color={c.mutedForeground} />}
                </Press>
              }
            />

            {/* Inscription : conseils pour un mot de passe solide (cochés au fur et à mesure, non bloquants) */}
            {!isLogin && !!password && (
              <View style={{ marginBottom: 20, marginLeft: 16, gap: 4 }}>
                <T font="sans600" size={11} color={c.mutedForeground}>
                  Conseillé pour un mot de passe solide :
                </T>
                {PASSWORD_RULES.map((r) => {
                  const ok = r.test(password);
                  const Icon = ok ? Check : Circle;
                  return (
                    <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon size={12} strokeWidth={ok ? 3 : 2} color={ok ? c.mood5 : c.mutedForeground} />
                      <T font={ok ? 'sans700' : 'sans400'} size={12} color={ok ? c.mood5 : c.mutedForeground}>
                        {r.label}
                      </T>
                    </View>
                  );
                })}
              </View>
            )}

            <Press onPress={submit} disabled={Boolean(busy)}>
              <View style={{ borderRadius: 24, backgroundColor: c.primary, paddingVertical: 14, alignItems: 'center' }}>
                <T font="sans700" size={16} color={c.primaryForeground}>
                  {busy === 'form' ? (isLogin ? 'Connexion…' : 'Création…') : isLogin ? 'Se connecter' : "S'inscrire"}
                </T>
              </View>
            </Press>
            {!!error && (
              <T font="sans600" size={12} color={c.destructive} center style={{ marginTop: 12 }} accessibilityRole="alert">
                {error}
              </T>
            )}

            <T font="sans600" size={12} center style={{ marginTop: 24 }}>
              {isLogin ? 'ou connecte-toi avec' : 'ou inscris-toi avec'}
            </T>
            <SocialRow onPick={social} busy={busy !== 'form' ? busy : null} />

            <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <T size={12} color={alpha(c.foreground, 0.8)}>
                {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
              </T>
              <Press onPress={() => onSwitch(isLogin ? 'signup' : 'login')}>
                <T font="sans700" size={12} color={c.primary}>
                  {isLogin ? 'Créer un compte' : 'Se connecter'}
                </T>
              </Press>
            </View>
            {isLogin && (
              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, opacity: 0.6 }}>
                <Lock size={11} color={c.foreground} />
                <T size={11}>Tes réponses sont anonymes</T>
              </View>
            )}
          </View>

          {isLogin && (
            <View style={{ marginHorizontal: 24, marginTop: 'auto', marginBottom: 24, paddingTop: 24 }}>
              <T font="sans600" size={11} center style={{ marginBottom: 8, opacity: 0.6 }}>
                Prototype : se connecter en tant que
              </T>
              <View style={{ flexDirection: 'row', gap: 4, borderRadius: 999, backgroundColor: alpha(c.foreground, 0.1), padding: 4 }}>
                {['salarie', 'manager'].map((r) => (
                  <Press key={r} onPress={() => pickRole(r)} style={{ flex: 1 }}>
                    <View style={{ borderRadius: 999, paddingVertical: 8, alignItems: 'center', backgroundColor: role === r ? c.foreground : 'transparent' }}>
                      <T font="sans700" size={14} color={role === r ? c.background : c.foreground}>
                        {r === 'salarie' ? 'Salarié' : 'Manager'}
                      </T>
                    </View>
                  </Press>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </FadeIn>
    </KeyboardAvoidingView>
  );
}
