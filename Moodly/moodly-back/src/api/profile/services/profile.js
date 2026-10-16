'use strict';

/**
 * Service « profil » : tout ce qu'on sait de l'utilisateur connecté, lu EN BASE.
 * Réutilisé par le login, GET /api/profile, la saisie d'un mood et les stats manager.
 */

// Les seuls rôles reconnus par l'app (champ « type » du rôle users-permissions)
const APP_ROLES = ['employee', 'manager'];

const pickTeam = (team) => (team ? { documentId: team.documentId, name: team.name } : null);

module.exports = ({ strapi }) => ({
  /**
   * @param {number} userId  l'id numérique du user (celui contenu dans le JWT)
   * @returns {Promise<null | {
   *   id: number, name: string,
   *   role: 'employee' | 'manager' | null,
   *   team: { documentId: string, name: string } | null,
   *   managedTeams: { documentId: string, name: string }[]
   * }>}
   */
  async forUser(userId) {
    const user = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { id: userId },
      fields: ['username'],
      populate: {
        role: { fields: ['type'] },
        team: { fields: ['name'] },
        managedTeams: { fields: ['name'], sort: 'name:asc' },
      },
    });

    if (!user) return null;

    const roleType = user.role?.type;
    return {
      id: user.id,
      name: user.username,
      role: APP_ROLES.includes(roleType) ? roleType : null,
      team: pickTeam(user.team),
      managedTeams: (user.managedTeams || []).map(pickTeam),
    };
  },
});
