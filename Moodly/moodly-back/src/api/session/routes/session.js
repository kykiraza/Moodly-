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
        middlewares: [
          // 1) Nettoie l'email (espaces, majuscules) pour que le limiteur ne soit pas contournable
          'api::session.normalize-email',
          // 2) Limite le nombre d'essais par email + IP (anti force brute)
          'plugin::users-permissions.rateLimit',
        ],
      },
    },
  ],
};
