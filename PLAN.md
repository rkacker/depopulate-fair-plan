# PLAN: depopulatefairplan.com

The single planning document for the site: direction, page design, and the backlog.
It replaces `BACKLOG.md`, `docs/redesign-brief.md`, and `docs/redesign-phase1-spec.md`
(all in git history before 2026-11-23).

## How to use this file (session ritual)

1. Read **Now**. Pick the top unblocked item.
2. Branch or worktree, implement, then `just test` (pipeline) and `npm run typecheck` (web).
3. Commit. Move the item to **Done** with the date.
4. Promote the next item into **Now**.
5. Never push `main` with user-visible changes before Rishi reviews the dev server (push deploys production).

## Direction (decided 2026-11-23)

The homepage is one integrated, homeowner-first argument, told by regulatory era:

1. FAIR Plan growth is a problem (what it costs you, the numbers, where).
2. It is a regulatory problem (who sets prices, the duty to insure, the backstop).
3. **2019 to 2026, Commissioner Lara:** the eight-year scorecard, what was tried in
   regulation and in legislation, the Sustainable Insurance Strategy and risk models,
   and the result: growth stopped, no decline.
4. **2027 to 2030, Commissioner-elect Kim:** the starting-line scorecard, what is on
   the table in regulation and legislation, Natural Disaster Insurance for All with
   its possible benefits and risks, and how we will score the term.
5. What you can do. Read deeper.

Rules that follow from Rishi's review:

- **Policy is always discussed inside an era**, split into regulation (the
  commissioner) and legislation (the Legislature and governor). New policy content
  goes into the era it belongs to, not into a standalone section.
- **The site is a fact and advocacy page.** No signup form, no "contact us", no
  contact email on any page. (Removed 2026-11-23: `Signup.tsx`, the header and map
  buttons, the footer and memo email lines, `web/docs/apps-script.md`.)
- **Framing:** FAIR Plan growth is a failure of regulation, shown by the record.
  NDIFA gets no endorsement; it gets a scorecard.
- `/data` and `/analysis/*` keep their URLs and are linked from the era sections.

## Constraints (carried over)

- **Stack.** Astro 6 with React islands, Tailwind 4, react-simple-maps for maps, hand-written SVG for charts, PapaParse for CSV. No backend, no API, no runtime fetch from the pipeline.
- **Data.** County and statewide data ship in the HTML at build time (`loadData.server.ts`). ZIP-level data loads only on intent.
- **Performance.** Fast first paint on mobile. Hydrate only what is interactive.
- **Accessibility.** Every chart has a tabular fallback in the DOM. No hover-only information. Keyboard-usable controls.
- **Copy.** Follows `.claude/skills/copy-review/SKILL.md`. Every number traces to a `/data` export or to a dated, sourced entry in `web/src/lib/policy.ts`.
- **Pipeline.** `config/export_contract.json` is authoritative for exports. Phase 1 changes no exports.

## Counting rule (decided 2026-11-23)

The site uses one FAIR Plan count: our integrated ZIP-level data (665,673 at
2026-09-30). It does not show the FAIR Plan dashboard's or CDI's higher totals beside
it. A quarterly move that is tiny against the base is reported as **flat**
(`quarterIsFlat` in `web/src/lib/homeStats.ts`, under 0.5% of the base). Q3 2026 was
flat. The message is that the base is not declining. The counts-basis note on `/data`
is the only place the dashboard difference is explained.

## What the November 2026 research settled

- SB 1301 (ch. 693), AB 69 (ch. 496) and AB 1680 (ch. 540) were all signed on
  2026-09-27. SB 1301 raises nonrenewal notice from 75 to 90 days on 2028-01-01.
- Insurer commitments run 730 days from each rate approval (10 CCR § 2644.4.8). The
  first approval under the model rule was Mercury, December 2025, so the first
  deadline is about December 2027.
- CDI has not published policies written against commitments (CalMatters, Sept 2026).
- Verisk, KCC and Moody's RMS wildfire models cleared CDI review by 2025-08-01.
- Jane Kim won the commissioner race (AP call 2026-11-07) and is due to take office
  2027-01-04. On SIS: "we're going to be examining this program."
- Every such fact is in `web/src/lib/policy.ts` with its source and a
  `primary` or `press` level.

## Homepage outline (`/`)

