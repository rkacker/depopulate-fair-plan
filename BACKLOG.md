# BACKLOG — site analysis & visualization

Working backlog for improving the depth and quality of analysis and visualization on
depopulatefairplan.com. **Scope: redesign-first** — every active task serves the
single-page consolidation (fold `/data` into the home page as in-flow deep-dive
sections, retire `/data` via redirect, advocacy/press audience first). Quality work
(trust / craft / pipeline) is parked in the Icebox until the redesign lands.

The design brief that gates this work is at `docs/redesign-brief.md` — read it before
starting the "Phase-1 design spec" task.

## How to use this file (session ritual)

1. Read **Now**. Pick the top unblocked item.
2. Branch / worktree → implement → `just test` (pipeline) and `npm run typecheck` (web).
3. Commit. Move the item to **Done** with the date.
4. Re-score and re-rank: promote the next item into **Now**.

## Scoring — ICE (Impact × Confidence × Ease, 1–10 each)

- **Impact** — how much it strengthens the "depopulate the FAIR Plan" argument / press utility.
- **Confidence** — how sure we are it lands well + the underlying data is reliable.
- **Ease** — 10 = data already in `data/exports/` + a simple component; lower = needs a new
  export, parser work, or a complex/novel visualization.
- **Score = I × C × E.** Sort within a bucket by score, but honor **Dependencies** first
  (a gated task can't be "Now" no matter its score).

Themes: `Depth` (metrics/tables) · `Viz` (sections/charts) · `Trust` · `Craft` · `Pipeline`.

---

## Now

- [ ] **Phase-1 design spec + wireframes** · `Viz` · L · I8 C9 E7 = **504**
  Run the redesign brief to produce the section-by-section spec, summary-panel system,
  story arc, and `/data` retirement map. *Gates every implementation task below.*
  **Draft delivered → [`docs/redesign-phase1-spec.md`](docs/redesign-phase1-spec.md) (pending review).**
  DoD: a reviewed spec doc in `docs/`; section list + panel inventory agreed.

- [ ] **Page-shell consolidation** · `Viz` · M · I7 C8 E6 = **336** · _blocked by: spec_
  Fold the three `/data` tabs into in-flow home sections; 301-redirect `/data` →
  `/#data` (preserve `?tab=` deep links); update nav/anchors. Remove the `?view=zip`
  experiment toggle in favor of the planned drill-down.
  DoD: single page renders all sections; `/data` and old `?tab=` URLs redirect; `astro check` clean.

- [ ] **Summary-panel design system** · `Viz` · M · I7 C8 E6 = **336** · _blocked by: spec_
  Build 4–6 reusable panels (headline-stat card, top-N w/ sparkline, dual-metric callout,
  distressed-flag chip) so sections compose as one system.
  DoD: panel components in `web/src/components/`, used by ≥2 sections.

## Next (ranked by score; most need a new export)

- [ ] **Statewide-history inline section** · `Viz` · S · I5 C9 E8 = **360** · _blocked by: shell_
  Rebuild the existing quarterly-history tab as a home section. Data is export-ready
  (`fair_statewide_history.csv`). Low-risk warm-up.

- [ ] **Premium-burden panel** · `Depth` · M · I7 C9 E5 = **315**
  premium ÷ policy_count and exposure ÷ policy_count by county; cost-of-coverage angle.
  **Not export-ready** — `california_county_data.csv` ships `policies` only; premium/exposure
  exist in processed data (`fair/county_quarterly.csv`) but must be added to the export
  contract first. Confirmed spread is ~12× across counties (not the brief's 2–3×).

- [ ] **Market-failure context** · `Depth`/`Viz` · M · I8 C7 E5 = **280**
  Counties where voluntary PIF is flat/declining while FAIR PIF accelerates. Needs
  `cdi/county_yearly.csv` added to the export contract.

- [ ] **Senate-district view** · `Viz` · M · I9 C6 E5 = **270**
  FAIR PIF apportioned to 40 CA Senate districts + senator names + 5-yr trend. Needs
  `analysis/senate_district_pif.csv` exported. **Open Q:** legal sign-off to name senators?

- [ ] **ZIP deep-dive section** · `Viz` · M · I6 C7 E6 = **252** · _blocked by: shell_
  Properly fold the ZIP map/table in as a drill-down (replacing the `?view=zip` hack).

- [ ] **Distressed-vs-growth divergence** · `Depth`/`Viz` · L · I9 C7 E4 = **252**
  Where CDI's distressed flag disagrees with actual FAIR growth — the sharpest angle.
  Needs `analysis/distressed_zip_reconciliation.csv` exported; chart form TBD by spec
  (slope graph vs. map).

## Someday / Icebox (deferred until redesign lands)

- [ ] `Trust` — Methodology / data-dictionary page; source-freshness badges.
- [ ] `Trust` — Data-quality tests on exports (row counts, totals, no-null invariants) in CI.
- [ ] `Craft` — Accessibility pass: tabular fallbacks for every chart, keyboard nav.
- [ ] `Craft` — Performance/bundle budget per section; lazy-load heavy ZIP datasets.
- [ ] `Craft` — Shareable stat cards / "embed this number" for press.
- [ ] `Pipeline` — New-quarter ingestion runbook; parser robustness on format drift.
- [ ] `Depth` — Total-insured-value (TIV) trends vs. policy counts (`zip_tiv_history.csv`).
- [ ] `Pipeline` — Remove dead `site/build.py` (legacy static generator superseded by `web/`).
- [ ] `Pipeline` — Drop `california_city_data.csv` from `config/export_contract.json` + `build_exports()` — the city view is retired, so the export is produced but unused (and not synced to the site).
- [ ] `Depth` — **Blocked:** "FAIR share of total market" *by ZIP*. CDI publishes total-market PIF only at the county level (`cdi_county_market_share.csv`); no ZIP-level denominator exists, so a true ZIP market-share table can't be built without fabricating one. Needs CDI ZIP-level market data (out of v1 scope). The county FAIR-share tab covers this dimension today.

## Done (rolling log)

- [x] 2026-05 — Remove city-level view; add build-time (SSR) data loading.
- [x] 2026-05 — Add `@astrojs/check` for `astro check` typecheck.
- [x] 2026-05 — Fix `?view=zip` loading flash; empty-`initialRows` fetch suppression; numeric year sort.
