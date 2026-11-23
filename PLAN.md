# PLAN: depopulatefairplan.com

The single planning document for the site: the message, how the site is built around
it, and the backlog. It replaces `BACKLOG.md`, `docs/redesign-brief.md`, and
`docs/redesign-phase1-spec.md` (all in git history before 2026-11-23).

## How to use this file (session ritual)

1. Read **Now**. Pick the top unblocked item.
2. Branch or worktree, implement, then `just test` (pipeline) and `npm run typecheck` (web).
3. Commit. Move the item to **Done** with the date.
4. Promote the next item into **Now**.
5. Never push `main` with user-visible changes before Rishi reviews the dev server (push deploys production).

## The message (decided 2026-11-23)

The site makes one argument, in five steps. Every page, dataset and analysis belongs
to one of them.

| # | Step | The claim | Home section (anchor) |
|---|---|---|---|
| 1 | **The problem** | California's insurer of last resort holds 665,000 home policies, 4.3 times what it held in 2019. A backstop is healthy when it is small. | Hero (`#top`) |
| 2 | **Why it matters** | Every homeowner pays: assessments, rates under the new rules, and worse coverage on the Plan. It is in your county and your ZIP code. | Why this matters (`#why`), county panel (`#where`), ZIP panel (`#zip`) |
| 3 | **Who is responsible** | Elected officials set the rules. The insurance commissioner holds most of the power, so that office is the one scored. | Who is responsible (`#regulation`) |
| 4 | **Scorecard: the last eight years** | Commissioner Lara, 2019 to 2026. Failed regulation: the Plan grew every year, and the 2023 strategy stopped growth without bringing a decline. | The last eight years (`#lara-era`) |
| 5 | **Scorecard: the next term** | Commissioner Kim, 2027 onward. An open question, scored against a starting line by the same test: does the FAIR Plan get smaller. | The next four years (`#kim-era`) |

`/take-action` is the companion page: what a reader can do once they accept the argument.

Rules that follow:

- **Do not assume the reader knows who regulates insurance.** Say that Californians
  elect an insurance commissioner before relying on it.
- **Score the office, one term at a time.** Policy is always discussed inside a term,
  split into regulation (the commissioner) and legislation (the Legislature and
  governor). New policy content goes into the term it belongs to.
- **The site's purpose is three things: state the problem, show the data, and keep
  a scorecard on the officials responsible.** This is the internal brief. It is not
  printed on the site; the reader should see it in the structure, not be told it.
- **The hero sets up the problem and the blame:** the headline, who is responsible,
  and four key facts. No 2023 deal, no quarterly movement, no statement of purpose.
  The links to the two scorecards sit at the end of "Who is responsible".
- **NDIFA gets no endorsement; it gets a scorecard,** with possible benefits and risks
  attributed to named people and to the state's own study.
- **Fact and advocacy page.** No signup form, no "contact us", no contact email.
- **One count.** Our integrated ZIP-level data (665,673 at 2026-09-30). Never show the
  FAIR Plan dashboard's or CDI's higher totals beside it. A quarterly move under 0.5%
  of the base is "flat" (`quarterIsFlat` in `web/src/lib/homeStats.ts`). The point is
  that the base is not declining. The counts note on `/data` is the only place the
  dashboard difference is explained.
- A commissioner's term is four years, with a two-term limit. The Kim scorecard is
  written for the first term ("the next four years"); extend it if she is reelected.

## How the site maps to the message

