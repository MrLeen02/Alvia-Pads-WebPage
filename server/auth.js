/* =====================================================
   ALVIA — admin credentials
   One admin account, kept in server/data/admin.json as a salted scrypt hash.
   The password itself is never written to disk. Shared by server.js and
   set-password.js.
   ===================================================== */
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = process.env.ALVIA_DATA_DIR
  ? path.resolve(process.env.ALVIA_DATA_DIR)
  : path.join(__dirname, 'data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 10;
/* How much work one password guess costs (scrypt N). Higher is slower for someone who
   got hold of admin.json and tries passwords against it. A login saved before this was
   raised carries no number and is checked with the old one. */
const COST = 2 ** 16;
const OLD_COST = 2 ** 14;

// Written to a temporary file first, so a crash mid-write never leaves half a file.
// Only the account the server runs as may read it (where the system knows such rights).
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, file);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

const derive = (password, salt, cost) =>
  crypto.scryptSync(String(password).normalize('NFKC'), salt, KEY_LENGTH, { N: cost, maxmem: 256 * cost * 8 });

function setAdmin(username, password) {
  const salt = crypto.randomBytes(16);
  writeJson(ADMIN_FILE, {
    username: String(username),
    salt: salt.toString('hex'),
    cost: COST,
    hash: derive(password, salt, COST).toString('hex')
  });
}

const readAdmin = () => readJson(ADMIN_FILE);
const costOf = (admin) => (Number.isInteger(admin.cost) ? admin.cost : OLD_COST);

// True while the saved login still uses an older, cheaper setting (see COST).
function outdated() {
  const admin = readAdmin();
  return Boolean(admin) && costOf(admin) !== COST;
}

/* The hash is always computed, also for a wrong user name, so the answer takes the
   same time whether the name or the password was wrong. */
function verify(username, password) {
  const admin = readAdmin();
  const salt = Buffer.from(admin ? admin.salt : '00', 'hex');
  const expected = admin ? Buffer.from(admin.hash, 'hex') : Buffer.alloc(KEY_LENGTH);
  const given = derive(password, salt, admin ? costOf(admin) : COST);
  const passwordOk = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  const nameOk = Boolean(admin) && String(username) === admin.username;
  return nameOk && passwordOk;
}

module.exports = { DATA_DIR, MIN_PASSWORD_LENGTH, outdated, readAdmin, readJson, setAdmin, verify, writeJson };
