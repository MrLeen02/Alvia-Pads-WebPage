/* =====================================================
   ALVIA — site server
   Serves the website, takes orders from the cart page and runs the admin
   backend's API (orders, inventory, shop settings, login). Plain Node, no packages
   to install.

   Before launch the website has no shop: cart, terms of sale and the shipping page
   only exist once "Shop on the website" is switched on in the backend (SHOP_PAGES).

   Visitors are counted per day and country, but only those who accept the cookie
   banner (see "Visitor statistics"). No address and no visitor number is kept.

   Paying: the buyer pays by TWINT before the order counts. There are two ways:
     online   a Payrexx account is connected (see payrexx.js). Every order gets its own
              payment page with a TWINT QR code for exactly its amount. Payrexx knows
              when the money has arrived and this server asks it: only then does the
              order become paid. Nobody can say "paid" without having paid.
     manual   no Payrexx account. The buyer sees the owner's TWINT number, pays and
              says so (status claimed); the owner checks the TWINT app and confirms
              (status paid).

     node server/server.js            (or: npm start)

   Environment:
     PORT             port to listen on (default 3000)
     HOST             address to listen on (default: every address of this computer;
                      127.0.0.1 → reachable from this computer only)
     TRUST_PROXY=1    behind a reverse proxy / hosting platform: take the visitor's
                      address and https from the X-Forwarded-* headers. The number is
                      how many proxies stand in front (1 on most platforms, 2 if e.g.
                      Cloudflare is in front of the platform as well). Too low and
                      everybody shares one address; too high and a visitor can make
                      theirs up. The log line after signing in shows what the server sees.
     ALVIA_DATA_DIR   where orders, settings and the admin login are kept
                      (default server/data)
     ALVIA_PAY_MINUTES  how long a started order waits for its payment (default 30)
     SMTP_USER, SMTP_PASS, …  the mail account for sign-in codes (see mail.js)

   Everything is kept in JSON files in the data folder: store.json (settings, orders,
   stock movements), admin.json (the login), sessions.json (who is signed in),
   devices.json (browsers confirmed with a sign-in code), visits.json (visitors per day
   and country) and, once they are connected, payrexx.json (the Payrexx keys) and
   mail.json (the mail account). Back that folder up; it is never served.
   Prices are whole Rappen (CHF 39.90 → 3990), so no rounding can creep in.
   ===================================================== */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const auth = require('./auth');
const payrexx = require('./payrexx');
const mail = require('./mail');
const zones = require('./zones');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || undefined;
const PROXIES = Math.max(0, Math.floor(Number(process.env.TRUST_PROXY)) || 0); // proxies in front of this server
const STORE_FILE = path.join(auth.DATA_DIR, 'store.json');
const SESSION_FILE = path.join(auth.DATA_DIR, 'sessions.json');
const DEVICES_FILE = path.join(auth.DATA_DIR, 'devices.json');
const VISITS_FILE = path.join(auth.DATA_DIR, 'visits.json');

const COLOURS = ['blue', 'black'];
const COUNTRIES = ['CH']; // where we deliver; add a code here and in cart.html to open another country
/* The way of an order:
     new       started on the cart page, the buyer is on the payment step
     claimed   manual payment only: the buyer says the TWINT payment is made — to be checked
     paid      the money is there (says Payrexx, or the owner has seen it): ready to ship
     shipped · cancelled */
const STATUSES = ['new', 'claimed', 'paid', 'shipped', 'cancelled'];
const ADJUSTMENTS = ['delivery', 'damaged', 'count'];
const LANGS = ['en', 'de', 'fr'];
const COOKIE = 'alvia_admin';
const SHORT_SESSION = 8 * 3600;        // seconds — signed in until the browser closes
const LONG_SESSION = 30 * 24 * 3600;   // seconds — "stay signed in"
const BODY_LIMIT = 10 * 1024;
// A started order holds its pads this long; not paid by then, it is cancelled.
const PAY_WINDOW = (Number(process.env.ALVIA_PAY_MINUTES) > 0 ? Number(process.env.ALVIA_PAY_MINUTES) : 30) * 60 * 1000;
/* Online payment: how often Payrexx is asked about one order — when the buyer's page
   asks, and by the server's own clock — and how long after the time is up an order is
   still given, so a payment made in the last second is not lost. */
const ASK_GAP = 3 * 1000;
const SWEEP_GAP = 25 * 1000;
const SWEEP_MOST = 25;
const PAY_GRACE = 60 * 1000;
// The TWINT QR code the owner uploads: kept in the data folder, shown on the payment step.
const QR_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const QR_LIMIT = 500 * 1024;
const MOVEMENTS_KEPT = 5000;
const MOVEMENTS_SHOWN = 500;

class HttpError extends Error {
  constructor(status, code, extra) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra || {};
  }
}

/* =====================================================
   Store
   ===================================================== */
const DEFAULT_SETTINGS = {
  selling: false,       // false → before launch: the website has no shop at all (see SHOP_PAGES)
  open: false,          // false → the product page says orders are paused
  statistics: true,     // false → no cookie banner, no visitor is counted
  price: 0,             // Rappen
  shipping: 0,          // Rappen, flat per order
  currency: 'CHF',
  maxQuantity: 10,      // per order
  lowStock: 5,          // the dashboard warns at or below this many pads
  stock: { blue: 0, black: 0 },               // pads that can still be ordered
  payment: { holder: '', iban: '', twint: '', qr: '' } // TWINT number and QR picture for the payment step
};

// A store file that exists but cannot be read stops the server: never start empty
// on top of real orders.
const saved = auth.readJson(STORE_FILE) || {};
const savedSettings = saved.settings || {};
const store = {
  settings: Object.assign({}, DEFAULT_SETTINGS, savedSettings, {
    stock: Object.assign({}, DEFAULT_SETTINGS.stock, savedSettings.stock),
    payment: Object.assign({}, DEFAULT_SETTINGS.payment, savedSettings.payment)
  }),
  orders: Array.isArray(saved.orders) ? saved.orders : [],
  movements: Array.isArray(saved.movements) ? saved.movements : [],
  nextNumber: Number.isInteger(saved.nextNumber) ? saved.nextNumber : 1001
};
const save = () => auth.writeJson(STORE_FILE, store);

// What the product page may know: stock is capped, so the exact count stays private.
function publicShop() {
  const { selling, open, price, shipping, currency, maxQuantity, stock, payment } = store.settings;
  const available = {};
  COLOURS.forEach((colour) => { available[colour] = Math.min(stock[colour], maxQuantity); });
  // Without Payrexx or a TWINT number nobody could pay, so the shop counts as closed.
  const online = Boolean(payrexx.keys());
  return { open: selling && open && price > 0 && (online || Boolean(payment.twint)), price, shipping, currency, maxQuantity, stock: available, payMinutes: Math.round(PAY_WINDOW / 60000), pay: online ? 'online' : 'manual' };
}

/* Every change of stock goes through here, so the inventory history in the dashboard
   is complete: what changed, why, and how many were left afterwards. */
function moveStock(colour, change, reason, ref, by) {
  const stock = store.settings.stock;
  stock[colour] = (stock[colour] || 0) + change;
  store.movements.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    colour,
    change,
    balance: stock[colour],
    reason,          // order · cancelled · expired · reopened · deleted · delivery · damaged · correction
    ref: ref || '',  // order number, or the note typed in the dashboard
    by: by || ''     // admin who did it; empty for orders from the website
  });
  if (store.movements.length > MOVEMENTS_KEPT) store.movements.splice(0, store.movements.length - MOVEMENTS_KEPT);
}

/* =====================================================
   Small helpers
   ===================================================== */
function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) });
  res.end(text);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) {
      reject(new HttpError(415, 'json-expected'));
      return;
    }
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > (limit || BODY_LIMIT)) {
        reject(new HttpError(413, 'too-large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
        resolve(body);
      } catch (_) {
        reject(new HttpError(400, 'bad-json'));
      }
    });
    req.on('error', reject);
  });
}

/* The visitor's address. Every proxy adds the address it was called from at the END of
   X-Forwarded-For; whatever stands further left was sent by the visitor and can be made
   up. So with one proxy the last entry counts, with two the one before it. Taking the
   first entry would let anyone dodge the login and order limits by inventing addresses. */
