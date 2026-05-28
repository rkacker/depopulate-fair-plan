# Redesign brief — next-iteration data sections

Reference brief for the single-page redesign of depopulatefairplan.com. This is the
gating artifact for the **redesign-first** backlog (`BACKLOG.md`): it can be handed to
an expert (web-viz + data scientist) or a fresh Claude session to produce the Phase-1
design spec. Self-contained — assumes no prior repo knowledge.

> **Snapshot as of 2026-05.** The data inventory and coverage dates below are point-in-time.
> Re-check the ✅/❌ "what's exported" status against `config/export_contract.json` and the
> coverage window against `config/sources.toml` before relying on it.

## Locked decisions

- **End-state shape:** Single page. Fold `/data` into the home page as deep-dive sections.
  Redirect `/data` → `/#data` (or relevant anchor).
- **Audience priority:** Advocacy + press first (policymakers, journalists, advocacy
  partners). Story arcs, shareable summary panels, copy-paste stats over dimensional drill-downs.
- **Deliverable format:** Two phases. Phase 1 = design spec + low-fi wireframes for review.
  Phase 2 = implementation plan, only after the spec is approved.

---

# Brief: Next-iteration data sections for depopulatefairplan.com

You are designing the next iteration of an advocacy/data website that aggregates and
visualizes the California FAIR Plan crisis. The site is at depopulatefairplan.com. It is
backed by an open-source Python pipeline that produces canonical CSVs from public CDI and
FAIR Plan PDFs.

You are working as a hybrid web-visualization designer and applied data scientist. Your job
in this engagement is to recommend how to surface much more of the underlying data — through
both narrative summary panels and deep-dive sections — without sacrificing the advocacy
voice of the current site.

## Audience

Optimize for **advocacy and press first**:
- California policymakers, legislative staff, and regulators (CDI)
- Journalists covering insurance, climate, housing
- Advocacy and consumer partners who quote/link the site

Homeowner self-lookup and researcher drill-downs are secondary. Design choices that trade
deep dimensional filtering for clearer story arcs and shareable stats are correct.

## Hard constraints

- **Single-page end state.** Fold the existing `/data` page into the home page as in-flow
  sections. After this redesign, `/data` 301-redirects to a home anchor. There is no second
  page. Tabs may exist *within* a section, but not as the page's top-level navigation.
- **Stack:** Astro 6 + React islands, Tailwind, react-simple-maps for choropleths, PapaParse
  for CSV. Data is bundled into the HTML at build time via Vite `?raw` imports; large datasets
  (ZIP-level, ~1,700 rows) lazy-load on the client. Keep this pattern — do not propose a
  backend, an API, or runtime data fetching from the pipeline.
- **Performance budget:** First contentful paint must remain fast on a mobile connection.
  County-level data ships with HTML; ZIP-level only loads on intent (scroll or interaction).
  Choose viz libraries that don't balloon bundle size.
- **Accessibility:** Every chart needs a tabular fallback in the DOM, semantic headings, and
  keyboard-navigable controls. Don't propose viz that requires hover-only interaction.
- **Voice:** Advocacy/civic, not academic. "Insurer of last resort," not "residual market
  mechanism." Headlines first, methodology in disclosures.

## What exists today (do not redesign these unless necessary)

**Main page (`web/src/pages/index.astro` → `web/src/components/Home.tsx`):**
1. Hero — large stat (current FAIR policy count), two CTAs
2. CrisisStats — three cards: prior-year count, current count, multiplier
3. CrisisMap — county-level choropleth, react-simple-maps + TopoJSON, tier-colored
4. CountyTable — sortable, quarter and YoY velocity indicators
5. Signup — Google Apps Script webhook for email capture

**`/data` page (`web/src/components/sections/DataPage.tsx`), tabs:**
1. Statewide History (Quarterly) — sparkline summary cards + table
2. FAIR Plan History (by ZIP) — searchable/sortable table with FY 2021–2025 sparklines
3. FAIR Share of Total Market — county table comparing total PIF vs. FAIR Plan PIF, 2020–2023

There is also a hidden `?view=zip` experiment on the main page that swaps the county
map+table for ZIP-level versions. Decide whether to keep it as a toggle, integrate it as a
zoom drill-down, or retire it.

## What's in the data — and what's underused

