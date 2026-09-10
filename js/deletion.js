/* ============================================================
   CrashPricer — account deletion, request and confirm

   Two small forms, no dependencies, driven entirely by data-*
   attributes the page generator writes, so the same script
   serves both languages without carrying a dictionary.

   Nothing here ever collects a password. The proof that the
   request is the account holder's is possession of the mailed
   link, which is the whole point of the flow: the people who
   need it have already uninstalled the app.
   ============================================================ */
(function () {
  'use strict';

  function setStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message;
    el.className = 'doc__note doc__note--' + (kind === 'error' ? 'warn' : 'calm');
    el.hidden = false;
  }

  /* ── asking for the link ────────────────────────────────── */
  var form = document.querySelector('[data-deletion-form]');
  if (form) {
    var status = document.querySelector('[data-deletion-status]');
    var button = form.querySelector('button');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = (form.querySelector('input[type="email"]') || {}).value || '';
      if (!email.trim()) return;

      button.disabled = true;
      setStatus(status, form.dataset.sending, 'ok');

      fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
        .then(function (response) {
          // 202 whether or not the address had an account — the server will
          // not say, and neither will this page. Anything else is a genuine
          // transport or server failure worth telling the person about,
          // because otherwise they wait for an email that was never sent.
          if (response.ok || response.status === 202) {
            setStatus(status, form.dataset.sent, 'ok');
            form.reset();
          } else {
            setStatus(status, form.dataset.failed, 'error');
            button.disabled = false;
          }
        })
        .catch(function () {
          setStatus(status, form.dataset.failed, 'error');
          button.disabled = false;
        });
    });
  }

  /* ── confirming it ──────────────────────────────────────── */
  var confirmPanel = document.querySelector('[data-deletion-confirm]');
  if (confirmPanel) {
    var confirmPage = document.querySelector('[data-confirm-page]');
    var confirmTitle = document.querySelector('[data-confirm-title]');
    var confirmLede = document.querySelector('[data-confirm-lede]');
    var confirmStatus = document.querySelector('[data-confirm-status]');
    var confirmButton = confirmPanel.querySelector('button');
    var token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      confirmPanel.hidden = true;
      setStatus(confirmStatus, confirmPanel.dataset.missing, 'error');
    } else {
      // Deliberately requires a click rather than acting on load. Mail clients
      // and security scanners follow links in messages to preview or vet them;
      // deleting on page load would let a scanner erase the account before the
      // person ever opened the email.
      confirmButton.addEventListener('click', function () {
        confirmButton.disabled = true;
        setStatus(confirmStatus, confirmPanel.dataset.working, 'ok');

        fetch(confirmPanel.dataset.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token }),
        })
          .then(function (response) {
            if (response.ok) {
              confirmPanel.hidden = true;
              if (confirmPage) confirmPage.classList.add('is-complete');
              if (confirmTitle) confirmTitle.textContent = confirmPanel.dataset.doneTitle;
              if (confirmLede) confirmLede.textContent = confirmPanel.dataset.doneLede;
              setStatus(confirmStatus, confirmPanel.dataset.done, 'ok');
            } else {
              setStatus(confirmStatus, confirmPanel.dataset.invalid, 'error');
              confirmButton.disabled = false;
            }
          })
          .catch(function () {
            setStatus(confirmStatus, confirmPanel.dataset.failed, 'error');
            confirmButton.disabled = false;
          });
      });
    }
  }
})();
