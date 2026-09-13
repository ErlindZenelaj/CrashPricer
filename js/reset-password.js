/* ============================================================
   CrashPricer — password reset hand-off

   The reset token arrives here as a query parameter and leaves
   as an app deep link. No dependencies and no dictionary: the
   page writes its copy into data-* attributes so one script
   serves both languages.

   The token is never sent anywhere from this page. It is only
   handed to the app, which is what redeems it.

   A reset token is single use, so once the app has actually
   taken over, this page stops offering the token and points at
   the app's home instead — otherwise coming back to the tab
   leaves a button that reopens a form the token can no longer
   satisfy.
   ============================================================ */
(function () {
  'use strict';

  var page = document.querySelector('[data-reset-page]');
  if (!page) return;

  var status = document.querySelector('[data-reset-status]');
  var action = document.querySelector('[data-reset-action]');
  var hint = document.querySelector('[data-reset-hint]');
  var prompt = document.querySelector('[data-reset-prompt]');

  function setStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.className = 'doc__note doc__note--' + (kind === 'error' ? 'warn' : 'calm');
    status.hidden = false;
  }

  function token() {
    try {
      return new URLSearchParams(window.location.search).get('token') || '';
    } catch (err) {
      return '';
    }
  }

  var raw = token();

  if (!raw) {
    if (action) action.hidden = true;
    if (hint) hint.hidden = true;
    setStatus(page.dataset.missing, 'error');
    return;
  }

  var link = page.dataset.scheme + '?token=' + encodeURIComponent(raw);
  if (action) action.setAttribute('href', link);

  var handedOff = false;
  var spent = false;

  function spend() {
    if (spent) return;
    spent = true;

    // The token is gone from the visible URL as well: a reset link is worth
    // protecting from a shoulder, a screenshot or a shared tab.
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) {
      /* a stale address bar is not worth failing the page over */
    }

    if (prompt) prompt.textContent = page.dataset.spentPrompt;
    if (hint) hint.hidden = true;
    if (action) {
      action.setAttribute('href', page.dataset.home);
      action.textContent = page.dataset.spentAction;
    }
    setStatus(page.dataset.spentNote, 'ok');
  }

  // Hidden then visible again means the app took the hand-off and the person
  // has come back. A dismissed system prompt never hides the page, so the
  // button survives for a genuine retry.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      handedOff = true;
    } else if (handedOff) {
      spend();
    }
  });

  if (action) {
    action.addEventListener('click', function () {
      handedOff = true;
    });
  }

  try {
    window.location.href = link;
  } catch (err) {
    /* the button below is the fallback */
  }

  if (hint) {
    window.setTimeout(function () {
      if (!spent) hint.hidden = false;
    }, 1200);
  }
})();