| Step | Home components (`web/src/components/home/`) | Data (`/data` tab or export) | Analysis | Gaps (see backlog) |
|---|---|---|---|---|
| 1 Problem | `HomeHero` (four key facts) | Statewide history; FAIR share of market | none | Earlier baseline (Jan 2019) |
| 2 Why it matters | `WhyYouCare`, `WhereIsland` (county map and table), `ZipLookup` (pre-filled example ZIP) | County data; ZIP data; ZIP history; reconciliation | none | Premium burden by county; nonrenewals and market-failure context |
| 3 Who is responsible | `WhoIsInCharge` | none | none | Sources for the civics facts |
| 4 Last eight years | `LaraEra`, `EraBarChart` | Distressed list; reconciliation; statewide history | The Depopulation Promise; SB 1301 memo; AB 69 and AB 1680 memo | "The quarter growth stopped" piece; memos rewritten against enacted text |
| 5 Next term | `KimEra` | Same exports, read against the starting line | none yet | Results column each quarter; log of the term's regulatory and legislative actions; NDIFA explainer |
| Companion | `WhatYouCanDo` on `/take-action` | none | none | none |

Navigation: the header reads Why it matters, The impact (county and ZIP panels), Who is responsible, 2019-2026, 2027 onward. Take action is linked from the footer and from the last line of the home page.
`/analysis` and `/data` are linked from the footer and inline from steps 2, 4 and 5.
They are the evidence layer, not destinations in the main story. When either is next
revised, group its contents under the five steps (analysis index by step; `/data`
tabs labeled by the step they support).

Implementation notes:

- Static Astro. Sections ship no JavaScript; islands are the header, the county map
  and table, and the ZIP panel.