| # | Section (anchor) | Component (`web/src/components/home/`) |
|---|---|---|
| 0 | Hero: the problem and five key facts (`#top`) | `HomeHero` |
| 1 | Why this matters to you (`#why`) | `WhyYouCare` |
| 2 | Map with ZIP lookup and county table (`#where`) | `ZipLookup` (island), `WhereIsland` (island) |
| 3 | It is a regulatory problem (`#regulation`); states that the site tracks regulatory and legislative success or failure | `RegulatoryProblem` |
| 4 | Under Commissioner Lara, 2019 to 2026 (`#lara-era`) | `LaraEra`, `EraTrajectoryChart` |
| 5 | Under Commissioner Kim, 2027 onward (`#kim-era`) | `KimEra` |
| 6 | Take action (`#act`) | `WhatYouCanDo` |

Decided in review (2026-11-23):
- The hero carries the problem and the key facts; there is no separate numbers section. The hero does not mention the 2023 deal. Its message: the Plan grew 4.3 times over the last eight-year term, regulation and legislation set its size, and the new term will be held to account.
- No "Read deeper" section. The header links only to sections of the home page. `/analysis` and `/data` are reached from the footer and from inline links in the era sections and the ZIP result.
- The ZIP lookup sits with the map and shows policies, one-year change, change since fiscal 2023, share of insured homes, fire-hazard share, distressed-list status, and a six-year history.

Era scorecards are computed in `web/src/lib/homeStats.ts` and `lib/distressed.ts`.
Hand-entered facts are in `web/src/lib/policy.ts`. The Lara scorecard is start
against end. The Kim scorecard is a starting line plus "what progress would look
like"; a results column gets filled in each quarter.

### Implementation approach

- Convert `Home.tsx` from one `client:load` island into Astro sections. Hydrate only the header, the map, and the ZIP lookup.
- `web/src/lib/policy.ts` holds every hand-entered fact for sections 1, 4, 5 as typed entries (value, as-of date, source URL), so a review can check them in one file.
- The ZIP lookup lazy-loads its two CSVs on first input. Retire `?view=zip`, `ZipMap`, and `ZipTable` (keeps the 2.8 MB ZIP geometry off the page).
- Header nav: Why, Numbers, The deal, What's next, plus Data and Analysis.
- `Base.astro`: compute the default description from the statewide history.

## Backlog

### Now

- [ ] **Rishi's review of the era-structured homepage** on the dev server, then merge and push.
- [ ] **Verify three dates in the Lara-era timeline** that came from memory, not a checked source: Safer from Wildfires (2022), the nonrenewal moratorium taking effect (2019), SB 254 (2025).
- [ ] **Run `/copy-review`** on the home page before it ships.
- [ ] **Upgrade press-level facts to primary sources** in `policy.ts`: FAIR Plan 29.1% rate increase (find the CDI or FAIR Plan document), insurer rate approvals (CDI approval lists), swearing-in date (state source).
- [ ] **Confirm SB 254 study page numbers by eye** (pp. 46-49 came from automated extraction).
- [ ] **Click-test the ZIP lookup** in a browser: 95667 (listed), 94110 (unlisted), 99999 (no data), "12" (invalid).

### Next (after launch)

- [ ] **Analysis page: the quarter growth stopped (Q3 2026).** Facts and draft framing in `notes/q3-2026-status-update.md`; Q2 setup in `notes/q2-2026-status-update.md`. Respect the re-geocoding caveat (Arnold −250 is not real).
- [ ] **Rewrite the two bill memos against the enacted text.** Both pages carry a dated "signed" note; the bodies still describe the July 2026 versions.
- [ ] **NDIFA standalone explainer** at `/analysis/ndifa`, if the home section outgrows itself.
- [ ] **Kim-era results column.** Each quarterly release, fill in results against the starting-line scorecard in `KimEra.tsx`; add a dated log of regulatory and legislative actions for the era.
- [ ] **Earlier baseline for the Lara era.** Our series starts Sept 2019; find a FAIR Plan count for Dec 2018 or Jan 2019 so the scorecard covers the full term.
- [ ] **Premium-burden panel.** Premium per policy and exposure per policy by county. Needs premium and exposure added to the export contract (`fair/county_quarterly.csv` has them). Spread is about 12× across counties.
- [ ] **Market-failure context.** Counties where voluntary policies are flat or falling while FAIR Plan policies climb; nonrenewals. Needs `cdi/county_yearly.csv` in the export contract.
- [ ] **Trajectory hover tooltip**, mirrored to an ARIA live region.

### Later

