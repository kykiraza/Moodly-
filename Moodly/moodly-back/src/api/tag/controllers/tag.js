'use strict';

// Contrôleur standard de Strapi (seule l'action « find » est exposée, voir routes/tag.js)
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::tag.tag');
