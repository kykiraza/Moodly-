'use strict';

/**
 * Index UNIQUE sur moods.daily_key, directement dans la base.
 *
 * Pourquoi ? Dans Strapi 5, « unique: true » dans schema.json est vérifié par le code
 * (une requête « existe-t-il déjà ? »), pas par la base. Deux requêtes envoyées au
 * même instant (double tap) pourraient passer toutes les deux. L'index garantit
 * qu'il n'y aura jamais 2 saisies avec la même empreinte, donc 1 saisie par jour.
 */
module.exports = async ({ strapi }) => {
  const knex = strapi.db.connection;
  const client = strapi.db.dialect.client;

  if (client === 'mysql') {
    // MySQL ne connaît pas « IF NOT EXISTS » pour les index
    const [rows] = await knex.raw("SHOW INDEX FROM moods WHERE Key_name = 'moods_daily_key_unique'");
    if (rows.length === 0) {
      await knex.raw('CREATE UNIQUE INDEX moods_daily_key_unique ON moods (daily_key)');
    }
    return;
  }

  await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS moods_daily_key_unique ON moods (daily_key)');
};
