/* =====================================================
   ALVIA — the cart page (cart.html)
   =====================================================
   Loaded on cart.html after script.js and cart.js. Shows what is in the cart with
   today's price and stock from the server, takes the delivery address, and then leads
   through the payment by TWINT, before the order counts. All copy lives in script.js
   (keys cart.*, order.*, pay.*, done.*, shop.*).

   The server says which of two ways of paying applies (shop.pay, and pay.online of an order):
     online   the shop has a payment provider (Payrexx). The buyer is sent to its
              payment page, which shows the TWINT QR code for exactly this order, and
              comes back here afterwards. Only the provider can say an order is paid:
              this page just keeps asking the server until it is.
     manual   no provider. The buyer pays to the owner's TWINT number and says so here
              ("I have paid"); the owner checks the TWINT app and confirms it in the
              admin backend.
   Either way the thank-you asks the server every few seconds where the order stands.

   One block, six faces:
     cart     → the lines, the sums, the address, "Continue to payment"
     pay      → the order is started and its pads are held, with a clock. Online: the
                button to the payment page. Manual: amount, TWINT number or QR code,
                order number, "I have paid"
     done     → the order is paid (manual: the buyer has said so); shows what happens next, live
     empty    → nothing in the cart
     closed   → the shop is switched off in the admin backend
     offline  → the server did not answer (for example on a files-only host)

   The started order is remembered in this browser (localStorage, key alvia.order: its
   id, a random key to it, number, total and what was in the cart), so a reload or a
   trip to the TWINT app and back lands on the same step.
   ===================================================== */
