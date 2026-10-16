// Garde de routes : n'affiche l'écran que si l'utilisateur a le bon rôle.
// role = 'salarie' | 'manager' | 'any' (n'importe quel connecté).
// Sinon : pas connecté → retour à l'accueil ; mauvais rôle → son propre écran d'accueil.
import { useCallback } from 'react';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/session';

export const homeFor = (session) => (session?.user.role === 'manager' ? '/manager' : '/salarie');

export function RoleGate({ role, children }) {
  const { session } = useAuth();

  // Déconnexion (ou session expirée) : on REVIENT à l'accueil qui est déjà dans l'historique.
  // useFocusEffect : seul l'écran visible réagit (sinon chaque écran de l'historique
  // ajouterait son propre accueil).
  useFocusEffect(
    useCallback(() => {
      if (!session) router.dismissTo('/');
    }, [session]),
  );

  if (!session) return null;
  if (role !== 'any' && session.user.role !== role) return <Redirect href={homeFor(session)} />;
  return children;
}
