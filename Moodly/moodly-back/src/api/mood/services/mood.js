'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { today, addDays, envInt } = require('../../../utils/moodly');

module.exports = createCoreService('api::mood.mood', ({ strapi }) => ({
  /**
   * Supprime les saisies plus vieilles que MOOD_RETENTION_DAYS jours (90 par défaut).
   * Appelée chaque nuit par config/cron-tasks.js. Renvoie le nombre de saisies supprimées.
   */
  async purgeExpired() {
    const retentionDays = envInt('MOOD_RETENTION_DAYS', 90);
    const oldestKept = addDays(today(), -(retentionDays - 1));
    let deleted = 0;

    // On supprime par paquets de 100 avec le Document Service
    // (il nettoie aussi les liens mood ↔ tags).
    for (;;) {
      const batch = await strapi.documents('api::mood.mood').findMany({
        filters: { day: { $lt: oldestKept } },
        fields: ['documentId'],
        limit: 100,
      });
      if (batch.length === 0) break;

      for (const mood of batch) {
        await strapi.documents('api::mood.mood').delete({ documentId: mood.documentId });
      }
      deleted += batch.length;
    }

    return deleted;
  },
}));
