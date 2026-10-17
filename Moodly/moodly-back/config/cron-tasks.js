'use strict';

/**
 * Tâches planifiées (activées dans config/server.js).
 *
 * Format de la règle : 'seconde minute heure jour mois jourDeLaSemaine'
 * '0 0 3 * * *' = tous les jours à 3h00 pile.
 */
const { backupDatabase } = require('../src/utils/backup');

module.exports = {
  // 💾 Une sauvegarde de la base chaque nuit à 2h30 (avant la purge de 3h)
  backupDatabase: {
    task: async ({ strapi }) => {
      try {
        const file = await backupDatabase('nuit');
        if (file) strapi.log.info(`[moodly] Sauvegarde de la base : ${file}`);
      } catch (err) {
        strapi.log.error(`[moodly] Sauvegarde de la base impossible : ${err.message}`);
      }
    },
    options: {
      rule: '0 30 2 * * *',
      tz: process.env.APP_TIMEZONE || 'Europe/Paris',
    },
  },

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
