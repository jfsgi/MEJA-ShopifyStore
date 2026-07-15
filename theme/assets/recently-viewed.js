/* Recently viewed products. Records the current PDP handle in localStorage and renders
 * cards for previously viewed products via /products/{handle}.js. Hides itself if empty. */
(function () {
  var el = document.querySelector('[data-recently-viewed]');
  if (!el) return;
  var KEY = 'meja.recentlyViewed';
  var current = el.dataset.current || '';
  var limit = parseInt(el.dataset.limit, 10) || 4;

  var list;
  try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];

  var prior = list.filter(function (h) { return h && h !== current; });
  var toShow = prior.slice(0, limit);

  // Record this visit (most-recent-first, deduped, capped) for next time.
  try { localStorage.setItem(KEY, JSON.stringify([current].concat(prior).slice(0, 12))); } catch (e) { /* full/disabled */ }

  if (!toShow.length) { el.remove(); return; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function money(c) { return '$' + (Number(c) / 100).toFixed(2); }
  function card(p) {
    var img = p.featured_image
      ? '<div class="img" style="background-image:url(' + esc(p.featured_image) + ')"></div>'
      : '<div class="img"></div>';
    return '<a class="pcard" href="' + esc(p.url) + '">' + img +
      '<div class="b"><h3>' + esc(p.title) + '</h3>' +
      '<div class="price">from ' + money(p.price_min != null ? p.price_min : p.price) + '</div>' +
      '<span class="cfg">View ›</span></div></a>';
  }

  Promise.all(toShow.map(function (h) {
    return fetch('/products/' + encodeURIComponent(h) + '.js', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  })).then(function (products) {
    var html = products.filter(Boolean).map(card).join('');
    var slot = el.querySelector('[data-rv-slot]');
    if (html && slot) { slot.innerHTML = html; el.hidden = false; }
    else { el.remove(); }
  });
})();