- [ ] `Trust` Methodology and data-dictionary page; source-freshness badges.
- [ ] `Trust` Data-quality tests on exports in CI (row counts, totals, no-null invariants).
- [ ] `Trust` Export JSON metadata: `site_stats.json` and `quarterly_totals.json` lack the required `as_of_date`, `coverage_*`, `generated_at`, `methodology`, `source_urls` fields.
- [ ] `Craft` Accessibility pass; performance and bundle budget.
- [ ] `Craft` Shareable stat cards for press.
- [ ] `Depth` Total insured value trends (`zip_tiv_history.csv`).
- [ ] `Depth` FAIR share of total market by ZIP (`cdi/zip_yearly.csv`, denominator as of 2023; current-year denominators wait on the CPRA response).
- [ ] `Depth` Send the CPRA request to CDI (`notes/cpra-request-cdi.md`, placeholders unfilled).
- [ ] `Pipeline` New-quarter ingestion runbook.
- [ ] `Pipeline` Remove dead `site/build.py`; drop `california_city_data.csv` from the contract; retire `site_stats.json.stats_cards`; remove unused `quarterly_totals.json` sync or use it.

### Parked

- Senate-district view (open question: legal sign-off to name senators).
- Summary-panel design system (replaced by the section components above).
- Trajectory multi-series toggle.

## Data available

Synced to `web/public/data/` today: `site_stats.json`, `quarterly_totals.json`,
`fair_statewide_history.csv`, `california_county_data.csv`, `california_zip_data.csv`,
`california_zip_history.csv`, `cdi_county_market_share.csv`, `cdi_distressed_list.csv`,
`distressed_zip_reconciliation.csv`.

Produced by the pipeline but not exported: `fair/county_quarterly.csv` (premium,
exposure by county), `fair/zip_tiv_history.csv`, `fair/zip_wide.csv`,
`cdi/statewide_yearly.csv` and `cdi/county_yearly.csv` (voluntary new, renewed,
nonrenewed through 2023), `cdi/zip_yearly.csv`, `analysis/senate_district_pif.csv`.

## Done (rolling log)

- [x] 2026-11-23 — **Homepage restructured by regulatory era** after Rishi's review: "It is a regulatory problem", the 2019 to 2026 Lara era (scorecard, regulation and legislation tried, SIS, result), the 2027 to 2030 Kim era (starting line, what is on the table, NDIFA benefits and risks, how we score it). Signup and all contact elements removed site-wide. Branches `explainer-panels` and `data/2026q3` deleted.
- [x] 2026-11-23 — **Integrated homepage built** (branch `redesign/integrated-home`): hero with ZIP lookup, Why this matters, The numbers, county map and table, the 2023 deal scorecard ("Stalled, not reversed"), the new commissioner and NDIFA explainer, What you can do, Read deeper. Static sections ship no JavaScript; islands are the header, ZIP lookup, map and table, and signup. Policy facts sourced into `web/src/lib/policy.ts`. Retired `?view=zip`, `ZipMap`, `ZipTable`, `CrisisStats`, `Solutions`, and the 2.8 MB ZIP geometry. Bill memos carry a "signed Sept 27, 2026" note. Sitemap and meta description refreshed.
- [x] 2026-11-23 — **Direction reset.** Plan and backlog consolidated into this file; homepage redirected to a homeowner-first integrated story covering SIS, the new commissioner, and NDIFA.
- [x] 2026-10-28 — **Q3 2026 quarterly release ingested** (as of 2026-09-30, published
  2026-10-19; branch `data/2026q3`): 3 DWE sources + FY2026 5-year PIF/TIV files;
  goldens 665,673 statewide / 665,673 FY2026 / Alameda 11,969; exports synced; ZIP
  history export and scorecard extended to FY2026 (92% grew, +55%). Pipeline work the
  release forced: (1) `config/corrections.toml` + `apply_category_corrections()` for
  two Yuba ZIPs the count PDF dropped (filled from the Plan's 5-year file); (2) stable
  ZIP→county assignment in `normalize()` after the Plan relabeled 7 ZIPs; (3) history
  parser accepts the new 10-token layout; (4) scorecard excludes zero-FY2023 ZIPs
  (5 new ZIPs are re-geocodes of Arnold/Magalia/Myers Flat). Counts-basis note on
  `/data` updated (dashboard 698,307 all-lines vs 686,376 county file). Analysis: first
  QoQ decline (−189); distressed ZIPs −1,447, non-distressed +1,258; details in
  `notes/q3-2026-status-update.md`. **Quarterly ritual additions:** diff the by-category
  count total against the 5-year file total; check ZIP row counts across the three
  DWE PDFs; check for county relabels and first-appearing ZIPs.
- [x] 2026-07-28 — **Q2 2026 quarterly release ingested** (as of 2026-06-30, published
  2026-07-17): 3 new DWE sources, goldens updated (665,862 statewide; Alameda 12,134),
  exports synced, deployed. `fetch` now skips archival (no-URL) sources and files
  already on disk. Analysis: slowest QoQ growth in series (+1.63%); 535 ZIPs declined
  (vs 63 all last FY); growth concentrated in non-distressed SoCal (top-5 counties =
  ~82% of net); deepest ZIP decline just −53 (Carmel).
- [x] 2026-07-28 — **Counts-basis note on `/data`**: our totals match the FAIR Plan's
  ZIP-level files exactly; the Plan's dashboard headline runs higher (675,229 vs
  665,862 dwelling, +9,367 / +1.4% as of 2026-06-30; gap has grown from ~0 in 2023)
  with no published reconciliation — their own footnote: "Totals may vary based on
  data source." Re-check the gap each quarterly release.