let proxyWarned = false;
function clientIp(req) {
  const chain = String(req.headers['x-forwarded-for'] || '').split(',').map((entry) => entry.trim()).filter(Boolean);
  if (PROXIES && chain.length) return chain[Math.max(0, chain.length - PROXIES)].slice(0, 64);
  if (chain.length && !proxyWarned) {
    proxyWarned = true;
    console.warn('[ALVIA] This server seems to run behind a proxy, but TRUST_PROXY is not set: all visitors count as one address and the sign-in cookie is not marked secure. Set TRUST_PROXY=1.');
  }
  return req.socket.remoteAddress || 'unknown';
}

const forwardedProto = (req) => (PROXIES ? String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() : '');
const isHttps = (req) => Boolean(req.socket.encrypted) || forwardedProto(req) === 'https';
// Called from this computer itself, with no proxy in between.
const isLocal = (req) => !PROXIES && !req.headers['x-forwarded-for']
  && /^(::1|(::ffff:)?127\.\d+\.\d+\.\d+)$/.test(req.socket.remoteAddress || '');

// Counts events per key inside a time window: failed logins, orders per address.
function limiter(max, windowMs) {
  const hits = new Map();
  const recent = (key) => (hits.get(key) || []).filter((time) => Date.now() - time < windowMs);
  setInterval(() => {
    hits.forEach((_, key) => { if (!recent(key).length) hits.delete(key); });
  }, windowMs).unref();
  return {
    blocked: (key) => recent(key).length >= max,
    hit: (key) => { hits.set(key, recent(key).concat(Date.now())); },
    reset: (key) => { hits.delete(key); }
  };
}

// One line of typed text: control characters out, trimmed, cut to length.
const clean = (value, max) => (typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)
  : '');

const wholeNumber = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

/* =====================================================
   Sessions
   The browser holds a random token in an HttpOnly cookie. The server keeps only a
   hash of each token, in sessions.json, so signing in survives a server restart and
   a copy of that file cannot be used to sign in.
     "Stay signed in" → 30 days, the cookie outlives the browser.
     otherwise        → 8 hours, the cookie goes when the browser closes.
   ===================================================== */
let savedSessions = {};
try { savedSessions = auth.readJson(SESSION_FILE) || {}; } catch (_) {} // unreadable → everyone signs in again
const sessions = new Map(Object.entries(savedSessions).filter(([, session]) => session && session.expires > Date.now()));
const saveSessions = () => auth.writeJson(SESSION_FILE, Object.fromEntries(sessions));
const sessionKey = (token) => crypto.createHash('sha256').update(token).digest('hex');
const loginLimit = limiter(5, 15 * 60 * 1000);
// All wrong passwords together, whatever address they come from: guessing from many
// addresses at once is slowed down as well.
const loginFlood = limiter(50, 15 * 60 * 1000);

function sessionToken(req) {
  const match = new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`).exec(req.headers.cookie || '');
  return match ? match[1] : null;
}

function currentSession(req) {
  const token = sessionToken(req);
  const session = token && sessions.get(sessionKey(token));
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(sessionKey(token));
    saveSessions();
    return null;
  }
  return session;
}

// maxAge null → a cookie that lasts until the browser is closed.
function sessionCookie(req, token, maxAge) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict`
    + (maxAge === null ? '' : `; Max-Age=${maxAge}`)
    + (isHttps(req) ? '; Secure' : '');
}

/* A request that changes something, and everything the backend asks for, must come
   from this site's own pages. The cookie is SameSite=Strict already; this is the second
   lock. Browsers say where a request comes from in Sec-Fetch-Site ("none": typed into
   the address bar) and Origin. */
function checkOrigin(req) {
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') throw new HttpError(403, 'origin');
  const origin = req.headers.origin;
  if (!origin) return;
  let host = null;
  try { host = new URL(origin).host; } catch (_) {}
  if (host !== req.headers.host) throw new HttpError(403, 'origin');
}

/* =====================================================
   Sign-in code by email (the second step)
   Once a mail account is set up (mail.js; Account page of the backend), the password
   alone only signs in a browser that was confirmed before, on an internet connection
   it was confirmed on. Every other sign-in — a new device, or a known one somewhere
   else — is sent a six-digit code by email, which has to be typed in.
     alvia_device   a random token in an HttpOnly cookie that marks a confirmed
                    browser. Only its hash is kept here (devices.json), with the
                    connections it was confirmed on.
   A code is good for 10 minutes and 5 tries, on the connection that asked for it. If
   the email cannot be sent, the code is written to the server's log instead: a broken
   mail account must not lock the owner out, and who reads the log has the server anyway.
   ===================================================== */
const DEVICE_COOKIE = 'alvia_device';
const DEVICE_LIFE = 180 * 24 * 3600;   // seconds — then a browser confirms itself again
const DEVICES_KEPT = 30;
const NETWORKS_KEPT = 5;               // connections remembered per browser
const CODE_LIFE = 10 * 60 * 1000;
const CODE_TRIES = 5;
const CODES_OPEN = 20;                 // codes waiting to be typed in, all together
const codeLimit = limiter(10, 15 * 60 * 1000);  // wrong codes per address
const mailLimit = limiter(5, 15 * 60 * 1000);   // codes sent per address
const mailFlood = limiter(20, 60 * 60 * 1000);  // codes sent, whoever asks

let devices = {};
try { devices = auth.readJson(DEVICES_FILE) || {}; } catch (_) {} // unreadable → every browser confirms itself again
Object.keys(devices).forEach((key) => {
  const device = devices[key];
  if (!device || !Array.isArray(device.networks) || !(device.expires > Date.now())) delete devices[key];
});
const saveDevices = () => auth.writeJson(DEVICES_FILE, devices);

/* The connection an address belongs to. An IPv4 address is one connection. An IPv6
   device changes the second half of its address by itself, so only the first half
   (the /64 the provider gave out) counts. */
function networkOf(ip) {
  const address = String(ip).replace(/%.*$/, '').toLowerCase();
  const v4 = /^(?:::ffff:)?(\d+\.\d+\.\d+\.\d+)$/.exec(address);
  if (v4) return v4[1];
  if (!address.includes(':')) return address;
  const [head, tail] = address.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = tail === undefined ? left : left.concat(Array(Math.max(0, 8 - left.length - right.length)).fill('0'), right);
  return groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, '')).join(':');
}

function deviceToken(req) {
  const match = new RegExp(`(?:^|;\\s*)${DEVICE_COOKIE}=([a-f0-9]{64})`).exec(req.headers.cookie || '');
  return match ? match[1] : null;
}

// The browser's entry if it was confirmed before, wherever it is now.
function knownDevice(req) {
  const token = deviceToken(req);
  const device = token && devices[sessionKey(token)];
  return device && device.expires > Date.now() ? device : null;
}

// Confirmed before, and on the connection it is on now?
function trusted(req) {
  const device = knownDevice(req);
  return Boolean(device) && device.networks.includes(networkOf(clientIp(req)));
}

