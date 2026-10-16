'use strict';

/**
 * Rôles et permissions de Moodly, créés automatiquement à chaque démarrage.
 *
 * Le code est la source de vérité : si on coche/décoche une permission de
 * Employee ou Manager dans l'admin, elle est remise comme ici au redémarrage.
 * ⚠️ Toute nouvelle route doit avoir sa permission ajoutée dans cette liste.
 */

const ROLES = [
  {
    type: 'employee',
    name: 'Employee',
    description: 'Salarié : donne son moral du jour (anonyme).',
    actions: [
      'api::profile.profile.me', // GET  /api/profile
      'api::tag.tag.find', // GET  /api/tags
      'api::mood.mood.create', // POST /api/moods
      'api::mood.mood.today', // GET  /api/moods/today
    ],
  },
  {
    type: 'manager',
    name: 'Manager',
    description: "Manager : voit uniquement les statistiques agrégées de son équipe.",
    actions: [
      'api::profile.profile.me', // GET /api/profile
      'api::tag.tag.find', // GET /api/tags
      'api::team.team.stats', // GET /api/teams/:id/stats
      'api::team.team.myStats', // GET /api/team/stats
    ],
  },
];

// Ajoutées au rôle Public (visiteur non connecté), sans toucher à ses autres permissions
const PUBLIC_ACTIONS = [
  'api::session.session.login', // POST /api/auth/login
  'api::session.session.register', // POST /api/auth/register
  'api::session.session.social', // POST /api/auth/social
  'api::session.session.agency', // GET /api/auth/agency?code=AG-0001 (nom de l'entreprise)
];

async function findOrCreateRole(strapi, { type, name, description }) {
  const roles = strapi.db.query('plugin::users-permissions.role');
  const existing = await roles.findOne({ where: { type } });
  if (existing) return existing;
  strapi.log.info(`[moodly] Création du rôle ${name}`);
  return roles.create({ data: { type, name, description } });
}

/** Ajoute les permissions manquantes ; si exact = true, retire celles qui ne sont pas dans la liste. */
async function syncPermissions(strapi, role, actions, { exact }) {
  const permissions = strapi.db.query('plugin::users-permissions.permission');
  const current = await permissions.findMany({ where: { role: role.id } });
  const currentActions = current.map((p) => p.action);

  for (const action of actions) {
    if (!currentActions.includes(action)) {
      await permissions.create({ data: { action, role: role.id } });
    }
  }

  if (exact) {
    const extra = current.filter((p) => !actions.includes(p.action));
    if (extra.length) {
      await permissions.deleteMany({ where: { id: { $in: extra.map((p) => p.id) } } });
    }
  }
}

module.exports = async ({ strapi }) => {
  for (const roleDef of ROLES) {
    const role = await findOrCreateRole(strapi, roleDef);
    await syncPermissions(strapi, role, roleDef.actions, { exact: true });
  }

  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  await syncPermissions(strapi, publicRole, PUBLIC_ACTIONS, { exact: false });

  // Pas d'inscription libre : les comptes sont créés par l'admin (ou npm run seed)
  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = (await store.get({ key: 'advanced' })) || {};
  if (advanced.allow_register !== false) {
    await store.set({ key: 'advanced', value: { ...advanced, allow_register: false } });
    strapi.log.info('[moodly] Inscription libre désactivée');
  }
};
