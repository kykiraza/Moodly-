<script setup>
// Écran d'accueil : splash → chargement → onboarding (3 slides) → bienvenue → connexion / inscription.
// La connexion et l'inscription appellent le VRAI back (src/lib/session.js).
import { onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowUpRight, Building2, Eye, EyeOff, Lock } from 'lucide-vue-next';
import Mascot from '@/components/Mascot.vue';
import PhoneShell from '@/components/PhoneShell.vue';
import Pattern from '@/components/Pattern.vue';
import SocialRow from '@/components/SocialRow.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { DEMO } from '@/config';
import { homeFor, login, register } from '@/lib/session';

const router = useRouter();

// 'splash' | 'loading' | 'onboarding' | 'welcome' | 'login' | 'signup'
const screen = ref('splash');
const slide = ref(0);
const progress = ref(0);

const SLIDES = [
  { mood: 4, bg: 'bg-mood-1', soft: 'bg-mood-1-soft', title: 'Check-in avec ton moral du jour.', sub: 'Quelques secondes pour dire comment tu vas.' },
  { mood: 5, bg: 'bg-mood-5', soft: 'bg-mood-5-soft', title: '100 % anonyme, vraiment.', sub: "Ton manager ne voit que la météo de l'équipe." },
  { mood: 3, bg: 'bg-primary', soft: 'bg-accent', title: 'Une équipe qui va mieux.', sub: 'Des tendances claires pour agir au bon moment.' },
];

// --- Enchaînement automatique splash → chargement → onboarding ---
let timer = null;
let interval = null;
const clearTimers = () => {
  clearTimeout(timer);
  clearInterval(interval);
};

watch(
  screen,
  (s) => {
    clearTimers();
    if (s === 'splash') timer = setTimeout(() => (screen.value = 'loading'), 2600);
    if (s === 'loading') {
      interval = setInterval(() => {
        progress.value = Math.min(100, progress.value + 4);
        if (progress.value >= 100) {
          clearInterval(interval);
          timer = setTimeout(() => (screen.value = 'onboarding'), 250);
        }
      }, 60);
    }
  },
  { immediate: true },
);
onUnmounted(clearTimers);

// Chargement : la mascotte passe de triste (1) à contente (5)
const loadingMood = () => Math.min(5, Math.floor(progress.value / 20) + 1);

function nextSlide() {
  if (slide.value < SLIDES.length - 1) slide.value += 1;
  else screen.value = 'welcome';
}

// --- Splash ---
const letters = 'Moodly'.split('');
const confetti = [
  { l: '14%', t: '16%', c: 'bg-mood-3', s: 12, d: '0s' },
  { l: '78%', t: '20%', c: 'bg-mood-1', s: 10, d: '0.6s' },
  { l: '22%', t: '68%', c: 'bg-mood-5', s: 9, d: '1.1s' },
  { l: '84%', t: '62%', c: 'bg-mood-4', s: 13, d: '0.3s' },
  { l: '60%', t: '12%', c: 'bg-mood-2', s: 8, d: '1.6s' },
];

// --- Connexion ---
const role = ref('salarie'); // bouton « Prototype : se connecter en tant que »
const showPassword = ref(false);
const loginForm = ref({ agency: DEMO.agencyId, email: DEMO.salarie, password: DEMO.password });
const busy = ref(false);
const error = ref('');

// Changer de rôle de démo remplit l'email du compte correspondant
watch(role, (r) => {
  loginForm.value.email = r === 'salarie' ? DEMO.salarie : DEMO.manager;
  error.value = '';
});

