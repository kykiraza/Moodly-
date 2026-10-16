'use strict';

/**
 * GET /api/profile → { name, email, role, agency, team, managedTeams }
 * Permet à l'app de savoir quel écran afficher (saisie employé ou vue manager).
 */
module.exports = ({ strapi }) => ({
  async me(ctx) {
    const profile = await strapi.service('api::profile.profile').forUser(ctx.state.user.id);
    if (!profile) return ctx.unauthorized();

    const { id, documentId, ...publicProfile } = profile; // on ne renvoie pas les identifiants internes
    ctx.body = publicProfile;
  },
});
