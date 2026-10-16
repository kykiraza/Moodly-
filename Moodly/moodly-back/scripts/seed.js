'use strict';

/**
 * npm run seed
 *
 * ⚠️ À lancer avec le serveur ARRÊTÉ (SQLite n'aime pas deux programmes en même temps).
 * Efface puis recrée les données de démo :
 * - 8 tags, 2 équipes, 2 managers, 10 employés (mot de passe : Moodly2026!)
 * - environ 160 saisies sur les 30 derniers jours, avec un creux de moral au milieu
 *   de la période pour l'Équipe Produit (pour que le graphe raconte une histoire)
 * - AUJOURD'HUI est laissé vide, pour pouvoir faire des saisies en direct pendant la démo.
 *
 * Les dates sont calculées à partir d'aujourd'hui : relance le seed juste avant la démo.
 * Les données sont toujours les mêmes d'un lancement à l'autre (hasard « reproductible »).
 */

const { createStrapi, compileStrapi } = require('@strapi/strapi');
const { today, addDays, isWeekend, dailyKey } = require('../src/utils/moodly');

const PASSWORD = 'Moodly2026!';
const DAYS = 30;

const TAGS = [
  { label: 'Charge de travail', slug: 'charge-de-travail', emoji: '📚' },
  { label: "Ambiance d'équipe", slug: 'ambiance-equipe', emoji: '🤝' },
  { label: 'Reconnaissance', slug: 'reconnaissance', emoji: '🏆' },
  { label: 'Fatigue', slug: 'fatigue', emoji: '😴' },
  { label: 'Projet motivant', slug: 'projet-motivant', emoji: '🚀' },
  { label: 'Communication', slug: 'communication', emoji: '💬' },
  { label: 'Équilibre vie pro/perso', slug: 'equilibre-vie-pro-perso', emoji: '⚖️' },
  { label: 'Management', slug: 'management', emoji: '🧭' },
];

// Tags plutôt choisis quand ça va mal / quand ça va bien
const NEGATIVE_TAGS = ['charge-de-travail', 'fatigue', 'communication', 'management'];
const POSITIVE_TAGS = ['ambiance-equipe', 'reconnaissance', 'projet-motivant', 'equilibre-vie-pro-perso'];

const TEAMS = [
  {
    name: 'Équipe Produit',
    manager: { username: 'Sarah', email: 'sarah@moodly.test' },
    members: ['Léa', 'Hugo', 'Inès', 'Théo', 'Chloé', 'Nathan'],
    participation: 0.72, // probabilité de répondre un jour ouvré
    mood: (daysAgo) => (daysAgo >= 11 && daysAgo <= 17 ? 2.1 : 3.9), // creux au milieu du mois
  },
  {
    name: 'Équipe Support',
    manager: { username: 'Karim', email: 'karim@moodly.test' },
    members: ['Emma', 'Lucas', 'Jade', 'Adam'],
    participation: 0.85, // petite équipe : certains jours auront < 3 réponses → masqués (anonymat)
    mood: () => 3.5,
  },
];

// Email à partir du prénom : "Léa" → "lea@moodly.test"
const emailOf = (name) =>
  `${name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}@moodly.test`;

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

async function createUser(strapi, { username, email, role, team }) {
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
      ...(team ? { team: team.documentId } : {}),
    },
  });
}

async function seed(strapi) {
  console.log('🧹 Suppression des anciennes données de démo…');
  await deleteAll(strapi, 'api::mood.mood');
  await deleteAll(strapi, 'api::team.team');
  await deleteAll(strapi, 'api::tag.tag');
  await deleteAll(strapi, 'plugin::users-permissions.user', { email: { $endsWith: '@moodly.test' } });

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

  console.log('👥 Création des équipes et des comptes…');
  const end = today();
  let moodCount = 0;

  for (const def of TEAMS) {
    const manager = await createUser(strapi, { ...def.manager, role: managerRole });
    const team = await strapi.documents('api::team.team').create({
      data: { name: def.name, manager: manager.documentId },
    });

    const members = [];
    for (const name of def.members) {
      members.push(await createUser(strapi, { username: name, email: emailOf(name), role: employeeRole, team }));
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

  console.log(`\n✅ Seed terminé : ${TAGS.length} tags, ${TEAMS.length} équipes, ${moodCount} saisies.`);
  console.log(`\nComptes de démo (mot de passe : ${PASSWORD})`);
  for (const def of TEAMS) {
    console.log(`  ${def.name}`);
    console.log(`    manager  : ${def.manager.email}`);
    console.log(`    employés : ${def.members.map(emailOf).join(', ')}`);
  }
  console.log("\nAujourd'hui est vide : connecte-toi en employé pour faire une saisie en direct.");
}

async function main() {
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
