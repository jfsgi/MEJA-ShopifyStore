# MEJA Designs WebStore — UI Design Standard

**Document type:** Design system + 10 design iterations (for approval)
**Version:** 0.2 (Draft — aligned to the suite's Indigo Atelier `--mj-*` tokens)
**Date:** 2026-06-13
**Companion:** Open [`../mockups/index.html`](../mockups/index.html) in a browser to *see* the 10 iterations.
**Status:** 🟢 Primary iteration **chosen: Variant 5 — Scandi Light** (Decision D2). Per-UI mockups now build in this direction (§9 register).

---

## 0. Purpose & how to use this

This document defines **one design system** with **interchangeable visual "iterations."** The *structure* (layouts, components, grid, behavior, accessibility) is shared across all ten; each **iteration** is a distinct **visual direction** (palette, type, texture, motion, imagery treatment) applied to that same structure.

**Your job at this stage:** review the 10 iterations (§7) — in the doc and in the live gallery — and approve **one primary direction** (plus any accents to borrow). Everything else here is the standard we build on once a direction is chosen.

> **Suite alignment (added after reviewing the sibling apps — [`05-Integration-Context.md`](05-Integration-Context.md)):** the store is part of a **family** — **MEJA‑CRM** already ships a locked design system, **"Indigo Atelier,"** built on **`--mj-*` design tokens** (Tailwind v4, token-only color rule), and **Atelier3D** uses a warm-neutral workspace with a single **teal** accent (dark "Studio" for color accuracy). The store keeps the same **`--mj-*` token structure + neutrals**, but **Decision (D12): the storefront uses its own brand accent — Scandi sage/slate `#5b6b73` — *not* the CRM indigo** (compared side-by-side: `../assets/MEJA-accent-comparison.pdf`). Layout, type roles, and neutrals stay shared; only the accent value differs.

---

### 0.1 Mockup-first rule (MANDATORY)

> **No UI gets built without an approved HTML mockup.** Every page layout, component, state, and the chosen iteration in this standard ships a **self-contained HTML mockup** (in [`../mockups/`](../mockups/)) that is **rendered and explicitly signed off** before any Online Store 2.0 theme code is written. The full requirement, the **mockup register** (every UI that needs one), and the approval process are in **§9**.

---

## 1. Brand foundations

| Foundation | Direction |
|------------|-----------|
| **Essence** | Handcrafted • warm • precise • considered. Wood as the hero material. |
| **Tone** | Confident, calm, expert. We make heirloom pieces, not mass goods. |
| **Promise** | "Designed with you, made for your space." (configurability is the brand.) |
| **Personality dial** | Artisanal ←——●——→ Modern. We sit center-warm; iterations slide this dial. |
| **Do** | Show real wood grain, scale cues, the making process, the 3D/4K capability. |
| **Don't** | Look like a generic dropship store; bury the configurator; hide price logic. |

---

## 2. Design tokens (system-wide)

Tokens are the contract between design and code. Each **iteration overrides the *values*** (esp. color & type); the **token *names* never change**, so swapping directions is a theme change, not a rebuild.

> **Map to the suite:** these `--color-*` / `--font-*` roles **alias the CRM's `--mj-*` tokens** (Indigo Atelier). In the OS 2.0 theme they compile from the same source so the store, CRM, and Atelier3D stay visually one product (D12).

### 2.1 Color (token roles — values set per iteration; alias `--mj-*`)
```
--color-bg            /* page background            */
--color-surface       /* cards, panels              */
--color-ink           /* primary text               */
--color-ink-muted     /* secondary text             */
--color-line          /* borders/dividers           */
--color-brand         /* primary brand accent       */
--color-brand-contrast/* text on brand              */
--color-accent        /* secondary accent           */
--color-success / --color-warning / --color-danger
--color-focus         /* focus ring (AA visible)    */
```

### 2.2 Typography (roles)
```
--font-display   /* hero/headlines               */
--font-text      /* body/UI                      */
--font-mono      /* price math, SKUs, specs      */
Scale (rem): 0.75 0.875 1 1.125 1.25 1.5 2 2.5 3.25 4.25
Line-height: tight 1.1 · normal 1.5 · relaxed 1.7
```

### 2.3 Space, radius, elevation, motion
```
--space: 4 8 12 16 24 32 48 64 96 (px, 4-based scale)
--radius: 0 4 8 16 999(pill)
--shadow: sm / md / lg (soft, low-contrast; "lifted paper")
--ease: standard cubic-bezier(.2,0,0,1) · duration 120/200/320ms
--container: 1280px max; gutters 16/24/32 at sm/md/lg
```

### 2.4 Grid & breakpoints
- **12-column** fluid grid; 8px baseline rhythm.
- Breakpoints: `sm 480 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- Configurator uses a **split canvas**: ≥lg = viewer left / controls right; <lg = stacked (viewer top, sticky control bar bottom).

---

## 3. Core components (shared library)

| Component | Notes / states |
|-----------|----------------|
| **App header** | Logo, primary nav, search, account, cart. Sticky, condenses on scroll. |
| **Mega-menu / collection nav** | Styles (Tile, Art Back, …), Shop by room, Custom (Atelier3d entry). |
| **Product card** | Image, title, from-price, style tag, "Configure" vs "Buy" affordance. |
| **PDP gallery** | Photo set + (when applicable) live render thumbnail. |
| **Configurator panel** | Grouped option controls; live price; validity/constraint messaging. |
| **Option controls** | Swatches (wood/finish), segmented (style), steppers (dimensions), toggles, asset pickers (back art). Locked = read-only chip. |
| **4K render viewer** | Zoom, pan, AR/fullscreen, "rendering…" → "4K ready" state. |
| **Price block** | Live total, `--font-mono`, expandable breakdown. |
| **Made-to-order policy microcopy** | "Made to order · no returns or exchanges" shown near add-to-cart, in the cart, and at checkout — every product is custom-made. |
| **Quote/Private banner** | "Prepared for {name} · expires {date}" on private/hybrid PDPs. |
| **Cart line** | Thumbnail (render), config summary, edit link. |
| **Star rating** | Aggregate + inline stars; half-stars; count; keyboard/AT-operable (input variant for "write a review"). |
| **Review summary** | Average score, star **histogram** (5→1), total count, "% recommend", photo-gallery strip, sort/filter (with photos, rating, recent). |
| **Review card** | Reviewer name + **verified-buyer** badge, date, rating, body, **customer photos**, helpful votes, and optional **brand response**. |
| **Write-a-review form/modal** | Star input, title/body, photo upload, consent; verified-buyer gated from order history; submitting / success / moderation-pending states. |
| **Buttons** | primary / secondary / ghost / destructive; loading & disabled states. |
| **Forms & inputs** | Labels always visible; inline validation; error + helper text. |
| **Empty / loading / error** | Skeletons for cards & viewer; friendly empty states. |
| **Toasts & dialogs** | Non-blocking confirmations; modal only for destructive/auth. |

---

## 4. Page layout blueprints (shared across iterations)

> These are the **structural** layouts. Iterations restyle them; they do not restructure them.

### 4.1 Home
Hero (brand + "Design yours" CTA) → featured styles (Tile / Art Back / …) → "How custom works" (3 steps: Configure → Preview in 4K → We craft it) → shop-by-room → social proof → newsletter/footer.

### 4.2 Collection
Filter rail (style, room, size, wood, finish, price) + sortable responsive grid + quick-view; "Configure" badge on configurable items; **star-rating badge** on cards.

### 4.3 Product (ready-made)
Gallery left / details right; variant picker; add-to-cart; specs; care; related. **Reviews section** (family-level): review summary + histogram + photo gallery + sortable/filterable review cards, with a verified-buyer "write a review" entry. The configurator and private/hybrid pages link to the same family-level reviews.

### 4.4 Configurator (`/configure/...`)
```
┌───────────────────────────────────────────────┐
│ header                                          │
├───────────────────────┬─────────────────────────┤
│                       │  Style: [Tile][Art Back] │
│   4K / WebGL VIEWER    │  Dimensions  ▭▭▭         │
│   (rotate · zoom · AR) │  Wood swatches ● ● ●     │
│                       │  Finish ● ●              │
│   [render4k] [AR]      │  Back art  [pick]        │
│                       │  ───────────────────     │
│                       │  Price  $248  (▼ details)│
│                       │  [ Add to cart ]         │
└───────────────────────┴─────────────────────────┘
```
≥lg split; <lg stacks viewer on top with a **sticky price+CTA bar**.

> **Note:** configurable products **never** use Shopify's native variant picker (3-option / 2,048-variant limits). All options come from the **Variant & Options Engine** (Master Plan §5.4); the configurator UI is mandatory for these products.

### 4.5 Private / hybrid listing (`/q/:token`)
Same as configurator/PDP **plus** a "Prepared for you" banner, expiry, locked options shown read-only, editable options interactive (hybrid).

### 4.6 Cart → Checkout
Cart shows render thumbnail + config summary per line; checkout is **Shopify-native**.

### 4.7 Account
Orders, **saved configurations**, **my quotes** (active private/hybrid listings).

---

## 5. Motion & interaction principles
- **Purposeful, not decorative.** Motion explains state (render progress, option applied, price change).
- **Respect `prefers-reduced-motion`.** Provide instant equivalents.
- **Optimistic UI** for option changes; reconcile price/validity from the **CRM pricing engine**.
- **Never trap the user** waiting on a 4K render — preview stays interactive.

---

## 6. Accessibility & responsive standard (non-negotiable, all iterations)
- **WCAG 2.2 AA**: contrast ≥ 4.5:1 text / 3:1 large; visible focus rings; 44px min targets.
- **Keyboard**: full configurator operability; logical focus order; skip links.
- **Screen readers**: option groups labelled; live region announces price/render changes; render viewer has text/spec fallback. **Star ratings** expose an accessible name (e.g., "4.8 out of 5, 126 reviews); the review-input stars are keyboard-operable radios.
- **Responsive**: mobile-first; no horizontal scroll; sticky CTA on small screens.
- **Performance budget**: hero/preview never block on 4K; images responsive + lazy.

---

## 7. The 10 design iterations (FOR APPROVAL)

Each iteration = the same system, a different soul. For each: **concept**, **palette**, **type**, **layout/texture signature**, **best for**, and **trade-off**. See them live in [`../mockups/index.html`](../mockups/index.html).

> **Reading the palettes:** values are starting points; all are tuned to pass AA before build.

---

### Iteration 1 — "Atelier Gallery"
- **Concept:** Museum-grade minimalism. The product is the artwork; the UI disappears.
- **Palette:** Gallery white `#FAF9F6`, ink `#1A1A1A`, muted `#6B6B6B`, brand walnut `#6B4A2B`, line `#E7E3DC`.
- **Type:** Display serif (e.g., a refined transitional serif) + clean grotesque body; mono for specs.
- **Signature:** Enormous whitespace, hairline rules, centered hero, slow fades, oversized product imagery.
- **Best for:** Premium positioning; lets 4K renders shine.
- **Trade-off:** Can feel sparse; needs excellent photography/renders to carry it.

### Iteration 2 — "Warm Workshop"
- **Concept:** The maker's bench. Tactile, honest, handcrafted.
- **Palette:** Kraft `#EFE7D8`, ink `#2B2117`, brand amber `#B8742A`, sage `#7C8466`, line `#D8CBB3`.
- **Type:** Humanist serif headlines + humanist sans body; hand-drawn accent marks.
- **Signature:** Paper/wood textures, stamp-like badges, process photography, warm shadows.
- **Best for:** Storytelling, artisanal trust, "made by hand" narrative.
- **Trade-off:** Texture must be restrained to keep the configurator legible.

### Iteration 3 — "Modern Luxe"
- **Concept:** Editorial luxury. Dark, quiet, expensive.
- **Palette:** Espresso `#171411`, surface `#211C17`, ink `#F3EEE6`, brand brass `#C9A227`, line `#3A332B`.
- **Type:** High-contrast display serif + tight modern sans; brass-on-dark accents.
- **Signature:** Dark canvas, gold hairlines, generous margins, cinematic product lighting.
- **Best for:** High-ticket custom pieces; pairs beautifully with 4K hero renders.
- **Trade-off:** Dark UI needs careful contrast tuning for forms/configurator.

### Iteration 4 — "Scandi Light"
- **Concept:** Functional, airy, calm. Form follows function.
- **Palette:** Snow `#FFFFFF`, mist `#F2F4F3`, ink `#222826`, brand birch `#C9B79C`, accent slate `#5B6B73`.
- **Type:** Geometric sans throughout; light weights; lots of air.
- **Signature:** Light woods, soft grids, rounded radii, gentle shadows, lifestyle-in-bright-rooms.
- **Best for:** Broad appeal, clarity, fast comprehension of configurable options.
- **Trade-off:** Risk of feeling generic without strong photography/brand marks.

### Iteration 5 — "Bold Editorial"
- **Concept:** Magazine energy. Big type, confident layout, asymmetric.
- **Palette:** Bone `#F5F2EC`, ink `#111`, brand vermilion `#D7492B`, ink-blue `#1F2A44`, line `#E3DDD2`.
- **Type:** Oversized display + tight tracking; sans body; numerals as graphics.
- **Signature:** Asymmetric grids, full-bleed type, editorial captions, strong color blocks.
- **Best for:** Marketing-led, drops/collections, a brand with a point of view.
- **Trade-off:** Strong personality must not overpower the configurator's clarity.

### Iteration 6 — "Tech Configurator-First"
- **Concept:** The configurator *is* the homepage. Product-as-software.
- **Palette:** Graphite `#15171A`, surface `#1E2125`, ink `#EAECEE`, brand cyan `#2FB6C9`, line `#2C3036`.
- **Type:** Precise neo-grotesque + mono for all numerics; UI-dense but tidy.
- **Signature:** Dashboard panels, live readouts, segmented controls, keyboard hints, dark "app" feel.
- **Best for:** Showcasing Atelier3d + live 4K as the core differentiator.
- **Trade-off:** Leans "tool" over "warmth"; needs lifestyle moments to stay human.

### Iteration 7 — "Organic Botanical"
- **Concept:** Nature-led warmth. Wood + plants + light.
- **Palette:** Linen `#F3EFE6`, ink `#23291F`, brand moss `#4F6B3A`, terracotta `#B5673E`, line `#DAD3C2`.
- **Type:** Soft serif headlines + humanist sans; leaf/curve accents.
- **Signature:** Organic shapes, botanical styling in lifestyle shots, earthy gradients.
- **Best for:** Home-décor emotional appeal, sustainability story.
- **Trade-off:** Must keep organic shapes from interfering with grid/legibility.

### Iteration 8 — "Heritage Craft"
- **Concept:** Timeless workshop heritage; trademark-quality, classic.
- **Palette:** Parchment `#EFE9DC`, ink `#2A2620`, brand oxblood `#7B3B34`, brass `#A8852C`, line `#D5CBB6`.
- **Type:** Classic serif (old-style) + small-caps labels; engraved feel.
- **Signature:** Crests/monograms, rule-lined sections, letterpress textures, archival photography.
- **Best for:** Legacy/trust, gifting, premium heritage narrative.
- **Trade-off:** Can read "old" if not balanced with modern spacing/motion.

### Iteration 9 — "Minimal Mono"
- **Concept:** Type-driven, near-monochrome, ruthless clarity.
- **Palette:** Paper `#FFFFFF`, ink `#0A0A0A`, grey scale only, single brand hairline accent `#0A0A0A`.
- **Type:** One superb sans across weights; mono for data; no decoration.
- **Signature:** Black/white, strict grid, type hierarchy does all the work, micro-interactions only.
- **Best for:** Ultra-modern, design-savvy audience; cheapest to keep consistent.
- **Trade-off:** Little warmth; relies entirely on imagery + copy for emotion.

### Iteration 10 — "Showroom 3D Immersive"
- **Concept:** Walk-through showroom. Full-bleed 3D scenes; the piece lives in a space.
- **Palette:** Near-black stage `#0E0F12`, ink `#F4F5F7`, brand warm-white `#EDE7DB`, accent amber `#E0A458`, line `#23262B`.
- **Type:** Cinematic display + clean sans HUD; mono overlays for specs.
- **Signature:** Immersive scenes, scene transitions, floating HUD controls, 4K renders as backdrops, AR-forward.
- **Best for:** Maximizing the 4K render + Atelier3d "wow"; flagship differentiator.
- **Trade-off:** Heaviest to build/perform; needs the render pipeline mature (Phase 3+).

---

### 7.1 Comparison matrix

| # | Iteration | Mood | Warmth | "Wow" | Build effort | Configurator fit |
|---|-----------|------|:------:|:-----:|:------------:|:----------------:|
| 1 | Atelier Gallery | Premium minimal | ●●○ | ●●● | ●○○ | ●●○ |
| 2 | Warm Workshop | Artisanal | ●●● | ●●○ | ●●○ | ●●○ |
| 3 | Modern Luxe | Dark luxury | ●●○ | ●●● | ●●○ | ●●○ |
| 4 | Scandi Light | Calm functional | ●●○ | ●○○ | ●○○ | ●●● |
| 5 | Bold Editorial | Magazine | ●●○ | ●●○ | ●●○ | ●●○ |
| 6 | Tech Configurator-First | App-like | ●○○ | ●●● | ●●● | ●●● |
| 7 | Organic Botanical | Natural | ●●● | ●●○ | ●●○ | ●●○ |
| 8 | Heritage Craft | Classic | ●●● | ●●○ | ●●○ | ●●○ |
| 9 | Minimal Mono | Stark modern | ●○○ | ●●○ | ●○○ | ●●● |
| 10 | Showroom 3D Immersive | Cinematic | ●●○ | ●●● | ●●● | ●●● |

**Recommendation (Decision D2):** lead with **#1 Atelier Gallery** or **#2 Warm Workshop** — they sit closest to the CRM's **Indigo Atelier** and Atelier3D's warm-neutral + teal, keeping the suite one brand (#3 Modern Luxe is the premium-dark alternative). **Borrow #6/#10 patterns** for the configurator and 4K viewer. Whichever wins, its tokens **alias the `--mj-*` set** (D12). Final call is yours.

---

## 8. From iteration to build
Once a primary iteration is approved:
1. Lock token *values* for that direction (color/type/texture) **as overrides/aliases of the CRM `--mj-*` tokens** so the suite stays consistent (D12).
2. Apply to the shared component library + page blueprints.
3. **Produce an approved HTML mockup for *every* UI** in the mockup register (§9) — all page layouts, key components, and responsive/empty/loading/error states — not just a few hero pages.
4. Accessibility + performance pass against §6 on the mockups.
5. Only **approved** mockups proceed to Online Store 2.0 theme build (the mockup-first gate, §0.1 / §9).

---

## 9. Mockup-first approval gate (mandatory)

**Rule:** every UI in this standard must have a **self-contained HTML mockup**, rendered for review and **explicitly approved**, *before* it is built in the Online Store 2.0 theme. This covers all page layouts (§4), all shared components (§3), their responsive and empty/loading/error states, and the chosen iteration's full-fidelity pages.

### 9.1 What a mockup deliverable is
- A **self-contained HTML/CSS file** in [`../mockups/`](../mockups/) using the **approved iteration's tokens** (aliasing `--mj-*`, §2 / D12) — openable in any browser, no build step.
- **Rendered to PDF/PNG** for sharing/sign-off via [`../tools/render_mockups.mjs`](../tools/render_mockups.mjs).
- Shows **real content + representative states** (live price, render viewer states, locked vs editable options) — not lorem where data matters.
- **Mobile + desktop** wherever the layout differs.

### 9.2 Process (per UI)
1. **Draft** the HTML mockup in `../mockups/`.
2. **Render** it to PDF/PNG.
3. **Review** with stakeholders; capture feedback; iterate.
4. **Approve** — record sign-off (date + who) in the register below.
5. **Build** — only an approved mockup may proceed to theme code.

A UI **cannot be marked build-ready without an approved mockup.** This is a gate in Phase 0–1 (Master Plan §11), and the approved mockups are the reference for the §11.1 sandbox demo.

### 9.3 Mockup register (every UI that needs a mockup)

> Status: ☐ to do · ◐ in review · ✓ approved. The existing [`../mockups/index.html`](../mockups/index.html) covers the **10-iteration selection** (✓ produced); the per-UI mockups below are produced in the **approved** iteration once D2 is chosen.

**Pages (§4)**

| UI | Mockup file | Status |
|----|-------------|:------:|
| Iteration selection (10 directions) | `mockups/index.html` | ✓ produced |
| Home | `mockups/home.html` | ✓ approved |
| Collection / catalog | `mockups/collection.html` | ✓ approved |
| Product (ready-made) PDP — incl. reviews section | `mockups/product.html` | ✓ approved |
| Configurator (product-type tabs) + 4K viewer | `mockups/configurator.html` | ✓ approved |
| Private / hybrid listing | `mockups/private-listing.html` | ✓ approved |
| Cart | `mockups/cart.html` | ✓ approved |
| Account + saved configs | `mockups/account.html` | ◐ in review |
| My quotes | `mockups/account-quotes.html` | ◐ in review |
| Content (FAQ / made-to-order policy) | `mockups/content.html` | ◐ in review |

**Components & states (§3)**

| UI | Mockup file | Status |
|----|-------------|:------:|
| Header / nav + mega-menu | `mockups/components.html` | ◐ in review |
| Product card | `mockups/components.html` | ◐ in review |
| Configurator panel + option controls (swatch / segmented / stepper / asset / locked) | `mockups/components.html` | ◐ in review |
| 4K render viewer (rendering / ready / AR / fullscreen) | `mockups/components.html` | ◐ in review |
| Price block + made-to-order microcopy | `mockups/components.html` | ◐ in review |
| Quote / Private banner | `mockups/components.html` | ◐ in review |
| Cart line | `mockups/components.html` | ◐ in review |
| Buttons / forms / inputs | `mockups/components.html` | ◐ in review |
| Empty / loading / error states | `mockups/components.html` | ◐ in review |
| Toasts / dialogs | `mockups/components.html` | ◐ in review |
| Reviews section (summary + histogram + photo gallery + cards) | `mockups/components.html` | ◐ in review |
| Write-a-review (verified-buyer modal/page + states) | `mockups/components.html` | ◐ in review |

**Responsive:** each page mockup includes a **mobile** view (≤ md) where the layout differs (especially the configurator's stacked viewer + sticky price/CTA bar).

---

_End of UI Design Standard (Draft v0.2). Please approve one primary iteration (and any accents) — Decision D2 — then the per-UI mockups land per §9._
