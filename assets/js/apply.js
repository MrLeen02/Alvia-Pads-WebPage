/* =====================================================
   ALVIA — tester application (apply.html)
   =====================================================
   Loaded on apply.html after script.js. Checks the form, sends it and shows the
   confirmation. The application is delivered to the ALVIA inbox by FormSubmit
   (formsubmit.co): the address is the form's `action` in apply.html, and this file
   posts to that same address through the service's JSON endpoint, so the visitor
   stays on the page. Nothing is stored on this site.
   All copy lives in the shared catalogue in script.js (keys apply.*).

   FormSubmit asks the owner of the inbox to confirm it once: the very first
   application is answered with an "Activate Form" email instead of being delivered.
   Until that link is clicked, visitors see the "could not be sent" message.
   ===================================================== */
(function () {
  'use strict';

  const i18n = window.ALVIA_I18N;
  const form = document.querySelector('[data-apply]');
  if (!i18n || !form) return; // script.js did not run: the browser posts the form itself.

  const ENDPOINT = form.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/');
  const INBOX = 'alviapads@gmail.com'; // for the "send it by email instead" link
  const TIMEOUT = 20000;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const submit = form.querySelector('[data-apply-submit]');
  const submitLabel = form.querySelector('[data-apply-submit-label]');
  const messageEl = form.querySelector('[data-apply-message]');
  const doneEl = document.querySelector('[data-apply-done]');
  const required = [...form.querySelectorAll('[required]')];

  let sending = false;

  // The checks below speak the page's language; the browser's own bubbles do not.
  form.noValidate = true;

  // Text that follows the language switch on its own: the key travels with the element.
  function setLabel(element, key) {
    element.setAttribute('data-i18n', key);
    element.textContent = i18n.t(key);
  }

  /* =====================================================
     Checking the fields
     ===================================================== */
  // Catalogue key of what is wrong with a required field, or null.
  function problemOf(control) {
    if (control.type === 'checkbox') return control.checked ? null : 'apply.error.consent';
    const value = control.value.trim();
    if (!value) return 'apply.error.required';
    if (control.type === 'email' && !EMAIL.test(value)) return 'apply.error.email';
    return null;
  }

  // The line under a field, made the first time that field has something to say.
  function errorEl(control) {
    const id = `${control.id}-error`;
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement('p');
      element.className = 'field__error';
      element.id = id;
      control.closest('.field').append(element);
      control.setAttribute('aria-describedby', `${control.getAttribute('aria-describedby') || ''} ${id}`.trim());
    }
    return element;
  }

  // Shows or clears a field's error; true when the field is fine.
  function check(control) {
    const problem = problemOf(control);
    if (problem) {
      control.setAttribute('aria-invalid', 'true');
      const element = errorEl(control);
      setLabel(element, problem);
      element.hidden = false;
    } else if (control.hasAttribute('aria-invalid')) {
      control.removeAttribute('aria-invalid');
      errorEl(control).hidden = true;
    }
    return !problem;
  }

  // A field that was marked is checked again as it is corrected, not before.
  required.forEach((control) => {
    control.addEventListener(control.type === 'checkbox' ? 'change' : 'input', () => {
      if (control.hasAttribute('aria-invalid')) check(control);
    });
  });

  /* =====================================================
     Sending
     ===================================================== */
  // The line under the button; `mailto` adds the way out by email.
  function showMessage(key, mailto) {
    messageEl.replaceChildren();
    messageEl.hidden = !key;
    if (!key) return;
    const text = document.createElement('span');
    setLabel(text, key);
    messageEl.append(text);
    if (mailto) {
      const link = document.createElement('a');
      link.href = mailto;
      setLabel(link, 'apply.error.mail');
      messageEl.append(' ', link, '.');
    }
  }

  function setSending(state) {
    sending = state;
    submit.disabled = state;
    form.setAttribute('aria-busy', String(state));
    setLabel(submitLabel, state ? 'apply.sending' : 'apply.submit');
  }

  // The answers in the order of the form; optional fields left empty are left out.
  function answers() {
    const data = {};
    new FormData(form).forEach((value, name) => {
      const text = String(value).trim();
      if (text) data[name] = text;
    });
    return data;
  }

  // The same application as a ready-written email, for when the service cannot be reached.
  function mailtoFor(data) {
    const lines = Object.keys(data)
      .filter((name) => !name.startsWith('_') && name !== 'consent')
      .map((name) => `${name}: ${data[name]}`);
    return `mailto:${INBOX}?subject=${encodeURIComponent(data._subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  // Resolves once FormSubmit has accepted the application; throws otherwise.
  async function send(data) {
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), TIMEOUT);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: abort.signal
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || String(result.success) !== 'true') {
        throw new Error((result && result.message) || `HTTP ${response.status}`);
      }
    } finally {
      window.clearTimeout(timer);
    }
  }

  function showDone() {
    form.reset();
    form.hidden = true;
    doneEl.hidden = false;
    doneEl.scrollIntoView({ block: 'start' });
    doneEl.focus({ preventScroll: true });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;

    const invalid = required.filter((control) => !check(control));
    if (invalid.length) {
      showMessage('apply.error.check');
      invalid[0].focus();
      return;
    }

    const data = answers();
    // The subject carries the name, so two applications never thread into one email;
    // a reply goes to the applicant; the language says which one to answer in.
    data._subject = `${data._subject} (${data.name})`;
    data._replyto = data.email;
    data.language = i18n.lang();

    setSending(true);
    showMessage(null);
    try {
      // Only a bot fills the hidden field: it gets its thank-you and nothing is sent.
      if (!data._honey) await send(data);
      showDone();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[ALVIA apply] application not sent:', error.message);
      showMessage('apply.error.send', mailtoFor(data));
    }
    setSending(false);
  });
})();
