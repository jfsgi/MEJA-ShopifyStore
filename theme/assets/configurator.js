// Configurator behavior: renders the option model + exact-size inputs, computes a price
// PREVIEW, wires add-to-cart with line-item properties (Ajax Cart API), and embeds the
// 4kGraphics engine. The authoritative price is the MEJA-CRM engine; the Cart Transform
// Function applies the signed price server-side (see theme/functions/cart-transform).
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
const baseConnected = !!form?.querySelector('input[name="id"]')?.value;
const CRM = (viewer?.dataset.crmService || '').replace(/\/+$/, ''); // MEJA-CRM pricing host (/v1/price, /v1/options)
const priceModeEl = document.getElementById('meja-pmode');
const optionsLoaded = {};

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
// dims[axis] = inches (user-entered exact size)
let dims = {};
let dimsValid = true;

// Editable size axes per kind (inches). thickness maps to stock thickness in the engine.
const DIM_FIELDS = {
  drawerbox:   [ {key:'width',label:'Width',min:6,max:36,step:0.25,def:21}, {key:'depth',label:'Depth',min:8,max:24,step:0.25,def:21}, {key:'height',label:'Height',min:2,max:12,step:0.25,def:4} ],
  drawerunit:  [ {key:'width',label:'Width',min:12,max:48,step:0.25,def:24}, {key:'depth',label:'Depth',min:16,max:28,step:0.25,def:22}, {key:'height',label:'Height',min:20,max:42,step:0.25,def:28} ],
  cabinetdoor: [ {key:'width',label:'Width',min:6,max:36,step:0.125,def:15}, {key:'height',label:'Height',min:8,max:60,step:0.125,def:28} ],
  shelf:       [ {key:'width',label:'Width',min:12,max:72,step:0.25,def:36}, {key:'depth',label:'Depth',min:6,max:16,step:0.25,def:10}, {key:'thickness',label:'Thickness',min:1,max:3,step:0.25,def:1.5} ],
};

const in2mm = (v) => Math.round(Number(v) * 25.4);
const fmtIn = (v) => String(parseFloat(Number(v).toFixed(2)));

// Map our UI product keys to the 4kGraphics engine's FurnitureKind union
// ('door' is the engine's cabinet-door kind; 'shelf' has no parametric kind yet).
const ENGINE_KIND = { drawerbox: 'drawerbox', drawerunit: 'drawerunit', cabinetdoor: 'door', shelf: 'shelf' };

function engineSpec() {
  const d = { kind: ENGINE_KIND[product] || product };
  const f = DIM_FIELDS[product] || [];
  f.forEach(df => {
    const mm = in2mm(dims[df.key]);
    if (df.key === 'width') d.widthMm = mm;
    else if (df.key === 'depth') d.depthMm = mm;
    else if (df.key === 'height') d.heightMm = mm;
    else if (df.key === 'thickness') { d.stockThicknessMm = mm; d.heightMm = mm; }
  });
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
    if (selection.finish && eng.setStain) eng.setStain(selection.finish.value);
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

function dimsGroup(){
  const fields = DIM_FIELDS[product] || [];
  const wrap = document.createElement('div'); wrap.className = 'opt dims-opt';
  wrap.innerHTML = '<div class="l"><label>Dimensions</label><span class="unit">inches</span></div>';
  const grid = document.createElement('div'); grid.className = 'dims';
  fields.forEach(df => {
    dims[df.key] = df.def;
    const cell = document.createElement('label'); cell.className = 'dimf';
    cell.innerHTML = '<span>' + df.label + '</span>';
    const inp = document.createElement('input');
    inp.type = 'number'; inp.min = df.min; inp.max = df.max; inp.step = df.step;
    inp.value = df.def; inp.inputMode = 'decimal'; inp.dataset.axis = df.key;
    inp.setAttribute('aria-label', df.label + ' in inches');
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);
      dims[df.key] = isNaN(v) ? '' : v;
      recompute();
    });
    cell.appendChild(inp);
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);
  const err = document.createElement('p'); err.className = 'dimerr'; err.id = 'meja-dimerr'; err.hidden = true;
  wrap.appendChild(err);
  return wrap;
}

function validateDims(){
  const fields = DIM_FIELDS[product] || [];
  let bad = null;
  for (const df of fields) {
    const v = parseFloat(dims[df.key]);
    if (isNaN(v) || v < df.min || v > df.max) { bad = df; break; }
  }
  dimsValid = !bad;
  const err = document.getElementById('meja-dimerr');
  if (err) {
    if (bad) { err.hidden = false; err.textContent = bad.label + ' must be between ' + bad.min + '″ and ' + bad.max + '″.'; }
    else { err.hidden = true; err.textContent = ''; }
  }
  document.querySelectorAll('.dims input').forEach(inp => {
    const df = (DIM_FIELDS[product] || []).find(x => x.key === inp.dataset.axis);
    const v = parseFloat(inp.value);
    inp.classList.toggle('invalid', df && (isNaN(v) || v < df.min || v > df.max));
  });
  if (addBtn && baseConnected) addBtn.disabled = !dimsValid;
}

