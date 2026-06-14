/* Slide-out cart drawer. Renders from the Ajax Cart API (/cart.js, /cart/change.js,
 * /cart/add.js). Progressive enhancement: the header Cart link still points at /cart
 * and product forms still submit natively if JS is off. Exposes window.MejaCart. */
(function () {
  var drawer = document.getElementById('cart-drawer');
  var body = document.getElementById('cd-body');
  if (!drawer || !body) return;

  function money(c) { return '$' + (Number(c) / 100).toFixed(2); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setCount(n) { document.querySelectorAll('.cartdot').forEach(function (el) { el.textContent = n; }); }

  function open() {
    drawer.hidden = false;
    document.body.classList.add('cd-lock');
    refresh();
    requestAnimationFrame(function () { drawer.classList.add('cd-on'); });
  }
  function close() {
    drawer.classList.remove('cd-on');
    document.body.classList.remove('cd-lock');
    setTimeout(function () { drawer.hidden = true; }, 250);
  }

  function lineRow(item) {
    var props = '';
    var keys = item.properties ? Object.keys(item.properties) : [];
    keys.forEach(function (k) {
      var v = item.properties[k];
      if (k.charAt(0) === '_' || v == null || v === '') return;
      props += '<span class="cd-chip">' + esc(k) + ': ' + esc(v) + '</span>';
    });
    return '<div class="cd-line" data-key="' + esc(item.key) + '">' +
      '<div class="cd-thumb"' + (item.image ? ' style="background-image:url(' + esc(item.image) + ')"' : '') + '></div>' +
      '<div class="cd-info">' +
        '<a class="cd-title" href="' + esc(item.url) + '">' + esc(item.product_title || item.title) + '</a>' +
        '<div class="cd-chips">' + props + '</div>' +
        '<div class="cd-qty">' +
          '<button type="button" class="cd-dec" aria-label="Decrease quantity">&minus;</button>' +
          '<span class="cd-q">' + item.quantity + '</span>' +
          '<button type="button" class="cd-inc" aria-label="Increase quantity">+</button>' +
          '<button type="button" class="cd-rm">Remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="cd-price">' + money(item.final_line_price) + '</div>' +
    '</div>';
  }

  function render(cart) {
    setCount(cart.item_count);
    if (!cart.item_count) {
      body.innerHTML = '<div class="cd-empty"><p class="muted">Your cart is empty.</p>' +
        '<a class="btn" href="/collections/all" data-cd-close>Browse products</a></div>';
      return;
    }
    body.innerHTML = '<div class="cd-lines">' + cart.items.map(lineRow).join('') + '</div>' +
      '<div class="cd-foot">' +
        '<div class="cd-sub"><span>Subtotal</span><span class="mono">' + money(cart.total_price) + '</span></div>' +
        '<p class="cd-note">Made to order — no returns. Shipping &amp; taxes at checkout.</p>' +
        '<a class="btn block" href="/checkout">Checkout</a>' +
        '<a class="cd-viewcart" href="/cart">View full cart</a>' +
      '</div>';
    bindRows();
  }

  function bindRows() {
    body.querySelectorAll('.cd-line').forEach(function (row) {
      var key = row.getAttribute('data-key');
      var q = parseInt(row.querySelector('.cd-q').textContent, 10) || 1;
      row.querySelector('.cd-inc').addEventListener('click', function () { change(key, q + 1); });
      row.querySelector('.cd-dec').addEventListener('click', function () { change(key, q - 1); });
      row.querySelector('.cd-rm').addEventListener('click', function () { change(key, 0); });
    });
  }

  function change(key, qty) {
    body.classList.add('cd-busy');
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: Math.max(0, qty) })
    })
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () {})
      .then(function () { body.classList.remove('cd-busy'); });
  }

  function refresh() {
    fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () {});
  }

  function addItem(id, quantity, properties) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(id), quantity: quantity || 1, properties: properties || {} }] })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw e; });
      return r.json();
    }).then(function () { open(); return true; });
  }

  drawer.addEventListener('click', function (e) { if (e.target.closest('[data-cd-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) close(); });

  document.querySelectorAll('[data-cart-trigger]').forEach(function (t) {
    t.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });

  // Intercept product add-to-cart forms (PDP, private listing) -> drawer.
  document.querySelectorAll('form.product-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var idField = form.querySelector('[name="id"]');
      if (!idField || !idField.value) return; // no variant -> let it submit
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var restore = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
      var properties = {};
      form.querySelectorAll('[name^="properties["]').forEach(function (f) {
        var m = f.name.match(/^properties\[(.+)\]$/);
        if (m) properties[m[1]] = f.value;
      });
      addItem(idField.value, 1, properties)
        .catch(function () { form.submit(); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = restore; } });
    });
  });

  window.MejaCart = { open: open, close: close, refresh: refresh, addItem: addItem };
})();
