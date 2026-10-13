/* =====================================================
   ALVIA — admin sign-in in the header (top right)
   =====================================================
   Loaded on every page after script.js. Adds a round account button next to the
   "Buy" button:
     signed out → it opens a small sign-in panel under the header
     signed in  → it carries a green dot and leads straight to the admin backend
   "Stay signed in" keeps this device signed in for 30 days (see server/server.js).
   A new device or connection is asked for an emailed code on the backend's own page.
   The button only appears when the site's own server answers; on a files-only host
   there is nothing to sign in to. All copy lives in script.js (keys account.*).
   ===================================================== */
(function () {
  'use strict';

  const i18n = window.ALVIA_I18N;
  const actions = document.querySelector('.nav__actions');
  if (!i18n || !actions) return;

  const ADMIN = 'admin/';
  const ERRORS = { 401: 'account.error.credentials', 429: 'account.error.rate' };

  const button = document.createElement('a');
  button.className = 'nav__account';
  button.href = ADMIN;
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/></svg><span class="nav__account-dot" hidden></span>';
  const dot = button.querySelector('.nav__account-dot');

  let signedIn = false;
  let dialog = null; // built the first time it is opened
  let sending = false;

  function renderButton() {
    const label = i18n.t(signedIn ? 'account.dashboard' : 'account.signin');
    button.setAttribute('aria-label', label);
    button.title = label;
    dot.hidden = !signedIn;
    if (signedIn) button.removeAttribute('aria-haspopup');
    else button.setAttribute('aria-haspopup', 'dialog');
  }

  // Text that follows the language switch on its own: the key travels with the element.
  function setLabel(element, key) {
    element.setAttribute('data-i18n', key);
    element.textContent = i18n.t(key);
  }

  /* The panel is a modal <dialog>: focus trap, Escape and focus return come from the
     browser. data-i18n keeps its copy in step with the language switch. */
  function buildDialog() {
    const node = document.createElement('dialog');
    node.className = 'account';
    node.setAttribute('aria-labelledby', 'account-title');
    node.innerHTML = `
      <form class="account__panel" novalidate>
        <header class="account__head">
          <h2 class="account__title" id="account-title" data-i18n="account.title"></h2>
          <button class="account__close" type="button" data-account-close data-i18n-aria="account.close"><span aria-hidden="true">×</span></button>
        </header>
        <label class="account__field"><span data-i18n="account.username"></span><input name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" autofocus required></label>
        <label class="account__field"><span data-i18n="account.password"></span><input name="password" type="password" autocomplete="current-password" required></label>
        <label class="account__check"><input name="remember" type="checkbox" checked><span data-i18n="account.remember"></span></label>
        <button class="button button--accent account__submit" type="submit"><span data-account-label data-i18n="account.submit"></span></button>
        <p class="account__message" data-account-message role="alert" hidden></p>
      </form>`;
    document.body.append(node);
    i18n.translate(node);

    const form = node.querySelector('form');
    const submit = form.querySelector('.account__submit');
    const label = form.querySelector('[data-account-label]');
    const message = form.querySelector('[data-account-message]');

    node.querySelector('[data-account-close]').addEventListener('click', () => node.close());
    // The form fills the dialog, so a click that lands on the dialog itself hit the backdrop.
    node.addEventListener('click', (event) => { if (event.target === node) node.close(); });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (sending) return;
      const fields = form.elements;
      if (!fields.username.value.trim() || !fields.password.value) {
        (fields.username.value.trim() ? fields.password : fields.username).focus();
        return;
      }
      sending = true;
      submit.disabled = true;
      message.hidden = true;
      setLabel(label, 'account.sending');
      let problem = 'account.error.send';
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ username: fields.username.value, password: fields.password.value, remember: fields.remember.checked })
        });
        if (response.ok) {
          /* On a device or connection not confirmed before, the server has emailed a code
             and answers with what the backend's sign-in page needs to ask for it. It is
             handed over for this tab only (admin/admin.js reads it). */
          const answer = await response.json().catch(() => null);
          if (answer && answer.step === 'code') {
            try { window.sessionStorage.setItem('alvia_code', JSON.stringify(answer)); } catch (_) {}
          }
          window.location.href = ADMIN;
          return; // the button stays busy until the backend has opened
        }
        problem = ERRORS[response.status] || problem;
      } catch (_) {}
      sending = false;
      submit.disabled = false;
      setLabel(label, 'account.submit');
      setLabel(message, problem);
      message.hidden = false;
      fields.password.select();
    });
    return node;
  }

  button.addEventListener('click', (event) => {
    if (signedIn) return; // a plain link to the backend
    event.preventDefault();
    if (!dialog) dialog = buildDialog();
    if (!dialog.open) dialog.showModal();
  });

  async function check() {
    try {
      const response = await fetch('/api/session', { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      signedIn = Boolean((await response.json()).signedIn);
    } catch (_) {
      return; // no server behind this page: no button
    }
    renderButton();
    if (!button.isConnected) actions.insertBefore(button, actions.querySelector('.nav__shop'));
  }

  document.addEventListener('alvia:langchange', renderButton);
  // Back on the page (also out of the back/forward cache) after signing in or out elsewhere.
  window.addEventListener('pageshow', (event) => { if (event.persisted) check(); });
  check();
})();
