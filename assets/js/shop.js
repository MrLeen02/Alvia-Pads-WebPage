/* =====================================================
   ALVIA — buy box on the product page
   =====================================================
   Loaded on products.html after script.js and cart.js. Shows the price and puts pads
   in the cart; the order itself is placed on the cart page (cart.html, checkout.js).
   Price, stock and "shop open" come from the site's own server (server/server.js, set
   in the admin backend). All copy lives in script.js (keys shop.*, order.*, cart.*).

   One block, three faces:
     buy      → price, colourway, quantity, "Add to cart"
     closed   → the shop is switched off in the admin backend
     offline  → the server did not answer
   Before launch ("Shop on the website" is off, or a files-only host) none of them shows.
   ===================================================== */
(function () {
  'use strict';

  const i18n = window.ALVIA_I18N;
  const cart = window.ALVIA_CART;
  const block = document.querySelector('[data-shop]');
  if (!i18n || !cart || !block) return; // not the product page, or the scripts before did not run
  // Before launch the block stays away altogether (see SELLING in script.js).
  if (!document.documentElement.classList.contains('is-selling')) return;

  const LOCALES = { en: 'en-CH', de: 'de-CH', fr: 'fr-CH' };
  const LOW_STOCK = 5;

  const form = block.querySelector('[data-shop-buy]');
  const faces = {
    buy: form,
    closed: block.querySelector('[data-shop-closed]'),
    offline: block.querySelector('[data-shop-offline]')
  };
  const priceEl = form.querySelector('[data-shop-price]');
  const shippingEl = form.querySelector('[data-shop-shipping]');
  const stockEl = form.querySelector('[data-shop-stock]');
  const quantityEl = form.querySelector('[data-shop-quantity]');
  const decrease = form.querySelector('[data-shop-decrease]');
  const increase = form.querySelector('[data-shop-increase]');
  const submit = form.querySelector('[data-shop-submit]');
  const submitLabel = form.querySelector('[data-shop-submit-label]');
  const addedEl = form.querySelector('[data-shop-added]');
  const addedTextEl = form.querySelector('[data-shop-added-text]');
  const messageEl = form.querySelector('[data-shop-message]');

  let shop = null;      // { open, price, shipping, currency, maxQuantity, stock } from the server
  let face = null;
  let quantity = 1;
  let added = false;    // "it is in your cart", until the next change

  // Catalogue lookup with {placeholders}.
  function t(key, vars) {
    let text = i18n.t(key);
    Object.keys(vars || {}).forEach((name) => { text = text.replace(`{${name}}`, vars[name]); });
    return text;
  }

  // Amounts travel as whole Rappen.
  function money(rappen) {
    const amount = rappen / 100;
    try {
      return new Intl.NumberFormat(LOCALES[i18n.lang()] || 'en-CH', { style: 'currency', currency: shop.currency }).format(amount);
    } catch (_) {
      return `${shop.currency} ${amount.toFixed(2)}`;
    }
  }

  function show(name) {
    face = name;
    Object.keys(faces).forEach((key) => { faces[key].hidden = key !== name; });
  }

  // The colourway comes from <body data-variant>, which the gallery switch sets.
  const colour = () => document.body.dataset.variant || 'blue';

  function render() {
    if (face !== 'buy' || !shop) return;

    // How many more of this colourway fit: what is in stock, and the most per order.
    const inCart = cart.get();
    const available = shop.stock[colour()] || 0;
    const room = Math.max(0, Math.min(available - (inCart[colour()] || 0), shop.maxQuantity - cart.count()));
    quantity = Math.max(1, Math.min(quantity, room));

    priceEl.textContent = money(shop.price);
    shippingEl.textContent = shop.shipping > 0
      ? t('order.shipping.flat', { amount: money(shop.shipping) })
      : t('order.shipping.free');

    stockEl.hidden = available === 0 || available > LOW_STOCK || available >= shop.maxQuantity;
    stockEl.textContent = stockEl.hidden ? '' : t('order.stock.low', { count: available });

    quantityEl.textContent = String(quantity);
    decrease.disabled = quantity <= 1;
    increase.disabled = quantity >= room;

    submit.disabled = room === 0;
    submitLabel.textContent = t(available === 0 ? 'shop.soldout' : 'shop.add');

    // With something in the cart the way to it is always there.
    addedEl.hidden = cart.count() === 0;
    addedTextEl.textContent = added ? t('shop.added') : t('shop.incart', { count: cart.count() });
    // Nothing more fits although there is stock: say why the button is off.
    const full = room === 0 && available > 0 && !added;
    messageEl.hidden = !full;
    messageEl.textContent = full ? t(cart.count() >= shop.maxQuantity ? 'cart.max' : 'shop.full', { count: shop.maxQuantity }) : '';
  }

  // Asks the server what is on sale.
  async function load() {
    try {
      const response = await fetch('/api/shop', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      shop = await response.json();
    } catch (_) {
      shop = null;
    }
    show(!shop ? 'offline' : (shop.open ? 'buy' : 'closed'));
    render();
  }

  decrease.addEventListener('click', () => { quantity -= 1; added = false; render(); });
  increase.addEventListener('click', () => { quantity += 1; added = false; render(); });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!shop || submit.disabled) return;
    cart.add(colour(), quantity);
    quantity = 1;
    added = true;
    render();
  });

  // Price and stock follow the colourway switch; every line follows the language.
  new MutationObserver(() => { added = false; render(); }).observe(document.body, { attributes: true, attributeFilter: ['data-variant'] });
  document.addEventListener('alvia:langchange', render);
  document.addEventListener(cart.CHANGE, render);
  // Back on the page (also out of the back/forward cache): stock may have moved.
  window.addEventListener('pageshow', (event) => { if (event.persisted) load(); });

  load();
})();
