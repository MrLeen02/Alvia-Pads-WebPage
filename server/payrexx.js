/* =====================================================
   ALVIA — Payrexx (automatic TWINT payments)
   Payrexx is the payment provider: for every order it makes a payment page that
   shows the TWINT QR code for exactly that amount, and it knows when the money has
   arrived. This file is the few calls the shop needs: make such a page ("gateway"),
   ask whether it is paid, and close it again.

   The keys (instance name and API key of the Payrexx account) are kept in
   server/data/payrexx.json — typed in on the Shop page of the admin backend — or
   come from the environment, which wins:
     PAYREXX_INSTANCE     the name in front of .payrexx.com
     PAYREXX_API_SECRET   the API key from Payrexx → Integrations → API
     ALVIA_PAYREXX_API    another address for the API (only for testing)
   ===================================================== */
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const auth = require('./auth');

const KEYS_FILE = path.join(auth.DATA_DIR, 'payrexx.json');
const API = (process.env.ALVIA_PAYREXX_API || 'https://api.payrexx.com/v1.0').replace(/\/+$/, '');
const TIMEOUT = 10 * 1000;
const INSTANCE = /^[a-z0-9][a-z0-9-]{0,62}$/;

const fromEnv = () => Boolean(process.env.PAYREXX_INSTANCE && process.env.PAYREXX_API_SECRET);

// The keys in use, or null while no Payrexx account is connected. Read from the file
// once and then remembered: the shop asks on every visit whether it can take payments.
let remembered;
function keys() {
  if (fromEnv()) return { instance: process.env.PAYREXX_INSTANCE.toLowerCase(), secret: process.env.PAYREXX_API_SECRET };
  if (remembered === undefined) {
    let saved = null;
    try { saved = auth.readJson(KEYS_FILE); } catch (_) {} // unreadable → not connected
    remembered = saved && INSTANCE.test(saved.instance) && typeof saved.secret === 'string' && saved.secret ? saved : null;
  }
  return remembered;
}

function saveKeys(instance, secret) {
  auth.writeJson(KEYS_FILE, { instance, secret });
  remembered = { instance, secret };
}

function removeKeys() {
  fs.rmSync(KEYS_FILE, { force: true });
  remembered = null;
}

/* One call to Payrexx. Throws an Error with .code:
     'keys'         Payrexx does not accept the instance name or API key
     'missing'      what was asked for does not exist (any more)
     'unreachable'  no answer, or one that makes no sense */
async function call(method, resource, body, using) {
  const { instance, secret } = using || keys() || {};
  const fail = (code, detail) => Object.assign(new Error(`payrexx: ${detail || code}`), { code });
  if (!instance || !secret) throw fail('keys', 'not connected');
  let response;
  let reply = null;
  try {
    response = await fetch(`${API}/${resource}/?instance=${encodeURIComponent(instance)}`, {
      method,
      headers: Object.assign({ 'X-API-KEY': secret, Accept: 'application/json' }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT)
    });
    reply = await response.json().catch(() => null);
  } catch (error) {
    throw fail('unreachable', error.message);
  }
  if (response.ok && reply && reply.status === 'success') return Array.isArray(reply.data) ? reply.data[0] : reply.data;
  const detail = `HTTP ${response.status}${reply && reply.message ? ` — ${reply.message}` : ''}`;
  if (response.status === 401 || response.status === 403) throw fail('keys', detail);
  if (response.status === 404) throw fail('missing', detail);
  // Payrexx answers a wrong key with an error text rather than a status of its own.
  if (reply && /api secret|signature|instance/i.test(String(reply.message))) throw fail('keys', detail);
  throw fail('unreachable', detail);
}

// Are these the keys of a real account? Throws like call().
const check = (instance, secret) => call('GET', 'SignatureCheck', null, { instance, secret });

/* A payment page for one order: TWINT only, exactly the order's total, open for
   `minutes`. Returns { id, link }; the buyer is sent to the link. */
async function createGateway({ number, total, currency, lang, minutes, back }) {
  const gateway = await call('POST', 'Gateway', {
    amount: total,                // Rappen
    currency,
    pm: ['twint'],
    purpose: `ALVIA ${number}`,
    referenceId: number,
    language: lang,
    validity: minutes,
    skipResultPage: true,         // straight back to the shop after paying
    successRedirectUrl: back,
    failedRedirectUrl: back,
    cancelRedirectUrl: back
  });
  // The buyer is sent to this link: nothing but a secure address is passed on.
  const linkFine = gateway && (/^https:\/\//.test(String(gateway.link)) || Boolean(process.env.ALVIA_PAYREXX_API));
  if (!gateway || !gateway.id || !linkFine) {
    throw Object.assign(new Error('payrexx: gateway without id or link'), { code: 'unreachable' });
  }
  return { id: gateway.id, link: String(gateway.link) };
}

/* Has this order's payment page been paid? True only if Payrexx says the payment is
   confirmed, for this order number and at least the order's amount in its currency. */
async function isPaid(order) {
  let gateway;
  try {
    gateway = await call('GET', `Gateway/${encodeURIComponent(order.gateway.id)}`);
  } catch (error) {
    if (error.code === 'missing') return false; // closed or run out, never paid
    throw error;
  }
  return Boolean(gateway)
    && gateway.status === 'confirmed'
    && String(gateway.referenceId) === order.number
    && Number(gateway.amount) >= order.total
    && String(gateway.currency).toUpperCase() === order.currency;
}

// Closes a payment page so it can no longer be paid. One that is already gone is fine.
async function closeGateway(id) {
  try {
    await call('DELETE', `Gateway/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error.code !== 'missing') throw error;
  }
}

module.exports = { INSTANCE, check, closeGateway, createGateway, fromEnv, isPaid, keys, removeKeys, saveKeys };