(function () {
  'use strict';

  const i18n = window.ALVIA_I18N;
  const cart = window.ALVIA_CART;
  const block = document.querySelector('[data-checkout]');
  if (!i18n || !cart || !block) return;

  const LOCALES = { en: 'en-CH', de: 'de-CH', fr: 'fr-CH' };
  const IMAGES = { blue: 'blue_top.webp', black: 'black_top.webp' };
  const NAMES = { blue: 'product.colorway.blue', black: 'product.colorway.black' };
  const KEY = 'alvia.order';
  const KEEP = 14 * 24 * 3600 * 1000; // how long the thank-you of a finished order comes back
  const ASK_EVERY = 8;                // seconds between two questions to the server
  const ASK_EVERY_ONLINE = 3;         // … while waiting for an online payment to arrive
  const DONE_STEPS = ['claimed', 'paid', 'shipped'];

  const form = block.querySelector('[data-checkout-form]');
  const faces = {
    cart: form,
    pay: block.querySelector('[data-checkout-pay]'),
    empty: block.querySelector('[data-checkout-empty]'),
    done: block.querySelector('[data-checkout-done]'),
    closed: block.querySelector('[data-checkout-closed]'),
    offline: block.querySelector('[data-checkout-offline]')
  };
  const linesEl = form.querySelector('[data-checkout-lines]');
  const summaryEl = form.querySelector('[data-checkout-summary]');
  const noticeEl = form.querySelector('[data-checkout-notice]');
  const subtotalEl = form.querySelector('[data-checkout-subtotal]');
  const shippingEl = form.querySelector('[data-checkout-shipping]');
  const totalEl = form.querySelector('[data-checkout-total]');
  const submit = form.querySelector('[data-checkout-submit]');
  const submitLabel = form.querySelector('[data-checkout-submit-label]');
  const messageEl = form.querySelector('[data-checkout-message]');
  const pay = {
    title: faces.pay.querySelector('[data-pay-title]'),
    timer: faces.pay.querySelector('[data-pay-timer]'),
    online: faces.pay.querySelector('[data-pay-online]'),
    manual: faces.pay.querySelector('[data-pay-manual]'),
    link: faces.pay.querySelector('[data-pay-link]'),
    wait: faces.pay.querySelector('[data-pay-wait]'),
    gone: faces.pay.querySelector('[data-pay-gone]'),
    qr: faces.pay.querySelector('[data-pay-qr]'),
    qrImg: faces.pay.querySelector('[data-pay-qr-img]'),
    amount: faces.pay.querySelector('[data-pay-amount]'),
    number: faces.pay.querySelector('[data-pay-number]'),
    ref: faces.pay.querySelector('[data-pay-ref]'),
    how: [...faces.pay.querySelectorAll('[data-pay-how]')],
    confirm: faces.pay.querySelector('[data-pay-confirm]'),
    cancel: faces.pay.querySelector('[data-pay-cancel]'),
    message: faces.pay.querySelector('[data-pay-message]'),
    copies: [...faces.pay.querySelectorAll('[data-copy]')]
  };
  const doneTitle = faces.done.querySelector('[data-checkout-done-title]');
  const doneBody = faces.done.querySelector('[data-checkout-done-body]');
  const doneStatus = faces.done.querySelector('[data-checkout-done-status]');
  const doneSteps = [...faces.done.querySelectorAll('[data-done-step]')];

  let shop = null;      // { open, price, shipping, currency, maxQuantity, stock, pay } from the server
  let face = null;
  let sending = false;
  let notice = null;    // catalogue key of the line above the list (the cart was changed for the buyer)
  let message = null;   // catalogue key of the line under the button
  let invalid = [];     // names of the address fields that still need attention
  let order = null;     // the started order, as remembered in this browser (see KEY)
  let view = null;      // where it stands, from the server: { status, expired, refund, total, payBy, pay: { online, link | twint, qr } }
  let payMessage = null;
  let seconds = 0;      // ticks of the clock since the last question to the server
  let asking = false;   // a question to the server is on its way

  // The address fields that are checked, here and again on the server.
  const REQUIRED = ['name', 'email', 'street', 'zip', 'city'];

  // Catalogue lookup with {placeholders}.
  function t(key, vars) {
    let text = i18n.t(key);
    Object.keys(vars || {}).forEach((name) => { text = text.replace(`{${name}}`, vars[name]); });
    return text;
  }

  // Amounts travel as whole Rappen.
  function money(rappen, currency) {
    const amount = rappen / 100;
    const code = currency || (shop && shop.currency) || 'CHF';
    try {
      return new Intl.NumberFormat(LOCALES[i18n.lang()] || 'en-CH', { style: 'currency', currency: code }).format(amount);
    } catch (_) {
      return `${code} ${amount.toFixed(2)}`;
    }
  }

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

  // True if the page was on another face before.
  function show(name) {
    const changed = face !== name;
    face = name;
    Object.keys(faces).forEach((key) => { faces[key].hidden = key !== name; });
    return changed;
  }

  /* =====================================================
     The started order, remembered in this browser
     ===================================================== */
  function readOrder() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
    const fine = saved && typeof saved.id === 'string' && typeof saved.token === 'string' && typeof saved.number === 'string'
      && Number.isFinite(saved.total) && Date.now() - saved.at < KEEP;
    return fine ? saved : null;
  }

  function writeOrder() {
    try {
      if (order) localStorage.setItem(KEY, JSON.stringify(order));
      else localStorage.removeItem(KEY);
    } catch (_) {}
  }

  /* Back from the payment page: the address carries the order and the key to it
     (?order=…&key=…). That is how the order is found again when the TWINT app comes
     back in another browser than the one the order was started in. Both are taken out
     of the address at once, so they are not kept in the history or shared by mistake. */
  function orderFromAddress() {
    let query;
    try { query = new URLSearchParams(window.location.search); } catch (_) { return null; }
    const id = query.get('order');
    const token = query.get('key');
    if (id === null && token === null) return null;
    query.delete('order');
    query.delete('key');
    const rest = query.toString();
    try { window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`); } catch (_) {}
    if (!/^[a-f0-9-]{36}$/.test(id || '') || !/^[a-f0-9]{48}$/.test(token || '')) return null;
    // Number, total and what was in the cart are not known yet: load() asks the server.
    return { id, token, number: '', total: 0, items: null, confirmed: false, at: Date.now() };
  }

  // Asks the server about the started order, or tells it something: status · paid · cancel.
  async function ask(action) {
    try {
      const response = await fetch(`/api/orders/${order.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token: order.token })
      });
      return { status: response.status, data: await response.json().catch(() => null) };
    } catch (_) {
      return { status: 0, data: null };
    }
  }

  // The pads of an order that did not happen go back into the cart — unless it has been filled again.
  function giveBack() {
    const items = order && order.items;
    order = null;
    view = null;
    writeOrder();
    if (items && cart.count() === 0) {
      cart.COLOURS.forEach((colour) => { if (items[colour] > 0) cart.set(colour, items[colour]); });
    }
  }

  /* =====================================================
     Cart: lines, sums, address
     ===================================================== */
  // The cart as lines, in a fixed order.
  const lines = () => cart.COLOURS.filter((colour) => cart.get()[colour]).map((colour) => ({ colour, quantity: cart.get()[colour] }));

  /* Brings the cart in line with what can be ordered right now: not more than is in
     stock, not more pads in total than one order may hold. True if it had to change. */
  function fit() {
    let room = shop.maxQuantity;
    let changed = false;
    lines().forEach((line) => {
      const most = Math.max(0, Math.min(shop.stock[line.colour] || 0, room));
      if (line.quantity > most) {
        cart.set(line.colour, most);
        changed = true;
      }
      room -= Math.min(line.quantity, most);
    });
    return changed;
  }

  function renderLine(line) {
    const name = t(NAMES[line.colour]);
    const room = shop.maxQuantity - cart.count();
    const decrease = el('button', { class: 'qty__btn', type: 'button', 'data-action': 'decrease', 'aria-label': t('shop.qty.dec'), text: '−' });
    const increase = el('button', { class: 'qty__btn', type: 'button', 'data-action': 'increase', 'aria-label': t('shop.qty.inc'), text: '+' });
    const remove = el('button', { class: 'buy__retry', type: 'button', 'data-action': 'remove', text: t('cart.remove') });
    decrease.disabled = sending || line.quantity <= 1;
    increase.disabled = sending || room <= 0 || line.quantity >= (shop.stock[line.colour] || 0);
    remove.disabled = sending;
    decrease.addEventListener('click', () => change(line.colour, line.quantity - 1));
    increase.addEventListener('click', () => change(line.colour, line.quantity + 1));
    remove.addEventListener('click', () => change(line.colour, 0));

    return el('li', { class: 'cart-line', 'data-colour': line.colour }, [
      el('img', { class: 'cart-line__img', src: IMAGES[line.colour], alt: '', width: '84', height: '84', loading: 'lazy' }),
      el('div', { class: 'cart-line__info' }, [
        el('p', { class: 'cart-line__title', text: 'ALVIA Control CC01' }),
        el('p', { class: 'cart-line__variant', text: name }),
        el('p', { class: 'cart-line__variant', text: t('cart.each', { price: money(shop.price) }) })
      ]),
      el('p', { class: 'cart-line__total', text: money(shop.price * line.quantity) }),
      el('div', { class: 'cart-line__controls' }, [
        el('div', { class: 'qty', role: 'group', 'aria-label': `${t('shop.quantity')} — ${name}` }, [
          decrease,
          el('output', { class: 'qty__value', text: String(line.quantity) }),
          increase
        ]),
        remove
      ])
    ]);
  }

  // Says under each address field what is missing, in the language of the page.
  function renderErrors() {
    REQUIRED.forEach((name) => {
      const bad = invalid.includes(name);
      const input = form.elements[name];
      const error = form.querySelector(`[data-error="${name}"]`);
      input.setAttribute('aria-invalid', String(bad));
      error.hidden = !bad;
      error.textContent = bad ? t(`order.invalid.${name}`) : '';
    });
  }

  function change(colour, quantity) {
    notice = null;
    message = null;
    cart.set(colour, quantity); // → the cart's change event → render()
  }

  function renderCart() {
    if (!shop) return;
    const list = lines();
    show(list.length ? 'cart' : 'empty');
    if (!list.length) return;

    // Rebuilding the list drops focus: remember which control had it and hand it back.
    const focused = linesEl.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = focused && { colour: focused.closest('[data-colour]').dataset.colour, action: focused.dataset.action };
    linesEl.replaceChildren(...list.map(renderLine));
    if (focusKey) {
      const row = linesEl.querySelector(`[data-colour="${focusKey.colour}"]`);
      const again = row && row.querySelector(`[data-action="${focusKey.action}"]`);
      if (again && !again.disabled) again.focus();
      else submit.focus();
    }

    // The same lines once more, short, next to the sums.
    summaryEl.replaceChildren(...list.map((line) => el('li', { class: 'summary__line' }, [
      el('img', { class: 'summary__img', src: IMAGES[line.colour], alt: '', width: '44', height: '44', loading: 'lazy' }),
      el('span', { class: 'summary__name', text: `${line.quantity} × ${t(NAMES[line.colour])}` }),
      el('span', { class: 'summary__amount', text: money(shop.price * line.quantity) })
    ])));

    const subtotal = shop.price * cart.count();
    subtotalEl.textContent = money(subtotal);
    shippingEl.textContent = shop.shipping > 0 ? money(shop.shipping) : t('cart.shipping.free');
    totalEl.textContent = money(subtotal + shop.shipping);

    noticeEl.hidden = !notice;
    noticeEl.textContent = notice ? t(notice, { count: shop.maxQuantity }) : '';
    submit.disabled = sending;
    form.setAttribute('aria-busy', String(sending));
    submitLabel.textContent = sending ? t('order.sending') : `${t('order.submit')} · ${money(subtotal + shop.shipping)}`;
    messageEl.hidden = !message;
    messageEl.textContent = message ? t(message, { count: shop.maxQuantity }) : '';
    renderErrors();
  }

  /* =====================================================
     Payment step and thank-you
     ===================================================== */
  // Not paid in time: the server has released the pads.
  const expired = () => view.status === 'cancelled' && view.expired;

  // "29:41" until the pads are released.
  function clock() {
    const left = Math.max(0, Math.round((Date.parse(view.payBy) - Date.now()) / 1000));
    return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }

  // The address of the provider's payment page, if it is one a buyer may be sent to.
  const payLink = () => (view && view.pay.online && /^https?:\/\//.test(view.pay.link || '') ? view.pay.link : '');

  function renderPay() {
    const total = money(view.total, view.currency);
    const online = Boolean(view.pay.online);
    pay.title.textContent = t('pay.title', { total });
    pay.online.hidden = !online;
    pay.manual.hidden = online;
    pay.cancel.disabled = sending;
    faces.pay.setAttribute('aria-busy', String(sending));
    pay.message.hidden = !payMessage;
    pay.message.textContent = payMessage ? t(payMessage) : '';

    if (online) {
      // The time is up but the server still looks for a payment made in the last moment.
      const over = !view.payBy || Date.parse(view.payBy) <= Date.now();
      pay.timer.textContent = over ? t('pay.online.checking') : t('pay.timer', { time: clock() });
      pay.timer.classList.remove('is-late');
      const link = payLink();
      pay.link.hidden = !link;
      pay.wait.hidden = !link;
      pay.gone.hidden = Boolean(link);
      if (link && pay.link.getAttribute('href') !== link) pay.link.setAttribute('href', link);
      return;
    }

    pay.timer.textContent = expired() ? t('pay.expired') : (view.payBy ? t('pay.timer', { time: clock() }) : '');
    pay.timer.classList.toggle('is-late', expired());

    pay.qr.hidden = !view.pay.qr;
    const picture = `/api/twint-qr?order=${order.id}&token=${order.token}`;
    if (view.pay.qr && pay.qrImg.getAttribute('src') !== picture) pay.qrImg.setAttribute('src', picture);

    pay.amount.textContent = total;
    pay.number.textContent = view.pay.twint;
    pay.ref.textContent = order.number;
    pay.how[0].textContent = t(view.pay.qr ? 'pay.how.1' : 'pay.how.1.number');
    pay.how[1].textContent = t('pay.how.2', { total, number: order.number });
    pay.how[2].textContent = t('pay.how.3');

    pay.confirm.disabled = sending;
  }

  function renderDone() {
    doneTitle.textContent = t('order.done.title', { number: order.number });
    // Paid, but only after the order was cancelled and its pads were gone: the money goes back.
    doneBody.hidden = Boolean(view.refund);
    doneBody.textContent = t(view.pay.online ? 'order.done.body.online' : 'order.done.body', { total: money(view.total, view.currency) });
    doneStatus.textContent = t(view.refund ? 'done.status.refund' : `done.status.${view.status}`);
    doneStatus.dataset.status = view.status;
    // "New" here means the owner set it back: the buyer's own step still stands.
    const reached = view.status === 'cancelled' ? -1 : Math.max(0, DONE_STEPS.indexOf(view.status));
    doneSteps.forEach((step, index) => step.classList.toggle('is-done', index <= reached));
  }

  function render() {
    if (face === 'pay') renderPay();
    else if (face === 'done') renderDone();
    else if (face === 'cart' || face === 'empty') renderCart();
  }

  /* Puts the page on the face that fits the started order — the payment step while it
     waits for "I have paid", the thank-you afterwards. True if the order took the page;
     false if there is none (any more) and the cart is to be shown. */
  function settle() {
    if (!order || !view) return false;
    if (view.refund && !order.confirmed) { // the thank-you says what happens with the money
      order.confirmed = true;
      writeOrder();
    }
    if (!order.confirmed && view.pay.online && expired()) {
      giveBack(); // no payment arrived in time: back to the cart, with a line that says so
      notice = 'pay.expired.online';
      return false;
    }
    if (!order.confirmed && (view.status === 'new' || expired())) {
      if (show('pay')) faces.pay.focus({ preventScroll: true });
      render();
      return true;
    }
    if (!order.confirmed && view.status === 'cancelled') {
      giveBack(); // cancelled before it was paid: back to the cart
      return false;
    }
    if (!order.confirmed) { // confirmed in another tab, or marked as paid by the owner
      order.confirmed = true;
      writeOrder();
    }
    if (cart.count() > 0 && face !== 'done') return false; // shopping again: the cart comes first
    show('done');
    render();
    return true;
  }

  // Asks the server where the started order stands and redraws.
  async function refresh() {
    if (!order || asking) return;
    seconds = 0;
    asking = true;
    const reply = await ask('status');
    asking = false;
    if (!order) return;
    if (reply.status === 404) { // the order is gone (deleted in the backend)
      if (order.confirmed) { order = null; view = null; writeOrder(); } else giveBack();
      await load();
      return;
    }
    if (reply.status !== 200 || !reply.data) return; // the server is away for a moment: try again later
    take(reply.data);
    if (!settle()) await load();
  }

  // The server's word on the started order. An order found by the address (see
  // orderFromAddress) learns its number and total here.
  function take(data) {
    view = data;
    if (order.number) return;
    order.number = data.number;
    order.total = data.total;
    writeOrder();
  }

  /* The lines on the cart face that say how paying works read differently when the
     payment is made online: nothing has to be confirmed by hand there. Each such line
     names its catalogue key in data-pay-word; online, the key with ".online" applies. */
  function word() {
    const online = Boolean(shop && shop.pay === 'online');
    block.querySelectorAll('[data-pay-word]').forEach((node) => {
      const key = node.dataset.payWord + (online ? '.online' : '');
      if (node.getAttribute('data-i18n') === key) return;
      node.setAttribute('data-i18n', key); // so a language switch keeps the right line
      node.textContent = t(key);
    });
  }

  // Asks the server what is on sale, and about a started order if there is one.
  async function load() {
    try {
      const response = await fetch('/api/shop', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      shop = await response.json();
    } catch (_) {
      shop = null;
    }
    word();
    if (!order) order = readOrder();
    if (order && !view) {
      const reply = await ask('status');
      if (reply.status === 200 && reply.data) take(reply.data);
      else if (reply.status === 404) { order = null; writeOrder(); }
    }
    if (settle()) return;
    if (!shop) { show('offline'); return; }
    if (!shop.open) { show('closed'); return; }
    face = 'cart';
    if (fit()) notice = 'cart.adjusted';
    render();
  }

  /* =====================================================
     What the buyer does
     ===================================================== */
  // "Continue to payment": starts the order, which holds its pads while the buyer pays.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !shop || !lines().length) return;
    const fields = new FormData(form);
    const request = { items: lines(), lang: i18n.lang(), country: 'CH' };
    ['name', 'email', 'street', 'zip', 'city', 'note', 'website'].forEach((name) => {
      request[name] = String(fields.get(name) || '').trim();
    });

    // Check the address here first, so nothing is sent that the server would turn down.
    invalid = REQUIRED.filter((name) => !request[name] || !form.elements[name].validity.valid);
    notice = null;
    message = invalid.length ? 'order.error.fields' : null;
    if (invalid.length) {
      render();
      form.elements[invalid[0]].focus();
      return;
    }

    sending = true;
    render();
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request)
      });
      const result = await response.json().catch(() => null);
      if (response.status === 201 && result) {
        order = { id: result.id, token: result.token, number: result.number, total: result.total, items: cart.get(), confirmed: false, at: Date.now() };
        view = result;
        writeOrder();
        sending = false;
        invalid = [];
        payMessage = null;
        seconds = 0;
        show('pay');   // before the cart empties, so its change event leaves this face alone
        cart.clear();
        render();
        faces.pay.scrollIntoView({ block: 'center' });
        faces.pay.focus({ preventScroll: true });
        // Online: on to the payment page with the TWINT QR code. The payment step drawn
        // just now is what the buyer finds if they come back without having paid.
        if (payLink()) window.location.assign(payLink());
        return;
      }
      if (response.status === 502) {
        message = 'order.error.payment'; // the provider's payment page could not be made
      } else if (response.status === 409) {
        // Sold out or switched off while the cart was open: show what is true now.
        message = result && result.error === 'stock' ? 'order.error.stock' : null;
      } else if (response.status === 429) {
        message = 'order.error.rate';
      } else if (response.status === 400) {
        // The server names what it did not accept: mark those fields, or say it is the cart.
        const refused = result && Array.isArray(result.fields) ? result.fields : [];
        invalid = REQUIRED.filter((name) => refused.includes(name));
        message = invalid.length ? 'order.error.fields' : (refused.includes('items') ? 'order.error.items' : 'order.error.send');
      } else {
        message = 'order.error.send';
      }
    } catch (_) {
      message = 'order.error.send';
    }
    sending = false;
    await load();
    if (invalid.length && face === 'cart') form.elements[invalid[0]].focus();
  });

  // A field that was marked is cleared as soon as it is put right.
  form.addEventListener('input', (event) => {
    const name = event.target.name;
    if (!invalid.includes(name) || !event.target.value.trim() || !event.target.validity.valid) return;
    invalid = invalid.filter((entry) => entry !== name);
    if (!invalid.length) message = null;
    render();
  });

  // "I have paid": from here the order waits for the owner to see the money.
  pay.confirm.addEventListener('click', async () => {
    if (sending || !order) return;
    sending = true;
    payMessage = null;
    render();
    const reply = await ask('paid');
    sending = false;
    if (reply.status === 200 && reply.data) {
      view = reply.data;
      order.confirmed = true;
      writeOrder();
      form.reset();
      show('done');
      render();
      faces.done.scrollIntoView({ block: 'center' });
      faces.done.focus({ preventScroll: true });
      return;
    }
    payMessage = reply.status === 409 && reply.data && reply.data.error === 'expired' ? 'pay.error.expired' : 'pay.error.send';
    render();
  });

  // Changed their mind before paying: the pads are released and go back into the cart.
  pay.cancel.addEventListener('click', async () => {
    if (sending || !order) return;
    sending = true;
    payMessage = null;
    render();
    const reply = await ask('cancel');
    sending = false;
    if (reply.status === 200 || reply.status === 404) {
      giveBack();
      await load();
      return;
    }
    if (reply.status === 409) { await refresh(); return; } // already confirmed elsewhere
    payMessage = 'pay.error.send';
    render();
  });

  // Copy buttons next to amount, number and order number: what gets typed into TWINT.
  pay.copies.forEach((button) => button.addEventListener('click', async () => {
    const text = { amount: (view.total / 100).toFixed(2), number: view.pay.twint, ref: order.number }[button.dataset.copy];
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      return; // no clipboard here: the value is on the page to read off
    }
    button.textContent = t('pay.copied');
    window.setTimeout(() => { button.textContent = t('pay.copy'); }, 1600);
  }));

  /* One clock for both order faces: the countdown on the payment step moves every
     second, and every few seconds the server is asked where the order stands — so the
     thank-you changes by itself when the owner confirms the payment or ships. */
  window.setInterval(() => {
    if (document.hidden || sending || !order || !view || (face !== 'pay' && face !== 'done')) return;
    seconds += 1;
    const finished = face === 'done' && (view.status === 'shipped' || view.status === 'cancelled');
    const online = Boolean(view.pay.online);
    // Manual: the moment the time is up, see what the server made of it. Online the
    // server waits a little longer for the provider, so the usual rhythm is enough.
    const late = !online && face === 'pay' && view.status === 'new' && view.payBy && Date.parse(view.payBy) <= Date.now();
    const every = online && face === 'pay' ? ASK_EVERY_ONLINE : ASK_EVERY;
    if (late || (!finished && seconds >= every)) refresh();
    else if (face === 'pay') renderPay();
  }, 1000);
  // Back from the TWINT app: see at once where things stand.
  document.addEventListener('visibilitychange', () => { if (!document.hidden && order && view) refresh(); });

  document.addEventListener(cart.CHANGE, () => { if (face === 'cart' || face === 'empty') render(); });
  document.addEventListener('alvia:langchange', render);
  // Back on the page (also out of the back/forward cache, e.g. "back" from the payment
  // page): stock may have moved, and a started order may be paid by now.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    if (order && view) refresh();
    else load();
  });

  // Coming back from the payment page, the order named in the address is the one that counts.
  const returned = orderFromAddress();
  order = readOrder();
  if (returned && (!order || order.id !== returned.id)) {
    order = returned;
    writeOrder();
  }
  load();
})();
