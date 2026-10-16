'use strict';

const setupPermissions = require('./bootstrap/permissions');
const setupDatabase = require('./bootstrap/database');

module.exports = {
  /**
   * Avant le démarrage : on vérifie que la configuration Moodly est présente.
   */
  register() {
    const salt = process.env.MOOD_SALT;
    if (!salt || /^tobemodified$/i.test(salt)) {
      throw new Error(
        'MOOD_SALT manquant ou non modifié dans .env. Lance `npm run setup` puis redémarre.'
      );
    }
  },

  /**
   * Au démarrage (la base est prête) : rôles, permissions et index unique.
   */
  async bootstrap({ strapi }) {
    await setupPermissions({ strapi });
    await setupDatabase({ strapi });
  },
};