function renderProduct(){
  const def = model[product]; if (!def) return;
  titleEl.textContent = def.title;
  optionsEl.innerHTML = '';
  for (const k in selection) delete selection[k];
  dims = {};
  optionsEl.appendChild(dimsGroup());
  def.groups.forEach(g => optionsEl.appendChild(segGroup(g.key, g.label, g.options)));
  optionsEl.appendChild(segGroup('wood', 'Wood', model.wood));
  optionsEl.appendChild(segGroup('finish', 'Finish', model.finish));
  recompute();
  maybeLoadCrmOptions(product);
}

let priceSeq = 0, priceTimer;
function setPriceMode(isLive){
  if (!priceModeEl) return;
  priceModeEl.hidden = false;
  priceModeEl.textContent = isLive ? 'live price' : (CRM ? 'estimate' : 'estimate · price confirmed before build');
  priceModeEl.classList.toggle('live', !!isLive);
}

// Ask the CRM pricing engine for the authoritative (signed) price; falls back to the local
// estimate if no service is configured or the request fails (D4: the store never computes
// the final price).
function requestLivePrice(){
  if (!CRM) return;
  clearTimeout(priceTimer);
  priceTimer = setTimeout(async () => {
    const seq = ++priceSeq;
    const body = JSON.stringify({ spec: engineSpec(), configId: configIdEl?.value });
    try {
      const r = await fetch(CRM + '/v1/price', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body });
      if (!r.ok) return;
      const data = await r.json();
      if (seq !== priceSeq) return; // superseded by a newer change
      if (priceEl) {
        if (data.displayPrice) priceEl.textContent = data.displayPrice;
        else if (typeof data.amount === 'number') priceEl.textContent = money(data.amount);
      }
      if (unitPriceEl && data.unitPrice != null) unitPriceEl.value = String(data.unitPrice); // signed CRM unit price
      setPriceMode(true);
    } catch (e) { /* keep local estimate */ }
  }, 300);
}

// Optionally replace the local option model for a kind with the CRM's live option set.
async function maybeLoadCrmOptions(kind){
  if (!CRM || optionsLoaded[kind]) return;
  try {
    const r = await fetch(CRM + '/v1/options?kind=' + encodeURIComponent(kind), { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return;
    const def = await r.json();
    if (def && Array.isArray(def.groups)) { model[kind] = def; optionsLoaded[kind] = true; if (product === kind) renderProduct(); }
  } catch (e) { /* keep local model */ }
}

function recompute(){
  const def = model[product]; if (!def) return;
  validateDims();
  let total = def.base;
  for (const k in selection) total += selection[k].delta;
  if (priceEl) priceEl.textContent = money(total);
  if (unitPriceEl) unitPriceEl.value = (total / 100).toFixed(2);     // signed CRM price in production
  const dimParts = (DIM_FIELDS[product] || []).map(df => df.key.charAt(0) + fmtIn(dims[df.key] || 0));
  const optParts = Object.keys(selection).sort().map(k => k + '=' + selection[k].value);
  if (configIdEl) configIdEl.value = product + ':' + optParts.concat(dimParts).join('|');
  // mirror readable selections into hidden line-item property inputs (form fallback)
  if (propsEl) {
    propsEl.innerHTML = '';
    propsEl.appendChild(hidden('properties[Product]', def.title));
    (DIM_FIELDS[product] || []).forEach(df => propsEl.appendChild(hidden('properties[' + df.label + ']', fmtIn(dims[df.key] || 0) + ' in')));
    for (const k in selection) propsEl.appendChild(hidden('properties[' + selection[k].groupLabel + ']', selection[k].optLabel));
  }
  renderBreakdown(def, total);
  setPriceMode(false);
  requestLivePrice();
  updatePreview();
  busy();
}

function bdRow(label, val, muted){
  return '<div class="bd-row' + (muted ? ' muted' : '') + '"><span>' + label + '</span><span class="mono">' + val + '</span></div>';
}

// Compose the indicative estimate (base + option deltas) shown under "See breakdown".
function renderBreakdown(def, total){
  const bd = document.getElementById('meja-breakdown');
  if (!bd) return;
  let rows = bdRow('Base · ' + def.title, money(def.base));
  const sizeStr = (DIM_FIELDS[product] || []).map(df => fmtIn(dims[df.key] || 0)).join(' × ') + ' in';
  rows += bdRow('Size', sizeStr, true);
  for (const k in selection) {
    const s = selection[k];
    const d = s.delta || 0;
    const val = d === 0 ? 'incl.' : (d > 0 ? '+' : '−') + money(Math.abs(d));
    rows += bdRow(s.groupLabel + ': ' + s.optLabel, val, d === 0);
  }
  bd.innerHTML = '<div class="bd-rows">' + rows + '</div>' +
    '<div class="bd-total"><span>Estimate</span><span class="mono">' + money(total) + '</span></div>' +
    '<p class="bd-note">Indicative — your final made-to-order price is confirmed by the MEJA workshop.</p>';
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
    if (!dimsValid) { setStatus('Please enter valid dimensions before adding to cart.', 'err'); return; }
    const properties = { _configId: configIdEl?.value, _meja_unit_price: unitPriceEl?.value, Product: model[product]?.title };
    (DIM_FIELDS[product] || []).forEach(df => { properties[df.label] = fmtIn(dims[df.key] || 0) + ' in'; });
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
        setStatus('Added ✓', 'ok');
        if (window.MejaCart) { window.MejaCart.open(); }
        else { window.location.href = '/cart'; }
        return;
      }
      const err = await res.json().catch(() => ({}));
      setStatus(err.description || 'Could not add to cart. Please try again.', 'err');
    } catch (err) {
      setStatus('Network error — please try again.', 'err');
    } finally {
      if (addBtn) { addBtn.disabled = !dimsValid; addBtn.textContent = restore; }
    }
  });
}

