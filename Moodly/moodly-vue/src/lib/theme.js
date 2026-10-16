// 🌗 Thème clair / sombre / auto (suit le téléphone). Préférence gardée dans « moodly-theme ».
// Le script anti-flash qui l'applique avant l'affichage est dans index.html.
import { ref } from 'vue';

const KEY = 'moodly-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

function readPref() {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
}

function apply(pref) {
  const dark = pref === 'dark' || (pref === 'system' && media.matches);
  document.documentElement.classList.toggle('dark', dark);
}

// Une seule valeur partagée par tous les écrans (si on change ici, tout suit)
const pref = ref(readPref());

// En mode « auto », on suit le téléphone quand il change de thème
media.addEventListener('change', () => apply(pref.value));

export function useTheme() {
  const set = (p) => {
    localStorage.setItem(KEY, p);
    pref.value = p;
    apply(p);
  };
  return { pref, set };
}