The pipeline (`src/fairplan/pipeline.py`, `src/fairplan/parsers.py`) produces these
canonical tables. Assume any of these can be added to `config/export_contract.json` and
synced to `web/public/data/` via `web/scripts/sync-data.sh`. Today, only the items marked
✅ are surfaced on the site.

**FAIR Plan (quarterly, 2019-09 → 2026-03, ~26 quarters):**
- `fair/county_quarterly.csv` — latest county snapshot ✅ (as `california_county_data.csv`)
- `fair/zip_quarterly.csv` — latest ZIP snapshot ✅ (as `california_zip_data.csv`)
- `fair/city_quarterly.csv` — latest city snapshot (city aggregates) ❌
- `fair/county_pif_history.csv` — county PIF over 5 fiscal years ❌
- `fair/city_pif_history.csv` — city PIF over 5 fiscal years ❌
- `fair/zip_pif_history.csv` — ZIP PIF over 5 fiscal years ✅ (as `california_zip_history.csv`)
- `fair/zip_tiv_history.csv` — ZIP **total insured value** history (different story than PIF) ❌
- `fair/zip_wide.csv` — full ZIP × quarter pivot of policy_count and exposure (1,682 ZIPs) ❌
- `fair/county_rankings.csv` — top counties by latest count ❌
- `fair_statewide_history.csv` — statewide policy_count / premium / exposure trajectory ✅

**CDI market context (annual, 2020 → 2023):**
- `cdi/statewide_yearly.csv` — voluntary vs. FAIR new/renewed/nonrenewed at state level ❌
- `cdi/county_yearly.csv` — same, by county ❌
- `cdi/county_pif_wide.csv` — county total_pif vs. fair_plan_pif vs. fair_plan_share ✅
  (as `cdi_county_market_share.csv`)
- `cdi/distressed_counties.csv` — official distressed-county flags ❌
- `cdi/distressed_zips.csv` — official distressed-ZIP flags ❌

**Derived analyses (computed by pipeline, never surfaced):**
- `analysis/distressed_county_pif.csv` — distressed counties × 5-year FAIR PIF history ❌
- `analysis/distressed_zip_pif.csv` — distressed ZIPs × 5-year FAIR PIF history ❌
- `analysis/distressed_zip_reconciliation.csv` — agree/disagree flags between CDI's
  distressed list and the FAIR Plan's actual growth trajectory ❌
- `analysis/senate_district_pif.csv` — FAIR PIF apportioned to 40 CA senate districts
  with senator names + 5-year history + CDI market context ❌

**Story angles already validated by the team but not built:**

1. **Distressed-vs-growth divergence.** CDI's distressed-area flag (used for moratoria,
   non-renewal protections) often *disagrees* with actual FAIR Plan growth. The
   reconciliation table makes this explicit. Compelling because it directly questions
   whether CDI's classifications match the on-the-ground crisis.

2. **Senate district view.** FAIR PIF apportioned to CA Senate districts → "your senator,
   your constituents on the FAIR Plan, the 5-year trend." Politically actionable.

3. **Market-failure context.** Counties where the *voluntary* market is retreating — i.e.,
   total PIF flat or declining while FAIR Plan PIF accelerates. Pairs the CDI county
   yearly data with FAIR Plan growth.

4. **Premium burden / exposure normalization.** premium ÷ policy_count and exposure ÷
   policy_count vary 2–3× across the state. The cost-of-coverage angle has not been told.

5. **Concentration risk.** What share of statewide FAIR Plan exposure sits in the top 10
   ZIPs / top 10 cities? Single number, easy to quote.

## What to deliver

### Phase 1 — Design spec + low-fi wireframes (this engagement)

Produce a single Markdown document containing:

1. **Page outline** — ordered list of sections from hero to signup, with a one-sentence
   purpose for each. Show how today's `/data` tabs land in this outline.

2. **Section specs.** For each new or rebuilt section:
   - Headline + supporting copy direction (not final copy — voice cues + a placeholder hook)
   - The "headline number" or summary stat the section opens with
   - Chart type and why (bar / choropleth / small multiples / slope / sparkline grid / etc.)
   - Data binding: which canonical CSV(s) and which columns
   - Interaction model: hover, sort, filter, drill — and what's keyboard/tab-fallback
   - Mobile layout note (stack order, what collapses)
   - Low-fi ASCII or sketch-style wireframe

