'use strict';

/**
 * Routes publiques (pas besoin d'être connecté pour se connecter ou s'inscrire !).
 * Les permissions « api::session.session.login », « .register » et « .social » sont données au
 * rôle Public dans src/bootstrap/permissions.js.
 */
const middlewares = [
  // 1) Nettoie l'email (espaces, majuscules) pour que le limiteur ne soit pas contournable
  'api::session.normalize-email',
  // 2) Limite le nombre d'essais par email + IP (anti force brute)
  'plugin::users-permissions.rateLimit',
];

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'session.login',
      config: { middlewares },
    },
    {
      method: 'POST',
      path: '/auth/register',
      handler: 'session.register',
      config: { middlewares },
    },
    {
      method: 'POST',
      path: '/auth/social',
      handler: 'session.social',
      config: { middlewares },
    },
  ],
};
