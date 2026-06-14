/* ============================================================================
 * 4kgraphics-engine.browser.js  —  MEJA live preview engine (embedded)
 *
 * API-compatible drop-in for the MEJA configurator. The production 4kGraphics
 * service replaces THIS file (same asset name + same exports) with the
 * Cycles-backed 4K engine; the configurator wiring does not change.
 *
 * Public API expected by assets/configurator.js:
 *   import { FurnitureEngine } from '4kgraphics-engine.browser.js'
 *   const e = new FurnitureEngine({ container })
 *   e.showFurniture({ kind, widthMm, depthMm, heightMm, stockThicknessMm, joinery, drawers, style })
 *   e.setMaterial('walnut' | 'whiteoak' | 'cherry' | 'maple' | 'ash')
 *   e.dispose()
 *
 * Renders a parametric WebGL preview (drag to rotate, wheel to zoom, auto-spin).
 * Three.js is loaded as a self-contained ES module from a CDN so the theme
 * asset stays tiny; if it can't load, configurator.js keeps the static viewer.
 * ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const MM = 0.001; // millimetres -> scene metres
const WOODS = {
  walnut:   { color: 0x5c3a21, roughness: 0.55 },
  whiteoak: { color: 0xc7a877, roughness: 0.62 },
  cherry:   { color: 0x7a3b25, roughness: 0.5 },
  maple:    { color: 0xe0cda4, roughness: 0.64 },
  ash:      { color: 0xc9b89a, roughness: 0.64 },
};

export class FurnitureEngine {
  constructor({ container }) {
    this.container = container;
    this.scene = new THREE.Scene();

    const w = container.clientWidth || 600;
    const h = container.clientHeight || 600;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    Object.assign(this.renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    this.renderer.domElement.style.cursor = 'grab';
    container.insertBefore(this.renderer.domElement, container.firstChild); // sit behind the HUD overlays

    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.01, 100);

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(0.7, 1.2, 0.9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.1; key.shadow.camera.far = 8;
    this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe3e0, 1.0));
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(-0.9, 0.5, -0.7);
    this.scene.add(fill);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.13 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.material = new THREE.MeshStandardMaterial({ color: WOODS.walnut.color, roughness: WOODS.walnut.roughness, metalness: 0.02 });

    this.azimuth = -0.7;
    this.elevation = 0.42;
    this.distance = 1;
    this.autoRotate = true;
    this._center = new THREE.Vector3(0, 0.2, 0);
    this._radius = 0.4;
    this._disposed = false;

    this._bindControls();
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
    this._tick = this._tick.bind(this);
    this._tick();
  }

  _bindControls() {
    const el = this.renderer.domElement;
    let dragging = false, px = 0, py = 0;
    const point = (e) => (e.touches && e.touches[0]) ? e.touches[0] : e;
    const down = (e) => { dragging = true; this.autoRotate = false; el.style.cursor = 'grabbing'; const p = point(e); px = p.clientX; py = p.clientY; };
    const move = (e) => {
      if (!dragging) return;
      const p = point(e);
      this.azimuth -= (p.clientX - px) * 0.01;
      this.elevation = Math.max(-0.15, Math.min(1.2, this.elevation - (p.clientY - py) * 0.01));
      px = p.clientX; py = p.clientY;
    };
    const up = () => { dragging = false; el.style.cursor = 'grab'; };
    el.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchmove', move, { passive: true });
    el.addEventListener('touchend', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.distance = Math.max(0.6, Math.min(2.4, this.distance + (e.deltaY > 0 ? 0.08 : -0.08))); }, { passive: false });
    this._controlHandlers = { move, up };
  }

  setMaterial(wood) {
    const w = WOODS[wood] || WOODS.walnut;
    this.material.color.setHex(w.color);
    this.material.roughness = w.roughness;
  }

  _box(wMm, hMm, dMm, xMm, yMm, zMm) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(wMm * MM, hMm * MM, dMm * MM), this.material);
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(xMm * MM, yMm * MM, zMm * MM);
    return m;
  }

  showFurniture(spec = {}) {
    // clear previous build (geometry only; material is shared & reused)
    while (this.root.children.length) {
      const c = this.root.children.pop();
      if (c.geometry) c.geometry.dispose();
    }
    const kind = spec.kind || 'drawerbox';
    const g = (this['_build_' + kind] || this._build_drawerbox).call(this, spec);
    this.root.add(g);
    this._fit();
  }

  _build_drawerbox(s) {
    const W = s.widthMm || 533, D = s.depthMm || 533, H = s.heightMm || 102, t = s.stockThicknessMm || 15;
    const g = new THREE.Group();
    g.add(this._box(W, t, D, 0, t / 2, 0));                  // bottom
    g.add(this._box(W, H, t, 0, H / 2, -(D - t) / 2));       // back
    g.add(this._box(W, H, t, 0, H / 2, (D - t) / 2));        // front
    g.add(this._box(t, H, D, -(W - t) / 2, H / 2, 0));       // left
    g.add(this._box(t, H, D, (W - t) / 2, H / 2, 0));        // right
    return g;
  }

  _build_drawerunit(s) {
    const W = s.widthMm || 600, D = s.depthMm || 560, H = s.heightMm || 720, t = s.stockThicknessMm || 18;
    const n = Math.max(1, Math.min(8, s.drawers || 3));
    const g = new THREE.Group();
    g.add(this._box(t, H, D, -(W - t) / 2, H / 2, 0));       // left
    g.add(this._box(t, H, D, (W - t) / 2, H / 2, 0));        // right
    g.add(this._box(W, t, D, 0, H - t / 2, 0));              // top
    g.add(this._box(W, t, D, 0, t / 2, 0));                  // bottom
    g.add(this._box(W, H, t, 0, H / 2, -(D - t) / 2));       // back
    const gap = 8, inner = W - 2 * t, fh = (H - 2 * t - (n + 1) * gap) / n;
    for (let i = 0; i < n; i++) {
      const y = t + gap + i * (fh + gap) + fh / 2;
      g.add(this._box(inner, fh, 14, 0, y, (D / 2) - 5));    // drawer front
      g.add(this._box(inner * 0.32, 10, 18, 0, y, (D / 2) + 4)); // handle
    }
    return g;
  }

  _build_cabinetdoor(s) {
    const W = s.widthMm || 380, H = s.heightMm || 700, t = s.stockThicknessMm || 19;
    const g = new THREE.Group();
    g.add(this._box(W, H, t, 0, H / 2, 0));                  // slab panel
    if (s.style === 'shaker' || s.style === 'raised') {      // raised perimeter frame
      const fr = 58, pz = t / 2 + 5;
      g.add(this._box(W, fr, 8, 0, H - fr / 2, pz));         // top rail
      g.add(this._box(W, fr, 8, 0, fr / 2, pz));             // bottom rail
      g.add(this._box(fr, H, 8, -(W - fr) / 2, H / 2, pz));  // left stile
      g.add(this._box(fr, H, 8, (W - fr) / 2, H / 2, pz));   // right stile
    }
    return g;
  }

  _build_shelf(s) {
    const W = s.widthMm || 900, D = s.depthMm || 240, t = s.stockThicknessMm || 40;
    const legH = 210;
    const g = new THREE.Group();
    g.add(this._box(W, t, D, 0, legH + t / 2, 0));           // top slab
    g.add(this._box(t * 0.6, legH, D, -(W / 2) + t, legH / 2, 0)); // left end
    g.add(this._box(t * 0.6, legH, D, (W / 2) - t, legH / 2, 0));  // right end
    if (s.style === 'artback' || s.style === 'tile') {
      g.add(this._box(W - 2.4 * t, legH * 0.78, 10, 0, legH * 0.5, -(D / 2) + 8)); // back panel
    }
    return g;
  }

  _fit() {
    const bb = new THREE.Box3().setFromObject(this.root);
    if (bb.isEmpty()) return;
    bb.getCenter(this._center);
    const sphere = new THREE.Sphere();
    bb.getBoundingSphere(sphere);
    this._radius = Math.max(sphere.radius, 0.12);
  }

  _resize() {
    const w = this.container.clientWidth || 600, h = this.container.clientHeight || 600;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _tick() {
    if (this._disposed) return;
    requestAnimationFrame(this._tick);
    if (this.autoRotate) this.azimuth += 0.0035;
    const r = this._radius * 2.5 * this.distance;
    const ce = Math.cos(this.elevation), se = Math.sin(this.elevation);
    this.camera.position.set(
      this._center.x + r * ce * Math.sin(this.azimuth),
      this._center.y + r * se,
      this._center.z + r * ce * Math.cos(this.azimuth)
    );
    this.camera.lookAt(this._center);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this._disposed = true;
    window.removeEventListener('resize', this._onResize);
    if (this._controlHandlers) {
      window.removeEventListener('mousemove', this._controlHandlers.move);
      window.removeEventListener('mouseup', this._controlHandlers.up);
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
  }
}

export default FurnitureEngine;
