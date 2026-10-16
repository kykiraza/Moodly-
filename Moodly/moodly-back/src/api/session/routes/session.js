'use strict';

/**
 * Route publique (pas besoin d'être connecté pour se connecter !).
 * La permission « api::session.session.login » est donnée au rôle Public
 * dans src/bootstrap/permissions.js.
 */
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'session.login',
      config: {
        // Limite le nombre d'essais (anti force brute), comme /api/auth/local
        middlewares: ['plugin::users-permissions.rateLimit'],
      },
    },
  ],
};
