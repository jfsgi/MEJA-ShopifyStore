/* Header predictive search. Progressive enhancement: the trigger is a real
 * link to /search and the panel contains a real <form>, so it works with JS off.
 * With JS, the panel opens inline and shows live suggestions from Shopify's
 * Predictive Search JSON API. */
(function () {
  var trigger = document.getElementById('search-trigger');
  var panel   = document.getElementById('search-panel');
  var input   = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var closeBtn = document.getElementById('search-close');
  if (!trigger || !panel || !input || !results) return;

  function open()  { panel.hidden = false; trigger.setAttribute('aria-expanded', 'true');  setTimeout(function () { input.focus(); }, 30); }
  function close() { panel.hidden = true;  trigger.setAttribute('aria-expanded', 'false'); results.innerHTML = ''; }

  trigger.addEventListener('click', function (e) { e.preventDefault(); panel.hidden ? open() : close(); });
  if (closeBtn) closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !trigger.contains(e.target)) close();
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(cents) { return '$' + (Number(cents) / 100).toFixed(2); }

  var timer;
  input.addEventListener('input', function () {
    var q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 2) { results.innerHTML = ''; return; }
    timer = setTimeout(function () { run(q); }, 220);
  });

  function run(q) {
    var url = '/search/suggest.json?q=' + encodeURIComponent(q) +
      '&resources[type]=product,article,page&resources[limit]=6' +
      '&resources[options][unavailable_products]=last&resources[options][prefix]=last';
    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) render(d, q); })
      .catch(function () {});
  }

  function priceOf(p) {
    if (typeof p.price === 'string') return p.price;
    if (p.price_min != null) return money(p.price_min);
    if (typeof p.price === 'number') return money(p.price);
    return '';
  }

  function render(d, q) {
    var res = (d.resources && d.resources.results) || {};
    var products = res.products || [], articles = res.articles || [], pages = res.pages || [];
    var html = '';

    if (products.length) {
      html += '<div class="sr-group"><h4>Products</h4>';
      products.forEach(function (p) {
        var img = p.image || (p.featured_image && p.featured_image.url) || '';
        var price = priceOf(p);
        html += '<a class="sr-item" href="' + p.url + '">' +
          '<span class="sr-thumb"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '></span>' +
          '<span class="sr-meta"><span class="sr-title">' + esc(p.title) + '</span>' +
          (price ? '<span class="sr-price">from ' + esc(price) + '</span>' : '') +
          '</span></a>';
      });
      html += '</div>';
    }

    var content = articles.concat(pages);
    if (content.length) {
      html += '<div class="sr-group"><h4>Pages &amp; journal</h4>';
      content.forEach(function (a) { html += '<a class="sr-item sr-text" href="' + a.url + '">' + esc(a.title) + '</a>'; });
      html += '</div>';
    }

    if (!products.length && !content.length) {
      html = '<div class="sr-empty">No matches for “' + esc(q) + '”. Press Enter to search everything.</div>';
    } else {
      html += '<a class="sr-all" href="/search?q=' + encodeURIComponent(q) + '">See all results for “' + esc(q) + '” →</a>';
    }
    results.innerHTML = html;
  }
})();