async function doLogin(email, password, agency) {
  error.value = '';
  busy.value = true;
  try {
    const session = await login(email, password, agency);
    router.replace(homeFor(session));
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}

const submitLogin = () => doLogin(loginForm.value.email, loginForm.value.password, loginForm.value.agency);

// Boutons Google / Apple / Microsoft : pas de vraie connexion sociale dans le MVP,
// ils connectent le compte de démo du rôle choisi.
const demoLogin = (r) => doLogin(r === 'manager' ? DEMO.manager : DEMO.salarie, DEMO.password, DEMO.agencyId);

// --- Inscription ---
const signupForm = ref({ agency: DEMO.agencyId, name: '', email: '', password: '' });

async function submitSignup() {
  error.value = '';
  busy.value = true;
  try {
    const f = signupForm.value;
    await register(f.name, f.email, f.password, f.agency);
    router.replace('/salarie');
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}

function go(s) {
  error.value = '';
  showPassword.value = false;
  screen.value = s;
}

const field =
  'w-full rounded-xl bg-secondary px-5 py-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary';
</script>

<template>
  <PhoneShell>
    <!-- 1. Splash -->
    <button
      v-if="screen === 'splash'"
      type="button"
      class="relative flex flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden bg-splash px-8 text-center"
      aria-label="Passer l'écran d'accueil"
      @click="screen = 'loading'"
    >
      <!-- blobs flottants -->
      <span class="pointer-events-none absolute -left-12 top-24 h-40 w-40 rounded-full bg-mood-3/50 blur-2xl animate-splash-float" />
      <span
        class="pointer-events-none absolute -right-14 top-1/3 h-48 w-48 rounded-full bg-mood-1/45 blur-2xl animate-splash-float"
        style="animation-delay: 1.2s"
      />
      <span
        class="pointer-events-none absolute bottom-16 left-1/4 h-32 w-32 rounded-full bg-mood-5/40 blur-2xl animate-splash-float"
        style="animation-delay: 2.4s"
      />

      <!-- confettis -->
      <span
        v-for="(b, i) in confetti"
        :key="i"
        :class="`pointer-events-none absolute rounded-full ${b.c} animate-splash-float`"
        :style="{ left: b.l, top: b.t, width: `${b.s}px`, height: `${b.s}px`, animationDelay: b.d }"
      />

      <!-- mascotte + anneaux qui pulsent -->
      <div class="relative flex h-52 w-52 items-center justify-center">
        <span class="absolute h-40 w-40 rounded-full border-4 border-background/60 animate-splash-ring" />
        <span class="absolute h-40 w-40 rounded-full border-4 border-background/40 animate-splash-ring" style="animation-delay: 0.6s" />
        <div class="animate-splash-pop rounded-full bg-background p-5 shadow-pop">
          <Mascot :mood="5" :size="120" class="animate-bob" />
        </div>
      </div>

      <!-- le nom, lettre par lettre -->
      <h1 class="mt-6 flex font-display text-6xl font-extrabold uppercase leading-none text-background">
        <span v-for="(c, i) in letters" :key="i" class="animate-splash-letter" :style="{ animationDelay: `${700 + i * 90}ms` }">
          {{ c }}
        </span>
      </h1>
      <p class="mt-4 animate-splash-rise text-sm font-semibold text-background/90" style="animation-delay: 1250ms">
        Ton moral du jour, en quelques secondes.
      </p>

      <!-- points qui rebondissent -->
      <div class="mt-8 flex gap-2">
        <span
          v-for="i in 3"
          :key="i"
          class="h-2.5 w-2.5 rounded-full bg-background animate-splash-dot"
          :style="{ animationDelay: `${(i - 1) * 160}ms` }"
        />
      </div>

      <p
        class="absolute bottom-8 animate-splash-rise text-[11px] font-bold uppercase tracking-[0.2em] text-background/70"
        style="animation-delay: 1600ms"
      >
        Appuie pour continuer
      </p>
    </button>

    <!-- 2. Chargement -->
    <div v-else-if="screen === 'loading'" class="flex flex-1 animate-in fade-in duration-500">
      <div class="relative flex flex-1 flex-col bg-background">
        <Pattern dark :cols="7" :rows="8" class="absolute inset-x-0 top-0 h-[55%] w-full" />
        <div class="relative mt-auto flex flex-col items-center px-8 pb-16 text-center">
          <div class="-mt-24 rounded-full bg-background p-4">
            <Mascot :mood="loadingMood()" :size="130" class="animate-bob" />
          </div>
          <h1 class="mt-4 text-5xl font-extrabold text-foreground">Moodly</h1>
          <p class="mt-2 text-sm text-foreground/70">Ton moral du jour, en quelques secondes.</p>
          <div class="mt-10 h-2 w-48 overflow-hidden rounded-full bg-foreground/15">
            <div class="h-full rounded-full bg-mood-4 transition-all" :style="{ width: `${progress}%` }" />
          </div>
          <p class="mt-3 text-xs font-semibold text-foreground/60">Chargement… {{ progress }}%</p>
        </div>
      </div>
    </div>

    <!-- 3. Onboarding -->
    <div v-else-if="screen === 'onboarding'" :key="slide" :class="`flex flex-1 flex-col transition-colors ${SLIDES[slide].soft}`">
      <p class="pt-10 text-center font-display text-lg font-extrabold">Moodly</p>
      <div :class="`relative mt-10 flex flex-1 flex-col rounded-t-[3rem] ${SLIDES[slide].bg} animate-in slide-in-from-right-8 fade-in duration-500`">
        <!-- bosses de nuage -->
        <div class="absolute -top-10 left-0 right-0 flex justify-center gap-0">
          <span v-for="i in 3" :key="i" :class="`h-24 w-32 rounded-full ${SLIDES[slide].bg} ${i === 2 ? '-mt-6' : ''} -mx-4`" />
        </div>
        <div class="relative flex justify-center pt-10">
          <Mascot :mood="SLIDES[slide].mood" :size="190" class="animate-bob" />
        </div>
        <div class="relative mt-auto px-7 pb-8">
          <div class="mb-5 flex gap-1.5">
            <span
              v-for="(_, i) in SLIDES"
              :key="i"
              :class="`h-1.5 rounded-full bg-card transition-all ${i === slide ? 'w-8' : 'w-2 opacity-50'}`"
            />
          </div>
          <h1 class="font-display text-4xl font-extrabold uppercase leading-[0.95] text-card">{{ SLIDES[slide].title }}</h1>
          <p class="mt-3 text-sm font-medium text-card/90">{{ SLIDES[slide].sub }}</p>
          <div class="mt-8 flex items-center justify-between">
            <button class="text-sm font-semibold text-card/80" @click="screen = 'welcome'">Passer</button>
            <button class="flex items-center gap-3 text-sm font-semibold text-card" @click="nextSlide">
              {{ slide === SLIDES.length - 1 ? "C'est parti" : 'Continuer' }}
              <span class="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-primary-foreground ring-4 ring-card/30 transition active:scale-95">
                <ArrowUpRight :size="22" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <ThemeToggle v-if="['welcome', 'login', 'signup'].includes(screen)" class="absolute right-4 top-5 z-20" />

    <!-- 4. Bienvenue -->
    <div v-if="screen === 'welcome'" class="flex flex-1 flex-col bg-background animate-in fade-in">
      <Pattern dark :cols="7" :rows="8" class="h-[50%] w-full" />
      <div class="flex flex-1 flex-col items-center px-8 text-center">
        <Mascot :mood="5" :size="90" class="-mt-12 animate-bob" />
        <h1 class="mt-4 text-3xl font-extrabold text-foreground">Bienvenue sur Moodly</h1>
        <p class="mt-3 text-sm text-foreground/70">
          Partage ton moral en quelques secondes, en toute simplicité et en toute confidentialité.
        </p>
        <div class="mt-auto mb-10 grid w-full grid-cols-2 gap-3">
          <button class="rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground" @click="go('signup')">Créer un compte</button>
          <button class="rounded-2xl border-2 border-foreground/40 py-3.5 font-bold text-foreground" @click="go('login')">Se connecter</button>
        </div>
      </div>
    </div>

    <!-- 5. Inscription -->
    <div
      v-else-if="screen === 'signup'"
      class="relative flex flex-1 flex-col overflow-hidden bg-background text-foreground animate-in fade-in slide-in-from-bottom-4"
    >
      <Pattern
        :cols="6"
        :rows="6"
        class="absolute -right-2 top-0 h-64 w-64 [mask-image:radial-gradient(circle_at_top_right,black_55%,transparent_80%)]"
      />
      <div class="relative px-6 pt-6">
        <button class="p-1" aria-label="Retour" @click="go('welcome')"><ArrowLeft :size="20" /></button>
        <h1 class="mt-28 text-3xl font-extrabold leading-tight">Créer un<br />compte</h1>
        <p class="mt-2 text-sm opacity-70">Entre tes informations pour créer ton compte.</p>
      </div>
      <form class="relative px-6 pt-6" @submit.prevent="submitSignup">
        <div class="relative mb-3">
          <Building2 :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="signupForm.agency"
            required
            placeholder="ID agence"
            aria-label="ID agence"
            class="w-full rounded-xl bg-secondary py-3.5 pl-11 pr-5 text-sm uppercase text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <input v-model="signupForm.name" required minlength="2" maxlength="50" placeholder="Nom complet" :class="`mb-3 ${field}`" />
        <input v-model="signupForm.email" required type="email" placeholder="Email professionnel" :class="`mb-3 ${field}`" />
        <div class="relative mb-5">
          <input
            v-model="signupForm.password"
            required
            minlength="8"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mot de passe (8 caractères min.)"
            :class="`${field} pr-12`"
          />
          <button
            type="button"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Afficher le mot de passe"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
        <button
          :disabled="busy"
          class="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
        >
          {{ busy ? 'Création…' : "S'inscrire" }}
        </button>
        <p v-if="error" class="mt-3 text-center text-xs font-semibold text-destructive" role="alert">{{ error }}</p>
        <p class="mt-6 text-center text-xs font-semibold">ou inscris-toi avec</p>
        <SocialRow @pick="demoLogin('salarie')" />
        <p class="mt-5 mb-6 text-center text-xs opacity-80">
          Déjà un compte ? <button type="button" class="font-bold text-primary" @click="go('login')">Se connecter</button>
        </p>
      </form>
    </div>

    <!-- 6. Connexion -->
    <div
      v-else-if="screen === 'login'"
      class="relative flex flex-1 flex-col overflow-hidden bg-background text-foreground animate-in fade-in slide-in-from-bottom-4"
    >
      <Pattern
        :cols="6"
        :rows="6"
        class="absolute -right-2 top-0 h-64 w-64 [mask-image:radial-gradient(circle_at_top_right,black_55%,transparent_80%)]"
      />
      <div class="relative px-6 pt-6">
        <button class="p-1" aria-label="Retour" @click="go('welcome')"><ArrowLeft :size="20" /></button>
        <h1 class="mt-28 text-3xl font-extrabold leading-tight">Content de<br />te revoir !</h1>
        <p class="mt-2 text-sm opacity-70">Entre tes informations pour te connecter.</p>
      </div>

      <form class="relative px-6 pt-6" @submit.prevent="submitLogin">
        <div class="relative mb-3">
          <Building2 :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="loginForm.agency"
            required
            placeholder="ID agence"
            aria-label="ID agence"
            class="w-full rounded-xl bg-secondary py-3.5 pl-11 pr-5 text-sm uppercase text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <input
          v-model="loginForm.email"
          required
          type="email"
          autocomplete="username"
          placeholder="Email professionnel"
          class="mb-3 w-full rounded-xl bg-secondary px-5 py-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
        />
        <div class="relative mb-5">
          <input
            v-model="loginForm.password"
            required
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Mot de passe"
            class="w-full rounded-xl bg-secondary px-5 py-3.5 pr-12 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Afficher le mot de passe"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
        <button
          :disabled="busy"
          class="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
        >
          {{ busy ? 'Connexion…' : 'Se connecter' }}
        </button>
        <p v-if="error" class="mt-3 text-center text-xs font-semibold text-destructive" role="alert">{{ error }}</p>

        <p class="mt-6 text-center text-xs font-semibold">ou connecte-toi avec</p>
        <SocialRow @pick="demoLogin(role)" />
        <p class="mt-5 text-center text-xs opacity-80">
          Pas encore de compte ? <button type="button" class="font-bold text-primary" @click="go('signup')">Créer un compte</button>
        </p>
        <p class="mt-2 flex items-center justify-center gap-1.5 text-[11px] opacity-60"><Lock :size="11" /> Tes réponses sont anonymes</p>
      </form>

      <div class="relative mx-6 mt-auto mb-6 pt-6">
        <p class="mb-2 text-center text-[11px] font-semibold opacity-60">Prototype : se connecter en tant que</p>
        <div class="grid grid-cols-2 gap-1 rounded-full bg-foreground/10 p-1">
          <button
            v-for="r in ['salarie', 'manager']"
            :key="r"
            type="button"
            :class="`rounded-full py-2 text-sm font-bold transition ${role === r ? 'bg-foreground text-background' : ''}`"
            @click="role = r"
          >
            {{ r === 'salarie' ? 'Salarié' : 'Manager' }}
          </button>
        </div>
      </div>
    </div>
  </PhoneShell>
</template>
