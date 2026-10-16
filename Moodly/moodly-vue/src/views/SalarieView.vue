<script setup>
// Écran salarié : humeur (1-5) → raisons (0 à 3) → message libre → merci → « déjà partagé ».
// - La note et les raisons sont envoyées au back (anonymes : aucun lien vers la personne).
// - Le message libre n'est JAMAIS envoyé : il reste dans le journal local du téléphone.
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Lock, LogOut, Settings } from 'lucide-vue-next';
import Mascot from '@/components/Mascot.vue';
import PhoneShell from '@/components/PhoneShell.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import TopBar from '@/components/TopBar.vue';
import { api } from '@/lib/api';
import { FACTORS, LEVELS, MOODS, getToday, saveToday } from '@/lib/moods';
import { getSession, logout } from '@/lib/session';

const router = useRouter();
const session = getSession();

// 'checking' | 'error' | 'mood' | 'factors' | 'note' | 'thanks' | 'done'
const step = ref('checking');
const mood = ref(3);
const factors = ref([]);
const note = ref('');
const knownMood = ref(true); // false si on a répondu ailleurs (autre appareil) : humeur inconnue ici
const sending = ref(false);
const error = ref('');

const m = computed(() => MOODS[mood.value]);
const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// Au démarrage : a-t-on déjà répondu aujourd'hui ? (le serveur fait foi)
async function check() {
  step.value = 'checking';
  error.value = '';
  try {
    if (await api.hasAnsweredToday()) {
      showDone();
    } else {
      step.value = 'mood';
    }
  } catch (err) {
    error.value = err.message;
    step.value = 'error';
  }
}
onMounted(check);

function showDone() {
  const local = getToday(session.user.id);
  knownMood.value = Boolean(local);
  if (local) mood.value = local.mood;
  step.value = 'done';
}

// Jusqu'à 3 raisons
function toggle(id) {
  const f = factors.value;
  if (f.includes(id)) factors.value = f.filter((x) => x !== id);
  else if (f.length < 3) factors.value = [...f, id];
}

async function send() {
  error.value = '';
  sending.value = true;
  try {
    // Seuls la note et les raisons partent au serveur, PAS le message (note.value)
    await api.sendMood({ level: mood.value, factors: factors.value });
    saveToday(session.user.id, mood.value, factors.value, note.value);
    step.value = 'thanks';
  } catch (err) {
    if (err.status === 409) showDone(); // déjà répondu aujourd'hui (ex. depuis un autre appareil)
    else error.value = err.message;
  } finally {
    sending.value = false;
  }
}

function signOut() {
  logout();
  router.replace('/');
}

const colors = ['bg-mood-1', 'bg-mood-2', 'bg-mood-3', 'bg-mood-4', 'bg-mood-5', 'bg-primary'];
</script>

