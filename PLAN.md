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

The homepage becomes one integrated, homeowner-first story. It joins the headline
metrics, the policy record (the Sustainable Insurance Strategy and risk models), and
what comes next (the new commissioner and Natural Disaster Insurance for All), and it
links down into `/data` and `/analysis/*` for depth.

- **Shape.** One story page plus deep links. `/data` and `/analysis/*` keep their URLs.
- **Reader.** The homeowner first. Press and legislative staff get deep links and downloads.
- **SIS verdict.** Stated plainly: stalled, not reversed.
- **NDIFA and the new commissioner.** Neutral explainer plus a "what we will track" list. No endorsement.

Why now: Jane Kim won the insurance commissioner race in November 2026 on NDIFA, CDI
updated its SIS dashboard on Nov 20, and the FAIR Plan's 29.1% rate increase took
effect in October. The site mentioned none of it and gave homeowners nothing to act on.

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

Each section makes one claim, shows one number or chart, and offers one deep link.

| # | Section (anchor) | Content | Built from |
|---|---|---|---|
| 0 | Hero (`#top`) | What the FAIR Plan costs every homeowner, not only those on it. ZIP lookup box. | `Hero.tsx` rewritten; new `ZipLookup` island |
| 1 | Why you care (`#why`) | Three cost channels: assessments passed to all policyholders; your insurer's rates under the new rules; what landing on the Plan means (rate increase, limited coverage, a second policy). | new `WhyYouCare` |
| 2 | The numbers (`#numbers`) | Metric strip: policies in force, exposure, change since the 2023 deal, last-quarter change, FAIR share of market (2023). Trajectory chart with deal-date markers. Link: `/data?tab=statewide_history`. | new `MetricStrip`; shared `TrajectoryChart` extracted from `DepopulationPromise.tsx` |
| 3 | Where (`#where`) | County map and table. ZIP result card: policies, 1-year change, on the CDI distressed list or not, fire-hazard share. Link: `/data?tab=zip_history`. | `CrisisMap`, `CountyTable`, `california_zip_data.csv`, `distressed_zip_reconciliation.csv` |
| 4 | The deal (`#deal`) | What the 2023 deal traded: catastrophe models and reinsurance costs in rates, for writing 85% of market share in distressed areas (or 5% growth) within two years. Scorecard of promise against result. Verdict. Links: `/analysis/depopulation-promise`, `/data?tab=distressed_list`. | new `SisScorecard`; `buildPromiseStats`, `sisTimeline.ts` |
| 5 | What changes next (`#next`) | The new commissioner. NDIFA: what it proposes, what the state's SB 254 study says it would cost, what needs the Legislature, named supporters and critics. What we will track. | new `WhatsNext`; `lib/policy.ts` |
| 6 | What you can do (`#act`) | Homeowner actions: shop before accepting the Plan, the DIC wrap, nonrenewal notice rights, CDI help line, mitigation discounts. Email signup. | `Signup.tsx`; replaces unused `Solutions.tsx` |
| 7 | Read deeper (`#more`) | Cards for the analysis pieces and `/data`. Sources strip with as-of dates. | `lib/pieces.ts`, shared with `/analysis` |

### SIS scorecard rows

Each row carries a source and an as-of date.

- FAIR Plan size at the deal and now (320,572 to 665,673).
- Last quarter: flat (see the counting rule above).
- Distressed ZIPs that grew since the deal (505 of 550).
- Growth inside and outside the distressed list (+55% and +184%).
- Insurer groups expanding under SIS (CDI: 12, against 0 in 2025).
- Wildfire models approved for ratemaking (verify).
- Approved homeowner rate changes in 2026 (CDI rate filing lists; verify each).
- Average premium, California and national (CDI citing NAIC: $1,655 and $1,737).
- Commitment deadlines: two years from each rate approval, so the first come due in 2027.

### Implementation approach

- Convert `Home.tsx` from one `client:load` island into Astro sections. Hydrate only the map, the ZIP lookup, and signup.
- `web/src/lib/policy.ts` holds every hand-entered fact for sections 1, 4, 5 as typed entries (value, as-of date, source URL), so a review can check them in one file.
- The ZIP lookup lazy-loads its two CSVs on first input. Retire `?view=zip`, `ZipMap`, and `ZipTable` (keeps the 2.8 MB ZIP geometry off the page).
- Header nav: Why, Numbers, The deal, What's next, plus Data and Analysis.
- `Base.astro`: compute the default description from the statewide history.

## Backlog

### Now

- [ ] **Rishi's review of the new homepage** on the dev server, then merge and push.
- [ ] **Run `/copy-review`** on the home page before it ships.
- [ ] **Upgrade press-level facts to primary sources** in `policy.ts`: FAIR Plan 29.1% rate increase (find the CDI or FAIR Plan document), insurer rate approvals (CDI approval lists), swearing-in date (state source).
- [ ] **Confirm SB 254 study page numbers by eye** (pp. 46-49 came from automated extraction).
- [ ] **Click-test the ZIP lookup** in a browser: 95667 (listed), 94110 (unlisted), 99999 (no data), "12" (invalid).
- [ ] **Delete branches** `explainer-panels` and `data/2026q3` (needs Rishi's OK).

### Next (after launch)

- [ ] **Analysis page: the quarter growth stopped (Q3 2026).** Facts and draft framing in `notes/q3-2026-status-update.md`; Q2 setup in `notes/q2-2026-status-update.md`. Respect the re-geocoding caveat (Arnold −250 is not real).
- [ ] **Rewrite the two bill memos against the enacted text.** Both pages carry a dated "signed" note; the bodies still describe the July 2026 versions.
- [ ] **NDIFA standalone explainer** at `/analysis/ndifa`, if the home section outgrows itself.
- [ ] **Commissioner tracker.** A dated log of actions against the "what we will track" list.
- [ ] **Premium-burden panel.** Premium per policy and exposure per policy by county. Needs premium and exposure added to the export contract (`fair/county_quarterly.csv` has them). Spread is about 12× across counties.
- [ ] **Market-failure context.** Counties where voluntary policies are flat or falling while FAIR Plan policies climb; nonrenewals. Needs `cdi/county_yearly.csv` in the export contract.
- [ ] **Trajectory hover tooltip**, mirrored to an ARIA live region.

### Later

- [ ] `Trust` Methodology and data-dictionary page; source-freshness badges.
- [ ] `Trust` Data-quality tests on exports in CI (row counts, totals, no-null invariants).
- [ ] `Trust` Export JSON metadata: `site_stats.json` and `quarterly_totals.json` lack the required `as_of_date`, `coverage_*`, `generated_at`, `methodology`, `source_urls` fields.
- [ ] `Trust` Signup reports success even when the Apps Script request fails (no-cors). Add a verifiable path.
- [ ] `Craft` Accessibility pass; performance and bundle budget.
- [ ] `Craft` Shareable stat cards for press.
- [ ] `Depth` Total insured value trends (`zip_tiv_history.csv`).
- [ ] `Depth` FAIR share of total market by ZIP (`cdi/zip_yearly.csv`, denominator as of 2023; current-year denominators wait on the CPRA response).
- [ ] `Depth` Send the CPRA request to CDI (`notes/cpra-request-cdi.md`, placeholders unfilled).
- [ ] `Pipeline` New-quarter ingestion runbook.
- [ ] `Pipeline` Remove dead `site/build.py`; drop `california_city_data.csv` from the contract; retire `site_stats.json.stats_cards`; remove unused `quarterly_totals.json` sync or use it.
- [ ] `Pipeline` Delete merged branch `data/2026q3`.

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
