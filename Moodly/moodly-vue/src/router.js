// Les écrans de l'app et qui a le droit d'y aller.
import { createRouter, createWebHistory } from 'vue-router';
import { getSession, homeFor } from '@/lib/session';

const routes = [
  // Accueil : splash, onboarding, connexion, inscription
  { path: '/', component: () => import('@/views/IndexView.vue'), meta: { title: 'Moodly — Ton moral du jour' } },
  // Salarié
  { path: '/salarie', component: () => import('@/views/SalarieView.vue'), meta: { role: 'salarie', title: 'Mon moral du jour — Moodly' } },
  { path: '/espace-salarie', component: () => import('@/views/EspaceSalarieView.vue'), meta: { role: 'salarie', title: 'Mon espace — Moodly' } },
  // Manager
  { path: '/manager', component: () => import('@/views/ManagerView.vue'), meta: { role: 'manager', title: 'Vue manager — Moodly' } },
  { path: '/espace-manager', component: () => import('@/views/EspaceManagerView.vue'), meta: { role: 'manager', title: "Calendrier d'équipe — Moodly" } },
  // Tout le monde (connecté)
  { path: '/parametres', component: () => import('@/views/ParametresView.vue'), meta: { role: 'any', title: 'Paramètres — Moodly' } },
  // Adresse inconnue → accueil
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Garde de routes : vérifie la session avant chaque changement d'écran
router.beforeEach((to) => {
  const session = getSession();

  // Déjà connecté et on revient sur l'accueil → directement sur son écran
  if (to.path === '/' && session) return homeFor(session);

  const needed = to.meta.role;
  if (!needed) return true; // page publique
  if (!session) return '/'; // pas connecté → connexion
  if (needed !== 'any' && session.user.role !== needed) return homeFor(session); // mauvais rôle
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title || 'Moodly';
});