- `web/src/lib/homeStats.ts` computes the headline figures, the flat flag, the
  distressed counties and the default ZIP (`pickDefaultZip`: the ZIP code outside the
  state's list with the largest increase since fiscal 2023; 92223 Beaumont on Q3 2026 data).
- `web/src/lib/policy.ts` holds every hand-entered fact with its source, date, and a
  `primary` or `press` level. `web/src/lib/zipSnapshot.ts` builds one ZIP's figures
  the same way at build time and in the browser.
- The Lara scorecard is start against end. The Kim scorecard is a starting line plus
  "what progress would look like"; a results column is added each quarter.
- The Depopulation Promise article keeps its own deal-annotated chart
  (`DealTrajectoryChart`).

## Constraints

- **Stack.** Astro 6 with React islands, Tailwind 4, react-simple-maps for maps, hand-written SVG for charts, PapaParse for CSV. No backend, no API, no runtime fetch from the pipeline.
- **Data.** County and statewide data ship in the HTML at build time (`loadData.server.ts`). ZIP-level data loads only on a lookup.
- **Accessibility.** Every chart has a tabular fallback in the DOM. No hover-only information. Keyboard-usable controls.
- **Copy.** Every number traces to a `/data` export or to a dated, sourced entry in `policy.ts`. The site states "failed regulation" outright, on Rishi's instruction; this goes past the older copy standard of letting data carry criticism, so the supporting numbers must sit next to every such statement.
- **Pipeline.** `config/export_contract.json` is authoritative for exports. The redesign changed no exports.

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

## Backlog

### Now (before launch)

- [ ] **Rishi's final read** of `/` and `/take-action` on the dev server, then merge `redesign/integrated-home` and push.
- [ ] **Click-test the ZIP panel** in a browser: 95667 (listed), 94110 (unlisted), 99999 (no data), "12" (invalid).
- [ ] **Verify facts that came from memory, not a checked source:**
  - Step 3 civics: four-year term, two-term limit, 80 Assembly and 40 Senate members, governor does not appoint the commissioner.
  - Step 4 timeline dates: Safer from Wildfires (2022), nonrenewal moratorium in effect (2019), SB 254 (2025).
- [ ] **Upgrade press-level facts to primary sources** in `policy.ts`: FAIR Plan 29.1% increase, insurer rate approvals, swearing-in date, Becerra rate-freeze proposal.
- [ ] **Confirm SB 254 study page numbers by eye** (pp. 46-49 came from automated extraction), and that the Sacramento Bee and study links open in a browser (both timed out to an automated check).
- [ ] **Mobile navigation.** Section links are hidden below the `lg` breakpoint; only the logo and the Take action button show. Add a compact menu or accept it.

### Next, by step

Step 1, the problem
- [ ] **Earlier baseline.** Our series starts Sept 2019; find a FAIR Plan count for Dec 2018 or Jan 2019 so the scorecard covers Lara's full term.

Step 2, why it matters
- [ ] **Premium burden by county.** Premium and exposure per policy. Needs both added to the export contract (`fair/county_quarterly.csv` has them). Spread is about 12× across counties.
- [ ] **Market-failure context.** Nonrenewals, and counties where voluntary policies fall while FAIR Plan policies climb. Needs `cdi/county_yearly.csv` in the export contract.

Step 4, the last eight years
- [ ] **Analysis: the quarter growth stopped (Q3 2026),** written in the flat framing. Facts in `notes/q3-2026-status-update.md`. Respect the re-geocoding caveat (Arnold −250 is not real).
- [ ] **Rewrite the two bill memos against the enacted text.** Both carry a dated "signed" note; the bodies describe the July 2026 versions.
- [ ] **Bring the Depopulation Promise article into the era frame** (title, intro, links back to the scorecard).

Step 5, the next term
- [ ] **Results column.** Each quarterly release, fill in results against the starting line in `KimEra.tsx`.
- [ ] **Term log.** A dated record of the term's regulatory and legislative actions, in the same two columns as the Lara era.
- [ ] **NDIFA explainer** at `/analysis/ndifa` once there is a bill.

Evidence layer
- [ ] **Regroup `/analysis` and `/data` under the five steps.**
- [ ] **Send the CPRA request to CDI** (`notes/cpra-request-cdi.md`, placeholders unfilled): commitment counts and current nonrenewal data, the two gaps the Take action page asks about.

### Later

- [ ] `Trust` Methodology and data-dictionary page; source-freshness badges.
- [ ] `Trust` Data-quality tests on exports in CI (row counts, totals, no-null invariants).
- [ ] `Trust` Export JSON metadata: `site_stats.json` and `quarterly_totals.json` lack the required `as_of_date`, `coverage_*`, `generated_at`, `methodology`, `source_urls` fields.
- [ ] `Craft` Accessibility pass; performance and bundle budget; hover detail on the bar chart.
- [ ] `Depth` Total insured value trends (`zip_tiv_history.csv`); FAIR share of market by ZIP (`cdi/zip_yearly.csv`, denominator as of 2023).
- [ ] `Pipeline` New-quarter ingestion runbook.
- [ ] `Pipeline` Remove dead `site/build.py`; drop `california_city_data.csv` from the contract; retire `site_stats.json.stats_cards` and its now-unused `hero` and `map.title` text; remove the unused `quarterly_totals.json` sync or use it.

### Parked

- Senate-district view (open question: legal sign-off to name senators).
- Shareable stat cards for press.

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

- [x] 2026-11-23 — **Site rebuilt around the five-step message** (branch `redesign/integrated-home`, 14 commits, not yet merged):
  - Plan and backlog consolidated into this file; `AGENTS.md` now holds agent instructions, with pipeline conventions in `src/fairplan/CLAUDE.md`.
  - Homepage: hero with the problem, the blame and four key facts; Why this matters; county map and table; ZIP panel pre-filled with an example chosen from the data; Who is responsible, ending in links to the two scorecards; the Lara scorecard with a bar-per-year chart, regulation and legislation tried, and the SIS and risk-model explainer; the Kim starting-line scorecard with NDIFA benefits and risks.
  - `/take-action` page. Signup, contact email, "Read deeper", and the header's Analysis and Data links removed.
  - Policy facts researched and stored in `web/src/lib/policy.ts`. Bill memos carry a "signed Sept 27, 2026" note. The Depopulation Promise article says the latest quarter is flat.
  - Retired: `?view=zip`, `ZipMap`, `ZipTable`, `CrisisStats`, `Solutions`, `Signup`, the 2.8 MB ZIP geometry. Branches `explainer-panels` and `data/2026q3` deleted.
  - Checked: typecheck, build, pipeline tests (20 of 20 on the first commit; no pipeline changes since), section anchors, 18 of 20 external source links.
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
