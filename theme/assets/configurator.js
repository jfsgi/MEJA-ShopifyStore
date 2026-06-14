// Configurator behavior: renders the option model, computes a price PREVIEW, wires
// add-to-cart with line-item properties (Ajax Cart API), and embeds the 4kGraphics engine.
// The authoritative price is the MEJA-CRM engine; the Cart Transform Function applies the
// signed price server-side (see theme/functions/cart-transform). This preview is indicative.
const model = JSON.parse(document.getElementById('meja-option-model')?.textContent || '{}');
const optionsEl = document.getElementById('meja-options');
const propsEl = document.getElementById('meja-props');         // hidden line-item property inputs
const priceEl = document.getElementById('meja-price');         // [data-config-price] in price-block
const configIdEl = document.getElementById('meja-configId');
const unitPriceEl = document.getElementById('meja-unit-price');
const titleEl = document.getElementById('meja-title');
const viewer = document.getElementById('meja-viewer');
const form = document.getElementById('meja-form');
const addBtn = document.getElementById('meja-add');
const addStatus = document.getElementById('meja-add-status');

function setStatus(msg, kind){
  if (!addStatus) return;
  addStatus.textContent = msg || '';
  addStatus.className = 'addstatus' + (kind ? ' ' + kind : '');
}

async function updateCartCount(){
  try {
    const r = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return;
    const c = await r.json();
    document.querySelectorAll('.cartdot').forEach(el => { el.textContent = c.item_count; });
  } catch (e) { /* non-fatal */ }
}
let product = 'drawerbox';
// selection[groupKey] = { groupLabel, value, optLabel, delta }
const selection = {};

// Default dimensions per furniture kind (mm); option selections override below.
const DIMS = {
  drawerbox:   { widthMm: 533, depthMm: 533, heightMm: 102, stockThicknessMm: 15 },
  drawerunit:  { widthMm: 600, depthMm: 560, heightMm: 720, stockThicknessMm: 18 },
  cabinetdoor: { widthMm: 380, depthMm: 19,  heightMm: 700, stockThicknessMm: 19 },
  shelf:       { widthMm: 900, depthMm: 240, heightMm: 40,  stockThicknessMm: 40 },
};

function engineSpec() {
  const d = Object.assign({ kind: product }, DIMS[product] || DIMS.drawerbox);
  if (selection.width)   d.widthMm = Number(selection.width.value) || d.widthMm;
  if (selection.joinery) d.joinery = selection.joinery.value;
  if (selection.drawers) d.drawers = Number(selection.drawers.value) || 3;
  if (selection.style)   d.style = selection.style.value;
  return d;
}

function updatePreview() {
  const eng = window.__mejaEngine;
  if (!eng) return;
  try {
    eng.showFurniture(engineSpec());
    if (selection.wood) eng.setMaterial(selection.wood.value);
  } catch (e) { /* preview is best-effort */ }
}

function money(cents){ return '$' + (cents / 100).toFixed(2); }

function segGroup(key, label, opts){
  const wrap = document.createElement('div'); wrap.className = 'opt'; wrap.dataset.group = key;
  wrap.innerHTML = '<div class="l"><label>' + label + '</label></div>';
  const seg = document.createElement('div'); seg.className = 'seg';
  opts.forEach((o, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = o.label;
    b.dataset.delta = o.delta || 0; b.dataset.value = o.value;
    if (o.swatch) { b.style.borderLeft = '14px solid ' + o.swatch; }
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    if (i === 0) selection[key] = { groupLabel: label, value: o.value, optLabel: o.label, delta: o.delta || 0 };
    b.addEventListener('click', () => {
      seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      selection[key] = { groupLabel: label, value: o.value, optLabel: o.label, delta: o.delta || 0 };
      recompute();
    });
    seg.appendChild(b);
  });
  wrap.appendChild(seg); return wrap;
}

function renderProduct(){
  const def = model[product]; if (!def) return;
  titleEl.textContent = def.title;
  optionsEl.innerHTML = '';
  for (const k in selection) delete selection[k];
  def.groups.forEach(g => optionsEl.appendChild(segGroup(g.key, g.label, g.options)));
  optionsEl.appendChild(segGroup('wood', 'Wood', model.wood));
  optionsEl.appendChild(segGroup('finish', 'Finish', model.finish));
  recompute();
}

function recompute(){
  const def = model[product]; if (!def) return;
  let total = def.base;
  for (const k in selection) total += selection[k].delta;
  if (priceEl) priceEl.textContent = money(total);
  if (unitPriceEl) unitPriceEl.value = (total / 100).toFixed(2);     // signed CRM price in production
  const configId = product + ':' + Object.keys(selection).sort().map(k => k + '=' + selection[k].value).join('|');
  if (configIdEl) configIdEl.value = configId;
  // mirror readable selections into hidden line-item property inputs (form fallback)
  if (propsEl) {
    propsEl.innerHTML = '';
    propsEl.appendChild(hidden('properties[Product]', def.title));
    for (const k in selection) propsEl.appendChild(hidden('properties[' + selection[k].groupLabel + ']', selection[k].optLabel));
  }
  updatePreview();
  busy();
}

function hidden(name, value){
  const i = document.createElement('input'); i.type = 'hidden'; i.name = name; i.value = value; return i;
}

let t; function busy(){
  const d = document.getElementById('meja-rdot'), x = document.getElementById('meja-rtext');
  if (!d) return;
  const ready = window.__mejaEngine ? '4K preview live' : '4K render ready';
  d.classList.add('busy'); x.textContent = 'rendering 4K…';
  clearTimeout(t); t = setTimeout(() => { d.classList.remove('busy'); x.textContent = ready; }, 650);
}

document.querySelectorAll('#ptabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#ptabs button').forEach(x => x.setAttribute('aria-pressed', 'false'));
  b.setAttribute('aria-pressed', 'true'); product = b.dataset.prod; renderProduct();
}));

// Add to cart via the Ajax Cart API; the Cart Transform Function applies the CRM price.
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const baseId = form.querySelector('input[name="id"]')?.value;
    if (!baseId) {
      setStatus('This configurator isn’t connected to checkout yet — set a base product in the theme editor.', 'err');
      return;
    }
    const properties = { _configId: configIdEl?.value, _meja_unit_price: unitPriceEl?.value, Product: model[product]?.title };
    for (const k in selection) properties[selection[k].groupLabel] = selection[k].optLabel;

    const restore = addBtn ? addBtn.textContent : '';
    if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Adding…'; }
    setStatus('');
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(baseId), quantity: 1, properties }] })
      });
      if (res.ok) {
        await updateCartCount();
        setStatus('Added ✓ Taking you to your cart…', 'ok');
        window.location.href = '/cart';
        return;
      }
      const err = await res.json().catch(() => ({}));
      setStatus(err.description || 'Could not add to cart. Please try again.', 'err');
    } catch (err) {
      setStatus('Network error — please try again.', 'err');
    } finally {
      if (addBtn) { addBtn.disabled = false; addBtn.textContent = restore; }
    }
  });
}

async function boot(){
  if (!viewer) return;
  try {
    const mod = await import(viewer.dataset.engine);
    const FurnitureEngine = mod.FurnitureEngine || mod.default;
    window.__mejaEngine = new FurnitureEngine({ container: viewer });
    updatePreview(); // render the currently-selected configuration
    const x = document.getElementById('meja-rtext');
    if (x) x.textContent = '4K preview live';
  } catch (e) { console.warn('[MEJA] live preview engine unavailable; keeping static viewer:', e.message); }
}

renderProduct();
boot();
