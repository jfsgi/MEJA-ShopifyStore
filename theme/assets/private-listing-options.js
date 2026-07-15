/*
 * Buyer-selectable OPTIONS on a private commission listing (G-41 hybrid flow) — the small sibling of
 * configurator.js scoped to a locked quote. Renders the curated add-ons (crm.editable_options) as
 * checkboxes; on each change it shows a local estimate immediately, then fetches a SIGNED price from
 * the CRM (/v1/listing-price) and drops the claim into the hidden line-item-property inputs. The
 * native product form carries those properties to the cart; the Cart Transform applies the signed unit
 * price; order ingest verifies + auto-promotes the picks. Never adds an UNSIGNED option to the cart.
 */
(function () {
  var root = document.getElementById('pl-options');
  if (!root) return;
  var CRM = (root.dataset.crmService || '').replace(/\/+$/, '');
  var listingId = root.dataset.listingId || '';
  var baseCents = parseInt(root.dataset.baseCents || '0', 10) || 0;
  var options;
  try { options = JSON.parse(root.dataset.options || '[]'); } catch (e) { options = []; }
  if (!CRM || !listingId || !options.length) return;

  var priceEl = document.getElementById('meja-price');
  var topPriceEl = document.querySelector('[data-pl-price]'); // the price by the title — keep it in step
  var pmodeEl = document.getElementById('meja-pmode');
  var unitPriceEl = document.getElementById('pl-unit-price');
  var sigEl = document.getElementById('pl-sig');
  var specHashEl = document.getElementById('pl-spec-hash');
  var expiresEl = document.getElementById('pl-expires');
  var keysEl = document.getElementById('pl-options-keys');

  var money = function (cents) { return '$' + (cents / 100).toFixed(2); };
  var centsOf = function (o) { return Math.round(parseFloat(o.price) * 100) || 0; };
  // Keep BOTH price displays in step — the one by the title and the one in the buy box.
  var setPrice = function (text) {
    if (priceEl) priceEl.textContent = text;
    if (topPriceEl) topPriceEl.textContent = text;
  };
  var selected = {}; // key -> option

  // Render: one checkbox per option, grouped by its piece + SIZE so two same-named pieces are
  // distinguishable ("Drawer Box/Pullout Tray · 36 × 21 × 8 in" vs "· 22 × 21 × 3 in").
  var groups = [];
  var byGroup = {};
  options.forEach(function (o) {
    var g = (o.pieceName || '') + (o.pieceSize ? ' · ' + o.pieceSize : '');
    if (!byGroup[g]) { byGroup[g] = []; groups.push(g); }
    byGroup[g].push(o);
  });
  var html = '<div class="pl-opts-title">Add options</div>';
  groups.forEach(function (g) {
    if (g) html += '<div class="pl-opts-piece">' + esc(g) + '</div>';
    byGroup[g].forEach(function (o) {
      html += '<label class="pl-opt"><input type="checkbox" class="pl-opt-cb" value="' + esc(o.key) + '">' +
        '<span class="pl-opt-label">' + esc(o.label) + '</span>' +
        '<span class="pl-opt-price">+$' + (centsOf(o) / 100).toFixed(2) + '</span></label>';
    });
  });
  root.innerHTML = html;
  var byKey = {};
  options.forEach(function (o) { byKey[o.key] = o; });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function setMode(live) {
    if (!pmodeEl) return;
    pmodeEl.hidden = false;
    pmodeEl.textContent = live ? 'live price' : 'estimate';
  }

  function clearClaim() { [unitPriceEl, sigEl, specHashEl, expiresEl, keysEl].forEach(function (el) { if (el) el.value = ''; }); }

  var seq = 0, timer = null;
  function recompute() {
    var keys = [];
    var cents = baseCents;
    root.querySelectorAll('.pl-opt-cb').forEach(function (cb) {
      if (cb.checked) { keys.push(cb.value); cents += centsOf(byKey[cb.value]); }
    });
    keys.sort();
    // Immediate LOCAL estimate; the signed price replaces it below.
    setPrice(money(cents));
    setMode(false);
    // No selection → no claim needed; the line stays at the locked base price.
    if (!keys.length) { clearClaim(); return; }
    var mySeq = ++seq;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      fetch(CRM + '/v1/listing-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ listingId: listingId, options: keys })
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        if (mySeq !== seq) return; // superseded by a newer selection
        if (!data || !data.signature) { disableAll('Options are unavailable right now.'); return; }
        setPrice(data.displayPrice || money(data.amount));
        if (unitPriceEl) unitPriceEl.value = data.unitPrice;
        if (sigEl) sigEl.value = data.signature;
        if (specHashEl) specHashEl.value = data.spec_hash;
        if (expiresEl) expiresEl.value = data.expires;
        if (keysEl) keysEl.value = keys.join(',');
        setMode(true);
      }).catch(function () { disableAll('Options are unavailable right now.'); });
    }, 300);
  }

  function disableAll(msg) {
    // Signing off / endpoint unreachable: never let a buyer add an unsigned option. Fall back to the
    // locked base price and take the controls out of play.
    root.querySelectorAll('.pl-opt-cb').forEach(function (cb) { cb.checked = false; cb.disabled = true; });
    clearClaim();
    setPrice(money(baseCents));
    if (pmodeEl) { pmodeEl.hidden = false; pmodeEl.textContent = msg || 'locked'; }
  }

  root.addEventListener('change', function (e) { if (e.target && e.target.classList.contains('pl-opt-cb')) recompute(); });
})();