// Only the sign-in itself ever needs it, so it is not sent with any other request.
const deviceCookie = (req, token, maxAge) =>
  `${DEVICE_COOKIE}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;

// Marks this browser as confirmed on the connection it is on. Gives its cookie.
function trustDevice(req) {
  const token = knownDevice(req) ? deviceToken(req) : crypto.randomBytes(32).toString('hex');
  const key = sessionKey(token);
  const network = networkOf(clientIp(req));
  const before = devices[key] ? devices[key].networks.filter((entry) => entry !== network) : [];
  devices[key] = { networks: before.concat(network).slice(-NETWORKS_KEPT), expires: Date.now() + DEVICE_LIFE * 1000 };
  // Run out, or more than are kept: the ones used longest ago go.
  Object.keys(devices)
    .sort((a, b) => devices[b].expires - devices[a].expires)
    .filter((entry, index) => index >= DEVICES_KEPT || devices[entry].expires <= Date.now())
    .forEach((entry) => { delete devices[entry]; });
  saveDevices();
  return deviceCookie(req, token, DEVICE_LIFE);
}

// Every browser confirms itself again — except `keep`, the one that asked for it.
function forgetDevices(keep) {
  Object.keys(devices).forEach((key) => { if (key !== keep) delete devices[key]; });
  saveDevices();
}

/* Codes that wait to be typed in: hash of the challenge → what the code is for. The
   challenge is a random key the browser gets with the answer and sends back with the
   code, so a code only fits the sign-in it was made for. Kept in memory: a restart
   means signing in once more. */
const codes = new Map();
const proofOf = (challenge, code) => sessionKey(`${challenge}:${code}`);

// kind: 'login' (signing in) · 'mail' (trying a mail account out). Gives { challenge, code }.
function openCode(req, kind, data) {
  const ip = clientIp(req);
  if (mailLimit.blocked(ip) || mailFlood.blocked('all')) throw new HttpError(429, 'rate');
  mailLimit.hit(ip);
  mailFlood.hit('all');
  const now = Date.now();
  codes.forEach((open, key) => { if (open.expires < now) codes.delete(key); });
  while (codes.size >= CODES_OPEN) codes.delete(codes.keys().next().value);
  const challenge = crypto.randomBytes(32).toString('hex');
  const code = String(crypto.randomInt(1000000)).padStart(6, '0');
  codes.set(sessionKey(challenge), { kind, proof: proofOf(challenge, code), expires: now + CODE_LIFE, tries: 0, network: networkOf(ip), data });
  return { challenge, code };
}

// Checks a typed code. Right: the code is used up and what it was for comes back.
function takeCode(req, kind, body) {
  const ip = clientIp(req);
  if (codeLimit.blocked(ip)) throw new HttpError(429, 'rate');
  const challenge = typeof body.challenge === 'string' && /^[a-f0-9]{64}$/.test(body.challenge) ? body.challenge : '';
  const key = sessionKey(challenge);
  const open = codes.get(key);
  if (!open || open.kind !== kind || open.expires < Date.now() || open.network !== networkOf(ip)) {
    codeLimit.hit(ip);
    throw new HttpError(403, 'code-expired');
  }
  const typed = typeof body.code === 'string' ? body.code.replace(/\D/g, '').slice(0, 6) : '';
  if (!crypto.timingSafeEqual(Buffer.from(proofOf(challenge, typed)), Buffer.from(open.proof))) {
    codeLimit.hit(ip);
    open.tries += 1;
    if (open.tries < CODE_TRIES) throw new HttpError(403, 'code');
    codes.delete(key);
    console.warn(`[ALVIA] ${CODE_TRIES} wrong sign-in codes from ${ip} — that code is void`);
    throw new HttpError(403, 'code-expired');
  }
  codes.delete(key);
  return open.data;
}

// a••••••s@gmail.com — enough to know which mailbox to look in.
const masked = (address) => address.replace(/^(.)(.*)(.@.*)$/, (_, first, middle, rest) => `${first}${'•'.repeat(Math.min(middle.length, 6))}${rest}`);

/* A short email to the owner when something that guards the shop was changed. It never
   holds a request up and never fails one. */
function notice(req, subject, text) {
  if (!mail.account()) return;
  mail.send({ subject, text: `${text}\n\nWhen: ${new Date().toISOString()}\nFrom the address: ${clientIp(req)}\n\nIf that was not you, sign in, change the admin password and use "Sign out everywhere".` })
    .catch((error) => console.warn(`[ALVIA] notice "${subject}" not sent — ${error.message}`));
}

// Signed in: the session, its cookie and whatever other cookies go with the answer.
function openSession(req, res, who, cookies) {
  const token = crypto.randomBytes(32).toString('hex');
  const life = who.remember ? LONG_SESSION : SHORT_SESSION;
  sessions.set(sessionKey(token), { username: who.username, expires: Date.now() + life * 1000, remember: who.remember });
  saveSessions();
  console.log(`[ALVIA] ${who.username} signed in from ${clientIp(req)}`);
  res.setHeader('Set-Cookie', [sessionCookie(req, token, who.remember ? life : null)].concat(cookies || []));
  sendJson(res, 200, { username: who.username });
}

async function login(req, res) {
  // Over plain http the password could be read on the way. Only this computer itself may.
  if (!isHttps(req) && !isLocal(req)) throw new HttpError(403, 'https');
  const ip = clientIp(req);
  // The lock on everybody does not shut out a browser that was confirmed with a code:
  // wrong passwords from all over the world cannot keep the owner out of the shop.
  if (loginLimit.blocked(ip) || (loginFlood.blocked('all') && !knownDevice(req))) throw new HttpError(429, 'rate');
  const body = await readBody(req);
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
  if (!auth.verify(clean(body.username, 100), password)) {
    loginLimit.hit(ip);
    loginFlood.hit('all');
    console.warn(`[ALVIA] wrong sign-in from ${ip}${loginLimit.blocked(ip) ? ' — locked out for 15 minutes' : ''}`);
    throw new HttpError(401, 'credentials');
  }
  loginLimit.reset(ip);
  const username = auth.readAdmin().username;
  // A login saved with an older, weaker hash setting is saved again with today's.
  if (auth.outdated()) auth.setAdmin(username, password);
  const who = { username, remember: body.remember === true };
  const account = mail.account();
  if (!account) return openSession(req, res, who);
  if (trusted(req)) return openSession(req, res, who, [trustDevice(req)]);

  // The password was right, but not from a browser and connection confirmed before.
  const { challenge, code } = openCode(req, 'login', who);
  let mailed = true;
  try {
    await mail.send({
      subject: 'ALVIA admin: your sign-in code',
      text: `Your code for signing in to the ALVIA admin area:\n\n    ${code}\n\nIt is good for 10 minutes.\n\nSomeone entered the right password from the address ${ip}, on a device or internet connection that has not been confirmed before. If that was you, type the code into the sign-in page.\n\nIf it was not you: do not pass this code on to anyone, and change the admin password — somebody knows it.`
    });
  } catch (error) {
    mailed = false;
    console.warn(`[ALVIA] The sign-in code could not be emailed — ${error.message}`);
    console.warn(`[ALVIA] sign-in code for ${username} from ${ip}: ${code}`);
  }
  console.log(`[ALVIA] ${username}: right password from ${ip}, not confirmed there before — waiting for the code`);
  return sendJson(res, 200, { step: 'code', challenge, to: masked(account.to), mailed });
}

// The second step: the code from the email. This browser is confirmed from now on.
async function loginCode(req, res) {
  if (!isHttps(req) && !isLocal(req)) throw new HttpError(403, 'https');
  const who = takeCode(req, 'login', await readBody(req));
  openSession(req, res, who, [trustDevice(req)]);
}

// `everywhere` signs out every browser, not only this one, and every browser has to
// confirm itself with a code again.
function logout(req, res, everywhere) {
  if (everywhere) sessions.clear();
  else sessions.delete(sessionKey(sessionToken(req) || ''));
  saveSessions();
  const cookies = [sessionCookie(req, '', 0)];
  if (everywhere) {
    forgetDevices();
    cookies.push(deviceCookie(req, '', 0));
  }
  res.setHeader('Set-Cookie', cookies);
  sendJson(res, 200, { ok: true });
}

/* Asked again before anything that guards the sign-in itself is changed: a browser left
   open is not enough. Counted like wrong sign-ins, so it is no way to guess the password. */
function confirmPassword(req, session, given) {
  const ip = clientIp(req);
  if (loginLimit.blocked(ip)) throw new HttpError(429, 'rate');
  if (!auth.verify(session.username, typeof given === 'string' ? given.slice(0, 200) : '')) {
    loginLimit.hit(ip);
    throw new HttpError(403, 'credentials');
  }
}

async function changePassword(req, res, session) {
  const body = await readBody(req);
  const next = typeof body.next === 'string' ? body.next : '';
  confirmPassword(req, session, body.current);
  if (next.length < auth.MIN_PASSWORD_LENGTH || next.length > 200) throw new HttpError(400, 'password-length');
  auth.setAdmin(session.username, next);
  // Every other signed-in browser is signed out and has to confirm itself again.
  const keep = sessionKey(sessionToken(req));
  sessions.forEach((_, key) => { if (key !== keep) sessions.delete(key); });
  saveSessions();
  forgetDevices(deviceToken(req) ? sessionKey(deviceToken(req)) : '');
  notice(req, 'ALVIA admin: the password was changed', 'The password of the ALVIA admin area was changed. Every other device has been signed out.');
  sendJson(res, 200, { ok: true });
}

/* Switching the sign-in code on: the mail account from the Account page. A test code is
   sent through it first, and only when that code comes back — so the mail really
   arrives — is the account kept. The app password is never sent back to the browser. */
async function connectMail(req, res, session) {
  if (mail.fromEnv()) throw new HttpError(409, 'mail-env');
  const body = await readBody(req);
  confirmPassword(req, session, body.current);
  // Google shows an app password in four groups; the spaces are not part of it.
  const account = mail.complete({ user: clean(body.user, 254), pass: clean(body.pass, 200).replace(/\s+/g, '') });
  if (!account) throw new HttpError(400, 'fields', { fields: ['user', 'pass'] });
  const { challenge, code } = openCode(req, 'mail', account);
  try {
    await mail.send({
      subject: 'ALVIA admin: test code',
      text: `Your code for switching on sign-in codes for the ALVIA admin area:\n\n    ${code}\n\nIt is good for 10 minutes. Type it into the Account page.`
    }, account);
  } catch (error) {
    codes.delete(sessionKey(challenge));
    console.warn(`[ALVIA] mail account not accepted — ${error.message}`);
    throw error.code === 'login' ? new HttpError(400, 'mail-login') : new HttpError(502, 'mail-unreachable');
  }
  sendJson(res, 200, { challenge, to: account.to });
}

async function confirmMail(req, res) {
  if (mail.fromEnv()) throw new HttpError(409, 'mail-env');
  const account = takeCode(req, 'mail', await readBody(req));
  mail.save(account);
  console.log(`[ALVIA] sign-in codes switched on: they go to ${account.to}`);
  // The browser that set it up has just proven it reads that mailbox.
  res.setHeader('Set-Cookie', trustDevice(req));
  sendJson(res, 200, { ok: true });
}

async function disconnectMail(req, res, session) {
  if (mail.fromEnv()) throw new HttpError(409, 'mail-env');
  const body = await readBody(req);
  confirmPassword(req, session, body.current);
  notice(req, 'ALVIA admin: sign-in codes were switched off', 'Sign-in codes by email were switched off. From now on the password alone signs in to the ALVIA admin area.');
  mail.remove();
  forgetDevices();
  console.log('[ALVIA] sign-in codes switched off: the password alone signs in');
  res.setHeader('Set-Cookie', deviceCookie(req, '', 0));
  sendJson(res, 200, { ok: true });
}

// What the backend may know about the mail account: never its password.
function mailState() {
  const account = mail.account();
  return { on: Boolean(account), to: account ? account.to : '', fromEnv: mail.fromEnv() };
}

/* =====================================================
   Visitor statistics
   How many people visit, and from which country. Only who presses "Accept" in the
   cookie banner (assets/js/consent.js) is counted, once per day. Two cookies:
     alvia_consent   yes · no — the answer, so the banner does not ask on every page
     alvia_visit     the day this browser was last counted. It is not a visitor
                     number: all it tells is "counted today already" and "was here
                     before".
   The country comes from the time zone the browser reports (zones.js). What is kept
   is one line per day: visitors, how many of them came for the first time, and
   visitors per country. No address, nothing about a single visitor.
   ===================================================== */
const CONSENT_COOKIE = 'alvia_consent';
const VISIT_COOKIE = 'alvia_visit';
const CONSENT_LIFE = 90 * 24 * 3600;   // seconds — three months, after that the banner asks again
const VISIT_LIFE = 365 * 24 * 3600;
const DAYS_KEPT = 400;
// A day begins at midnight in Switzerland, wherever the server stands.
const SWISS_DAY = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayOf = (date) => SWISS_DAY.format(date).split('/').reverse().join('-'); // 13/10/2026 → 2026-10-13

// Statistics are not worth stopping the server for: an unreadable file starts a new count.
let visits = {};
try { visits = (auth.readJson(VISITS_FILE) || {}).days || {}; } catch (_) {}
// Counted visits per address: nobody can pump the numbers up by throwing the cookie away.
const visitLimit = limiter(20, 60 * 60 * 1000);

const cookieOf = (req, name) => {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(req.headers.cookie || '');
  return match ? match[1] : '';
};
// Readable by the page's script (consent.js decides from them what to do), so not HttpOnly.
const visitorCookie = (req, name, value, maxAge) =>
  `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;

