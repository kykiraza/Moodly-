'use strict';

/**
 * 💾 Sauvegarde de la base SQLite (.tmp/data.db).
 *
 * Utilisée par :
 * - npm run backup            → sauvegarde à la demande (scripts/backup.js)
 * - la tâche planifiée de 2h30 (config/cron-tasks.js) → une copie chaque nuit
 * - npm run seed              → copie de sécurité AVANT d'effacer les données
 *
 * On utilise l'API « backup » de SQLite (et pas une simple copie de fichier) :
 * la copie reste cohérente même si le serveur est en train d'écrire.
 *
 * Réglages (.env) :
 * - BACKUP_DIR  : dossier des sauvegardes (défaut : backups/). Conseillé : un autre disque
 *                 ou un dossier synchronisé hors du projet, pour survivre à la perte du Mac.
 * - BACKUP_KEEP : nombre de sauvegardes gardées (défaut : 14) ; les plus anciennes sont supprimées.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..', '..');
const DB_FILE = path.join(ROOT, process.env.DATABASE_FILENAME || '.tmp/data.db');
const BACKUP_DIR = path.resolve(ROOT, process.env.BACKUP_DIR || 'backups');
const KEEP = Math.max(1, parseInt(process.env.BACKUP_KEEP, 10) || 14);

/** "2026-10-17_02-30-00" (heure locale), triable par ordre alphabétique = ordre chronologique */
function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

/** Les sauvegardes existantes, de la plus récente à la plus ancienne. */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => /^moodly-.*\.db$/.test(f))
    .sort()
    .reverse()
    .map((f) => path.join(BACKUP_DIR, f));
}

/**
 * Crée une sauvegarde et supprime les plus anciennes au-delà de BACKUP_KEEP.
 * @param {string} reason petit mot ajouté au nom du fichier (ex. "nuit", "avant-seed")
 * @returns {Promise<string|null>} chemin de la sauvegarde, ou null s'il n'y a pas encore de base
 */
async function backupDatabase(reason = 'manuel') {
  if (!fs.existsSync(DB_FILE)) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const target = path.join(BACKUP_DIR, `moodly-${stamp()}-${reason}.db`);
  const db = new Database(DB_FILE, { readonly: true, fileMustExist: true });
  try {
    await db.backup(target);
  } finally {
    db.close();
  }

  for (const old of listBackups().slice(KEEP)) fs.unlinkSync(old);
  return target;
}

/**
 * Remet une sauvegarde à la place de la base. ⚠️ Serveur ARRÊTÉ obligatoirement.
 * La base actuelle est elle-même sauvegardée avant (on peut donc annuler).
 */
async function restoreDatabase(file) {
  const source = path.resolve(file);
  if (!fs.existsSync(source)) throw new Error(`Sauvegarde introuvable : ${file}`);
  // Vérifie que c'est bien une base SQLite lisible avant d'écraser quoi que ce soit
  new Database(source, { readonly: true, fileMustExist: true }).close();

  const safety = await backupDatabase('avant-restauration');
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.copyFileSync(source, DB_FILE);
  // Fichiers temporaires de SQLite liés à l'ancienne base : ils ne doivent pas être réappliqués
  for (const ext of ['-wal', '-shm']) fs.rmSync(DB_FILE + ext, { force: true });
  return safety;
}

module.exports = { backupDatabase, restoreDatabase, listBackups, BACKUP_DIR, DB_FILE };
