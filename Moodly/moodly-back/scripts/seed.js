'use strict';

/**
 * npm run seed
 *
 * ⚠️ À lancer avec le serveur ARRÊTÉ (SQLite n'aime pas deux programmes en même temps).
 * Efface puis recrée les données de démo :
 * - 1 agence AG-0001, 1 équipe de 12 personnes (1 manager + 11 salariés), mot de passe Moodly2026!
 * - les 8 raisons (tags) du prototype
 * - environ 350 saisies sur les 60 derniers jours, avec un creux de moral il y a
 *   2 semaines (pour que le graphe raconte une histoire)
 * - AUJOURD'HUI est laissé vide, pour pouvoir faire des saisies en direct pendant la démo.
 *
 * Les dates sont calculées à partir d'aujourd'hui : relance le seed juste avant la démo.
 * Les données sont toujours les mêmes d'un lancement à l'autre (hasard « reproductible »).
 */

const { createStrapi, compileStrapi } = require('@strapi/strapi');
const { today, addDays, isWeekend, dailyKey } = require('../src/utils/moodly');
const { backupDatabase } = require('../src/utils/backup');

const PASSWORD = 'Moodly2026!';
const DAYS = 60; // 60 jours : 30 pour le graphe + 30 pour comparer (tendance)

// Les 8 raisons du prototype (même slug que les « id » de FACTORS dans le front)
const TAGS = [
  { label: 'Charge de travail', slug: 'charge' },
  { label: "Ambiance d'équipe", slug: 'ambiance' },
  { label: 'Management', slug: 'management' },
  { label: 'Reconnaissance', slug: 'reco' },
  { label: 'Équilibre vie pro/perso', slug: 'equilibre' },
  { label: 'Conditions de travail', slug: 'conditions' },
  { label: 'Missions / projets', slug: 'missions' },
  { label: 'Personnel', slug: 'perso' },
];

// Raisons plutôt choisies quand ça va mal / quand ça va bien
const NEGATIVE_TAGS = ['charge', 'management', 'conditions', 'perso'];
const POSITIVE_TAGS = ['ambiance', 'reco', 'missions', 'equilibre'];

const AGENCY = { code: 'AG-0001', name: 'Agence démo Moodly' };

const TEAMS = [
  {
    name: 'Équipe Produit',
    manager: 'Julien Moreau',
    members: [
      'Camille Durand',
      'Léa Martin',
      'Hugo Bernard',
      'Inès Petit',
      'Théo Robert',
      'Chloé Richard',
      'Nathan Dubois',
      'Emma Laurent',
      'Lucas Simon',
      'Jade Michel',
      'Adam Lefebvre',
    ],
    participation: 0.75, // probabilité de répondre un jour ouvré
    mood: (daysAgo) => (daysAgo >= 11 && daysAgo <= 17 ? 2.2 : 3.8), // creux au milieu du mois
  },
];

// Email à partir du nom : "Léa Martin" → "lea.martin@entreprise.fr"
const DOMAIN = 'entreprise.fr';
const emailOf = (name) =>
  `${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '.')}@${DOMAIN}`;

