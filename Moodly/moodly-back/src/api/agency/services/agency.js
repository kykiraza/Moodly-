'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::agency.agency', ({ strapi }) => ({
  /** Trouve une agence par son code ("ag-0001" ou " AG-0001 " → AG-0001). null si inconnue. */
  async findByCode(code) {
    if (typeof code !== 'string' || !code.trim()) return null;
    return strapi.documents('api::agency.agency').findFirst({
      filters: { code: code.trim().toUpperCase() },
      fields: ['code', 'name'],
    });
  },
}));
