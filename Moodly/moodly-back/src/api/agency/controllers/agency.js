'use strict';

// Aucune route n'est ouverte pour Agency : elle se gère dans l'admin Strapi.
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::agency.agency');
