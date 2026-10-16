'use strict';

/**
 * GET /api/tags → la liste des tags proposés dans l'écran de saisie.
 * Seule la lecture de la liste est ouverte : pas de création/modification depuis l'app
 * (les tags se gèrent dans l'admin Strapi).
 */
const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::tag.tag', {
  only: ['find'],
  config: {
    find: {
      policies: ['global::agency-match'], // l'en-tête X-Agency-Id doit correspondre à l'agence du compte
    },
  },
});