// Counts this browser for today unless it is counted already. Gives the cookie that says so.
function countVisit(req, zone) {
  const today = dayOf(new Date());
  const last = /^\d{4}-\d{2}-\d{2}$/.test(cookieOf(req, VISIT_COOKIE)) ? cookieOf(req, VISIT_COOKIE) : '';
  const ip = clientIp(req);
  // The owner looking at their own site is not a visitor.
  if (last !== today && !currentSession(req) && !visitLimit.blocked(ip)) {
    visitLimit.hit(ip);
    const day = visits[today] || { visitors: 0, first: 0, countries: {} };
    const country = zones.countryOf(zone);
    day.visitors += 1;
    if (!last) day.first += 1;
    day.countries[country] = (day.countries[country] || 0) + 1;
    visits[today] = day;
    Object.keys(visits).sort().slice(0, -DAYS_KEPT).forEach((old) => { delete visits[old]; });
    auth.writeJson(VISITS_FILE, { days: visits });
  }
  return visitorCookie(req, VISIT_COOKIE, today, VISIT_LIFE);
}

// The answer to the cookie banner. "No" also takes the visit cookie away again.
async function saveConsent(req, res) {
  const body = await readBody(req);
  if (body.choice !== 'yes' && body.choice !== 'no') throw new HttpError(400, 'fields', { fields: ['choice'] });
  const agreed = body.choice === 'yes';
  res.setHeader('Set-Cookie', [
    visitorCookie(req, CONSENT_COOKIE, body.choice, CONSENT_LIFE),
    agreed ? countVisit(req, clean(body.zone, 64)) : visitorCookie(req, VISIT_COOKIE, '', 0)
  ]);
  sendJson(res, 200, { ok: true });
}

// Asked by a page once a day, by a browser that has agreed. Without the "yes" nothing is counted.
async function visit(req, res) {
  if (cookieOf(req, CONSENT_COOKIE) !== 'yes') throw new HttpError(403, 'consent');
  const body = await readBody(req);
  res.setHeader('Set-Cookie', countVisit(req, clean(body.zone, 64)));
  sendJson(res, 200, { ok: true });
}

/* =====================================================
   Orders
   Stock is taken when an order is started and given back when it is cancelled —
   by the buyer, by the owner, or because it was not paid in time.
   ===================================================== */
const orderLimit = limiter(10, 60 * 60 * 1000);
/* Orders that hold pads without confirmed money (new or claimed), per address. "I have
   paid" costs nothing to say, so without this one visitor could park the whole stock
   in unpaid orders. Kept in memory only: after a restart the count starts again. */
const UNPAID_PER_ADDRESS = 4;
const startedFrom = new Map(); // order id → address it was started from
function unpaidFrom(ip) {
  let count = 0;
  startedFrom.forEach((address, id) => {
    const order = store.orders.find((entry) => entry.id === id);
    if (!order || (order.status !== 'new' && order.status !== 'claimed')) startedFrom.delete(id);
    else if (address === ip) count += 1;
  });
  return count;
}
const holdsStock = (status) => status !== 'cancelled';
/* What an order contains: one line per colourway. Orders from before the cart had a
   single colour and quantity instead of a list. */
const itemsOf = (order) => order.items || [{ colour: order.colour, quantity: order.quantity }];

