'use strict';

const setupPermissions = require('./bootstrap/permissions');
const setupDatabase = require('./bootstrap/database');

// Variables secrètes obligatoires (voir .env.example)
const SECRETS = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'MOOD_SALT',
];

module.exports = {
  /**
   * Avant le démarrage : on vérifie que les secrets du .env sont présents et
   * qu'aucun n'a gardé la valeur d'exemple « tobemodified » de .env.example
   * (une valeur publique sur Git : avec un JWT_SECRET connu, n'importe qui
   * pourrait fabriquer un token de manager).
   */
  register() {
    const bad = SECRETS.filter((name) => {
      const value = process.env[name];
      return !value || /tobemodified/i.test(value);
    });
    if (bad.length) {
      throw new Error(
        `Secrets manquants ou non modifiés dans .env : ${bad.join(', ')}. Lance \`npm run setup\` puis redémarre.`
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
