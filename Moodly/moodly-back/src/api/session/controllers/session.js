'use strict';

/**
 * Connexion et inscription au format attendu par l'app (session = { jwt, agencyId, user }).
 *
 * POST /api/auth/login     { agencyId, email, password }              → 200 + session
 * POST /api/auth/register  { agencyId, name, email, password }        → 201 + session
 * POST /api/auth/social    { agencyId, provider, idToken, name? }     → 200/201 + session
 *                          provider = 'google' | 'apple' | 'microsoft'
 * GET  /api/auth/agency?code=AG-0001                                  → { code, name } (404 si inconnu)
 *
 * La route Strapi standard POST /api/auth/local existe toujours, mais elle ne
 * vérifie pas l'agence et ne renvoie pas le rôle Moodly.
 */

// Empreinte bcrypt « bidon » : quand l'email n'existe pas, on vérifie quand même un
// mot de passe pour que la réponse prenne le même temps → on ne peut pas deviner
// quels emails existent en chronométrant le serveur.
const DUMMY_HASH = '$2a$10$gOnHI13xuIDi0fDou4SU4ujntOF4iyuEFfApn0QvTEHiQDA.gpY8y';

const BAD_CREDENTIALS = 'Email, mot de passe ou ID agence incorrect';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Règles du mot de passe (les mêmes sont affichées dans l'app : src/lib/password.js) :
 * 8 caractères minimum, 1 majuscule, 1 chiffre, 1 caractère spécial.
 * Le serveur vérifie lui-même : on ne fait jamais confiance à l'app seule.
 * ⚠️ Désactivé par défaut (démo : n'importe quel mot de passe est accepté).
 * Pour exiger ces règles : STRONG_PASSWORD=true dans le .env, puis redémarrer le back.
 */
const STRONG_PASSWORD = process.env.STRONG_PASSWORD === 'true';
const PASSWORD_RULES_MESSAGE =
  'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 chiffre et 1 caractère spécial';
function passwordIsStrong(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /\p{Lu}/u.test(password) && // une majuscule (accents compris : É…)
    /\d/.test(password) && // un chiffre
    /[^\p{L}\p{N}]/u.test(password) // un caractère qui n'est ni une lettre ni un chiffre (! ? @ # …)
  );
}

/** La « session » renvoyée à l'app après login ou inscription. */
async function buildSession(strapi, userId) {
  const profile = await strapi.service('api::profile.profile').forUser(userId);
  const token = await strapi.plugin('users-permissions').service('jwt').issue({ id: userId });

  return {
    jwt: token,
    token, // même valeur, nom utilisé par l'ancien front Expo
    agencyId: profile.agency.code,
    role: profile.role,
    name: profile.name,
    user: {
      id: profile.documentId,
      email: profile.email,
      username: profile.name,
      role: profile.role,
    },
  };
}

/**
 * Crée un compte salarié dans l'équipe de l'agence (inscription classique ou 1re connexion sociale).
 * Renvoie { user } ou { error: [status, message] }.
 */
async function createEmployee(strapi, { agencyId, name, email, password, provider }) {
  const agency = await strapi.service('api::agency.agency').findByCode(agencyId);
  if (!agency) return { error: [400, 'ID agence inconnu'] };

  const team = await strapi.documents('api::team.team').findFirst({
    filters: { agency: { documentId: agency.documentId } },
    fields: ['name'],
    sort: 'id:asc',
  });
  if (!team) return { error: [400, "Cette agence n'a pas encore d'équipe"] };

  const users = strapi.documents('plugin::users-permissions.user');
  if (await users.findFirst({ filters: { email }, fields: ['id'] })) {
    return { error: [409, 'Un compte existe déjà avec cet email : connecte-toi'] };
  }

  // Le nom d'utilisateur doit être unique dans Strapi : "Camille Durand", "Camille Durand 2"...
  let username = name;
  for (let n = 2; await users.findFirst({ filters: { username }, fields: ['id'] }); n++) {
    username = `${name} ${n}`;
  }

  const employeeRole = await strapi.documents('plugin::users-permissions.role').findFirst({
    filters: { type: 'employee' },
  });

  // Le Document Service chiffre le mot de passe tout seul (pas de mot de passe pour un compte social)
  const user = await users.create({
    data: {
      username,
      email,
      ...(password ? { password } : {}),
      provider,
      confirmed: true,
      blocked: false,
      role: employeeRole.documentId,
      agency: agency.documentId,
      team: team.documentId,
    },
  });
  return { user };
}

module.exports = ({ strapi }) => ({
  async login(ctx) {
    // email déjà nettoyé (trim + minuscules) par le middleware normalize-email
    const { email, password, agencyId } = ctx.request.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return ctx.badRequest('email et password sont obligatoires');
    }
    if (typeof agencyId !== 'string' || !agencyId.trim()) {
      return ctx.badRequest('agencyId est obligatoire (ex. AG-0001)');
    }

    const user = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { provider: 'local', email },
      fields: ['password', 'blocked', 'confirmed'],
      populate: { agency: { fields: ['code'] } },
    });

    const passwordOk = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(password, user?.password || DUMMY_HASH);

    // Même message si l'email est inconnu, le mot de passe faux ou l'agence différente
    const sameAgency = user?.agency?.code === agencyId.trim().toUpperCase();
    if (!user || !user.password || !passwordOk || !sameAgency) {
      return ctx.unauthorized(BAD_CREDENTIALS);
    }

    if (user.blocked) {
      return ctx.forbidden('Ce compte est bloqué');
    }

    // Si l'admin a activé la confirmation d'email dans les réglages users-permissions
    const advanced = await strapi.store({ type: 'plugin', name: 'users-permissions' }).get({ key: 'advanced' });
    if (advanced?.email_confirmation && !user.confirmed) {
      return ctx.forbidden("Ce compte n'est pas encore confirmé");
    }

    const profile = await strapi.service('api::profile.profile').forUser(user.id);
    if (!profile.role) {
      return ctx.forbidden("Ce compte n'a pas de rôle Moodly (Employee ou Manager)");
    }

    ctx.body = await buildSession(strapi, user.id);
  },

  /**
   * Inscription d'un salarié avec le code de son agence.
   * Le compte est créé avec le rôle Employee, dans l'équipe de l'agence.
   * (On ne peut pas s'inscrire comme manager : ça se fait dans l'admin.)
   */
  async register(ctx) {
    const { agencyId, name, email, password } = ctx.request.body || {};

    // 1) Valider les champs
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return ctx.badRequest('Email invalide (ex. prenom@exemple.fr)');
    }
    // Nom facultatif : sans nom, on prend le début de l'email (« zoe.martin@… » → « zoe.martin »)
    const typed = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
    const cleanName = (typed || email.split('@')[0]).slice(0, 50);
    if (typeof password !== 'string' || !password) return ctx.badRequest('Mot de passe obligatoire');
    if (STRONG_PASSWORD && !passwordIsStrong(password)) return ctx.badRequest(PASSWORD_RULES_MESSAGE);
    // bcrypt ne prend en compte que les 72 premiers octets d'un mot de passe
    if (Buffer.byteLength(password) > 72) return ctx.badRequest('Le mot de passe est trop long');

    // 2) Créer le compte (agence et équipe vérifiées, email unique)
    const { user, error } = await createEmployee(strapi, {
      agencyId,
      name: cleanName,
      email,
      password,
      provider: 'local',
    });
    if (error) return ctx.send({ data: null, error: { status: error[0], message: error[1] } }, error[0]);

    ctx.status = 201;
    ctx.body = await buildSession(strapi, user.id);
  },

  /**
   * Connexion avec Google / Apple / Microsoft.
   * L'app envoie l'ID token du fournisseur ; on le vérifie (services/social.js), puis :
   * - si un compte existe avec cet email → on le connecte (même agence obligatoire) ;
   * - sinon → on crée un compte salarié dans l'équipe de l'agence (comme l'inscription).
   */
  async social(ctx) {
    const { provider, idToken, agencyId, name } = ctx.request.body || {};
    const social = strapi.service('api::session.social');

    if (!social.PROVIDERS.includes(provider)) return ctx.badRequest('provider doit être google, apple ou microsoft');
    if (typeof idToken !== 'string' || !idToken || idToken.length > 10000) return ctx.badRequest('idToken manquant');
    if (typeof agencyId !== 'string' || !agencyId.trim()) return ctx.badRequest('agencyId est obligatoire (ex. AG-0001)');

    let identity;
    try {
      identity = await social.verify(provider, idToken);
    } catch (err) {
      if (err instanceof social.SocialError) {
        return ctx.send({ data: null, error: { status: err.status, message: err.message } }, err.status);
      }
      throw err;
    }

    const existing = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { email: identity.email },
      fields: ['provider', 'blocked'],
      populate: { agency: { fields: ['code'] } },
    });

    if (existing) {
      // Microsoft : un compte d'organisation peut déclarer n'importe quel email. Par prudence,
      // on ne le relie jamais à un compte créé autrement (mot de passe, Google, Apple).
      if (provider === 'microsoft' && existing.provider !== 'microsoft') {
        return ctx.conflict('Un compte Moodly existe déjà avec cet email : connecte-toi avec ton mot de passe');
      }
      if (existing.agency?.code !== agencyId.trim().toUpperCase()) {
        return ctx.unauthorized('Ce compte appartient à une autre agence');
      }
      if (existing.blocked) return ctx.forbidden('Ce compte est bloqué');

      const profile = await strapi.service('api::profile.profile').forUser(existing.id);
      if (!profile.role) return ctx.forbidden("Ce compte n'a pas de rôle Moodly (Employee ou Manager)");

      ctx.body = await buildSession(strapi, existing.id);
      return;
    }

    // 1re connexion : création d'un compte salarié
    const fallbackName = identity.email.split('@')[0];
    const cleanName = String(identity.name || name || fallbackName).trim().replace(/\s+/g, ' ').slice(0, 50) || fallbackName;
    const { user, error } = await createEmployee(strapi, {
      agencyId,
      name: cleanName.length >= 2 ? cleanName : fallbackName,
      email: identity.email,
      provider,
    });
    if (error) return ctx.send({ data: null, error: { status: error[0], message: error[1] } }, error[0]);

    ctx.status = 201;
    ctx.body = await buildSession(strapi, user.id);
  },

  /**
   * Nom de l'entreprise pour un code, pour que la personne vérifie à l'inscription
   * qu'elle rejoint la bonne (« ✓ Agence démo Moodly »).
   * Il faut connaître le code pour obtenir le nom : la liste des clients n'est jamais exposée.
   */
  async agency(ctx) {
    const code = typeof ctx.query.code === 'string' ? ctx.query.code.trim().toUpperCase() : '';
    if (!/^AG-\d{4}$/.test(code)) return ctx.badRequest('Code entreprise invalide (format AG-0000)');

    const agency = await strapi.service('api::agency.agency').findByCode(code);
    if (!agency) return ctx.notFound('Code entreprise inconnu');
    ctx.body = { code: agency.code, name: agency.name };
  },
});
