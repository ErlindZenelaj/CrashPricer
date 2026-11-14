(function () {
  'use strict';

  const button = document.querySelector('[data-open-app]');
  const query = new URLSearchParams(window.location.search);
  const destination = query.get('to');

  if (destination !== 'offer' && destination !== 'offers') return;

  const offerId = query.get('id');
  const requestId = query.get('requestId');
  const guid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

  if (destination === 'offer' && guid.test(offerId ?? '') && guid.test(requestId ?? '')) {
    button.href = `crashpricer://offer/${offerId}?requestId=${requestId}`;
    button.textContent = button.dataset.offerLabel;
    return;
  }

  button.href = 'crashpricer://offers';
  button.textContent = button.dataset.offersLabel;
})();
