/* =====================================================
   ALVIA — cookie banner and visitor count
   =====================================================
   Loaded on every page after script.js. The site's own server counts visitors per day
   and country (server/server.js → "Visitor statistics"), but only those who agree:
     no answer yet → the banner asks, at the bottom of the page. Nothing is counted.
     "Accept"      → the server is told once a day, with the time zone of this device
                     (the country is read from it).
     "Decline"     → nothing is sent, nothing is counted.
   The answer and the day of the last count are kept in two cookies, both set by the
   server (alvia_consent, alvia_visit). "Cookie settings" in the footer opens the banner
   again. Only where the server counts does it mark the page (is-counting): on a
   files-only host there is no banner. All copy lives in script.js (keys consent.*).
   ===================================================== */
(function () {
  'use strict';

  const i18n = window.ALVIA_I18N;
  if (!i18n || !document.documentElement.classList.contains('is-counting')) return;

  const cookie = (name) => {
    const match = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(document.cookie);
    return match ? match[1] : '';
  };
  const zone = () => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { return ''; }
  };
  // The server's days begin at midnight in Switzerland (dayOf in server.js).
  const today = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date()).split('/').reverse().join('-');
  // keepalive: the answer also arrives when the visitor clicks on to the next page at once.
  const send = (path, body) => fetch(`/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    keepalive: true
  }).catch(() => {});

  let banner = null;  // built the first time it is shown
  let opener = null;  // the footer button, when the banner was opened from there

  function choose(choice) {
    banner.hidden = true;
    send('consent', choice === 'yes' ? { choice, zone: zone() } : { choice });
    if (opener) opener.focus();
    opener = null;
  }

  /* Not a dialog: the page stays usable while the banner is waiting. Both answers are
     buttons side by side and one click each; "Accept" is the wider, coloured one.
     data-i18n keeps the copy in step with the language. */
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  function buildBanner() {
    const node = document.createElement('section');
    node.className = 'consent';
    node.setAttribute('aria-labelledby', 'consent-title');
    node.innerHTML = `
      <div class="consent__head">
        <span class="consent__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5Z"/><path stroke-width="2.2" d="M8.5 9.5h.01M8 14.5h.01M12.5 16.5h.01M12.5 11.5h.01M16.5 14.5h.01"/></svg></span>
        <h2 class="consent__title" id="consent-title" tabindex="-1" data-i18n="consent.title"></h2>
      </div>
      <p class="consent__text"><span data-i18n="consent.text"></span> <a href="privacy.html" data-i18n="consent.more"></a></p>
      <div class="consent__actions">
        <button class="button consent__button consent__button--quiet" type="button" data-consent="no" data-i18n="consent.decline"></button>
        <button class="button button--accent consent__button consent__button--accept" type="button" data-consent="yes">${CHECK}<span data-i18n="consent.accept"></span></button>
      </div>`;
    node.querySelectorAll('[data-consent]').forEach((button) => {
      button.addEventListener('click', () => choose(button.dataset.consent));
    });
    document.body.append(node);
    i18n.translate(node);
    return node;
  }

  function show() {
    if (!banner) banner = buildBanner();
    banner.hidden = false;
  }

  // "Cookie settings" at the end of the legal links: the answer can be changed at any time.
  const legal = document.querySelector('.footer__legal');
  if (legal) {
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.setAttribute('data-i18n', 'footer.cookies');
    settings.textContent = i18n.t('footer.cookies');
    settings.addEventListener('click', () => {
      opener = settings;
      show();
      banner.querySelector('.consent__title').focus();
    });
    legal.append(settings);
  }

  const answer = cookie('alvia_consent');
  if (answer === 'yes') {
    if (cookie('alvia_visit') !== today()) send('visit', { zone: zone() });
  } else if (answer !== 'no') {
    show();
  }
})();
