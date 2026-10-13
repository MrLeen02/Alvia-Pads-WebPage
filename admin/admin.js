/* =====================================================
   ALVIA — admin backend
   Sign in, handle orders, keep the inventory, see customers, set up the shop.
   Talks to server/server.js; the login itself is checked there, never here.
   Everything a customer typed is written with textContent, never as HTML.

   After every change the whole data set is read again from the server (loadData),
   so what is on screen is always what is saved.
   ===================================================== */
(function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => [...(root || document).querySelectorAll(selector)];

  /* The way of an order. With a Payrexx account connected the buyer pays on Payrexx's
     TWINT page and the order becomes paid by itself. Without one the buyer pays to your
     TWINT number and says so (claimed); the site cannot see that money, so you check
     your TWINT app and confirm (paid). */
  const STATUS_LABELS = { new: 'Not paid yet', claimed: 'Paid — check TWINT', paid: 'Ready to ship', shipped: 'Shipped', cancelled: 'Cancelled' };
  const CANCEL_NOTES = { buyer: 'by the buyer', expired: 'not paid in time', payrexx: 'by Payrexx: the TWINT payment arrived' }; // who or what cancelled or confirmed, in the history
  const COLOUR_LABELS = { blue: 'Phantom Blue', black: 'Moonnight Black' };
  const COUNTRY_LABELS = { CH: 'Switzerland', LI: 'Liechtenstein' };
  const LEVEL_LABELS = { ok: 'In stock', low: 'Low', out: 'Sold out' };
  const REASON_LABELS = {
    order: 'Order',
    cancelled: 'Order cancelled',
    expired: 'Not paid in time',
    reopened: 'Order reopened',
    deleted: 'Order deleted',
    delivery: 'Delivery arrived',
    damaged: 'Damaged or lost',
    correction: 'Shelf counted'
  };
  const HISTORY_LABELS = { new: 'Order started', claimed: 'Paid, says the buyer', paid: 'Payment confirmed', shipped: 'Shipped', cancelled: 'Cancelled' };
  const QUANTITY_LABELS = { delivery: 'Pads to add', damaged: 'Pads to remove', count: 'Pads in stock now' };
  const TAB_TITLES = { overview: 'Overview', orders: 'Orders', inventory: 'Inventory', customers: 'Customers', shop: 'Shop', account: 'Account' };
  const TABS = Object.keys(TAB_TITLES);
  // The way of an order, and the one button that takes it a step further.
  const STEPS = ['new', 'claimed', 'paid', 'shipped'];
  const STEP_LABELS = { new: 'Order started', claimed: 'Buyer says paid', paid: 'Payment checked', shipped: 'Shipped' };
  const NEXT_STEP = {
    new: { status: 'paid', label: 'Payment arrived', done: 'Payment confirmed. Ready to ship.', undo: null },
    claimed: { status: 'paid', label: 'Payment arrived', done: 'Payment confirmed. Ready to ship.', undo: { status: 'new', label: 'No payment arrived' } },
    paid: { status: 'shipped', label: 'Mark as shipped', done: 'Marked as shipped.', undo: { status: 'claimed', label: 'Payment not checked after all' } },
    shipped: { status: null, undo: { status: 'paid', label: 'Not shipped yet' } }
  };
  const ERRORS = {
    credentials: 'Login name or password is wrong.',
    rate: 'Too many attempts. Wait 15 minutes and try again.',
    https: 'Signing in only works over https. Open this page with https:// at the start of the address.',
    'signed-out': 'You have been signed out. Sign in again.',
    code: 'That is not the code from the email. Look again and retype it.',
    'code-expired': 'This code no longer works. Start again to get a new one.',
    'mail-login': 'Gmail does not accept this address and app password. It has to be an app password, not the normal Gmail password.',
    'mail-unreachable': 'The email could not be sent. Check the address, or try again in a moment.',
    'mail-env': 'The mail account is set where the server is hosted and can only be changed there.',
    stock: 'There are not enough pads in stock for that.',
    'no-change': 'That is already the number in stock.',
    'selling-off': 'The shop is not on the website yet. Switch "Shop on the website" on first.',
    'price-missing': 'Set a price before opening the shop.',
    'twint-missing': 'Connect Payrexx or add your TWINT number before opening the shop.',
    'payrexx-keys': 'Payrexx does not accept this name and API key. Copy both again from your Payrexx account.',
    'payrexx-unreachable': 'Payrexx did not answer. Try again in a moment.',
    'payrexx-env': 'The Payrexx keys are set where the server is hosted and can only be changed there.',
    changed: 'This order has just changed by itself (paid, or run out). Look at it again.',
    picture: 'That is not a PNG, JPEG or WebP picture.',
    'too-large': 'The picture is too big (500 KB at most).',
    'password-length': 'The new password needs at least 10 characters.',
    fields: 'Check the values and try again.',
    network: 'The server cannot be reached.',
    unavailable: 'The admin server is not running at this address.'
  };

  /* The two emails to a buyer, in the language they ordered in. The site sends nothing
     itself: the buttons in an order open the mail program with this text. */
  const MAIL = {
    en: {
      locale: 'en-CH',
      sep: ':',
      hello: (name) => `Hello ${name},`,
      paymentSubject: (number) => `Your ALVIA order ${number} — payment details`,
      thanks: (number) => `Thank you for your order ${number}:`,
      item: (item, total) => `${item} — ${total} including shipping.`,
      pay: (total) => `Please pay ${total} by:`,
      bank: 'Bank transfer',
      reference: 'Reference',
      afterPayment: 'We ship your pad as soon as the payment has arrived.',
      shippedSubject: (number) => `Your ALVIA order ${number} is on its way`,
      shipped: (number, item) => `Your order ${number} (${item}) has been shipped.`,
      tracking: 'Tracking number',
      enjoy: 'Enjoy your pad!',
      bye: 'Best regards'
    },
    de: {
      locale: 'de-CH',
      sep: ':',
      hello: (name) => `Hallo ${name},`,
      paymentSubject: (number) => `Deine ALVIA-Bestellung ${number} — Zahlungsangaben`,
      thanks: (number) => `danke für deine Bestellung ${number}:`,
      item: (item, total) => `${item} — ${total} inkl. Versand.`,
      pay: (total) => `Bitte bezahle ${total} per:`,
      bank: 'Banküberweisung',
      reference: 'Zahlungszweck',
      afterPayment: 'Sobald die Zahlung eingegangen ist, verschicken wir dein Pad.',
      shippedSubject: (number) => `Deine ALVIA-Bestellung ${number} ist unterwegs`,
      shipped: (number, item) => `deine Bestellung ${number} (${item}) ist unterwegs.`,
      tracking: 'Sendungsnummer',
      enjoy: 'Viel Freude mit deinem Pad!',
      bye: 'Liebe Grüße'
    },
    fr: {
      locale: 'fr-CH',
      sep: ' :',
      hello: (name) => `Bonjour ${name},`,
      paymentSubject: (number) => `Votre commande ALVIA ${number} — informations de paiement`,
      thanks: (number) => `Merci pour votre commande ${number} :`,
      item: (item, total) => `${item} — ${total}, livraison comprise.`,
      pay: (total) => `Merci de régler ${total} par :`,
      bank: 'Virement bancaire',
      reference: 'Référence',
      afterPayment: 'Nous expédions votre tapis dès réception du paiement.',
      shippedSubject: (number) => `Votre commande ALVIA ${number} est en route`,
      shipped: (number, item) => `Votre commande ${number} (${item}) a été expédiée.`,
      tracking: 'Numéro de suivi',
      enjoy: 'Bonne utilisation !',
      bye: 'Cordialement'
    }
  };

  let settings = null;
  let orders = [];      // newest first
  let movements = [];   // stock history, newest first
  let visits = { today: '', days: {} }; // visitors the server has counted, per day (Swiss time)
  let visitRange = 30;                  // how many days back the visitor numbers, map and table look
  let payrexx = { connected: false, instance: '', fromEnv: false }; // automatic TWINT payments
  let mail = { on: false, to: '', fromEnv: false };                 // sign-in code by email
  let seenPaid = null;          // orders Payrexx has confirmed at the last look (null: not looked yet)
  const openOrders = new Set(); // ids of the rows that are unfolded, kept across redraws
  let seenClaimed = null;       // orders waiting for a payment check at the last look (null: not looked yet)

  /* =====================================================
     Helpers
     ===================================================== */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach((name) => {
      if (name === 'class') node.className = attrs[name];
      else if (name === 'text') node.textContent = attrs[name];
      else node.setAttribute(name, attrs[name]);
    });
    (children || []).forEach((child) => { if (child) node.append(child); });
    return node;
  }

  const money = (rappen, currency, locale) =>
    new Intl.NumberFormat(locale || 'de-CH', { style: 'currency', currency: currency || 'CHF' }).format(rappen / 100);
  const date = (iso) =>
    new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  const time = (iso) => new Intl.DateTimeFormat('en-GB', { timeStyle: 'short' }).format(new Date(iso));
  const sum = (list, value) => list.reduce((total, entry) => total + value(entry), 0);
  const signed = (number) => (number > 0 ? `+${number}` : `−${Math.abs(number)}`);
  const message = (error) => ERRORS[error.message] || 'Something went wrong. Please try again.';
  const counts = (order) => order.status === 'paid' || order.status === 'shipped'; // money that came in

  // "39.90", "39,9" or "39" → 3990 Rappen; anything else → null.
  function toRappen(text) {
    const match = /^(\d{1,5})(?:[.,](\d{1,2}))?$/.exec(String(text).trim());
    return match ? Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0')) : null;
  }

  function show(view) {
    $$('[data-view]').forEach((node) => { node.hidden = node.dataset.view !== view; });
  }

  // Status line under a form. The alert boxes take no room while they are empty.
  function note(node, text, tone) {
    node.textContent = text || '';
    if (node.getAttribute('role') === 'alert') node.hidden = !text;
    node.classList.toggle('note--error', tone === 'error');
    node.classList.toggle('note--ok', tone === 'ok');
  }

  // A short confirmation at the bottom of the screen that goes away on its own.
  let toastTimer = 0;
  function toast(text) {
    const node = $('[data-toast]');
    node.hidden = true; // restarts the entrance if one is still showing
    node.textContent = text;
    void node.offsetWidth;
    node.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { node.hidden = true; }, 3200);
  }

  // A table that scrolls sideways on a phone. Cells are text or ready-made nodes.
  function table(columns, rows, emptyText) {
    if (!rows.length) return el('p', { class: 'orders__empty', text: emptyText });
    return el('div', { class: 'table' }, [el('table', {}, [
      el('thead', {}, [el('tr', {}, columns.map((column) =>
        el('th', { scope: 'col', class: column.num ? 'num' : '', text: column.label })))]),
      el('tbody', {}, rows.map((cells) => el('tr', {}, cells.map((cell, index) => {
        const td = el('td', { class: columns[index].num ? 'num' : '' });
        td.append(cell);
        return td;
      }))))
    ])]);
  }

  /* CSV for a spreadsheet. A cell that starts with = + - or @ would be run as a
     formula by Excel, so those get a leading apostrophe. */
  function csvCell(value) {
    let text = String(value == null ? '' : value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadCsv(name, header, rows) {
    const csv = [header].concat(rows).map((row) => row.map(csvCell).join(';')).join('\r\n');
    // The BOM makes Excel read the file as UTF-8 (umlauts, accents).
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
    const link = el('a', { href: url, download: `alvia-${name}-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function api(method, path, body) {
    let response;
    try {
      response = await fetch(`/api/${path}`, {
        method,
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (_) {
      throw new Error('network');
    }
    let data = null;
    try { data = await response.json(); } catch (_) {}
    if (response.ok && data) return data;
    // A page that answers without the API's JSON is a host that only serves files.
    const error = new Error(data && data.error ? data.error : 'unavailable');
    error.status = response.status;
    throw error;
  }

  const appError = (text) => note($('[data-app-error]'), text, 'error');

  // Runs a backend action; an expired session goes back to the sign-in screen.
  async function act(run, onError) {
    try {
      await run();
    } catch (error) {
      if (error.status === 401) {
        showLogin(message(error));
        return;
      }
      (onError || appError)(message(error));
    }
  }

  /* =====================================================
     Sign in / out
     ===================================================== */
  const loginForm = $('[data-login]');
  const loginMessage = $('[data-login-message]');
  const codeForm = $('[data-code]');
  const codeMessage = $('[data-code-message]');
  /* A sign-in that waits for its emailed code: { challenge, to, mailed } from the server.
     Kept for this tab, so it survives a reload — and the sign-in panel in the website's
     header (assets/js/account.js) hands it over the same way. Without the code from the
     email it is worth nothing. */
  const WAITING = 'alvia_code';
  let waiting = null;

  function setWaiting(pending) {
    waiting = pending;
    try {
      if (pending) window.sessionStorage.setItem(WAITING, JSON.stringify(pending));
      else window.sessionStorage.removeItem(WAITING);
    } catch (_) {}
  }

  function savedWaiting() {
    try {
      const pending = JSON.parse(window.sessionStorage.getItem(WAITING));
      return pending && typeof pending.challenge === 'string' ? pending : null;
    } catch (_) {
      return null;
    }
  }

  function showLogin(text) {
    settings = null;
    orders = [];
    movements = [];
    seenClaimed = null;
    seenPaid = null;
    setWaiting(null);
    codeForm.hidden = true;
    loginForm.hidden = false;
    show('login');
    note(loginMessage, text, 'error');
    loginForm.elements.password.value = '';
    (loginForm.elements.username.value ? loginForm.elements.password : loginForm.elements.username).focus();
  }

  // The second step: the password was right, now the code from the email.
  function showCode(pending) {
    setWaiting(pending);
    loginForm.hidden = true;
    codeForm.hidden = false;
    show('login');
    $('[data-code-lede]').textContent = pending.mailed === false
      ? 'The email could not be sent. The code is in the log of the server: look for "sign-in code".'
      : `This device or internet connection is new. We sent a 6-digit code to ${pending.to}. It is good for 10 minutes.`;
    note(codeMessage, '');
    codeForm.elements.code.value = '';
    codeForm.elements.code.focus();
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('button[type="submit"]', loginForm);
    button.disabled = true;
    note(loginMessage, '');
    try {
      const answer = await api('POST', 'admin/login', {
        username: loginForm.elements.username.value,
        password: loginForm.elements.password.value,
        remember: loginForm.elements.remember.checked
      });
      loginForm.elements.password.value = '';
      if (answer.step === 'code') showCode(answer);
      else await openBackend(answer.username);
    } catch (error) {
      note(loginMessage, message(error), 'error');
      loginForm.elements.password.select();
    } finally {
      button.disabled = false;
    }
  });

  codeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const field = codeForm.elements.code;
    if (!waiting || !/^\d{6}$/.test(field.value.replace(/\D/g, ''))) {
      note(codeMessage, 'Type in the 6 digits from the email.', 'error');
      field.focus();
      return;
    }
    const button = $('button[type="submit"]', codeForm);
    button.disabled = true;
    note(codeMessage, '');
    try {
      const session = await api('POST', 'admin/login/code', { challenge: waiting.challenge, code: field.value });
      setWaiting(null);
      await openBackend(session.username);
      codeForm.hidden = true;
      loginForm.hidden = false;
    } catch (error) {
      // Run out, used up, or too many wrong tries: only a new sign-in gives a new code.
      if (error.message === 'code-expired') {
        showLogin(message(error));
      } else {
        note(codeMessage, message(error), 'error');
        field.select();
      }
    } finally {
      button.disabled = false;
    }
  });

  $('[data-code-back]').addEventListener('click', () => showLogin(''));

  $$('[data-logout]').forEach((button) => button.addEventListener('click', async () => {
    try { await api('POST', 'admin/logout'); } catch (_) {}
    showLogin('');
  }));

  $('[data-logout-all]').addEventListener('click', async () => {
    if (!window.confirm('Sign out on every device, including this one?')) return;
    try { await api('POST', 'admin/logout-all'); } catch (_) {}
    showLogin('');
  });

  /* =====================================================
     Tabs
     ===================================================== */
  function selectTab(name) {
    const tab = TABS.includes(name) ? name : 'overview';
    $$('[data-tab]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    $$('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== tab; });
    $('[data-page-title]').textContent = TAB_TITLES[tab];
    if (window.location.hash.slice(1) !== tab) window.history.replaceState(null, '', `#${tab}`);
    window.scrollTo(0, 0);
  }
  $$('[data-tab]').forEach((button) => button.addEventListener('click', () => selectTab(button.dataset.tab)));
  window.addEventListener('hashchange', () => selectTab(window.location.hash.slice(1)));

  /* =====================================================
     Orders
     ===================================================== */
  const filterStatus = { value: '' }; // which of the buttons above the list is chosen
  const filterText = $('[data-filter-text]');

  function showOrders(status, text) {
    filterStatus.value = status;
    filterText.value = text || '';
    render();
    selectTab('orders');
  }
  $$('[data-status-filter]').forEach((button) => button.addEventListener('click', () => {
    filterStatus.value = button.dataset.statusFilter;
    render();
  }));

  /* What an order contains: one line per colourway. Orders from before the cart had a
     single colour and quantity instead of a list. */
  const itemsOf = (order) => order.items || [{ colour: order.colour, quantity: order.quantity }];
  const padsIn = (order, colour) => sum(itemsOf(order).filter((item) => item.colour === colour), (item) => item.quantity);
  const itemOf = (order) => itemsOf(order).map((item) => `${item.quantity} × ${COLOUR_LABELS[item.colour] || item.colour}`).join(' + ');
  // The same for an email: with the product's name.
  const productsOf = (order) => itemsOf(order).map((item) => `${item.quantity} × ALVIA Control CC01, ${COLOUR_LABELS[item.colour]}`).join(' + ');

  function mailto(order, subject, lines) {
    const address = encodeURIComponent(order.customer.email).replace('%40', '@');
    return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\r\n'))}`;
  }

  // "Here is how to pay" — a reminder for an order that was started but not paid.
  function paymentMail(order) {
    const mail = MAIL[order.lang] || MAIL.en;
    const total = money(order.total, order.currency, mail.locale);
    const lines = [
      mail.hello(order.customer.name), '',
      mail.thanks(order.number),
      mail.item(productsOf(order), total), '',
      mail.pay(total),
      `TWINT${mail.sep} ${settings.payment.twint}`,
      `${mail.reference}${mail.sep} ${order.number}`, '',
      mail.afterPayment, '', mail.bye, 'ALVIA'
    ];
    return mailto(order, mail.paymentSubject(order.number), lines);
  }

  // "Your parcel is on its way" — with the parcel number if one is saved.
  function shippedMail(order) {
    const mail = MAIL[order.lang] || MAIL.en;
    const lines = [
      mail.hello(order.customer.name), '',
      mail.shipped(order.number, productsOf(order))
    ];
    if (order.tracking) lines.push(`${mail.tracking}${mail.sep} ${order.tracking}`);
    lines.push('', mail.enjoy, '', mail.bye, 'ALVIA');
    return mailto(order, mail.shippedSubject(order.number), lines);
  }

  function orderRow(order) {
    const customer = order.customer;
    const item = itemOf(order);
    const online = Boolean(order.gateway); // paid on Payrexx's TWINT page: it confirms itself
    const payable = Boolean(settings.payment.twint) && !online;

    const tracking = el('input', { type: 'text', maxlength: '60', value: order.tracking || '', placeholder: 'e.g. 99.00.123456.12345678' });
    const adminNote = el('input', { type: 'text', maxlength: '1000', value: order.adminNote || '', placeholder: 'Only you see this' });

    // Status, parcel number and note are saved together, so nothing typed is lost.
    const saveOrder = (status, done) => act(async () => {
      await api('PATCH', `admin/orders/${order.id}`, { status: status || order.status, tracking: tracking.value, adminNote: adminNote.value });
      appError('');
      await loadData();
      toast(done || 'Saved.');
    }, (text) => {
      appError(text);
      // Paid or run out in the very moment of the click: show the order as it is now.
      if (text === ERRORS.changed) act(async () => { await loadData(); toast(text); });
    });
    const action = (label, className, run) => {
      const button = el('button', { class: className, type: 'button', text: label });
      button.addEventListener('click', run);
      return button;
    };
    const saveButton = action('Save', 'btn', () => saveOrder());

    // Where the order stands, the one button for the next step, and the ways back.
    const step = NEXT_STEP[order.status];
    // Paid online there is no "buyer says paid": the order goes from started straight to paid.
    const steps = online && order.status !== 'claimed' ? STEPS.filter((name) => name !== 'claimed') : STEPS;
    const reached = steps.indexOf(order.status);
    const amount = money(order.total, order.currency);
    const byPayrexx = online && (order.history || []).some((entry) => entry.status === 'paid' && entry.note === 'payrexx');
    const hint = online ? {
      new: order.payBy
        ? `The buyer is on the TWINT payment page. As soon as the money arrives, this order becomes "Ready to ship" by itself — there is nothing for you to check. The pads are held until ${time(order.payBy)}; without a payment the order then cancels itself.`
        : 'This order was reopened by hand and can no longer be paid on the website. Agree on the payment with the buyer, then confirm it here.',
      claimed: 'Waiting for you to confirm the payment.',
      paid: byPayrexx
        ? `Paid: Payrexx has confirmed the TWINT payment of ${amount}. Pack the pad and mark the order as shipped.`
        : 'The payment is confirmed. Pack the pad and mark the order as shipped.',
      cancelled: order.refund
        ? `The buyer paid ${amount} by TWINT after this order was cancelled, and its pads were gone. Refund the payment in your Payrexx account and write to the buyer.`
        : (order.expired ? 'No payment arrived in time: the order cancelled itself. Its pads are back in stock.' : 'This order is cancelled. Its pads are back in stock.')
    }[order.status] : {
      new: order.payBy
        ? `The buyer is on the payment step and has not said "I have paid" yet. The pads are held until ${time(order.payBy)}; after that the order cancels itself.`
        : 'Waiting for the payment. Nothing arrives? Cancel the order to free its pads.',
      claimed: `The buyer says ${amount} was sent by TWINT with the message ${order.number}. Check your TWINT app, then confirm.`,
      paid: 'The payment is confirmed. Pack the pad and mark the order as shipped.',
      cancelled: order.expired ? 'Not paid in time: the order cancelled itself. Its pads are back in stock.' : 'This order is cancelled. Its pads are back in stock.'
    }[order.status];
    // What Payrexx has confirmed is not taken back with one click.
    const undo = step && step.undo && !(byPayrexx && order.status === 'paid') ? step.undo : null;
    const next = el('div', { class: `next next--${order.status}` }, [
      order.status === 'cancelled'
        ? null
        : el('ol', { class: 'steps' }, steps.map((name, index) =>
          el('li', { class: index <= reached ? 'is-done' : '', text: online && name === 'paid' ? 'Paid by TWINT' : STEP_LABELS[name] }))),
      hint ? el('p', { class: 'next__hint', text: hint }) : null,
      el('div', { class: 'next__actions' }, [
        // Online the order confirms itself; "Payment arrived" stays only for one reopened by hand.
        step && step.status && !(online && order.status === 'new' && order.payBy) ? action(step.label, 'btn btn--accent', () => saveOrder(step.status, step.done)) : null,
        undo ? action(undo.label, 'linkbtn', () => saveOrder(undo.status, 'Changed back.')) : null,
        order.status === 'cancelled'
          ? action('Reopen order', 'btn', () => saveOrder('new', 'Order reopened.'))
          : action('Cancel order', 'linkbtn', () => {
            if (window.confirm(`Cancel order ${order.number}? Its pads go back in stock.`)) saveOrder('cancelled', 'Order cancelled.');
          })
      ])
    ]);

    const remove = el('button', { class: 'btn btn--quiet btn--danger push', type: 'button', text: 'Delete order' });
    remove.addEventListener('click', () => {
      if (!window.confirm(`Delete order ${order.number} for good? This cannot be undone.`)) return;
      act(async () => {
        await api('DELETE', `admin/orders/${order.id}`);
        appError('');
        await loadData();
        toast('Order deleted.');
      });
    });

    const details = el('details', { class: 'order' }, [
      el('summary', { class: 'order__row' }, [
        el('span', { class: 'order__number', text: order.number }),
        el('span', { class: 'order__date', text: date(order.createdAt) }),
        el('span', { class: 'order__name', text: customer.name }),
        el('span', { class: 'order__item', text: item }),
        el('span', { class: 'order__total', text: money(order.total, order.currency) }),
        el('span', { class: `badge badge--${order.status}`, text: STATUS_LABELS[order.status] })
      ]),
      el('div', { class: 'order__body' }, [
        el('div', { class: 'order__block order__block--wide' }, [next]),
        el('div', { class: 'order__block' }, [
          el('h3', { text: 'Ship to' }),
          el('p', { text: customer.name }),
          el('p', { text: customer.street }),
          el('p', { text: `${customer.zip} ${customer.city}` }),
          el('p', { text: COUNTRY_LABELS[customer.country] || customer.country })
        ]),
        el('div', { class: 'order__block' }, [
          el('h3', { text: 'Contact' }),
          el('p', { text: customer.email }),
          el('p', { class: 'note', text: `Language: ${order.lang.toUpperCase()}` }),
          customer.note ? el('h3', { text: 'Note from the buyer' }) : null,
          customer.note ? el('p', { text: customer.note }) : null
        ]),
        el('div', { class: 'order__block' }, [
          el('h3', { text: 'Amount' }),
          el('p', { text: item }),
          el('p', { class: 'note', text: `${money(order.unitPrice, order.currency)} per pad` }),
          el('p', { text: `Shipping ${money(order.shipping, order.currency)}` }),
          el('p', {}, [el('strong', { text: `Total ${money(order.total, order.currency)}` })])
        ]),
        el('div', { class: 'order__block' }, [
          el('h3', { text: 'History' })
        ].concat((order.history || [{ at: order.createdAt, status: 'new' }]).map((step) =>
          el('p', { text: `${date(step.at)} — ${HISTORY_LABELS[step.status] || step.status}${(step.status === 'cancelled' || step.status === 'paid') && CANCEL_NOTES[step.note] ? `, ${CANCEL_NOTES[step.note]}` : ''}` })))),
        el('div', { class: 'order__block order__block--wide order__block--line' }, [
          el('div', { class: 'order__fields' }, [
            el('label', { class: 'field' }, [el('span', { text: 'Parcel number' }), tracking]),
            el('label', { class: 'field field--grow' }, [el('span', { text: 'Internal note' }), adminNote]),
            saveButton
          ])
        ]),
        el('div', { class: 'order__block order__block--wide order__block--line' }, [
          el('div', { class: 'order__actions' }, [
            payable && order.status === 'new' ? el('a', { class: 'btn', href: paymentMail(order), text: 'Email payment details' }) : null,
            el('a', { class: 'btn', href: shippedMail(order), text: 'Email shipping notice' }),
            remove
          ]),
          null
        ])
      ])
    ]);
    details.open = openOrders.has(order.id);
    details.addEventListener('toggle', () => {
      if (details.open) openOrders.add(order.id);
      else openOrders.delete(order.id);
    });
    return details;
  }

  function fillOrders(container, list, emptyText) {
    container.replaceChildren(...(list.length
      ? list.map(orderRow)
      : [el('p', { class: 'orders__empty', text: emptyText })]));
  }

  const matches = (words, values) => {
    const haystack = values.join(' ').toLowerCase();
    return words.every((word) => haystack.includes(word));
  };
  const wordsOf = (input) => input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);

  function filteredOrders() {
    const status = filterStatus.value;
    const words = wordsOf(filterText);
    return orders.filter((order) => {
      if (status && order.status !== status) return false;
      const customer = order.customer;
      return matches(words, [order.number, customer.name, customer.email, customer.city, customer.zip, customer.street, order.tracking || '']);
    });
  }

  filterText.addEventListener('input', render);

  $('[data-export]').addEventListener('click', () => {
    downloadCsv('orders',
      ['Order', 'Date', 'Status', 'Items', 'Pads', 'Unit price', 'Shipping', 'Total', 'Currency',
        'Name', 'Email', 'Street', 'Postcode', 'Town', 'Country', 'Language', 'Buyer note', 'Parcel number', 'Internal note'],
      filteredOrders().map((order) => [
        order.number, order.createdAt, STATUS_LABELS[order.status], itemOf(order), order.quantity,
        (order.unitPrice / 100).toFixed(2), (order.shipping / 100).toFixed(2), (order.total / 100).toFixed(2), order.currency,
        order.customer.name, order.customer.email, order.customer.street, order.customer.zip, order.customer.city,
        order.customer.country, order.lang, order.customer.note, order.tracking, order.adminNote
      ]));
  });

  /* =====================================================
     Inventory
     In stock (can still be ordered) is the number the server keeps. Reserved and
     shipped are counted from the orders.
     ===================================================== */
  const adjustForm = $('[data-adjust]');
  const adjustMessage = $('[data-adjust-message]');
  const thresholdForm = $('[data-threshold]');
  const thresholdMessage = $('[data-threshold-message]');
  const movementColour = $('[data-movement-colour]');

  function stockOf(colour) {
    const pads = (order) => padsIn(order, colour);
    const available = settings.stock[colour];
    const reserved = sum(orders.filter((order) => ['new', 'claimed', 'paid'].includes(order.status)), pads);
    return {
      available,
      reserved,
      shelf: available + reserved,
      shipped: sum(orders.filter((order) => order.status === 'shipped'), pads),
      level: available === 0 ? 'out' : (available <= settings.lowStock ? 'low' : 'ok')
    };
  }

  function stockCard(colour) {
    const stock = stockOf(colour);
    const row = (label, value) => el('div', {}, [el('dt', { text: label }), el('dd', { text: String(value) })]);
    // Straight to the form below, with this colourway and "delivery" already chosen.
    const add = el('button', { class: 'btn', type: 'button', text: '+ Add a delivery' });
    add.addEventListener('click', () => {
      adjustForm.elements.colour.value = colour;
      adjustForm.elements.type.value = 'delivery';
      labelQuantity();
      adjustForm.scrollIntoView({ block: 'center' });
      adjustForm.elements.quantity.focus({ preventScroll: true });
    });
    return el('article', { class: 'stock__card' }, [
      el('header', { class: 'stock__head' }, [
        el('span', { class: `stock__dot stock__dot--${colour}` }),
        el('h2', { class: 'panel__sub', text: COLOUR_LABELS[colour] }),
        el('span', { class: `badge badge--${stock.level}`, text: LEVEL_LABELS[stock.level] })
      ]),
      el('strong', { class: 'stock__value', text: String(stock.available) }),
      el('span', { class: 'tile__hint', text: 'in stock' }),
      el('dl', { class: 'stock__rows' }, [
        row('Reserved in open orders', stock.reserved),
        row('On the shelf', stock.shelf),
        row('Shipped so far', stock.shipped)
      ]),
      add
    ]);
  }

  const shownMovements = () => movements.filter((move) => !movementColour.value || move.colour === movementColour.value);

  function renderInventory() {
    $('[data-stock-cards]').replaceChildren(...Object.keys(COLOUR_LABELS).map(stockCard));
    $('[data-movements]').replaceChildren(table(
      [{ label: 'Date' }, { label: 'Colourway' }, { label: 'Change', num: true }, { label: 'In stock after', num: true },
        { label: 'Reason' }, { label: 'Order / note' }, { label: 'By' }],
      shownMovements().map((move) => [
        date(move.at), COLOUR_LABELS[move.colour] || move.colour,
        el('span', { class: move.change > 0 ? 'plus' : 'minus', text: signed(move.change) }),
        String(move.balance), REASON_LABELS[move.reason] || move.reason, move.ref, move.by || 'Website'
      ]),
      'No stock changes yet. Add your first delivery above.'));
  }

  movementColour.addEventListener('change', renderInventory);
  // The quantity field means something different for each kind of change.
  function labelQuantity() {
    $('[data-adjust-quantity-label]').textContent = QUANTITY_LABELS[adjustForm.elements.type.value];
  }
  adjustForm.elements.type.addEventListener('change', labelQuantity);

  adjustForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = adjustForm.elements;
    const type = fields.type.value;
    const quantity = Number(fields.quantity.value);
    if (fields.quantity.value === '' || !Number.isInteger(quantity) || quantity < (type === 'count' ? 0 : 1)) {
      note(adjustMessage, 'Enter a whole number of pads.', 'error');
      return;
    }
    note(adjustMessage, 'Saving…');
    act(async () => {
      await api('POST', 'admin/inventory', { colour: fields.colour.value, type, quantity, note: fields.note.value });
      fields.quantity.value = '';
      fields.note.value = '';
      await loadData();
      note(adjustMessage, `Saved. ${COLOUR_LABELS[fields.colour.value]}: ${settings.stock[fields.colour.value]} in stock.`, 'ok');
    }, (text) => note(adjustMessage, text, 'error'));
  });

  thresholdForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const lowStock = Number(thresholdForm.elements.lowStock.value);
    if (thresholdForm.elements.lowStock.value === '' || !Number.isInteger(lowStock) || lowStock < 0) {
      note(thresholdMessage, 'Enter a whole number.', 'error');
      return;
    }
    act(async () => {
      await api('PUT', 'admin/settings', { lowStock });
      await loadData();
      note(thresholdMessage, 'Saved.', 'ok');
    }, (text) => note(thresholdMessage, text, 'error'));
  });

  $('[data-export-movements]').addEventListener('click', () => {
    downloadCsv('stock-history',
      ['Date', 'Colourway', 'Change', 'In stock after', 'Reason', 'Order / note', 'By'],
      shownMovements().map((move) => [move.at, COLOUR_LABELS[move.colour], move.change, move.balance,
        REASON_LABELS[move.reason] || move.reason, move.ref, move.by || 'Website']));
  });

  /* =====================================================
     Customers — everyone who ordered, one row per email address
     ===================================================== */
  const customerText = $('[data-customer-text]');

  function customers() {
    const byEmail = new Map();
    orders.forEach((order) => { // newest first, so the first order seen carries the current name and town
      const key = order.customer.email.toLowerCase();
      if (!byEmail.has(key)) {
        byEmail.set(key, { name: order.customer.name, email: order.customer.email, city: order.customer.city,
          last: order.createdAt, orders: 0, pads: 0, paid: 0, currency: order.currency });
      }
      const customer = byEmail.get(key);
      if (order.status !== 'cancelled') {
        customer.orders += 1;
        customer.pads += order.quantity;
      }
      if (counts(order)) customer.paid += order.total;
    });
    return [...byEmail.values()];
  }

  const shownCustomers = () => customers().filter((customer) =>
    matches(wordsOf(customerText), [customer.name, customer.email, customer.city]));

  function renderCustomers() {
    const all = customers();
    const shown = shownCustomers();
    $('[data-customers-count]').textContent = `${shown.length} of ${all.length} customers`;
    $('[data-customers]').replaceChildren(table(
      [{ label: 'Name' }, { label: 'Email' }, { label: 'Town' }, { label: 'Orders', num: true }, { label: 'Pads', num: true },
        { label: 'Paid', num: true }, { label: 'Last order' }, { label: '' }],
      shown.map((customer) => {
        const view = el('button', { class: 'btn btn--quiet btn--small', type: 'button', text: 'Orders' });
        view.addEventListener('click', () => showOrders('', customer.email));
        return [customer.name, customer.email, customer.city, String(customer.orders), String(customer.pads),
          money(customer.paid, customer.currency), date(customer.last), view];
      }),
      all.length ? 'No customer matches the search.' : 'No customers yet.'));
  }

  customerText.addEventListener('input', renderCustomers);

  $('[data-export-customers]').addEventListener('click', () => {
    downloadCsv('customers',
      ['Name', 'Email', 'Town', 'Orders', 'Pads', 'Paid', 'Currency', 'Last order'],
      shownCustomers().map((customer) => [customer.name, customer.email, customer.city, customer.orders, customer.pads,
        (customer.paid / 100).toFixed(2), customer.currency, customer.last]));
  });

  /* =====================================================
     Shop settings
     ===================================================== */
  const settingsForm = $('[data-settings]');
  const settingsMessage = $('[data-settings-message]');

  // Fills the forms from the saved settings. Not part of render(): a redraw must not
  // overwrite what is being typed.
  function fillForms() {
    const fields = settingsForm.elements;
    fields.selling.checked = settings.selling;
    fields.open.checked = settings.open;
    lockOpen();
    fields.statistics.checked = settings.statistics;
    fields.price.value = (settings.price / 100).toFixed(2);
    fields.shipping.value = (settings.shipping / 100).toFixed(2);
    fields.maxQuantity.value = settings.maxQuantity;
    fields.twint.value = settings.payment.twint;
    showQr();
    thresholdForm.elements.lowStock.value = settings.lowStock;
    labelQuantity(); // a browser may bring back the last choice after a reload
  }

  // The shop can only be open while it is on the website.
  function lockOpen() {
    const fields = settingsForm.elements;
    fields.open.disabled = !fields.selling.checked;
    if (fields.open.disabled) fields.open.checked = false;
  }
  settingsForm.elements.selling.addEventListener('change', lockOpen);

  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = settingsForm.elements;
    const next = {
      selling: fields.selling.checked,
      open: fields.open.checked,
      statistics: fields.statistics.checked,
      price: toRappen(fields.price.value),
      shipping: toRappen(fields.shipping.value),
      maxQuantity: Number(fields.maxQuantity.value),
      payment: { twint: fields.twint.value } // TWINT only for now
    };
    if (next.price === null || next.shipping === null) {
      note(settingsMessage, 'Write amounts like 39.90.', 'error');
      return;
    }
    note(settingsMessage, 'Saving…');
    act(async () => {
      await api('PUT', 'admin/settings', next);
      await loadData();
      fillForms();
      note(settingsMessage, 'Saved. The website shows it straight away.', 'ok');
    }, (text) => note(settingsMessage, text, 'error'));
  });

  /* The TWINT QR code for the payment step: a picture saved from the TWINT app. It is
     read here and sent to the server as text (base64), which keeps it with the data. */
  const qrFile = $('[data-qr-file]');
  const qrMessage = $('[data-qr-message]');

  function showQr() {
    const has = Boolean(settings.payment.qr);
    const img = $('[data-qr-img]');
    img.hidden = !has;
    if (has) img.src = `/api/twint-qr?v=${Date.now()}`; // a new address, so a new picture shows at once
    else img.removeAttribute('src');
    $('[data-qr-none]').hidden = has;
    $('[data-qr-remove]').hidden = !has;
  }

  qrFile.addEventListener('change', () => {
    const file = qrFile.files[0];
    qrFile.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { note(qrMessage, ERRORS.picture, 'error'); return; }
    if (file.size > 500 * 1024) { note(qrMessage, ERRORS['too-large'], 'error'); return; }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      note(qrMessage, 'Uploading…');
      act(async () => {
        await api('PUT', 'admin/twint-qr', { type: file.type, data: String(reader.result).split(',')[1] });
        await loadData();
        showQr();
        note(qrMessage, 'Saved. Buyers see this code on the payment step.', 'ok');
      }, (text) => note(qrMessage, text, 'error'));
    });
    reader.readAsDataURL(file);
  });

  $('[data-qr-remove]').addEventListener('click', () => {
    if (!window.confirm('Remove the QR code? Buyers then see your TWINT number only.')) return;
    act(async () => {
      await api('DELETE', 'admin/twint-qr');
      await loadData();
      showQr();
      note(qrMessage, 'Removed.', 'ok');
    }, (text) => note(qrMessage, text, 'error'));
  });

  /* =====================================================
     Automatic TWINT payments (Payrexx)
     With a Payrexx account connected, every order gets its own TWINT payment page and
     becomes paid by itself when the money has arrived. The API key is sent to the
     server once and never comes back to this page.
     ===================================================== */
  const payrexxForm = $('[data-payrexx]');
  const payrexxMessage = $('[data-payrexx-message]');

  function showPayrexx() {
    const state = $('[data-payrexx-state]');
    state.textContent = payrexx.connected
      ? `Connected to ${payrexx.instance}.payrexx.com. Orders are only complete once the TWINT payment has arrived.`
      : 'Not connected. Buyers pay to your TWINT number and you confirm each payment by hand.';
    state.classList.toggle('note--ok', payrexx.connected);
    $('[data-payrexx-fields]').hidden = payrexx.connected || payrexx.fromEnv;
    $('[data-payrexx-connect]').hidden = payrexx.connected || payrexx.fromEnv;
    $('[data-payrexx-disconnect]').hidden = !payrexx.connected || payrexx.fromEnv;
    $('[data-payrexx-hook]').hidden = !payrexx.connected;
    $('[data-payrexx-hook-url]').textContent = `${window.location.origin}/api/payrexx/webhook`;
    // The TWINT number and QR picture are the way of paying only while Payrexx is not connected.
    $$('[data-manual-note]').forEach((node) => { node.hidden = !payrexx.connected; });
  }

  payrexxForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = payrexxForm.elements;
    if (!fields.instance.value.trim() || !fields.secret.value.trim()) {
      note(payrexxMessage, 'Enter both the name and the API key.', 'error');
      return;
    }
    note(payrexxMessage, 'Checking with Payrexx…');
    act(async () => {
      await api('PUT', 'admin/payrexx', { instance: fields.instance.value, secret: fields.secret.value });
      payrexxForm.reset();
      await loadData();
      note(payrexxMessage, 'Connected. From now on buyers pay on the TWINT payment page.', 'ok');
    }, (text) => note(payrexxMessage, text, 'error'));
  });

  $('[data-payrexx-disconnect]').addEventListener('click', () => {
    if (!window.confirm('Disconnect Payrexx? Buyers then pay to your TWINT number again and you confirm each payment by hand. Without a TWINT number the shop closes.')) return;
    act(async () => {
      await api('DELETE', 'admin/payrexx');
      await loadData();
      note(payrexxMessage, 'Disconnected.', 'ok');
    }, (text) => note(payrexxMessage, text, 'error'));
  });

  /* =====================================================
     Sign-in code by email
     The mail account the server sends the code through. A test code goes out first;
     only when it is typed in here — so the mail really arrives — is the code switched
     on. The app password is sent to the server once and never comes back to this page.
     ===================================================== */
  const mailForm = $('[data-mail]');
  const mailMessage = $('[data-mail-message]');
  let mailChallenge = null; // a test code is on its way and waits to be typed in

  function showMail() {
    const state = $('[data-mail-state]');
    state.textContent = mail.on
      ? `On. Codes go to ${mail.to}.${mail.fromEnv ? ' The mail account is set where the server is hosted and can only be changed there.' : ''}`
      : 'Off. The password alone signs in, from any device.';
    state.classList.toggle('note--ok', mail.on);
    const testing = Boolean(mailChallenge) && !mail.on;
    $('[data-mail-fields]').hidden = mail.on || testing;
    $('[data-mail-current]').hidden = mail.fromEnv || testing;
    $('[data-mail-current] span').textContent = mail.on ? 'Your admin password, to switch off' : 'Your admin password, to confirm';
    $('[data-mail-code]').hidden = !testing;
    $('[data-mail-help]').hidden = mail.on;
    const submit = $('[data-mail-submit]');
    submit.hidden = mail.on;
    submit.textContent = testing ? 'Switch on' : 'Send test code';
    $('[data-mail-off]').hidden = !mail.on || mail.fromEnv;
  }

  const mailError = (text) => note(mailMessage, text === ERRORS.credentials ? 'The admin password is wrong.' : text, 'error');

  mailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = mailForm.elements;
    if (mailChallenge) {
      act(async () => {
        await api('POST', 'admin/mail/confirm', { challenge: mailChallenge, code: fields.code.value });
        mailChallenge = null;
        mailForm.reset();
        await loadData();
        note(mailMessage, 'Switched on. This device is confirmed; any other one is asked for a code.', 'ok');
      }, (text) => {
        if (text === ERRORS['code-expired']) {
          mailChallenge = null;
          showMail();
        }
        mailError(text);
      });
      return;
    }
    if (!fields.user.value.trim() || !fields.pass.value.trim() || !fields.current.value) {
      note(mailMessage, 'Fill in the address, the app password and your admin password.', 'error');
      return;
    }
    note(mailMessage, 'Sending a test code…');
    act(async () => {
      const answer = await api('PUT', 'admin/mail', { user: fields.user.value, pass: fields.pass.value, current: fields.current.value });
      mailChallenge = answer.challenge;
      fields.pass.value = '';
      fields.current.value = '';
      showMail();
      note(mailMessage, `A code is on its way to ${answer.to}. Type it in to switch on.`, 'ok');
      fields.code.focus();
    }, mailError);
  });

  $('[data-mail-off]').addEventListener('click', () => {
    const current = mailForm.elements.current;
    if (!current.value) {
      note(mailMessage, 'Type in your admin password to switch off.', 'error');
      current.focus();
      return;
    }
    if (!window.confirm('Switch the sign-in code off? The password alone then signs in, from any device.')) return;
    act(async () => {
      await api('POST', 'admin/mail/off', { current: current.value });
      mailForm.reset();
      await loadData();
      note(mailMessage, 'Switched off.', 'ok');
    }, mailError);
  });

  /* =====================================================
     Password
     ===================================================== */
  const passwordForm = $('[data-password]');
  const passwordMessage = $('[data-password-message]');

  passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = passwordForm.elements;
    if (fields.next.value !== fields.repeat.value) {
      note(passwordMessage, 'The two new passwords are not the same.', 'error');
      return;
    }
    if (fields.next.value.length < 10) {
      note(passwordMessage, ERRORS['password-length'], 'error');
      return;
    }
    act(async () => {
      await api('POST', 'admin/password', { current: fields.current.value, next: fields.next.value });
      const username = fields.username.value;
      passwordForm.reset();
      fields.username.value = username;
      note(passwordMessage, 'Password changed. Other devices have been signed out.', 'ok');
    }, (text) => note(passwordMessage, text === ERRORS.credentials ? 'The current password is wrong.' : text, 'error'));
  });

  /* =====================================================
     Overview
     ===================================================== */
  const shopToggle = $('[data-shop-toggle]');
  // A way to be paid: Payrexx (automatic), or at least a TWINT number (by hand).
  const canBePaid = () => payrexx.connected || Boolean(settings.payment.twint);
  const isLive = () => settings.selling && settings.open && settings.price > 0 && canBePaid();
  const countOf = (status) => orders.filter((order) => order.status === status).length;
  const plural = (number, one, many) => `${number} ${number === 1 ? one : many}`;

  // Opens or closes the shop. Before launch, or without a price or a TWINT number, it cannot open: off to the Shop page.
  function toggleShop() {
    const open = !isLive();
    act(async () => {
      await api('PUT', 'admin/settings', { open });
      await loadData();
      fillForms();
      toast(open ? 'The shop is open. Buyers can order now.' : 'The shop is closed.');
    }, (text) => {
      toast(text);
      if (text === ERRORS['selling-off'] || text === ERRORS['price-missing'] || text === ERRORS['twint-missing']) selectTab('shop');
    });
  }
  shopToggle.addEventListener('click', toggleShop);

  /* The first steps, shown until the shop can sell: stock, price, payment details,
     on the website, open. Each has a button to where it is done. */
  function setupSteps() {
    const payable = canBePaid();
    return [
      { done: settings.stock.blue + settings.stock.black > 0 || orders.length > 0, title: 'Add your stock',
        hint: 'Tell the shop how many pads you have.', label: 'Add stock', run: () => selectTab('inventory') },
      { done: settings.price > 0, title: 'Set your price',
        hint: 'Price per pad and shipping per order.', label: 'Set price', run: () => selectTab('shop') },
      { done: payable, title: 'Set up the payment',
        hint: 'Connect Payrexx so TWINT payments are confirmed by themselves — or add your TWINT number and check them by hand.', label: 'Set up', run: () => selectTab('shop') },
      { done: settings.selling, title: 'Put the shop on the website',
        hint: 'Until then the website has no cart, no terms and no shipping page: it says CC01 is in testing.', label: 'Shop page', run: () => selectTab('shop') },
      { done: isLive(), title: 'Open the shop',
        hint: 'From then on people can order on the product page.', label: 'Open shop', run: toggleShop }
    ];
  }

  // What needs you now, most urgent first.
  function alerts() {
    const list = [];
    const refunds = orders.filter((order) => order.refund && order.status === 'cancelled').length;
    if (refunds) {
      list.push({ tone: 'pay', text: `${plural(refunds, 'payment', 'payments')} arrived for a cancelled order whose pads were gone. Refund in your Payrexx account.`, label: 'Show', run: () => showOrders('cancelled') });
    }
    if (countOf('claimed')) {
      list.push({ tone: 'pay', text: `${plural(countOf('claimed'), 'buyer says', 'buyers say')} the TWINT payment is made. Check your TWINT app and confirm.`, label: 'Show', run: () => showOrders('claimed') });
    }
    if (countOf('paid')) {
      list.push({ tone: 'info', text: `${plural(countOf('paid'), 'order is', 'orders are')} paid and ready to ship.`, label: 'Show', run: () => showOrders('paid') });
    }
    // Stock warnings only once there has been stock: before that it is a setup step.
    if (movements.length || orders.length) {
      Object.keys(COLOUR_LABELS).forEach((colour) => {
        const stock = stockOf(colour);
        const go = { label: 'Inventory', run: () => selectTab('inventory'), stock: true };
        if (stock.level === 'out') list.push(Object.assign({ tone: 'out', text: `${COLOUR_LABELS[colour]} is sold out.` }, go));
        if (stock.level === 'low') list.push(Object.assign({ tone: 'low', text: `${COLOUR_LABELS[colour]} is running low: ${stock.available} left.` }, go));
      });
    }
    if (!mail.on) {
      list.push({ tone: 'info', text: 'The sign-in code by email is off: the password alone opens this backend, from any device.', label: 'Switch on', run: () => selectTab('account') });
    }
    return list;
  }

  /* Visitors: only those who accepted the cookie banner are counted, each once per day,
     with the country their device's time zone belongs to (server.js → countVisit). */
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const countryName = (code) => {
    if (code === 'ZZ') return 'Unknown';
    try { return regionNames.of(code) || code; } catch (_) { return code; }
  };

  /* The world map (outlines in world.js): countries with visitors are filled, the more
     visitors the stronger, and carry a dot that grows with their number — so a country
     too small to see on the map shows as well. Built once, then only repainted. */
  const SVG = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => {
    const node = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach((name) => node.setAttribute(name, attrs[name]));
    return node;
  };
  const world = window.ALVIA_WORLD;
  let mapShapes = null; // country code → its outline
  let mapDots = null;   // the layer the dots are drawn on

  function buildMap() {
    const svg = svgEl('svg', { viewBox: `0 0 ${world.width} ${world.height}`, role: 'img', 'aria-label': 'World map of visitors by country. The table below holds the same numbers.' });
    svg.append(svgEl('path', { class: 'map__land', d: world.land }));
    mapShapes = new Map();
    Object.keys(world.countries).forEach((code) => {
      if (!world.countries[code][0]) return;
      const shape = svgEl('path', { class: 'map__land', d: world.countries[code][0] });
      shape.append(svgEl('title', {}));
      mapShapes.set(code, shape);
      svg.append(shape);
    });
    mapDots = svgEl('g', {});
    svg.append(mapDots);
    $('[data-map]').append(svg);
  }

  // countries: code → visitors.
  function renderMap(countries) {
    const figure = $('[data-map]');
    figure.hidden = !world;
    if (!world) return;
    if (!mapShapes) buildMap();
    const most = Math.max(1, ...countries.values());
    const label = (code) => `${countryName(code)}: ${plural(countries.get(code), 'visitor', 'visitors')}`;
    mapShapes.forEach((shape, code) => {
      const visitors = countries.get(code) || 0;
      shape.classList.toggle('is-visited', visitors > 0);
      if (visitors) shape.setAttribute('fill-opacity', (0.5 + 0.5 * visitors / most).toFixed(2));
      else shape.removeAttribute('fill-opacity');
      shape.firstChild.textContent = visitors ? label(code) : countryName(code);
    });
    // The biggest first, so a small dot is never hidden under a big one.
    mapDots.replaceChildren(...[...countries.keys()]
      .filter((code) => world.countries[code])
      .sort((a, b) => countries.get(b) - countries.get(a))
      .map((code) => {
        const dot = svgEl('circle', { class: 'map__dot', cx: world.countries[code][1], cy: world.countries[code][2], r: (3 + 6 * Math.sqrt(countries.get(code) / most)).toFixed(1) });
        const title = svgEl('title', {});
        title.textContent = label(code);
        dot.append(title);
        return dot;
      }));
  }

  function renderVisits() {
    // The days the server has a count for, out of the last `count` days.
    const lastDays = (count) => {
      const end = Date.parse(`${visits.today}T12:00:00Z`);
      return Array.from({ length: count }, (_, back) => visits.days[new Date(end - back * 86400000).toISOString().slice(0, 10)]).filter(Boolean);
    };
    // "Today" and "Last 7 days" stay; everything else follows the chosen span.
    const range = lastDays(visitRange);
    const total = sum(range, (day) => day.visitors);
    $('[data-visits="today"]').textContent = String(sum(lastDays(1), (day) => day.visitors));
    $('[data-visits="week"]').textContent = String(sum(lastDays(7), (day) => day.visitors));
    $('[data-visits="range"]').textContent = String(total);
    $('[data-visits="first"]').textContent = String(sum(range, (day) => day.first));
    $$('[data-visits-range]').forEach((node) => { node.textContent = `${node.dataset.visitsRange} ${visitRange} days`; });
    $$('[data-visit-range]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.visitRange) === visitRange));
    });

    const countries = new Map();
    range.forEach((day) => Object.keys(day.countries).forEach((code) => {
      countries.set(code, (countries.get(code) || 0) + day.countries[code]);
    }));
    renderMap(countries);
    $('[data-countries]').replaceChildren(table(
      [{ label: `Country (last ${visitRange} days)` }, { label: 'Visitors', num: true }, { label: 'Share', num: true }],
      [...countries.keys()].sort((a, b) => countries.get(b) - countries.get(a) || countryName(a).localeCompare(countryName(b))).map((code) =>
        [countryName(code), String(countries.get(code)), `${Math.round(countries.get(code) / total * 100)} %`]),
      'No visitors counted yet.'));
    $('[data-visits-note]').textContent = settings.statistics
      ? 'Only visitors who press "Accept" in the cookie banner are counted, so more people visit than these numbers show. The country is the one the time zone of the visitor\'s device belongs to. You are not counted while you are signed in here.'
      : 'The cookie banner and the visitor statistics are switched off (Shop page): the website sets no cookies and counts nobody.';
  }

  $$('[data-visit-range]').forEach((button) => button.addEventListener('click', () => {
    visitRange = Number(button.dataset.visitRange);
    renderVisits();
  }));

  function renderOverview() {
    const count = countOf;
    const live = isLive();

    $('[data-stat="claimed"]').textContent = String(count('claimed'));
    $('[data-stat="paid"]').textContent = String(count('paid'));
    $('[data-stat="revenue"]').textContent = money(sum(orders.filter(counts), (order) => order.total), settings.currency);
    $('[data-stat="stock"]').textContent = `${settings.stock.blue} · ${settings.stock.black}`;

    shopToggle.setAttribute('aria-pressed', String(live));
    $('[data-shop-toggle-label]').textContent = live ? 'Shop open' : 'Shop closed';

    const badge = $('[data-new-count]');
    badge.textContent = String(count('claimed'));
    badge.hidden = count('claimed') === 0;
    // Also in the browser tab, so a paid order is seen while another tab is open.
    document.title = count('claimed') ? `(${count('claimed')}) ALVIA — Admin` : 'ALVIA — Admin';

    const steps = setupSteps();
    $('[data-setup]').hidden = steps.every((step) => step.done);
    $('[data-setup-steps]').replaceChildren(...steps.map((step) => {
      const go = el('button', { class: 'btn btn--accent btn--small', type: 'button', text: step.label });
      go.addEventListener('click', step.run);
      return el('li', { class: `setup__step${step.done ? ' is-done' : ''}` }, [
        el('span', { class: 'setup__mark' }),
        el('span', { class: 'setup__text' }, [el('strong', { text: step.title }), el('span', { text: step.hint })]),
        step.done ? null : go
      ]);
    }));

    const list = alerts();
    const hour = new Date().getHours();
    $('[data-hello]').textContent = `${hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening')}.`;
    $('[data-hello-sub]').textContent = list.length
      ? `${plural(list.length, 'thing needs', 'things need')} you today.`
      : (live ? 'All done — nothing is waiting for you.' : (settings.selling ? 'The shop is closed at the moment.' : 'Before launch: the website has no shop yet.'));

    $('[data-stock-count]').hidden = !list.some((alert) => alert.stock);
    const alertsEl = $('[data-alerts]');
    alertsEl.hidden = list.length === 0;
    alertsEl.replaceChildren(...list.map((alert) => {
      const go = el('button', { class: 'btn btn--small', type: 'button', text: alert.label });
      go.addEventListener('click', alert.run);
      return el('li', { class: `alerts__item alerts__item--${alert.tone}` }, [el('span', { text: alert.text }), go]);
    }));

    // The buttons above the order list: which is chosen, and how many each holds.
    $$('[data-status-filter]').forEach((button) => {
      const status = button.dataset.statusFilter;
      button.setAttribute('aria-pressed', String(status === filterStatus.value));
      $('[data-status-count]', button).textContent = String(status ? count(status) : orders.length);
    });

    // Money that came in, by the month the order was placed.
    const months = new Map();
    orders.filter(counts).forEach((order) => {
      const key = order.createdAt.slice(0, 7);
      const month = months.get(key) || { orders: 0, pads: 0, revenue: 0 };
      month.orders += 1;
      month.pads += order.quantity;
      month.revenue += order.total;
      months.set(key, month);
    });
    const monthName = (key) => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(`${key}-15T12:00:00Z`));
    $('[data-months]').replaceChildren(table(
      [{ label: 'Month' }, { label: 'Orders', num: true }, { label: 'Pads', num: true }, { label: 'Revenue', num: true }],
      [...months.keys()].sort().reverse().slice(0, 12).map((key) => {
        const month = months.get(key);
        return [monthName(key), String(month.orders), String(month.pads), money(month.revenue, settings.currency)];
      }),
      'No paid orders yet.'));
  }

  /* =====================================================
     Draw, load, start
     ===================================================== */
  function render() {
    renderOverview();
    renderVisits();
    fillOrders($('[data-latest]'), orders.slice(0, 5), 'No orders yet.');
    const shown = filteredOrders();
    fillOrders($('[data-orders]'), shown, orders.length ? 'No order matches the filter.' : 'No orders yet.');
    $('[data-orders-count]').textContent = `${shown.length} of ${orders.length} orders`;
    renderInventory();
    renderCustomers();
  }

  async function loadData() {
    const data = await api('GET', 'admin/data');
    settings = data.settings;
    orders = data.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first
    movements = data.movements;
    visits = data.visits || { today: new Date().toISOString().slice(0, 10), days: {} };
    payrexx = data.payrexx || { connected: false, instance: '', fromEnv: false };
    mail = data.mail || { on: false, to: '', fromEnv: false };
    appError('');
    unsaved = false;
    render();
    // A buyer has paid since the last look: say so.
    const waiting = countOf('claimed');
    if (seenClaimed !== null && waiting > seenClaimed) toast(waiting - seenClaimed === 1 ? 'A buyer has paid — check your TWINT app.' : 'New payments — check your TWINT app.');
    seenClaimed = waiting;
    // The same for a payment Payrexx has confirmed: that order is ready to ship.
    const confirmed = orders.filter((order) => (order.history || []).some((entry) => entry.status === 'paid' && entry.note === 'payrexx')).length;
    if (seenPaid !== null && confirmed > seenPaid) toast(confirmed - seenPaid === 1 ? 'A TWINT payment has arrived — one order is ready to ship.' : 'TWINT payments have arrived — orders are ready to ship.');
    seenPaid = confirmed;
    showPayrexx();
    showMail();
  }

  async function openBackend(username) {
    $('[data-username]').textContent = username;
    passwordForm.elements.username.value = username;
    await loadData();
    fillForms();
    [settingsMessage, passwordMessage, mailMessage, adjustMessage, thresholdMessage].forEach((node) => note(node, ''));
    selectTab(window.location.hash.slice(1));
    show('app');
  }

  $('[data-refresh]').addEventListener('click', () => act(loadData));
  /* New orders show by themselves: the data is read again every 15 seconds while the
     page is open, and when coming back to the tab. Not while a field is being filled
     in — a redraw would throw the typing away. */
  const typing = () => document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
  // A parcel number or note typed into an order but not saved yet must survive, too.
  let unsaved = false;
  document.addEventListener('input', (event) => { if (event.target.closest('.order')) unsaved = true; });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && settings && !typing() && !unsaved) act(loadData);
  });
  window.setInterval(() => {
    if (document.hidden || !settings || typing() || unsaved) return;
    // Quietly: a server that is away for a moment is not worth an error on screen.
    loadData().catch((error) => { if (error.status === 401) showLogin(message(error)); });
  }, 15000);

  // Start: straight in if this browser is still signed in.
  (async () => {
    try {
      const session = await api('GET', 'session');
      if (session.signedIn) await openBackend(session.username);
      else if (savedWaiting()) showCode(savedWaiting());
      else showLogin('');
    } catch (error) {
      showLogin(message(error));
    }
  })();
})();
