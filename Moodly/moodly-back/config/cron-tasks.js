'use strict';

/**
 * Tâches planifiées (activées dans config/server.js).
 *
 * Format de la règle : 'seconde minute heure jour mois jourDeLaSemaine'
 * '0 0 3 * * *' = tous les jours à 3h00 pile.
 */
module.exports = {
  purgeOldMoods: {
    task: async ({ strapi }) => {
      const deleted = await strapi.service('api::mood.mood').purgeExpired();
      if (deleted > 0) {
        strapi.log.info(`[moodly] Purge RGPD : ${deleted} saisie(s) supprimée(s).`);
      }
    },
    options: {
      rule: '0 0 3 * * *',
      tz: process.env.APP_TIMEZONE || 'Europe/Paris',
    },
  },
};
