'use strict';

/**
 * Routes standard de Strapi pour Mood : on n'ouvre QUE la création (POST /api/moods).
 * Pas de find / findOne / update / delete : personne ne peut relire les saisies
 * individuelles par l'API, même pas leur auteur. Le manager ne voit que des agrégats
 * (voir src/api/team).
 */
const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::mood.mood', {
  only: ['create'],
  config: {
    create: {
      policies: ['global::agency-match'], // l'en-tête X-Agency-Id doit correspondre à l'agence du compte
    },
  },
});
