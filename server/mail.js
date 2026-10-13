/* =====================================================
   ALVIA — email from the server (sign-in codes, security notices)
   The server sends its mail itself: it speaks SMTP with the mail account's own server
   (Gmail by default) over an encrypted connection. No package, no service in between.

   The account is kept in server/data/mail.json — typed in on the Account page of the
   admin backend — or comes from the environment, which wins:
     SMTP_USER          the account that sends, e.g. alviapads@gmail.com
     SMTP_PASS          its app password. For Gmail: Google account → Security →
                        2-Step Verification → App passwords. The normal password of
                        the mailbox does not work.
     SMTP_HOST          default smtp.gmail.com
     SMTP_PORT          default 465; 587 works as well
     ALVIA_LOGIN_EMAIL  where the mail goes (default: SMTP_USER itself)
   ===================================================== */
'use strict';

const net = require('node:net');
const tls = require('node:tls');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const auth = require('./auth');

const ACCOUNT_FILE = path.join(auth.DATA_DIR, 'mail.json');
const DEFAULT_HOST = 'smtp.gmail.com';
const TIMEOUT = 15 * 1000;
const ANSWER_LIMIT = 64 * 1024;
// Nothing that could end a line or an address inside a mail header.
const ADDRESS = /^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,180}\.[a-z]{2,24}$/i;
const HOST = /^[a-z0-9.-]{1,253}$/i;

const fromEnv = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

// A whole account from what was typed or saved, or null if something is missing or odd.
function complete(given) {
  const account = {
    host: String(given.host || DEFAULT_HOST).trim(),
    port: Number(given.port) || 465,
    user: String(given.user || '').trim(),
    pass: String(given.pass || ''),
    to: String(given.to || given.user || '').trim()
  };
  const fine = ADDRESS.test(account.user) && ADDRESS.test(account.to) && HOST.test(account.host)
    && Number.isInteger(account.port) && account.port > 0 && account.port < 65536
    && account.pass.length > 0 && account.pass.length <= 200 && !/[\u0000-\u001f\u007f]/.test(account.pass);
  return fine ? account : null;
}

// The account in use, or null while none is set up. Read from the file once, then remembered.
let remembered;
function account() {
  if (fromEnv()) {
    return complete({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, to: process.env.ALVIA_LOGIN_EMAIL });
  }
  if (remembered === undefined) {
    let saved = null;
    try { saved = auth.readJson(ACCOUNT_FILE); } catch (_) {} // unreadable → not set up
    remembered = saved ? complete(saved) : null;
  }
  return remembered;
}

function save(given) {
  auth.writeJson(ACCOUNT_FILE, given);
  remembered = given;
}

function remove() {
  fs.rmSync(ACCOUNT_FILE, { force: true });
  remembered = null;
}

/* An Error with .code:
     'account'      no mail account is set up
     'login'        the mail server does not accept the address and app password
     'unreachable'  no connection, no answer, or the mail was refused */
const fail = (code, detail) => Object.assign(new Error(`mail: ${detail || code}`), { code });

const connect = (secure, options) => new Promise((resolve, reject) => {
  const socket = secure ? tls.connect(options) : net.connect(options);
  socket.once('error', reject);
  socket.once(secure ? 'secureConnect' : 'connect', () => {
    socket.off('error', reject);
    resolve(socket);
  });
});

/* Reads the mail server's answers off a connection. One answer is one or more lines
   starting with the same three digits; the last has a space after them ("250 OK"),
   the ones before a dash ("250-SIZE …"). */
function listen(socket) {
  let text = '';
  let waiting = null;
  let broken = null;
  const settle = () => {
    if (!waiting) return;
    const answer = /^(?:\d{3}-[^\n]*\n)*(\d{3})(?: [^\n]*)?\r?\n/.exec(text);
    if (answer) {
      text = text.slice(answer[0].length);
      waiting.resolve({ code: Number(answer[1]), text: answer[0].trim().replace(/\s+/g, ' ').slice(0, 300) });
    } else if (broken) {
      waiting.reject(broken);
    } else {
      return;
    }
    waiting = null;
  };
  const stop = (error) => { broken = broken || error; settle(); };
  const onData = (chunk) => {
    text += chunk;
    if (text.length > ANSWER_LIMIT) stop(new Error('answer too long'));
    else settle();
  };
  socket.setEncoding('utf8');
  socket.on('data', onData);
  socket.on('error', stop);
  socket.on('close', () => stop(new Error('connection closed')));
  return {
    read: () => new Promise((resolve, reject) => { waiting = { resolve, reject }; settle(); }),
    release: () => socket.off('data', onData)
  };
}

// The mail as it goes over the wire. The text travels as base64, so any character is safe.
function compose(from, message) {
  const subject = String(message.subject).replace(/[^\x20-\x7e]+/g, ' ').slice(0, 150);
  const body = Buffer.from(String(message.text).replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');
  return [
    `From: ALVIA <${from.user}>`,
    `To: <${from.to}>`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomUUID()}@${from.user.split('@')[1]}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated',
    '',
    body
  ].join('\r\n');
}

async function deliver(from, message, hold) {
  // Port 587 starts in the open and switches to an encrypted connection before anything
  // is said (STARTTLS); every other port is encrypted from the first byte.
  const upgrade = from.port === 587;
  let socket;
  try {
    socket = await connect(!upgrade, { host: from.host, port: from.port, servername: from.host });
  } catch (error) {
    throw fail('unreachable', error.message);
  }
  hold.socket = socket;
  let chat = listen(socket);
  // Sends one line (never logged: it may be the password) and wants one of `codes` back.
  const say = async (line, codes, what) => {
    if (line !== null) socket.write(`${line}\r\n`);
    let answer;
    try {
      answer = await chat.read();
    } catch (error) {
      throw fail('unreachable', error.message);
    }
    if (!codes.includes(answer.code)) throw fail(what || 'unreachable', answer.text);
    return answer;
  };

  await say(null, [220]);
  await say('EHLO alvia.localhost', [250]);
  if (upgrade) {
    await say('STARTTLS', [220]);
    chat.release();
    try {
      socket = await connect(true, { socket, servername: from.host });
    } catch (error) {
      throw fail('unreachable', error.message);
    }
    hold.socket = socket;
    chat = listen(socket);
    await say('EHLO alvia.localhost', [250]);
  }
  await say(`AUTH PLAIN ${Buffer.from(`\u0000${from.user}\u0000${from.pass}`, 'utf8').toString('base64')}`, [235], 'login');
  await say(`MAIL FROM:<${from.user}>`, [250]);
  await say(`RCPT TO:<${from.to}>`, [250, 251]);
  await say('DATA', [354]);
  await say(`${compose(from, message)}\r\n.`, [250]);
  socket.write('QUIT\r\n');
}

/* Sends one mail: { subject, text }, to the address of the account. `using` tries an
   account out before it is kept. Throws an Error with .code (see fail). */
async function send(message, using) {
  const from = using || account();
  if (!from) throw fail('account');
  const hold = { socket: null };
  let timer;
  const late = new Promise((_, reject) => {
    timer = setTimeout(() => reject(fail('unreachable', 'no answer in time')), TIMEOUT);
  });
  try {
    await Promise.race([deliver(from, message, hold), late]);
  } finally {
    clearTimeout(timer);
    if (hold.socket) hold.socket.destroy();
  }
}

module.exports = { account, complete, fromEnv, remove, save, send };
