'use strict';

/**
 * npm run backup                     → sauvegarde la base maintenant (serveur allumé ou non)
 * npm run backup -- --list           → liste les sauvegardes
 * npm run restore -- <fichier.db>    → remet une sauvegarde (⚠️ serveur ARRÊTÉ)
 *
 * Le fonctionnement est expliqué dans src/utils/backup.js.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { backupDatabase, restoreDatabase, listBackups, BACKUP_DIR } = require('../src/utils/backup');

const [command, arg] = process.argv.slice(2);

async function main() {
  if (command === '--list') {
    const files = listBackups();
    if (!files.length) return console.log(`Aucune sauvegarde dans ${BACKUP_DIR}`);
    console.log(`Sauvegardes (${BACKUP_DIR}) :`);
    for (const f of files) console.log(`  ${path.basename(f)}  (${Math.round(fs.statSync(f).size / 1024)} Ko)`);
    return;
  }

  if (command === '--restore') {
    if (!arg) throw new Error('Indique le fichier : npm run restore -- backups/moodly-….db');
    const safety = await restoreDatabase(arg);
    console.log(`✅ Base restaurée depuis ${arg}`);
    if (safety) console.log(`   (l'ancienne base est gardée ici : ${safety})`);
    console.log('   Relance le serveur : npm run develop');
    return;
  }

  const file = await backupDatabase('manuel');
  if (!file) return console.log("Pas encore de base à sauvegarder (lance d'abord npm run develop).");
  console.log(`✅ Sauvegarde créée : ${file}`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
