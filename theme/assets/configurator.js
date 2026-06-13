// Bootstraps the embedded 4kGraphics engine on the configurator template.
// The engine ships as a self-contained browser.js (see docs/05-Integration-Context.md).
const viewer = document.getElementById('meja-viewer');
async function boot() {
  if (!viewer) return;
  const engineUrl = viewer.dataset.engine;
  try {
    const mod = await import(engineUrl);
    const FurnitureEngine = mod.FurnitureEngine || mod.default;
    const engine = new FurnitureEngine({ container: viewer });
    // Spec is built from the option panel (see FurnitureSpec in api/openapi.yaml).
    engine.showFurniture({ kind: 'drawerbox', widthMm: 533, depthMm: 533, heightMm: 102, stockThicknessMm: 15, joinery: 'dovetail' });
    engine.setMaterial('walnut');
    window.__mejaEngine = engine;
  } catch (e) {
    console.warn('[MEJA] 4kGraphics engine asset not present in this scaffold:', e.message);
  }
}
// product-type tabs
document.querySelectorAll('#ptabs button').forEach(function (b) {
  b.addEventListener('click', function () {
    document.querySelectorAll('#ptabs button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    b.setAttribute('aria-pressed', 'true');
    const t = document.getElementById('meja-title');
    if (t) t.textContent = b.textContent;
    // TODO: fetch option model + price for b.dataset.prod from the CRM engine
  });
});
boot();