// Petit générateur pseudo-aléatoire (mulberry32) : même graine → mêmes données
function random(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = random(2026);
const pick = (list) => list[Math.floor(rand() * list.length)];

/** Supprime tous les documents d'un content-type (via le Document Service). */
async function deleteAll(strapi, uid, filters = {}) {
  const docs = await strapi.documents(uid).findMany({ filters, fields: ['documentId'] });
  for (const doc of docs) {
    await strapi.documents(uid).delete({ documentId: doc.documentId });
  }
  return docs.length;
}

async function createUser(strapi, { username, email, role, team, agency }) {
  // Le Document Service chiffre (hash) le mot de passe tout seul
  return strapi.documents('plugin::users-permissions.user').create({
    data: {
      username,
      email,
      password: PASSWORD,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: role.documentId,
      agency: agency.documentId,
      ...(team ? { team: team.documentId } : {}),
    },
  });
}

async function seed(strapi) {
  console.log('🧹 Suppression des anciennes données de démo…');
  await deleteAll(strapi, 'api::mood.mood');
  await deleteAll(strapi, 'api::team.team');
  await deleteAll(strapi, 'api::tag.tag');
  await deleteAll(strapi, 'api::agency.agency');
  // Tous les comptes salariés/managers (démo + comptes créés par l'inscription)
  await deleteAll(strapi, 'plugin::users-permissions.user', {
    $or: [
      { role: { type: { $in: ['employee', 'manager'] } } },
      { email: { $endsWith: `@${DOMAIN}` } },
      { email: { $endsWith: '@moodly.test' } },
    ],
  });

  // Les rôles sont créés au démarrage par src/bootstrap/permissions.js
  const roleOf = async (type) => {
    const role = await strapi.documents('plugin::users-permissions.role').findFirst({ filters: { type } });
    if (!role) throw new Error(`Rôle "${type}" introuvable`);
    return role;
  };
  const employeeRole = await roleOf('employee');
  const managerRole = await roleOf('manager');

  console.log('🏷️  Création des tags…');
  const tags = {};
  for (const tag of TAGS) {
    tags[tag.slug] = await strapi.documents('api::tag.tag').create({ data: tag });
  }

  console.log("🏢 Création de l'agence…");
  const agency = await strapi.documents('api::agency.agency').create({ data: AGENCY });

  console.log('👥 Création des équipes et des comptes…');
  const end = today();
  let moodCount = 0;

  for (const def of TEAMS) {
    const manager = await createUser(strapi, {
      username: def.manager,
      email: emailOf(def.manager),
      role: managerRole,
      agency,
    });
    const team = await strapi.documents('api::team.team').create({
      data: { name: def.name, manager: manager.documentId, agency: agency.documentId },
    });

    const members = [];
    for (const name of def.members) {
      members.push(
        await createUser(strapi, { username: name, email: emailOf(name), role: employeeRole, team, agency })
      );
    }

    // Saisies des 29 jours précédents (daysAgo = 0 = aujourd'hui, laissé vide)
    for (let daysAgo = DAYS - 1; daysAgo >= 1; daysAgo--) {
      const day = addDays(end, -daysAgo);
      const chance = isWeekend(day) ? 0.06 : def.participation;

      for (const member of members) {
        if (rand() > chance) continue;

        const base = def.mood(daysAgo);
        const score = Math.min(5, Math.max(1, Math.round(base + (rand() - 0.5) * 2.2)));

        // 0 à 3 tags, plutôt négatifs si la note est basse, positifs sinon
        const pool = score <= 2 ? NEGATIVE_TAGS : score >= 4 ? POSITIVE_TAGS : [...NEGATIVE_TAGS, ...POSITIVE_TAGS];
        const chosen = new Set();
        const howMany = Math.floor(rand() * 4); // 0, 1, 2 ou 3
        while (chosen.size < howMany) chosen.add(pick(pool));

        await strapi.documents('api::mood.mood').create({
          data: {
            day,
            score,
            tags: [...chosen].map((slug) => tags[slug].documentId),
            team: team.documentId,
            dailyKey: dailyKey(member.id, day),
          },
        });
        moodCount += 1;
      }
    }
  }

  console.log(`\n✅ Seed terminé : 1 agence, ${TAGS.length} tags, ${TEAMS.length} équipe(s), ${moodCount} saisies.`);
  console.log(`\nAgence : ${AGENCY.code} — comptes de démo (mot de passe : ${PASSWORD})`);
  for (const def of TEAMS) {
    console.log(`  ${def.name}`);
    console.log(`    manager  : ${emailOf(def.manager)}`);
    console.log(`    salariés : ${def.members.map(emailOf).join(', ')}`);
  }
  console.log("\nAujourd'hui est vide : connecte-toi en employé pour faire une saisie en direct.");
}

async function main() {
  // Le seed efface tout : on garde d'abord une copie de la base actuelle
  const backup = await backupDatabase('avant-seed');
  if (backup) console.log(`💾 Copie de sécurité de la base : ${backup}`);

  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();
  strapi.log.level = 'error'; // on garde la console lisible

  try {
    await seed(strapi);
  } finally {
    await strapi.destroy();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Le seed a échoué :', err.message);
    console.error('   Le serveur est-il bien arrêté ? (Ctrl+C dans le terminal de npm run develop)');
    process.exit(1);
  });
