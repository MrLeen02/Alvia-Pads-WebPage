/* =====================================================
   ALVIA — the cart
   =====================================================
   Loaded on every page after script.js. Two things:
     · window.ALVIA_CART — what is in the cart, kept in this browser (localStorage),
       so it survives a reload and is the same in every tab. Used by shop.js (product
       page) and checkout.js (cart page).
     · the cart button in the header, with the number of pads in it.
   The cart holds a quantity per colourway: { blue: 1, black: 2 }. Prices and stock
   are never stored here — they always come fresh from the server.
   All copy lives in script.js (keys cart.*).
   ===================================================== */
(function () {
  'use strict';

  const KEY = 'alvia.cart';
  const COLOURS = ['blue', 'black'];
  const CHANGE = 'alvia:cartchange';

  // Whatever is in storage, only whole positive quantities of known colourways come out.
  function get() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
    const cart = {};
    COLOURS.forEach((colour) => {
      const quantity = Math.floor(Number(saved[colour]));
      if (quantity > 0) cart[colour] = Math.min(quantity, 99);
    });
    return cart;
  }

  function save(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {}
    document.dispatchEvent(new CustomEvent(CHANGE));
  }

  function set(colour, quantity) {
    const cart = get();
    if (quantity > 0) cart[colour] = quantity;
    else delete cart[colour];
    save(cart);
  }

  const count = () => COLOURS.reduce((total, colour) => total + (get()[colour] || 0), 0);

  window.ALVIA_CART = {
    COLOURS,
    CHANGE,
    get,
    set,
    add: (colour, quantity) => set(colour, (get()[colour] || 0) + quantity),
    clear: () => save({}),
    count
  };

  // Another tab changed the cart.
  window.addEventListener('storage', (event) => {
    if (event.key === KEY) document.dispatchEvent(new CustomEvent(CHANGE));
  });

  /* =====================================================
     Header button
     ===================================================== */
  const i18n = window.ALVIA_I18N;
  const actions = document.querySelector('.nav__actions');
  if (!i18n || !actions) return;
  // Before launch the website has no shop, so no cart button either (see SELLING in script.js).
  if (!document.documentElement.classList.contains('is-selling')) return;

  const button = document.createElement('a');
  button.className = 'nav__cart';
  button.href = 'cart.html';
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="nav__cart-count" hidden></span>';
  const badge = button.querySelector('.nav__cart-count');
  if (document.body.dataset.page === 'cart') button.setAttribute('aria-current', 'page');
  actions.insertBefore(button, actions.querySelector('.nav__shop'));

  function render() {
    const pads = count();
    if (pads && badge.textContent && badge.textContent !== String(pads)) {
      // Restart the pop on the badge (see cart-bump in shop.css).
      badge.classList.remove('is-bumped');
      void badge.offsetWidth;
      badge.classList.add('is-bumped');
    }
    badge.textContent = String(pads);
    badge.hidden = pads === 0;
    const label = pads ? i18n.t('cart.open.count').replace('{count}', pads) : i18n.t('cart.open');
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  document.addEventListener(CHANGE, render);
  document.addEventListener('alvia:langchange', render);
  render();
})();
