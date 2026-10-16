'use strict';

/**
 * Aucune route standard pour Team (pas de liste des équipes ni des membres).
 * Permissions données au rôle Manager dans src/bootstrap/permissions.js.
 */
module.exports = {
  routes: [
    {
      // Stats d'une équipe précise (id = documentId de l'équipe)
      method: 'GET',
      path: '/teams/:id/stats',
      handler: 'team.stats',
      config: {
        policies: ['api::team.is-team-manager'],
      },
    },
    {
      // Raccourci pour le front : stats de « mon » équipe, au format du front
      method: 'GET',
      path: '/team/stats',
      handler: 'team.myStats',
    },
  ],
};
