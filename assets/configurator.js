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
let product = 'drawerbox';
// selection[groupKey] = { groupLabel, value, optLabel, delta }
const selection = {};

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
  busy();
}

function hidden(name, value){
  const i = document.createElement('input'); i.type = 'hidden'; i.name = name; i.value = value; return i;
}

let t; function busy(){
  const d = document.getElementById('meja-rdot'), x = document.getElementById('meja-rtext');
  if (!d) return; d.classList.add('busy'); x.textContent = 'rendering 4K…';
  clearTimeout(t); t = setTimeout(() => { d.classList.remove('busy'); x.textContent = '4K render ready'; }, 850);
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
    const properties = { _configId: configIdEl?.value, _meja_unit_price: unitPriceEl?.value, Product: model[product]?.title };
    for (const k in selection) properties[selection[k].groupLabel] = selection[k].optLabel;
    if (!baseId) { console.warn('[MEJA] set the base configurable variant ID in the section settings'); form.submit(); return; }
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(baseId), quantity: 1, properties }] })
      });
      if (res.ok) { window.location.href = '/cart'; }
      else { form.submit(); }   // fall back to a standard form POST
    } catch (err) { form.submit(); }
  });
}

async function boot(){
  if (!viewer) return;
  try {
    const mod = await import(viewer.dataset.engine);
    const FurnitureEngine = mod.FurnitureEngine || mod.default;
    const engine = new FurnitureEngine({ container: viewer });
    engine.showFurniture({ kind: 'drawerbox', widthMm: 533, depthMm: 533, heightMm: 102, stockThicknessMm: 15, joinery: 'dovetail' });
    engine.setMaterial('walnut'); window.__mejaEngine = engine;
  } catch (e) { console.warn('[MEJA] 4kGraphics engine asset not present in this scaffold:', e.message); }
}

renderProduct();
boot();