async function createOrder(req, res) {
  const ip = clientIp(req);
  if (orderLimit.blocked(ip)) throw new HttpError(429, 'rate');
  const body = await readBody(req);

  // Hidden field that people never see and form-filling bots do fill in.
  if (clean(body.website, 200)) {
    sendJson(res, 201, { id: crypto.randomUUID(), token: crypto.randomBytes(24).toString('hex'), number: 'AL-0000', status: 'new', total: 0, currency: store.settings.currency, payBy: null, pay: { online: false, link: '', twint: '', qr: false } });
    return;
  }

  const settings = store.settings;
  if (!publicShop().open) throw new HttpError(409, 'closed');

  const customer = {
    name: clean(body.name, 100),
    email: clean(body.email, 254),
    street: clean(body.street, 120),
    zip: clean(body.zip, 10),
    city: clean(body.city, 80),
    country: clean(body.country || COUNTRIES[0], 2).toUpperCase(),
    note: clean(body.note, 500)
  };
  // The cart: at most one line per colourway, and no more pads in total than allowed.
  // A line that is not accepted refuses the whole order: nothing is left out silently.
  const wanted = Array.isArray(body.items) ? body.items.slice(0, COLOURS.length + 1) : [{ colour: body.colour, quantity: body.quantity }];
  const items = [];
  wanted.forEach((line) => {
    const fine = line && COLOURS.includes(line.colour) && wholeNumber(line.quantity, 1, settings.maxQuantity)
      && !items.some((item) => item.colour === line.colour);
    if (fine) items.push({ colour: line.colour, quantity: line.quantity });
  });
  const pads = items.reduce((total, item) => total + item.quantity, 0);
  const invalid = [];
  if (!items.length || items.length !== wanted.length || pads > settings.maxQuantity) invalid.push('items');
  if (customer.name.length < 2) invalid.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) invalid.push('email');
  if (customer.street.length < 3) invalid.push('street');
  if (!/^\d{4}$/.test(customer.zip)) invalid.push('zip');
  if (customer.city.length < 2) invalid.push('city');
  if (!COUNTRIES.includes(customer.country)) invalid.push('country');
  if (invalid.length) throw new HttpError(400, 'fields', { fields: invalid });

  if (items.some((item) => settings.stock[item.colour] < item.quantity)) throw new HttpError(409, 'stock');
  if (unpaidFrom(ip) >= UNPAID_PER_ADDRESS) throw new HttpError(429, 'rate');

  orderLimit.hit(ip);
  const now = new Date().toISOString();
  const token = crypto.randomBytes(24).toString('hex');
  const id = crypto.randomUUID();
  const number = `AL-${store.nextNumber++}`;
  const total = settings.price * pads + settings.shipping;
  const lang = LANGS.includes(body.lang) ? body.lang : 'en';

  /* Online payment: Payrexx makes the payment page for this order first. Only when that
     worked is the order kept and its pads taken — and since asking Payrexx takes a
     moment, the stock is looked at once more afterwards. */
  let gateway = null;
  if (payrexx.keys()) {
    const minutes = Math.max(1, Math.round(PAY_WINDOW / 60000));
    try {
      gateway = await payrexx.createGateway({
        number, total, currency: settings.currency, lang, minutes,
        // Where Payrexx sends the buyer afterwards. With the key to the order, so the
        // cart page finds it even if the TWINT app comes back in another browser.
        back: `${siteAddress(req)}/cart.html?order=${id}&key=${token}`
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error(`[ALVIA] order ${number}: no payment page — ${error.message}`);
      throw new HttpError(502, 'payment');
    }
    const gone = !publicShop().open || items.some((item) => store.settings.stock[item.colour] < item.quantity);
    if (gone) {
      payrexx.closeGateway(gateway.id).catch(() => {});
      throw new HttpError(409, publicShop().open ? 'stock' : 'closed');
    }
    gateway.until = new Date(Date.now() + PAY_WINDOW).toISOString();
  }

  const order = {
    id,
    number,
    createdAt: now,
    status: 'new',
    history: [{ at: now, status: 'new' }],
    items,
    quantity: pads,  // all pads of the order together
    unitPrice: settings.price,
    shipping: settings.shipping,
    total,
    currency: settings.currency,
    lang,
    tracking: '',    // parcel number, typed in the dashboard
    adminNote: '',   // internal note, never shown to the buyer
    customer,
    payKey: sessionKey(token),  // hash of the buyer's key to this order (see buyerOrder)
    payBy: new Date(Date.now() + PAY_WINDOW).toISOString()
  };
  // { id, link, until } of the Payrexx payment page; later also closed: true (see below).
  if (gateway) order.gateway = gateway;
  store.orders.push(order);
  startedFrom.set(order.id, ip);
  items.forEach((item) => moveStock(item.colour, -item.quantity, 'order', order.number));
  save();
  console.log(`[ALVIA] order ${order.number} started, waiting for payment`);
  sendJson(res, 201, Object.assign({ id: order.id, token }, buyerView(order)));
}

/* The buyer's side of an order, after it was started. The browser that started it
   holds a random key; only a hash of it is kept here. Without the key an order cannot
   be seen, confirmed or cancelled from the website. */
function buyerOrder(id, token) {
  const order = store.orders.find((entry) => entry.id === id);
  const key = typeof token === 'string' && /^[a-f0-9]{48}$/.test(token) ? sessionKey(token) : '';
  if (!order || !order.payKey || !key || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(order.payKey))) {
    throw new HttpError(404, 'not-found');
  }
  return order;
}

/* What the payment step and the thank-you may know. An order paid online gets the link
   to its payment page while it can still be paid; a manual one the TWINT number, which
   is only given here. `refund`: the money came in after the order was cancelled and its
   pads were gone — the owner pays it back. */
const buyerView = (order) => ({
  number: order.number,
  status: order.status,
  expired: Boolean(order.expired),
  refund: Boolean(order.refund),
  total: order.total,
  currency: order.currency,
  payBy: order.status === 'new' ? (order.payBy || null) : null,
  pay: order.gateway
    ? { online: true, link: order.status === 'new' && !order.gateway.closed ? order.gateway.link : '' }
    : { online: false, twint: store.settings.payment.twint, qr: Boolean(store.settings.payment.qr) }
});

const stamp = (order, status, note) => {
  order.status = status;
  order.history = (order.history || []).concat(Object.assign({ at: new Date().toISOString(), status }, note ? { note } : {}));
};

/* Started orders that were not paid in time are cancelled and their pads freed. Runs
   before every API request and on a timer, so stock is never held by an abandoned cart.
   Orders paid online are not touched here: Payrexx is asked first (see settle). */
function expireOrders() {
  const now = Date.now();
  const late = store.orders.filter((order) => !order.gateway && order.status === 'new' && order.payBy && Date.parse(order.payBy) <= now);
  if (!late.length) return;
  late.forEach((order) => {
    itemsOf(order).forEach((item) => moveStock(item.colour, item.quantity, 'expired', order.number));
    stamp(order, 'cancelled', 'expired');
    order.expired = true;
    console.log(`[ALVIA] order ${order.number} not paid in time, cancelled`);
  });
  save();
}

// The address of this site as the visitor typed it, for the way back from Payrexx.
function siteAddress(req) {
  const host = String(req.headers.host || '');
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) throw new HttpError(400, 'bad-address');
  return `${isHttps(req) ? 'https' : 'http'}://${host}`;
}

/* =====================================================
   Online payment (Payrexx)
   An order paid online becomes "paid" in exactly one place: markPaid, after Payrexx
   has said the money is there. Payrexx is asked
     · whenever the buyer's page asks where the order stands,
     · when Payrexx knocks (the webhook — it only says "look again", nothing in it is believed),
     · by the server's own clock, so it also works if the buyer closes the page.
   An order's payment page ("gateway") is open until it is paid or closed. While it is
   open it could still be paid, so it is kept an eye on — also after the order was
   cancelled, until closing it has worked.
   ===================================================== */
const watched = (order) => Boolean(order.gateway) && !order.gateway.closed && (order.status === 'new' || order.status === 'cancelled');
const lastAsked = new Map(); // order id → when Payrexx was last asked about it
const asking = new Map();    // order id → the question that is on its way
const enoughStock = (order) => itemsOf(order).every((item) => (store.settings.stock[item.colour] || 0) >= item.quantity);

function markPaid(order) {
  order.gateway.closed = true; // paid: nothing more to ask
  if (order.status === 'cancelled') {
    // The money came after the order was cancelled: take the pads again if they are still there.
    if (!enoughStock(order)) {
      order.refund = true;
      save();
      console.warn(`[ALVIA] order ${order.number}: paid after it was cancelled and its pads are gone — refund it in Payrexx`);
      return;
    }
    itemsOf(order).forEach((item) => moveStock(item.colour, -item.quantity, 'reopened', order.number));
  }
  stamp(order, 'paid', 'payrexx');
  delete order.payBy;
  order.expired = false;
  save();
  console.log(`[ALVIA] order ${order.number}: TWINT payment arrived — ready to ship`);
}

// Gives an unpaid order's pads back. `note`: buyer · expired, as in the history.
function cancelUnpaid(order, note) {
  itemsOf(order).forEach((item) => moveStock(item.colour, item.quantity, note === 'expired' ? 'expired' : 'cancelled', order.number));
  stamp(order, 'cancelled', note);
  order.expired = note === 'expired';
  save();
}

/* Closes an order's payment page so it cannot be paid any more. If Payrexx cannot be
   reached the page stays "open" and the clock tries again — until the page has run out
   on Payrexx's side anyway. */
