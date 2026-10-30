(function () {
  'use strict';
  var form = document.getElementById('ppb-calc');
  if (!form) return;
  var count = document.getElementById('ppb-count');
  var range = document.getElementById('ppb-range');
  var trade = 'HVAC';
  var picks = Array.from(form.querySelectorAll('[data-trade]'));
  function money(n) { return '$' + n.toLocaleString('en-US'); }
  function render() {
    var n = Math.max(0, Math.min(80, parseInt(count.value, 10) || 0));
    count.value = range.value = String(n);
    var raw = 49 + 29 * n;
    document.getElementById('ppb-total').textContent = money(Math.min(raw, 499));
    document.getElementById('ppb-detail').textContent = trade + ', ' + n + ' confirmed ' + (n === 1 ? 'booking' : 'bookings') + ': $49 + $29 × ' + n + ' = ' + money(raw) + '. ' + (raw > 499 ? 'The $499 cap applies, so you pay $499.' : 'Under the $499 cap.');
    document.getElementById('ppb-trade-example').textContent = trade + ' uses the same $49 base, $29 per confirmed booking and $499 monthly cap.';
  }
  picks.forEach(function (button) { button.addEventListener('click', function () {
    trade = button.textContent.trim();
    picks.forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
    render();
  }); });
  count.addEventListener('input', render);
  range.addEventListener('input', function () { count.value = range.value; render(); });
  form.addEventListener('submit', function (event) { event.preventDefault(); render(); });
  render();
})();