// Price breakdown toggle.
const bdToggle = document.getElementById('meja-bd-toggle');
const bdPanel = document.getElementById('meja-breakdown');
if (bdToggle && bdPanel) bdToggle.addEventListener('click', () => {
  const open = bdToggle.getAttribute('aria-expanded') === 'true';
  bdToggle.setAttribute('aria-expanded', String(!open));
  bdPanel.hidden = open;
  bdToggle.textContent = open ? 'See breakdown ▾' : 'Hide breakdown ▴';
});

// Lighting modes + downloadable preview snapshot (engine polish).
document.querySelectorAll('#meja-lights button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#meja-lights button').forEach(x => x.setAttribute('aria-pressed', 'false'));
  b.setAttribute('aria-pressed', 'true');
  const eng = window.__mejaEngine;
  if (eng && eng.setLighting) eng.setLighting(b.dataset.light);
}));

const dlBtn = document.getElementById('meja-download');
if (dlBtn) dlBtn.addEventListener('click', async () => {
  const eng = window.__mejaEngine;
  if (!eng || !eng.renderSnapshot) { setStatus('Preview engine still loading — try again in a moment.', 'err'); return; }
  // The stub returns a data-URL string; the production engine returns Promise<Blob>.
  const out = await Promise.resolve(eng.renderSnapshot({ width: 2000, height: 1500 }));
  const href = (typeof Blob !== 'undefined' && out instanceof Blob) ? URL.createObjectURL(out) : out;
  const a = document.createElement('a');
  a.href = href;
  a.download = (model[product]?.title || 'design').toLowerCase().replace(/\s+/g, '-') + '-preview.png';
  document.body.appendChild(a); a.click(); a.remove();
  if (href !== out) setTimeout(() => URL.revokeObjectURL(href), 10000);
});

// AR — "View in your room" (dormant until settings.ar_service_url is set). Lazy-loads
// <model-viewer> only on click, fetches per-config GLB/USDZ from the 4kGraphics /v1/ar
// endpoint, and reveals the model (model-viewer surfaces its own AR launch on mobile).
const AR = (viewer?.dataset.arService || '').replace(/\/+$/, '');
const arBtn = document.getElementById('meja-ar');
const mv = document.getElementById('meja-mv');
const mvClose = document.getElementById('meja-mv-close');
let mvLoaded = false;
async function ensureModelViewer(){
  if (mvLoaded || (window.customElements && window.customElements.get('model-viewer'))) { mvLoaded = true; return; }
  await import('https://cdn.jsdelivr.net/npm/@google/model-viewer@4/dist/model-viewer.min.js');
  mvLoaded = true;
}
if (AR && arBtn && mv) {
  arBtn.addEventListener('click', async () => {
    if (!dimsValid) { setStatus('Enter valid dimensions before viewing in AR.', 'err'); return; }
    var restore = arBtn.textContent;
    arBtn.disabled = true; arBtn.textContent = 'Preparing…';
    try {
      const r = await fetch(AR + '/v1/ar', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ spec: engineSpec(), configId: configIdEl?.value })
      });
      if (!r.ok) throw new Error('ar');
      const data = await r.json();
      await ensureModelViewer();
      if (data.glbUrl) mv.setAttribute('src', data.glbUrl);
      if (data.usdzUrl) mv.setAttribute('ios-src', data.usdzUrl);
      if (data.posterUrl) mv.setAttribute('poster', data.posterUrl);
      mv.hidden = false;
      if (mvClose) mvClose.hidden = false;
    } catch (e) {
      setStatus('AR isn’t available right now — please try again.', 'err');
    } finally {
      arBtn.disabled = false; arBtn.textContent = restore;
    }
  });
  if (mvClose) mvClose.addEventListener('click', () => { mv.hidden = true; mvClose.hidden = true; });
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

