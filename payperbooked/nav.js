(function () {
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  var host = String(location.hostname || '').toLowerCase();
  if (host === 'payperbooked.com' || host === 'www.payperbooked.com') return;
  var map = {
    '/': '/pay-per-booking',
    '/pricing': '/payperbooked/pricing',
    '/booking': '/payperbooked/booking',
    '/#faq': '/pay-per-booking#faq',
    '/#hvac': '/pay-per-booking#hvac',
    '/#towns': '/pay-per-booking#towns',
    '/#qualify': '/pay-per-booking#qualify',
    '/#price-math': '/pay-per-booking#price-math',
    '/#trades': '/pay-per-booking#trades',
    '/#counts': '/pay-per-booking#counts'
  };
  document.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (map[href]) link.setAttribute('href', map[href]);
  });
})();
