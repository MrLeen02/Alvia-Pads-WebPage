/* Creates or replaces the admin login.
   Usage:  node server/set-password.js <login name> <password>
   Use this if the password is forgotten; otherwise change it in the dashboard. */
'use strict';

const { MIN_PASSWORD_LENGTH, setAdmin } = require('./auth');

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: node server/set-password.js <login name> <password>');
  process.exit(1);
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
setAdmin(username, password);
console.log(`Admin login "${username}" saved. Restart the server if it is running.`);