3. **Summary panel system.** Define 4–6 reusable "summary panels" (e.g., headline stat
   card, top-N list with sparklines, dual-metric callout, distressed-flag chip).
   These should be composable across sections so the page reads as one design system,
   not a collage.

4. **Story arc.** A one-paragraph narrative explaining how a reader's understanding builds
   as they scroll: which beat lands the crisis, which lands the "why now," which lands the
   "where," which lands the "what's broken," which lands the "what can be done." Map each
   beat to a section in the outline.

5. **`/data` retirement note.** A short subsection naming exactly which existing `/data`
   tabs survive (rebuilt as sections vs. retired entirely), and the redirect target for
   each previous `?tab=` URL — preserve external links from press/research citations.

6. **Open design questions** — 3–6 questions for the team that genuinely block the spec
   (e.g., "Do we have legal sign-off to name individual senators?"). Don't pad.

**Length target:** 8–15 screens of Markdown. No code. No component names. No file paths
yet — those belong in Phase 2.

### Phase 2 — Implementation plan (separate engagement, only after Phase 1 is approved)

A second Markdown document, scoped only after Phase 1 lands. It will include:
- Section-by-section component breakdown (new files in `web/src/components/sections/`)
- Props / TypeScript types (add to `web/src/types.ts`)
- Server-side data loaders to add to `web/src/lib/loadData.server.ts`
- New entries for `config/export_contract.json` and `data/exports/` (with column specs
  the pipeline maintainer can implement against)
- The redirect implementation for `/data`
- Migration order: ship-ready slices that can land one PR at a time, not a big-bang rewrite
- Performance and bundle-size notes per section

Do not begin Phase 2 until the Phase 1 document has explicit sign-off.

## What "good" looks like

A strong Phase 1 spec will:
- Open with a one-paragraph thesis on what the redesign *changes about what this site
  argues*, not just what it shows. The data is in service of an argument.
- Treat the page as a sequenced argument — each section earns the next. Cut sections that
  don't move the argument forward, even if the data is interesting.
- Surface 1–2 derived insights that the team hasn't asked for. You're the data scientist
  in the room; if the senate-district view should be replaced with congressional districts,
  or if the distressed-vs-growth chart is actually a slope graph rather than a map, say so
  with reasoning.
- Be honest about what *doesn't* belong on a single page. If something is researcher-only,
  recommend an external CSV/data dictionary link rather than building a section for it.

## Inputs you can rely on

- Repo: github.com/rkacker/depopulate-fair-plan (open source)
- Pipeline overview: `CLAUDE.md` and `README.md` at repo root
- Current site code: `web/` directory (Astro + React)
- Live site: depopulatefairplan.com
- Data freshness: pipeline reruns when CA FAIR Plan and CDI publish; latest snapshot is
  the FAIR Plan quarterly ending 2026-03-31.

---

## Critical paths (Phase 2 implementation)

Once Phase 1 lands, the relevant code paths are:

- `web/src/pages/index.astro` — page entry, build-time data loading
- `web/src/components/Home.tsx` — section composition; remove the `?view=zip` toggle if Phase 1 retires it
- `web/src/components/sections/` — new section components go here
- `web/src/components/sections/DataPage.tsx` — entire file likely deleted; tabs become inline sections
- `web/src/pages/data.astro` — replaced by a redirect (`Astro.redirect("/#data", 301)`)
- `web/src/lib/loadData.server.ts` — add server loaders for new exports
- `web/src/lib/data.ts` — add lazy client loaders for ZIP/large datasets
- `web/src/types.ts` — new TS types for added datasets
- `web/scripts/sync-data.sh` — pulls new exports from `data/exports/` if added
- `config/export_contract.json` — add any new exports the pipeline needs to ship
- `src/fairplan/pipeline.py` (`build_exports`) — implement any new export the contract names

## Pre-flight checks before commissioning Phase 1

1. Confirm the audience priority and the "single page, /data retired" decision still hold —
   they shape the brief fundamentally.
2. Confirm there's appetite for naming individual senators in the senate-district section.
   If not, soften story angle #2 or move it to "open questions."
3. Confirm whether the press kit / shareable-stat angle (image cards, share-this-number
   embeds) should be in scope — currently implicit via "summary panels."
4. After Phase 1 is delivered, sanity-check the spec against `config/sources.toml` to make
   sure the data it assumes is within the pipeline's coverage window.
