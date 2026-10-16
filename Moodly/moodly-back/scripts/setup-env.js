'use strict';

/**
 * npm run setup
 *
 * Prépare le fichier .env à partir de .env.example :
 * - si .env n'existe pas : on le crée et on remplace chaque « tobemodified » par un secret aléatoire ;
 * - si .env existe déjà : on n'écrase RIEN, on ajoute seulement les variables qui manquent.
 *
 * Utile quand un membre du groupe clone le dépôt : le .env n'est pas sur Git (il contient des secrets).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const examplePath = path.join(root, '.env.example');
const envPath = path.join(root, '.env');

// Un secret aléatoire de 16 octets, en base64 (même format que ceux générés par Strapi)
const secret = () => crypto.randomBytes(16).toString('base64');

// Remplace les valeurs « tobemodified », « toBeModified1 »... par des secrets
const fillSecrets = (line) => line.replace(/tobemodified\d*/gi, () => secret());

// Lit les lignes « CLE=valeur » d'un texte → { CLE: 'ligne complète' }
const parse = (text) =>
  Object.fromEntries(
    text
      .split('\n')
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => [line.split('=')[0], line])
  );

const example = fs.readFileSync(examplePath, 'utf8');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, example.split('\n').map(fillSecrets).join('\n'));
  console.log('✅ .env créé avec des secrets aléatoires.');
  process.exit(0);
}

const current = parse(fs.readFileSync(envPath, 'utf8'));
const missing = Object.entries(parse(example)).filter(([key]) => !(key in current));

if (missing.length === 0) {
  console.log('✅ .env est déjà complet, rien à faire.');
  process.exit(0);
}

const toAdd = missing.map(([, line]) => fillSecrets(line)).join('\n');
fs.appendFileSync(envPath, `\n# Ajouté par npm run setup\n${toAdd}\n`);
console.log(`✅ Ajouté à .env : ${missing.map(([key]) => key).join(', ')}`);