async function closeGateway(order) {
  if (!order.gateway || order.gateway.closed) return;
  try {
    await payrexx.closeGateway(order.gateway.id);
    order.gateway.closed = true;
  } catch (error) {
    const over = Date.parse(order.gateway.until || 0) + 10 * 60 * 1000 <= Date.now();
    if (over || error.code === 'keys') order.gateway.closed = true;
    else console.error(`[ALVIA] order ${order.number}: payment page not closed yet — ${error.message}`);
  }
  if (order.gateway.closed) save();
}

// Asks Payrexx about one order and does what follows from the answer.
async function settle(order) {
  const paid = await payrexx.isPaid(order); // no answer → throws, and nothing changes
  if (!watched(order)) return;              // the owner has decided in the meantime
  if (paid) { markPaid(order); return; }
  const late = order.status === 'new' && order.payBy && Date.parse(order.payBy) + PAY_GRACE <= Date.now();
  if (late) {
    cancelUnpaid(order, 'expired');
    console.log(`[ALVIA] order ${order.number} not paid in time, cancelled`);
  }
  if (order.status === 'cancelled') await closeGateway(order);
}

// settle(), but not more often than every `gap` ms per order and never twice at once.
function syncPayment(order, gap) {
  if (!watched(order)) return Promise.resolve();
  if (asking.has(order.id)) return asking.get(order.id);
  if (Date.now() - (lastAsked.get(order.id) || 0) < gap) return Promise.resolve();
  lastAsked.set(order.id, Date.now());
  const run = settle(order)
    .catch((error) => console.error(`[ALVIA] order ${order.number}: Payrexx could not be asked — ${error.message}`))
    .finally(() => asking.delete(order.id));
  asking.set(order.id, run);
  return run;
}

// All orders whose payment page is still open, the oldest first.
let sweeping = false;
async function sweep(gap) {
  if (sweeping) return;
  sweeping = true;
  try {
    const open = store.orders.filter(watched);
    lastAsked.forEach((_, id) => { if (!open.some((order) => order.id === id)) lastAsked.delete(id); });
    for (const order of open.slice(0, SWEEP_MOST)) await syncPayment(order, gap);
  } finally {
    sweeping = false;
  }
}

/* Payrexx calls this address when a payment changes (set up in Payrexx → Webhooks).
   What it sends is not read: the call only means "ask now". So nobody can fake a
   payment by calling it, and it does not matter in which format Payrexx sends. */
const knockLimit = limiter(120, 60 * 1000);
function webhook(req, res) {
  let size = 0;
  req.on('data', (chunk) => { size += chunk.length; if (size > 1024 * 1024) req.destroy(); });
  req.on('error', () => {});
  sendJson(res, 200, { ok: true });
  const ip = clientIp(req);
  if (knockLimit.blocked(ip)) return;
  knockLimit.hit(ip);
  sweep(ASK_GAP).catch((error) => console.error('[ALVIA]', error));
}

/* The three things a buyer can do with a started order:
     status → where it stands (the payment step and the thank-you ask this)
     paid   → "I have paid": the order now waits for the owner to check TWINT
              (manual payment only — online, only Payrexx can say so)
     cancel → changed their mind before paying: the pads go back in stock */
async function buyerAction(req, res, id, action) {
  const body = await readBody(req);
  const order = buyerOrder(id, body.token);
  const items = itemsOf(order);

  if (order.gateway) {
    if (action === 'cancel' && order.status === 'new') {
      await syncPayment(order, 0); // paid a moment ago? then it is an order, not a cancellation
      if (order.status === 'new') {
        cancelUnpaid(order, 'buyer');
        await closeGateway(order);
      }
    } else if (action === 'cancel' && order.status !== 'cancelled') {
      throw new HttpError(409, 'too-late');
    } else {
      await syncPayment(order, ASK_GAP);
    }
    sendJson(res, 200, buyerView(order));
    return;
  }

  if (action === 'paid') {
    if (order.status === 'new') {
      stamp(order, 'claimed', 'buyer');
      console.log(`[ALVIA] order ${order.number}: buyer says paid — check TWINT`);
    } else if (order.status === 'cancelled' && order.expired) {
      // Paid just after the time ran out: take the pads again if they are still there.
      if (items.some((item) => (store.settings.stock[item.colour] || 0) < item.quantity)) throw new HttpError(409, 'expired');
      items.forEach((item) => moveStock(item.colour, -item.quantity, 'reopened', order.number));
      stamp(order, 'claimed', 'buyer');
      order.expired = false;
    } else if (order.status === 'cancelled') {
      throw new HttpError(409, 'cancelled');
    }
    save();
  }
  if (action === 'cancel') {
    if (order.status === 'new') {
      items.forEach((item) => moveStock(item.colour, item.quantity, 'cancelled', order.number));
      stamp(order, 'cancelled', 'buyer');
      save();
    } else if (order.status !== 'cancelled') {
      throw new HttpError(409, 'too-late');
    }
  }
  sendJson(res, 200, buyerView(order));
}

// The owner's TWINT QR code, for someone on the payment step of their order.
function sendQr(res) {
  const name = store.settings.payment.qr;
  const file = name ? path.join(auth.DATA_DIR, name) : '';
  const type = Object.keys(QR_TYPES).find((entry) => name.endsWith(`.${QR_TYPES[entry]}`));
  if (!file || !type || !fs.existsSync(file)) throw new HttpError(404, 'not-found');
  const data = fs.readFileSync(file);
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length });
  res.end(data);
}


function findOrder(id) {
  const order = store.orders.find((entry) => entry.id === id);
  if (!order) throw new HttpError(404, 'not-found');
  return order;
}

// Status, parcel number and internal note; each is only touched when it is sent.
async function updateOrder(req, res, session, id) {
  const order = findOrder(id);
  const body = await readBody(req);
  const invalid = [];
  if (body.status !== undefined && !STATUSES.includes(body.status)) invalid.push('status');
  if (body.tracking !== undefined && typeof body.tracking !== 'string') invalid.push('tracking');
  if (body.adminNote !== undefined && typeof body.adminNote !== 'string') invalid.push('adminNote');
  if (invalid.length) throw new HttpError(400, 'fields', { fields: invalid });

  if (body.status !== undefined && body.status !== order.status) {
    // An order waiting for its online payment: has the money come in this very moment?
    if (watched(order) && order.status === 'new') {
      await syncPayment(order, 0);
      if (order.status !== 'new') throw new HttpError(409, 'changed');
    }
    const items = itemsOf(order);
    if (holdsStock(order.status) && !holdsStock(body.status)) {
      items.forEach((item) => moveStock(item.colour, item.quantity, 'cancelled', order.number, session.username));
    }
    if (!holdsStock(order.status) && holdsStock(body.status)) {
      if (items.some((item) => (store.settings.stock[item.colour] || 0) < item.quantity)) throw new HttpError(409, 'stock');
      items.forEach((item) => moveStock(item.colour, -item.quantity, 'reopened', order.number, session.username));
    }
    stamp(order, body.status);
    // From here the owner decides: no more waiting for the clock, and the payment page
    // of an order paid online is closed, so it cannot be paid behind the owner's back.
    delete order.payBy;
    order.expired = false;
    await closeGateway(order);
  }
  if (body.tracking !== undefined) order.tracking = clean(body.tracking, 60);
  if (body.adminNote !== undefined) order.adminNote = clean(body.adminNote, 1000);
  save();
  sendJson(res, 200, { ok: true });
}

// Deleting an order that was never shipped or cancelled frees its pads again.
async function deleteOrder(res, session, id) {
  const order = findOrder(id);
  await closeGateway(order); // a deleted order must not be payable any more
  if (!store.orders.includes(order)) throw new HttpError(404, 'not-found');
  if (['new', 'claimed', 'paid'].includes(order.status)) {
    itemsOf(order).forEach((item) => moveStock(item.colour, item.quantity, 'deleted', order.number, session.username));
  }
  store.orders.splice(store.orders.indexOf(order), 1);
  save();
  sendJson(res, 200, { ok: true });
}

/* =====================================================
   Inventory and settings
   ===================================================== */
/* Stock changes made by hand:
     delivery → pads arrived (+quantity)
     damaged  → pads lost or unsellable (−quantity)
     count    → the shelf was counted: set the stock to `quantity` */
