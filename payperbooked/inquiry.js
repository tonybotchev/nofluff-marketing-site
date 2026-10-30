(function () {
  'use strict';
  var form = document.getElementById('ppb-qualify');
  if (!form) return;
  form.hidden = false;
  var steps = Array.from(form.querySelectorAll('[data-step]'));
  var error = document.getElementById('ppb-qualify-error');
  var done = document.getElementById('ppb-qualify-done');
  var next = document.getElementById('ppb-next');
  var back = document.getElementById('ppb-back');
  var send = document.getElementById('ppb-send');
  var step = 0, locked = false;
  var key = 'ppb-inquiry-state-v1';
  var labels = ['Trade.', 'Town.', 'Monthly call volume.', 'Contact details.'];
  var value = function (id) { return document.getElementById('ppb-' + id).value.trim(); };
  function record(state) {
    try { if (state) sessionStorage.setItem(key, JSON.stringify(state)); else sessionStorage.removeItem(key); } catch (_) {}
  }
  function notice(message) { error.textContent = message; error.hidden = !message; }
  function valid(index) {
    if (index === 0) return !!form.querySelector('input[name="trade"]:checked');
    if (index === 1) return !!value('town');
    if (index === 2) return /^\d+$/.test(value('volume')) && Number(value('volume')) <= 10000;
    return value('name').length >= 2 && value('name').length <= 120 &&
      /^\d{10,15}$/.test(value('phone').replace(/\D/g, '')) &&
      value('email').length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'));
  }
  function show(index, focus) {
    step = index;
    steps.forEach(function (fieldset, i) { fieldset.hidden = i !== index; });
    document.getElementById('ppb-step-label').textContent = 'Step ' + (index + 1) + ' of 4. ' + labels[index];
    back.hidden = index === 0;
    next.hidden = index === steps.length - 1;
    send.hidden = index !== steps.length - 1;
    notice('');
    if (focus) steps[index].querySelector('input, select').focus();
  }
  function validationError() {
    notice(step === 2 ? 'Enter a whole number from 0 to 10,000.' :
      step === 3 ? 'Add your name, a 10 to 15 digit phone number, and a valid email.' : 'Choose an answer to continue.');
  }
  function busy(on) {
    send.disabled = on; next.disabled = on; back.disabled = on;
    form.setAttribute('aria-busy', String(on));
  }
  function accepted(reference) {
    locked = true; form.hidden = true; done.hidden = false;
    done.querySelector('h3').textContent = 'Your inquiry was submitted for email delivery.';
    done.querySelector('p').textContent = 'Delivery can take time. This does not reserve a pilot spot, book an appointment, or start paid service. If you do not hear back, call (940) 394-5656. Reference: ' + reference;
    done.focus();
  }
  function unknown(reference) {
    locked = true; busy(true);
    notice('We could not confirm whether your inquiry was submitted. To avoid a duplicate, do not send it again. Call (940) 394-5656 and quote reference ' + reference + '.');
  }
  next.addEventListener('click', function () {
    if (locked) return;
    if (!valid(step)) return validationError();
    show(Math.min(step + 1, 3), true);
  });
  back.addEventListener('click', function () { if (!locked) show(Math.max(step - 1, 0), true); });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (locked) return;
    if (step < 3) { next.click(); return; }
    for (var i = 0; i < steps.length; i++) {
      if (!valid(i)) { show(i, true); validationError(); return; }
    }
    locked = true; busy(true); notice('Submitting your inquiry...');
    var reference;
    try { reference = crypto.randomUUID(); } catch (_) {
      locked = false; busy(false);
      notice('Your inquiry was not submitted. Please call (940) 394-5656.');
      return;
    }
    var state = { reference: reference, status: 'unknown', expires: Date.now() + 86400000 };
    // Store only status/reference, never personal data. This guard survives page
    // navigation in this tab, but is not server-wide duplicate prevention.
    record(state);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    try {
      var response = await fetch('/api/lead-email', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value('name'), phone: value('phone'), email: value('email'),
          trade: form.querySelector('input[name="trade"]:checked').value,
          town: value('town'), volume: value('volume'), source: 'pay-per-booking',
          page: location.origin + location.pathname, company_website: value('company'), reference: reference })
      });
      var data = await response.json();
      if (response.status === 202 && data.ok === true && data.status === 'accepted' && data.reference === reference) {
        state.status = 'accepted'; record(state); accepted(reference);
      } else if ([400, 413, 503].includes(response.status) && data.ok === false && data.retryable === true) {
        record(null); locked = false; busy(false);
        notice(response.status === 400 || response.status === 413 ?
          'Please check your answers. Your inquiry was not submitted.' :
          'Your inquiry was not submitted. Your answers are saved on this page. Try again shortly or call (940) 394-5656.');
      } else { unknown(reference); }
    } catch (_) { unknown(reference); }
    finally { clearTimeout(timer); }
  });
  show(0, false);
  try {
    var saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && saved.expires > Date.now() && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(saved.reference)) {
      if (saved.status === 'accepted') accepted(saved.reference); else unknown(saved.reference);
    } else record(null);
  } catch (_) {}
})();
