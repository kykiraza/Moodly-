'use strict';

/**
 * GET /api/moods/today → { hasAnswered, day }
 * Permission « api::mood.mood.today » donnée au rôle Employee (src/bootstrap/permissions.js).
 */
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/moods/today',
      handler: 'mood.today',
      config: {
        policies: ['global::agency-match'], // l'en-tête X-Agency-Id doit correspondre à l'agence du compte
      },
    },
  ],
};