- [x] 2026-07-28 — **AB 69/1680 page aligned to the sent amendment memo** (3+3 asks):
  dropped Retention + Machine-readable, headline start-first-quarter-after-enactment,
  "single, published distressed-area definition" wording, late-July status + amendment
  window.
- [x] 2026-07-26 — **CDI/SIS regulatory timeline shipped** on the analysis page:
  structured source (`web/src/lib/sisTimeline.ts`, 13 entries), trajectory chart gains
  announcement/rulemaking-band/operative markers + list-revision tick, §2 honesty copy.
  Non-action entries built then cut in review; live in `notes/cdi-sis-timeline.md`.
- [x] 2026-07-25 — **Distressed-vs-growth divergence** superseded: shipped as the
  `/analysis/depopulation-promise` reconciliation work (matrix section later replaced by
  the article + `/data` tab per review).
- [x] 2026-07-27 — `/data` gains a **CDI Distressed List** tab: the official March 2025
  list verbatim (29 counties, 663 ZIPs, new `cdi_distressed_list.csv` export, contract
  v12) with per-ZIP dots cross-checking the FAIR quarterly "Is Distressed Area" flag
  (573 / 1 / 89). Article notes the list covers the full designated footprint (all 29
  counties grew; union scorecard identical).
- [x] 2026-07-26 — **Ship the bill-memo pages** — `/analysis/sb-1301` (Allen: codify the
  nonrenewal series, reason codes, § 2644.4.8 re-runs) and `/analysis/ab-69-ab-1680`
  (Calderon: ZIP-grain net take-out flows w/ retention, earlier start, consistent
  distressed flag, financial-fragility + cost reporting). Shipped as public analysis
  pages (not letters); Rishi sends concrete request lists to each office separately.
  Plus: `/analysis` index page, footer Analysis link, sitemap fixed (was missing the
  depopulation-promise URL entirely).
- [x] 2026-07 — **Ship `/analysis/depopulation-promise`** — long-form analysis citing/extending
  the NYT Nov 2025 investigation: named-zones depopulation scorecard (534 of 574 designated
  ZIPs grew since the Sept 2023 deal), § 2644.4.8 fire-prong recomputation (478 qualify, 90
  missing from the official list, 186 stale), FAIR "Is Distressed Area" column as disclosed
  corroboration. Home page gets a slim callout (matrix section cut in review).
- [x] 2026-07 — Pipeline: CAL FIRE FHSZ ZIP overlap table (`config/zip_fire_hazard.csv` +
  generator script); CDI ZIP voluntary xlsx parser (`cdi/zip_yearly.csv`, 2020–2023);
  reconciliation export gains `fhsz_high_pct` / `penetration_pct` / `meets_criteria`.
- [x] 2026-07 — CI: bump all actions to current majors (Node 20 runner deprecation).
- [x] 2026-05 — Remove city-level view; add build-time (SSR) data loading.
- [x] 2026-05 — Add `@astrojs/check` for `astro check` typecheck.
- [x] 2026-05 — Fix `?view=zip` loading flash; empty-`initialRows` fetch suppression; numeric year sort.
- [x] 2026-05 — Merge Trajectory chart into "Understanding the Crisis" — replaces the 3-card grid with a time-axis line chart + endpoint annotations + a single growth stat; brings the statewide-history trajectory onto the home page (mobile-friendly via `<details>` table disclosure). Extracted shared formatters to `web/src/lib/historyFormat.ts`.
- [x] 2026-05 — Locked `/data` as the **permanent** Data & Downloads hub (no retirement, no redirect). Moved `/data` and `GitHub` from the header nav to the footer; updated README, BACKLOG, `docs/redesign-brief.md`, and `docs/redesign-phase1-spec.md` to reflect.
