/* Fetches product recommendations via the Section Rendering API and injects the grid.
 * Removes the section if there are no recommendations (or on error). */
(function () {
  document.querySelectorAll('[data-reco]').forEach(function (el) {
    var url = el.getAttribute('data-url');
    if (!url) { el.remove(); return; }
    fetch(url, { headers: { 'Accept': 'text/html' } })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var grid = doc.querySelector('.reco-grid');
        var slot = el.querySelector('.reco-slot');
        if (grid && grid.children.length && slot) { slot.appendChild(grid); }
        else { el.remove(); }
      })
      .catch(function () { el.remove(); });
  });
})();