<template>
  <PhoneShell>
    <!-- Vérification « déjà répondu ? » -->
    <div v-if="step === 'checking'" class="flex flex-1 flex-col items-center justify-center gap-3 animate-in fade-in">
      <Mascot :mood="3" :size="110" class="animate-bob" />
      <p class="text-sm font-semibold text-muted-foreground">Chargement…</p>
    </div>

    <div v-else-if="step === 'error'" class="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <Mascot :mood="2" :size="110" />
      <p class="text-sm font-semibold text-destructive" role="alert">{{ error }}</p>
      <button class="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground" @click="check">Réessayer</button>
    </div>

    <!-- Étape 1 : humeur -->
    <div v-else-if="step === 'mood'" :class="`flex flex-1 flex-col animate-in fade-in transition-colors duration-500 ${m.bg}`">
      <TopBar>
        <template #right>
          <div class="flex items-center gap-1">
            <ThemeToggle compact />
            <RouterLink to="/parametres" class="rounded-full p-2 hover:bg-secondary" aria-label="Paramètres"><Settings :size="18" /></RouterLink>
            <RouterLink to="/espace-salarie" class="rounded-full p-2 hover:bg-secondary" aria-label="Mon calendrier"><CalendarDays :size="18" /></RouterLink>
            <button class="rounded-full p-2 hover:bg-secondary" aria-label="Se déconnecter" @click="signOut"><LogOut :size="18" /></button>
          </div>
        </template>
      </TopBar>
      <div class="px-6 pt-6">
        <p class="text-sm font-semibold capitalize text-ink/70">{{ date }}</p>
        <h1 class="mt-1 font-display text-4xl font-extrabold uppercase leading-[0.95] text-ink">Comment tu te sens aujourd'hui ?</h1>
      </div>
      <div class="mx-6 mt-6 flex flex-col items-center rounded-[2rem] bg-card/25 py-8">
        <Mascot :mood="mood" :size="170" class="animate-bob" />
        <p class="mt-2 font-display text-2xl font-extrabold">{{ m.label }}</p>
      </div>

      <div class="px-6 pt-8">
        <input
          v-model.number="mood"
          type="range"
          min="1"
          max="5"
          step="1"
          class="w-full"
          :style="{ accentColor: m.fill }"
          aria-label="Ton moral"
        />
        <div class="mt-3 grid grid-cols-5 gap-2">
          <button
            v-for="l in LEVELS"
            :key="l"
            :class="`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold transition ${mood === l ? 'bg-card shadow-pop -translate-y-0.5' : 'bg-card/40'}`"
            @click="mood = l"
          >
            <Mascot :mood="l" :size="32" />
            {{ MOODS[l].label }}
          </button>
        </div>
      </div>

      <div class="mt-auto px-6 pb-8">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-bold text-primary-foreground transition active:scale-[0.98]"
          @click="step = 'factors'"
        >
          Suivant <ArrowRight :size="18" />
        </button>
      </div>
    </div>

    <!-- Étape 2 : raisons -->
    <div v-else-if="step === 'factors'" class="flex flex-1 flex-col animate-in fade-in slide-in-from-right-4">
      <div class="flex items-center justify-between px-6 pt-6">
        <button class="rounded-full bg-secondary p-2" aria-label="Retour" @click="step = 'mood'"><ArrowLeft :size="18" /></button>
        <div class="flex gap-1.5">
          <span v-for="s in 3" :key="s" :class="`h-2 rounded-full transition-all ${s <= 2 ? 'w-6 bg-primary' : 'w-2 bg-border'}`" />
        </div>
        <span class="text-xs font-semibold text-muted-foreground">Étape 2 sur 3</span>
      </div>
      <div class="px-6 pt-4">
        <h1 class="text-3xl font-extrabold leading-tight">Qu'est-ce qui joue sur ton moral ?</h1>
        <div class="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Jusqu'à 3 choix · facultatif</span>
          <span class="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">{{ factors.length }} / 3</span>
        </div>
        <div :class="`mt-4 inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold ${m.bgSoft}`">
          <Mascot :mood="mood" :size="28" /> Ton moral : {{ m.label }}
        </div>
      </div>
      <div class="flex flex-wrap gap-2 px-6 pt-6">
        <button
          v-for="f in FACTORS"
          :key="f.id"
          :class="`flex items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition ${factors.includes(f.id) ? 'border-primary bg-accent text-accent-foreground' : 'border-border bg-card'}`"
          :aria-pressed="factors.includes(f.id)"
          @click="toggle(f.id)"
        >
          <component
            :is="f.icon"
            :size="15"
            :stroke-width="1.5"
            :class="`shrink-0 ${factors.includes(f.id) ? 'text-primary' : 'text-muted-foreground'}`"
          />
          {{ f.label }}
          <Check v-if="factors.includes(f.id)" :size="14" :stroke-width="2" />
        </button>
      </div>
      <div class="mt-auto px-6 pb-8">
        <p class="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lock :size="12" /> Ta réponse est anonyme
        </p>
        <button
          class="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-bold text-primary-foreground transition active:scale-[0.98]"
          @click="step = 'note'"
        >
          Suivant <ArrowRight :size="18" />
        </button>
      </div>
    </div>

    <!-- Étape 3 : message libre (reste sur le téléphone) -->
    <div v-else-if="step === 'note'" class="flex flex-1 flex-col animate-in fade-in slide-in-from-right-4">
      <div class="flex items-center justify-between px-6 pt-6">
        <button class="rounded-full bg-secondary p-2" aria-label="Retour" @click="step = 'factors'"><ArrowLeft :size="18" /></button>
        <div class="flex gap-1.5">
          <span v-for="s in 3" :key="s" class="h-2 w-6 rounded-full bg-primary transition-all" />
        </div>
        <span class="text-xs font-semibold text-muted-foreground">Étape 3 sur 3</span>
      </div>
      <div class="px-6 pt-4">
        <h1 class="text-3xl font-extrabold leading-tight">Envie d'en dire plus ?</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Écris ce qui te passe par la tête. Facultatif : ce texte reste sur ton téléphone, il n'est jamais envoyé.
        </p>
      </div>
      <div class="px-6 pt-6">
        <textarea
          v-model="note"
          rows="7"
          maxlength="400"
          placeholder="Aujourd'hui, j'ai l'impression que…"
          class="w-full resize-none rounded-3xl border-2 bg-card p-5 text-base outline-none focus:border-primary"
        />
        <p class="mt-1 text-right text-xs text-muted-foreground">{{ note.length }}/400</p>
      </div>
      <div class="mt-auto px-6 pb-8">
        <p v-if="error" class="mb-3 text-center text-xs font-semibold text-destructive" role="alert">{{ error }}</p>
        <p class="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lock :size="12" /> Ta réponse est anonyme
        </p>
        <button
          :disabled="sending"
          class="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
          @click="send"
        >
          {{ sending ? 'Envoi…' : 'Envoyer' }}
        </button>
      </div>
    </div>

    <!-- Merci ! -->
    <div v-else-if="step === 'thanks'" class="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          v-for="i in 36"
          :key="i"
          :class="`absolute top-0 h-3 w-1.5 rounded-sm animate-confetti ${colors[(i - 1) % colors.length]}`"
          :style="{ left: `${((i - 1) * 37) % 100}%`, animationDelay: `${((i - 1) % 9) * 0.12}s` }"
        />
      </div>
      <Mascot :mood="5" :size="180" class="animate-bob" />
      <h1 class="mt-4 text-5xl font-extrabold">Merci !</h1>
      <p class="mt-1 text-lg font-semibold">À demain 👋</p>
      <div class="mt-4">
        <p class="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lock :size="12" /> Ta réponse est anonyme
        </p>
      </div>
      <div class="absolute inset-x-6 bottom-8">
        <RouterLink
          to="/espace-salarie"
          class="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-bold text-primary-foreground"
        >
          <CalendarDays :size="18" /> Voir mon calendrier
        </RouterLink>
        <button class="w-full rounded-full border-2 border-foreground bg-card py-3.5 font-bold" @click="step = 'done'">Fermer</button>
      </div>
    </div>

    <!-- Déjà partagé aujourd'hui -->
    <div v-else-if="step === 'done'" class="flex flex-1 flex-col animate-in fade-in">
      <TopBar>
        <template #right>
          <div class="flex items-center gap-1">
            <ThemeToggle compact />
            <RouterLink to="/parametres" class="rounded-full p-2 hover:bg-secondary" aria-label="Paramètres"><Settings :size="18" /></RouterLink>
            <RouterLink to="/espace-salarie" class="rounded-full p-2 hover:bg-secondary" aria-label="Mon calendrier"><CalendarDays :size="18" /></RouterLink>
            <button class="rounded-full p-2 hover:bg-secondary" aria-label="Se déconnecter" @click="signOut"><LogOut :size="18" /></button>
          </div>
        </template>
      </TopBar>
      <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div :class="`flex h-56 w-56 items-center justify-center rounded-full ${m.bgSoft}`">
          <Mascot :mood="mood" :size="150" class="animate-bob" />
        </div>
        <span v-if="knownMood" class="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-sm">
          <span :class="`h-2 w-2 rounded-full ${m.bg}`" /> Ton moral du jour : <b>{{ m.label }}</b>
        </span>
        <h1 class="mt-4 text-2xl font-extrabold">Tu as déjà partagé ton moral aujourd'hui.</h1>
        <p class="mt-1 text-muted-foreground">Reviens demain !</p>
      </div>
      <div class="px-6 pb-8 text-center">
        <p class="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lock :size="12" /> Ta réponse est anonyme
        </p>
      </div>
    </div>
  </PhoneShell>
</template>