async function adjustStock(req, res, session) {
  const body = await readBody(req);
  const invalid = [];
  if (!COLOURS.includes(body.colour)) invalid.push('colour');
  if (!ADJUSTMENTS.includes(body.type)) invalid.push('type');
  if (!wholeNumber(body.quantity, body.type === 'count' ? 0 : 1, 100000)) invalid.push('quantity');
  if (invalid.length) throw new HttpError(400, 'fields', { fields: invalid });

  const current = store.settings.stock[body.colour];
  let change = body.quantity - current;
  if (body.type === 'delivery') change = body.quantity;
  if (body.type === 'damaged') change = -body.quantity;
  if (change === 0) throw new HttpError(400, 'no-change');
  if (current + change < 0) throw new HttpError(409, 'stock');
  if (current + change > 100000) throw new HttpError(400, 'fields', { fields: ['quantity'] });

  moveStock(body.colour, change, body.type === 'count' ? 'correction' : body.type, clean(body.note, 200), session.username);
  save();
  sendJson(res, 200, { ok: true });
}

// Only the settings that are sent are changed. Stock is not a setting: see adjustStock.
async function updateSettings(req, res) {
  const body = await readBody(req);
  const next = Object.assign({}, store.settings);
  const invalid = [];
  const take = (key, valid) => {
    if (body[key] === undefined) return;
    if (valid(body[key])) next[key] = body[key];
    else invalid.push(key);
  };
  take('selling', (value) => typeof value === 'boolean');
  take('open', (value) => typeof value === 'boolean');
  take('statistics', (value) => typeof value === 'boolean');
  take('price', (value) => wholeNumber(value, 0, 1000000));
  take('shipping', (value) => wholeNumber(value, 0, 100000));
  take('maxQuantity', (value) => wholeNumber(value, 1, 50));
  take('lowStock', (value) => wholeNumber(value, 0, 1000));
  if (body.payment !== undefined) {
    const payment = body.payment;
    if (!payment || typeof payment !== 'object') invalid.push('payment');
    else next.payment = Object.assign({}, next.payment, { holder: clean(payment.holder, 100), iban: clean(payment.iban, 42), twint: clean(payment.twint, 40) });
  }
  if (invalid.length) throw new HttpError(400, 'fields', { fields: invalid });
  // Taking the shop off the website closes it as well; while it is off it cannot open.
  if (body.selling === false) next.open = false;
  if (next.open && !next.selling) throw new HttpError(400, 'selling-off');
  if (next.open && next.price === 0) throw new HttpError(400, 'price-missing');
  if (next.open && !next.payment.twint && !payrexx.keys()) throw new HttpError(400, 'twint-missing');

  if (next.selling !== store.settings.selling || next.statistics !== store.settings.statistics) pagesChanged = new Date();
  store.settings = next;
  save();
  sendJson(res, 200, { ok: true });
}

/* Connecting the Payrexx account: instance name and API key from the Shop page. They
   are tried out at Payrexx before they are kept, and the key is never sent back to
   the browser. From then on every new order is paid online. */
async function connectPayrexx(req, res) {
  if (payrexx.fromEnv()) throw new HttpError(409, 'payrexx-env');
  const body = await readBody(req);
  // "alvia", "alvia.payrexx.com" or the whole address of the Payrexx page all work.
  const instance = clean(body.instance, 120).toLowerCase().replace(/^https?:\/\//, '').replace(/\.payrexx\.com.*$/, '');
  const secret = clean(body.secret, 200);
  const invalid = [];
  if (!payrexx.INSTANCE.test(instance)) invalid.push('instance');
  if (secret.length < 8) invalid.push('secret');
  if (invalid.length) throw new HttpError(400, 'fields', { fields: invalid });
  try {
    await payrexx.check(instance, secret);
  } catch (error) {
    console.warn(`[ALVIA] Payrexx keys not accepted — ${error.message}`);
    throw error.code === 'unreachable' ? new HttpError(502, 'payrexx-unreachable') : new HttpError(400, 'payrexx-keys');
  }
  payrexx.saveKeys(instance, secret);
  console.log(`[ALVIA] Payrexx connected (${instance}): orders are paid online from now on`);
  // Where the money goes has changed: the owner hears of it.
  notice(req, 'ALVIA admin: a Payrexx account was connected', `The shop now takes its TWINT payments through the Payrexx account "${instance}".`);
  sendJson(res, 200, { ok: true });
}

function disconnectPayrexx(req, res) {
  if (payrexx.fromEnv()) throw new HttpError(409, 'payrexx-env');
  payrexx.removeKeys();
  console.log('[ALVIA] Payrexx disconnected: orders are paid by hand again');
  notice(req, 'ALVIA admin: Payrexx was disconnected', 'The Payrexx account was disconnected. Buyers pay to the TWINT number in the shop settings again.');
  sendJson(res, 200, { ok: true });
}

// What the backend may know about the connection: never the key itself.
function payrexxState() {
  const keys = payrexx.keys();
  return { connected: Boolean(keys), instance: keys ? keys.instance : '', fromEnv: payrexx.fromEnv() };
}

/* The TWINT QR code for the payment step: a picture the owner saves from the TWINT app
   and uploads on the Shop page. It arrives as base64 in JSON and is kept in the data
   folder. Only real PNG, JPEG or WebP pictures are taken. */
async function saveQr(req, res) {
  const body = await readBody(req, Math.ceil(QR_LIMIT * 1.4) + 1024);
  const extension = QR_TYPES[body.type];
  const data = typeof body.data === 'string' && /^[A-Za-z0-9+/=]+$/.test(body.data) ? Buffer.from(body.data, 'base64') : null;
  const looks = data && {
    png: data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    jpg: data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
    webp: data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP'
  }[extension];
  if (!extension || !looks) throw new HttpError(400, 'picture');
  if (data.length > QR_LIMIT) throw new HttpError(413, 'too-large');
  removeQrFile();
  const name = `twint-qr.${extension}`;
  fs.mkdirSync(auth.DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(auth.DATA_DIR, name), data);
  store.settings.payment.qr = name;
  save();
  sendJson(res, 200, { ok: true });
}

function removeQrFile() {
  Object.values(QR_TYPES).forEach((extension) => fs.rmSync(path.join(auth.DATA_DIR, `twint-qr.${extension}`), { force: true }));
}

function deleteQr(res) {
  removeQrFile();
  store.settings.payment.qr = '';
  save();
  sendJson(res, 200, { ok: true });
}

// Everything the shop knows, as one file to keep somewhere safe. The login is not in it.
function backup(res) {
  const text = JSON.stringify(store, null, 2);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="alvia-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    'Content-Length': Buffer.byteLength(text)
  });
  res.end(text);
}

/* =====================================================
   API routes
   ===================================================== */