// ---- Save / share configurations ----
const LS = 'meja.savedConfigs';
function loadSaved(){ try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } }
function storeSaved(a){ try { localStorage.setItem(LS, JSON.stringify(a.slice(0, 24))); } catch (e) { /* quota/full */ } }
function encodeConfig(cfg){ return btoa(unescape(encodeURIComponent(JSON.stringify(cfg)))); }
function decodeConfig(str){ try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch (e) { return null; } }

function currentConfig(){
  const s = {};
  for (const k in selection) s[k] = selection[k].value;
  const d = {};
  (DIM_FIELDS[product] || []).forEach(df => { d[df.key] = fmtIn(dims[df.key] || 0); });
  return { p: product, d, s, t: titleEl?.textContent || model[product]?.title || 'Design' };
}
function configKey(c){ return c.p + '|' + JSON.stringify(c.d) + '|' + JSON.stringify(c.s); }
function configLabel(cfg){
  const dimStr = Object.values(cfg.d || {}).join('×') + '″';
  const wood = cfg.s && cfg.s.wood ? ' · ' + cfg.s.wood : '';
  return (cfg.t || 'Design') + ' · ' + dimStr + wood;
}

function applyConfig(cfg){
  if (!cfg || !model[cfg.p]) return;
  product = cfg.p;
  document.querySelectorAll('#ptabs button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.prod === product)));
  renderProduct();
  if (cfg.d) Object.keys(cfg.d).forEach(axis => {
    const inp = optionsEl.querySelector('.dims input[data-axis="' + axis + '"]');
    if (inp) { inp.value = cfg.d[axis]; dims[axis] = parseFloat(cfg.d[axis]); }
  });
  if (cfg.s) Object.keys(cfg.s).forEach(key => {
    const btn = optionsEl.querySelector('.opt[data-group="' + key + '"] .seg button[data-value="' + cfg.s[key] + '"]');
    if (btn) btn.click();
  });
  recompute();
}

function renderSaved(){
  const panel = document.getElementById('meja-saved');
  const list = document.getElementById('meja-saved-list');
  if (!panel || !list) return;
  const items = loadSaved();
  if (!items.length) { panel.hidden = true; return; }
  panel.hidden = false;
  list.innerHTML = '';
  items.forEach((cfg, i) => {
    const row = document.createElement('div'); row.className = 'cfg-saved-item';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cfg-restore'; b.textContent = configLabel(cfg);
    b.addEventListener('click', () => applyConfig(cfg));
    const x = document.createElement('button'); x.type = 'button'; x.className = 'cfg-rm'; x.setAttribute('aria-label', 'Remove saved configuration'); x.textContent = '✕';
    x.addEventListener('click', () => { const a = loadSaved(); a.splice(i, 1); storeSaved(a); renderSaved(); });
    row.appendChild(b); row.appendChild(x); list.appendChild(row);
  });
}

const saveBtn = document.getElementById('meja-save');
if (saveBtn) saveBtn.addEventListener('click', () => {
  if (!dimsValid) { setStatus('Enter valid dimensions before saving.', 'err'); return; }
  const a = loadSaved();
  const cfg = currentConfig();
  if (!a.some(c => configKey(c) === configKey(cfg))) { a.unshift(cfg); storeSaved(a); }
  renderSaved();
  saveBtn.textContent = '♥'; saveBtn.classList.add('on');
  setTimeout(() => { saveBtn.textContent = '♡'; saveBtn.classList.remove('on'); }, 1200);
});

const shareBtn = document.getElementById('meja-share');
if (shareBtn) shareBtn.addEventListener('click', async () => {
  const url = location.origin + location.pathname + '#cfg=' + encodeConfig(currentConfig());
  try { await navigator.clipboard.writeText(url); shareBtn.textContent = 'Copied ✓'; }
  catch (e) { window.prompt('Copy this link:', url); }
  setTimeout(() => { shareBtn.textContent = 'Copy link to this design'; }, 1600);
});

function restoreFromHash(){
  const m = location.hash.match(/cfg=([^&]+)/);
  if (!m) return;
  const cfg = decodeConfig(decodeURIComponent(m[1]));
  if (cfg) applyConfig(cfg);
}

renderProduct();
restoreFromHash();
renderSaved();
boot();