async function api(req, res, pathname) {
  res.setHeader('Cache-Control', 'no-store');
  // An answer of the API is data, never a page: nothing in it may run or load anything.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  expireOrders();
  const route = `${req.method} ${pathname}`;
  if (req.method !== 'GET' || pathname.startsWith('/api/admin/')) checkOrigin(req);

  if (route === 'GET /api/shop') return sendJson(res, 200, publicShop());
  if (route === 'POST /api/orders') return createOrder(req, res);
  const mine = /^\/api\/orders\/([a-f0-9-]{36})\/(status|paid|cancel)$/.exec(pathname);
  if (mine && req.method === 'POST') return buyerAction(req, res, mine[1], mine[2]);
  if (route === 'GET /api/twint-qr') {
    // For the buyer of a started order (id and key in the address), or the signed-in owner.
    const query = new URL(req.url, 'http://localhost').searchParams;
    if (!currentSession(req)) buyerOrder(query.get('order') || '', query.get('token') || '');
    return sendQr(res);
  }
  if (route === 'POST /api/payrexx/webhook') return webhook(req, res);
  if (store.settings.statistics && route === 'POST /api/consent') return saveConsent(req, res);
  if (store.settings.statistics && route === 'POST /api/visit') return visit(req, res);
  if (route === 'POST /api/admin/login') return login(req, res);
  if (route === 'POST /api/admin/login/code') return loginCode(req, res);
  // Asked by every page for the sign-in button in the header: never an error.
  if (route === 'GET /api/session') {
    const visitor = currentSession(req);
    return sendJson(res, 200, visitor ? { signedIn: true, username: visitor.username } : { signedIn: false });
  }

  if (!pathname.startsWith('/api/admin/')) throw new HttpError(404, 'not-found');
  const session = currentSession(req);
  if (!session) throw new HttpError(401, 'signed-out');

  if (route === 'POST /api/admin/logout') return logout(req, res, false);
  if (route === 'POST /api/admin/logout-all') return logout(req, res, true);
  if (route === 'POST /api/admin/password') return changePassword(req, res, session);
  if (route === 'PUT /api/admin/mail') return connectMail(req, res, session);
  if (route === 'POST /api/admin/mail/confirm') return confirmMail(req, res);
  if (route === 'POST /api/admin/mail/off') return disconnectMail(req, res, session);
  if (route === 'GET /api/admin/data') {
    return sendJson(res, 200, {
      settings: store.settings,
      orders: store.orders.map((order) => Object.assign({}, order, { payKey: undefined })),
      movements: store.movements.slice(-MOVEMENTS_SHOWN).reverse(), // newest first
      visits: { today: dayOf(new Date()), days: visits },
      payrexx: payrexxState(),
      mail: mailState()
    });
  }
  if (route === 'PUT /api/admin/payrexx') return connectPayrexx(req, res);
  if (route === 'DELETE /api/admin/payrexx') return disconnectPayrexx(req, res);
  if (route === 'GET /api/admin/backup') return backup(res);
  if (route === 'PUT /api/admin/settings') return updateSettings(req, res);
  if (route === 'POST /api/admin/inventory') return adjustStock(req, res, session);
  if (route === 'PUT /api/admin/twint-qr') return saveQr(req, res);
  if (route === 'DELETE /api/admin/twint-qr') return deleteQr(res);

  const order = /^\/api\/admin\/orders\/([a-f0-9-]{36})$/.exec(pathname);
  if (order && req.method === 'PATCH') return updateOrder(req, res, session, order[1]);
  if (order && req.method === 'DELETE') return deleteOrder(res, session, order[1]);

  throw new HttpError(404, 'not-found');
}

/* =====================================================
   Website files
   Only web file types are served, and never anything from server/ — so the data
   folder, this code, backups and notes stay private whatever the address says.
   ===================================================== */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};
const PRIVATE_FOLDERS = ['server', 'node_modules'];

/* Before launch ("Shop on the website" is off in the backend) the shop's own pages do
   not exist: they are answered with "not found". Once it is on, every page is told so
   in its <html> tag — the stylesheet (shop.css) and script.js show the shop's parts
   and the launch wording from that mark. A host that only serves files never sets it.
   The same way a page learns that visitors are counted here: only then does it show
   the cookie banner (consent.js) and the cookie part of the privacy policy. */
const SHOP_PAGES = ['/cart.html', '/terms.html', '/shipping-returns.html'];
const SELLING_MARK = 'is-selling';
const COUNTING_MARK = 'is-counting';
// Pages read differently after a switch: a copy a browser kept from before is out of date.
let pagesChanged = new Date();

/* What a page may load and where it may send things (Content-Security-Policy). If a
   mistake ever let foreign text onto a page as HTML, this keeps it from running as a
   script or sending the sign-in form somewhere else.
   The website: its own files, the Inter font from rsms.me, the application form's
   service, and the one line of script every page carries in its <head> (by fingerprint).
   The backend: its own files only. */
const HEAD_SCRIPT = "document.documentElement.classList.remove('no-js');";
const SITE_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${crypto.createHash('sha256').update(HEAD_SCRIPT).digest('base64')}'`,
  "style-src 'self' 'unsafe-inline' https://rsms.me",
  "font-src 'self' https://rsms.me",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://formsubmit.co",
  "form-action 'self' https://formsubmit.co",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'"
].join('; ');
const ADMIN_POLICY = "default-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

function staticFile(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const unsafe = segments.some((segment) => /^\.|[\\:\0]|[. ]$/.test(segment));
  if (unsafe || PRIVATE_FOLDERS.includes((segments[0] || '').toLowerCase())) return null;
  let file = path.join(ROOT, ...segments);
  let stats = fs.statSync(file, { throwIfNoEntry: false });
  if (stats && stats.isDirectory()) {
    // Built from the folder names, so an address like //name can never send a visitor to another site.
    if (!pathname.endsWith('/')) return { redirect: `/${segments.map(encodeURIComponent).join('/')}/` };
    file = path.join(file, 'index.html');
    stats = fs.statSync(file, { throwIfNoEntry: false });
  }
  const type = TYPES[path.extname(file).toLowerCase()];
  return stats && stats.isFile() && type ? { file, type, size: stats.size, modified: stats.mtime } : null;
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'method');
  const selling = store.settings.selling;
  let found = !selling && SHOP_PAGES.includes(pathname.toLowerCase()) ? null : staticFile(pathname);
  if (found && found.redirect) {
    res.writeHead(301, { Location: found.redirect });
    res.end();
    return;
  }
  let status = 200;
  if (!found) {
    status = 404;
    found = staticFile('/404.html');
    if (!found) throw new HttpError(404, 'not-found');
  }
  const admin = pathname.startsWith('/admin/');
  // Pages, styles and scripts are checked with the server on every visit, so a change
  // shows at once; pictures may be kept for an hour.
  const text = /^(text|application)\//.test(found.type);
  // A page of the website is as new as the last switch in the backend that changes it.
  const page = !admin && found.type === TYPES['.html'];
  const marks = page ? [selling && SELLING_MARK, store.settings.statistics && COUNTING_MARK].filter(Boolean) : [];
  const modified = page && pagesChanged > found.modified ? pagesChanged : found.modified;
  const headers = {
    'Content-Type': found.type,
    'Cache-Control': admin ? 'no-store' : (text ? 'no-cache' : 'public, max-age=3600'),
    'Last-Modified': modified.toUTCString()
  };
  headers['Content-Security-Policy'] = admin ? ADMIN_POLICY : SITE_POLICY;
  if (admin) headers['X-Robots-Tag'] = 'noindex, nofollow';
  // The browser's copy is still the current one: nothing to send again.
  const since = Date.parse(req.headers['if-modified-since'] || '');
  if (status === 200 && !admin && since >= Math.floor(modified.getTime() / 1000) * 1000) {
    res.writeHead(304, headers);
    res.end();
    return;
  }
  if (marks.length) {
    const html = Buffer.from(fs.readFileSync(found.file, 'utf8').replace(/<html\b[^>]*\bclass="/, `$&${marks.join(' ')} `));
    headers['Content-Length'] = html.length;
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : html);
    return;
  }
  headers['Content-Length'] = found.size;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') { res.end(); return; }
  // A file that vanishes or cannot be read mid-way ends this answer, not the server.
  fs.createReadStream(found.file).on('error', () => res.destroy()).pipe(res);
}

/* =====================================================
   Start
   ===================================================== */
async function handle(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Behind a proxy that says the visitor came over plain http: send them to https.
  if (forwardedProto(req) === 'http' && req.headers.host) {
    res.writeHead(308, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
    return;
  }
  // Once seen over https, the browser uses https for this site for the next half year.
  if (isHttps(req)) res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (_) {
    throw new HttpError(400, 'bad-address');
  }
  if (pathname.startsWith('/api/')) await api(req, res, pathname);
  else serveStatic(req, res, pathname);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    if (!(error instanceof HttpError)) console.error('[ALVIA]', error);
    if (res.headersSent) { res.end(); return; }
    if (error instanceof HttpError) sendJson(res, error.status, Object.assign({ error: error.code }, error.extra));
    else sendJson(res, 500, { error: 'server' });
  });
});

// A connection that sends its request too slowly is dropped, so a few of them cannot
// keep the server busy.
server.headersTimeout = 15 * 1000;
server.requestTimeout = 30 * 1000;

// The server's own clock: unpaid orders run out, and Payrexx is asked about open payments.
const tick = () => {
  expireOrders();
  sweep(SWEEP_GAP).catch((error) => console.error('[ALVIA]', error));
};
tick();
setInterval(tick, 20 * 1000).unref();

server.listen(PORT, HOST, () => {
  console.log(`[ALVIA] site:  http://localhost:${PORT}/`);
  console.log(`[ALVIA] admin: http://localhost:${PORT}/admin/`);
  if (!auth.readAdmin()) {
    console.warn('[ALVIA] No admin login yet. Create one: node server/set-password.js <login name> <password>');
  } else if (!mail.account()) {
    console.warn('[ALVIA] Sign-in codes by email are off: the password alone signs in. Switch them on in the backend → Account.');
  }
});
