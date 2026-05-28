# Phase 1 — Redesign design spec + low-fi wireframes

Single-page redesign of depopulatefairplan.com. Design only: no code, no component
names, no file paths. Gating artifact for the implementation plan (Phase 2).

> **Grounding note.** This spec was written against the live repo, not only the brief's
> snapshot. The data inventory below was re-verified on 2026-05 against
> `config/export_contract.json` (8 exports), `config/sources.toml` (coverage window), and
> the actual headers/row counts in `data/exports/` and `data/processed/`. Where the brief's
> assumptions did not survive that check, it is called out inline and in the open questions.

---

## Thesis — what the redesign changes about what the site *argues*

Today the site argues a single, true, but narrow proposition: **"The FAIR Plan is growing
explosively — look how big and how fast."** It proves it with one number (655K policies),
one multiplier (4.2x since 2019), one county map, and a `/data` page that reads as a
download cabinet rather than an argument.

The redesign keeps that opening punch but advances the argument from *"the FAIR Plan is
big"* to **"the FAIR Plan's growth is the visible symptom of a private market that has
quietly stopped functioning — and the official safeguards meant to catch that failure are
looking at the wrong map."** That is a different, harder claim, and the data supports it:

1. The growth is not evenly a "wildfire-county" story — it is concentrated, it is
   accelerating in places the state has *not* flagged as distressed, and it is showing up
   as a cost-of-coverage gap that varies more than ten-fold across the state.
2. The state's own distressed-area list — the instrument that triggers moratoria and
   non-renewal protections — disagrees with the FAIR Plan's actual growth in **436 ZIP
   codes** (the FAIR Plan data flags them; the official list does not). That asymmetry is
   the sharpest single fact the pipeline produces, and it has never been on the site.
3. Every FAIR Plan policy sits in a Senate district with a name attached to it. The crisis
   is currently abstract; it should be constituent-level and addressable.

So the redesign reorders the site from *"here is a big number, here is a map, here is a
table"* into a **sequenced argument**: crisis → why it matters to everyone → where it is
concentrated → why the private market (not just fire) is the cause → why the official
safeguards miss it → who can act → act. The data is in service of that argument; sections
that do not move it forward are cut or sent to an external CSV, even when the data is
interesting.

---

## 1. Page outline

Top-to-bottom, single page. Each section gets a stable anchor so press and the retired
`/data` deep links can target it. One-sentence purpose each; the "lands which beat" column
maps to the Story Arc in section 4.

| # | Section (anchor) | Purpose | Story beat | Source today |
|---|---|---|---|---|
| 0 | **Hero** (`#top`) | One number that states the crisis and dates it. | Crisis | exists |
| 1 | **The Crisis in Three Numbers** (`#crisis`) | Prior count → today's count → multiplier; "insurer of last resort" framing. | Crisis | exists (CrisisStats) |
| 2 | **The Trajectory** (`#trajectory`) | The growth curve over time — show the slope, not just endpoints. | Why now | `/data` tab 1 (statewide history) rebuilt inline |
| 3 | **Where It's Concentrated** (`#map`) | County choropleth + ranked table; one concentration stat. | Where | exists (CrisisMap + CountyTable); absorbs ZIP drill-down + `/data` tab 2 (ZIP history) |
| 4 | **The Cost of Last-Resort Coverage** (`#cost`) | Premium- and value-per-policy spread; the affordability angle. | Why it matters (deepened) | NEW (derived) |
| 5 | **A Market Failure, Not Just a Fire Map** (`#market`) | FAIR Plan share of total market + voluntary-market retreat. | What's broken (1) | `/data` tab 3 (FAIR share) rebuilt + extended |
| 6 | **The Map the State Is Missing** (`#distressed`) | Distressed-flag vs. actual-growth divergence — 436 unflagged ZIPs. | What's broken (2) | NEW (derived) |
| 7 | **Your District Is on the FAIR Plan** (`#districts`) | FAIR Plan policies apportioned to all 40 Senate districts. | Who can act | NEW (derived) |
| 8 | **What Has to Change / Take Action** (`#act`) | Solutions framing + email signup. | Act | Signup exists; Solutions scaffolding to rebuild |
| — | **Methodology & Data** (`#data`) | Disclosure strip + links to every CSV and the pipeline. Replaces the `/data` page as the canonical home for `/data` redirects. | (supporting) | replaces `/data` |

**Where today's `/data` tabs land:** tab 1 (Statewide History) becomes section 2
(Trajectory). Tab 2 (ZIP History) folds into section 3 as the ZIP drill-down. Tab 3 (FAIR
Share of Total Market) becomes the spine of section 5. The `/data` page itself is retired;
its download/methodology role moves to the `#data` disclosure strip (section 7 / footer).
See section 5 of this spec for the redirect map.

---

## 2. Section specs

Notation for wireframes: `[ ]` = panel/card, `===` = chart area, `▸` = control, `→` =
flow. All charts assume a DOM tabular fallback (see section 3, Accessibility) — wireframes
omit it for space but it is mandatory per the brief.

### 0. Hero (`#top`) — keep, light refresh

- **Headline + copy:** Unchanged in spirit. Voice cue: declarative, dated, urgent. Hook
  placeholder: *"California's insurer of last resort now covers [655,000] homes — and
  counting."* Two CTAs: primary scrolls to "Take Action," secondary scrolls to the map.
- **Headline number:** Latest statewide policy count, with the as-of date inline (currently
  Mar 31, 2026). Dating the number is non-negotiable — it is the most-quoted fact and must
  carry its own provenance.
- **Chart type:** None. A single large numeral is the visualization.
- **Data binding:** statewide site-stats summary (`total_policies_display`, as-of date).
- **Interaction:** CTA buttons only; both keyboard-focusable, scroll to anchors.
- **Mobile:** Numeral scales down; CTAs stack full-width.
- **Wireframe:**
```
┌───────────────────────────────────────────────┐
│  California's insurer of last resort now        │
│  covers                                         │
│                                                 │
│            6 5 5 , 0 0 0   homes                 │
│              as of Mar 31, 2026                 │
│                                                 │
│   [ Take action ]   [ See the map ▾ ]           │
└───────────────────────────────────────────────┘
```

### 1. The Crisis in Three Numbers (`#crisis`) — keep, restate

- **Headline + copy:** "Understanding the crisis." Reframe the three cards so they read as
  a *sentence*, not three independent stats: then → now → multiplier. Add a one-line
  "Why this matters" callout (already a pattern on the page) that hands off to the
  trajectory.
- **Headline number:** The multiplier (e.g. "4.2x since 2019"). The choice of baseline year
  is an editorial decision the team should lock (see open questions) — 2019 (4.2x) vs. 2021
  (2.8x) tells a meaningfully different story.
- **Chart type:** Three stat cards (the reusable Headline-Stat panel, section 3).
- **Data binding:** statewide site-stats cards (prior-year value/label, current value/label,
  growth multiplier).
- **Interaction:** None beyond the handoff CTA. Fully static, fully accessible by default.
- **Mobile:** Cards stack vertically in then → now → multiplier order.
- **Wireframe:**
```
              Understanding the crisis
 [  155K   ]      [  655K   ]      [  4.2x   ]
 Sep 30 2019      Mar 31 2026      since 2019
 ┌─────────────────────────────────────────────┐
 │ Why this matters: the growth isn't just      │
 │ big — it's accelerating. Here's the curve. ▾ │
 └─────────────────────────────────────────────┘
```

### 2. The Trajectory (`#trajectory`) — rebuilt from `/data` tab 1

- **Headline + copy:** "The line that should be flat." Voice cue: a last-resort backstop
  should be roughly flat over time; this one bends upward and is steepening. Hook
  placeholder: *"In a healthy market, this line barely moves. It has roughly quadrupled in
  six years."*
- **Headline number:** Net policies added since the baseline, or most-recent-quarter add
  ("+[15,000] in the last quarter alone").
- **Chart type:** **Single line / area chart over time** (the trajectory). A line is right
  here, not bars: the argument is *slope and acceleration*, which a continuous line shows
  and a bar grid hides. Render policy_count as the primary series; offer a toggle to switch
  the series to exposure (dollars of insured value) and premium, since all three exist in
  the statewide history.
- **Data binding:** statewide history table — `coverage_end`, `policy_count`, `exposure`,
  `premium`. **Honesty caveat (verified):** this table mixes cadences — fiscal-year
  snapshots (Sept 30) for 2019–2024 and true quarterly points from 2025-06 on, plus a few
  interpolated `snapshot` rows. The x-axis must be a real time axis (unevenly spaced), not
  evenly spaced categorical ticks, or the slope is misleading. Premium only exists from
  2024-12 onward, and exposure is missing for 2019 — the toggle must gray out / annotate
  the segments where a series has no data rather than drawing a line to zero.
- **Interaction:** Series toggle (policies / exposure / premium) as keyboard-focusable
  segmented control. Hover reveals point value, but the same values are always present in
  the tabular fallback below — no hover-only data. No zoom.
- **Mobile:** Chart goes full-width, ~240px tall; toggle becomes a full-width segmented
  control above the chart; tabular fallback collapses behind a "Show data table" disclosure.
- **Wireframe:**
```
        The line that should be flat
  ▸ Policies  ▸ Insured value  ▸ Premium
  ┌────────────────────────────────────────┐
  │ 700K┤                              ╭──  │
  │     │                          ╭───╯    │
  │ 350K┤                  ╭───────╯        │
  │     │      ╭───────────╯                │
  │   0 ┼──────┴──┬──────┬──────┬──────┬──  │
  │     '19      '21    '23    '25         │
  └────────────────────────────────────────┘
  ▸ Show data table  (15 rows, dated points)
```

### 3. Where It's Concentrated (`#map`) — keep map+table, absorb ZIP drill-down

- **Headline + copy:** "Where the crisis lives." Voice cue: it is statewide but not
  uniform; a handful of areas carry a disproportionate share. Hook placeholder: *"Ten ZIP
  codes hold [8.6%] of every FAIR Plan policy in California."*
- **Headline number:** **Concentration stat (verified):** top 10 ZIPs = 8.6% of statewide
  policies; top 25 = 16.1%. One quotable number; pick 10 or 25 (open question). This is the
  "concentration risk" angle (brief #5) delivered as a single stat above the map rather than
  its own section — it earns its place as the map's framing, not a standalone beat.
- **Chart type:** **County choropleth** (existing, tier-colored) + **ranked sortable table**
  (existing CountyTable with quarter and YoY velocity). Drill-down: a county→ZIP toggle
  *within* the section (not a top-level page view) replaces today's hidden `?view=zip` hack.
  Default view ships county-level with the HTML; ZIP-level (~1,660 rows + ~2.8MB topojson)
  lazy-loads only when the reader opts into the ZIP view (per performance budget).
- **Data binding:** county snapshot (`county`, `policies`, `change_pct`, `yoy_change_pct`,
  direction flags) for the default; ZIP snapshot (`zip`, `city`, `county`, `region`,
  `policies`, change/yoy) for the drill-down; ZIP history (`fy_2021…fy_2025`) powers the
  per-ZIP sparkline in the drill-down table (this is where `/data` tab 2 lands).
- **Interaction:** county/ZIP segmented toggle (keyboard-focusable); table sort by column;
  map region click filters/scrolls the table. Map regions are also reachable as a list (the
  table *is* the keyboard/tab fallback for the map — clicking a county and tabbing a county
  row do the same thing). No hover-only state.
- **Mobile:** Map renders above table, ~320px tall; the toggle is full-width; table becomes
  horizontally scrollable with the county/ZIP name column pinned. ZIP view warns it is a
  larger dataset before loading on a metered connection.
- **Wireframe:**
```
            Where the crisis lives
  10 ZIPs hold 8.6% of all FAIR Plan policies
  ▸ By county   ▸ By ZIP (loads on demand)
  ┌──────────────────┐  County        Now   YoY
  │     ___           │  Los Angeles  153K  +36% ▲
  │    /CA \  shaded  │  San Bernard.  68K  +28% ▲
  │   | map |  by tier│  Riverside     ..   ..   ▲
  │    \___/          │  Sonoma        ..   ..   ▲
  └──────────────────┘  ▸ sort ▾   (58 rows)
```

### 4. The Cost of Last-Resort Coverage (`#cost`) — NEW (derived)

- **Headline + copy:** "Last resort, premium price." Voice cue: the FAIR Plan is supposed
  to be a stopgap, but what families pay — and how much value they can actually insure —
  varies enormously by where they live. Hook placeholder: *"The average FAIR Plan premium
  ranges from about [$620] to [$7,200] a year depending on your county."*
- **Headline number:** **Premium-per-policy spread (verified):** ~$621 (Imperial) to ~$7,234
  (Napa) — roughly a **12x** spread, materially larger than the "2–3x" the brief estimated.
  Lead with the spread, not an average.
- **Chart type:** **Horizontal ranked bar chart** of premium-per-policy by county (a dual
  view toggling to value-per-policy / average insured value). Bars beat a choropleth here
  because the story is *rank and magnitude of a dollar figure*, which a length encoding
  reads precisely and a color ramp does not. A dual-metric callout panel (section 3) frames
  premium vs. insured value side by side.
- **Data binding:** **Requires a new export (flagged for Phase 2).** The numerator/
  denominator already exist in processed county data (`policy_count`, `premium`, `exposure`
  per county per quarter) but the *current* county export ships `policies` only — no premium
  or exposure column. So this section is feasible with the existing pipeline output but needs
  an export contract addition; it cannot bind to today's published county CSV. This is the
  single biggest data-binding caveat in the spec.
- **Interaction:** metric toggle (premium-per-policy / insured-value-per-policy); sort
  ascending/descending; both keyboard-focusable. Tabular fallback is the same ranked list.
- **Mobile:** Bars stack full-width, top ~12 counties shown with a "show all 58" disclosure;
  metric toggle full-width above.
- **Wireframe:**
```
          Last resort, premium price
  ▸ Premium / policy   ▸ Insured value / policy
  Napa          ██████████████████  $7,234
  Santa Barbara ██████████████      $5,636
  Santa Cruz    █████████████       $4,891
   ...
  Kings         ██                  $719
  Imperial      █                   $621
  ▸ Show all 58 counties
```

### 5. A Market Failure, Not Just a Fire Map (`#market`) — rebuilt from `/data` tab 3

- **Headline + copy:** "When the private market leaves, the FAIR Plan fills the gap." Voice
  cue: the FAIR Plan isn't growing because of fire alone — it's growing where the voluntary
  market is retreating. Hook placeholder: *"In [N] counties the FAIR Plan's share of the
  market has [doubled/tripled] since 2020."*
- **Headline number:** Largest jump in FAIR Plan market share, or count of counties where
  FAIR share grew while total market shrank (the brief's "market-failure context," #3).
- **Chart type:** **Slope chart / connected-dot chart** of FAIR Plan share 2020→2023 per
  county (the years the CDI data actually covers), optionally a **scatter** of "change in
  total market PIF" (x) vs. "change in FAIR Plan PIF" (y) to make the divergence visible —
  points in the upper-left quadrant are the market-failure counties (voluntary down, FAIR
  up). A slope/scatter beats a table here because the argument is *direction and
  divergence*, not absolute counts.
- **Data binding:** county market-share export (`total_pif_2020…2023`,
  `fair_plan_pif_2020…2023`, `fair_plan_share_2020…2023`) — already exported, this is the
  one new-section spine that needs **no** new export. The richer voluntary
  new/renewed/**nonrenewed** breakdown exists in processed CDI data but is **not** exported;
  if the team wants the explicit "voluntary market retreat" framing (nonrenewals rising) that
  needs a new export — otherwise the share-shift story stands on the already-published data.
- **Time-window honesty (verified):** CDI market data ends at **2023**; FAIR Plan data runs
  to **2026-03**. The two cannot be plotted on a shared current axis. This section must label
  the CDI series as "through 2023 (latest available)" and avoid implying the share figure is
  current. This is a genuine constraint, not a presentation choice.
- **Interaction:** county select/highlight; toggle between slope view and scatter view; both
  keyboard-focusable. Tabular fallback lists each county's 2020 and 2023 share and the delta.
- **Mobile:** Scatter collapses to the slope view (scatter is hard to read small); county
  highlight via a select dropdown rather than point-click.
- **Wireframe:**
```
   When the private market leaves, FAIR fills in
        FAIR Plan share of market, 2020 → 2023
   2020                              2023
   Alpine   17.8% ─────────────────▶ 33.4%
   Trinity  ..   ─────────────────▶ ..
   Mariposa ..   ───────────▶ ..
   ▸ View as scatter (market change vs FAIR change)
   ⚠ CDI market data is latest-available through 2023.
```

### 6. The Map the State Is Missing (`#distressed`) — NEW (derived), sharpest beat

- **Headline + copy:** "The state's distress map doesn't match the ground." Voice cue:
  pointed but precise and sourced — this is an accountability claim, so it must be airtight.
  Hook placeholder: *"The FAIR Plan's own growth data flags [436] ZIP codes as in distress
  that the state's official list does not."*
- **Headline number:** **Divergence (verified):** of 1,661 reconciled ZIPs, 436 are flagged
  distressed by FAIR Plan growth but **not** on CDI's official distressed list; only **1**
  goes the other way; 1,224 agree. The asymmetry is the story — the official list
  systematically *under*-counts, it doesn't over-count.
- **Chart type:** **Recommendation — a 2×2 agreement matrix (confusion-matrix style) plus a
  ranked "unflagged but growing" list, NOT a choropleth.** The brief left "slope graph vs.
  map" open; I recommend neither as the primary. A choropleth of agree/disagree invites the
  reader to pattern-match geography and misses the point, which is a *classification
  disagreement*. The 2×2 matrix states the asymmetry in one glance (436 vs 1); the
  accompanying Top-N panel (section 3) names the worst unflagged ZIPs with their 5-year
  growth sparkline so the claim is concrete and checkable. A small companion choropleth can
  be offered as a secondary "see it on the map" view, but the matrix leads.
- **Data binding:** ZIP reconciliation export (`zip`, `county`, `fair_plan_flag`,
  `cdi_flag`, `agree`) for the matrix; distressed-ZIP 5-year PIF analysis
  (`geography_name`, `policy_count_2019…2025`) for the Top-N sparklines. **Both require new
  exports (flagged for Phase 2)** — they exist in processed analysis output but are not in
  the export contract today.
- **Interaction:** click a matrix cell to filter the list to that quadrant; sort the list by
  growth; keyboard-focusable cells and rows. The matrix counts and the list are both in the
  DOM as the fallback.
- **Mobile:** Matrix renders as four stacked labeled tiles; list below, name column pinned.
- **Methodology weight:** This is an accountability claim against a state agency. The
  in-section disclosure must define exactly how the FAIR Plan "distress flag" is derived
  (growth-rate threshold) and link the methodology — heavier disclosure than any other
  section. The threshold definition is an open question (see section 6).
- **Wireframe:**
```
   The state's distress map doesn't match the ground
                   CDI says distressed?
                     No          Yes
   FAIR     No  [  651    ]  [   1     ]
   growth        agree        disagree
   flags?  Yes  [  436    ]  [  573    ]
              UNFLAGGED      agree
              ⚠ growing
   ┌ 436 ZIPs the state's list misses ─────────┐
   │ 92060  +210% ▁▂▃▅▇   Riverside            │
   │ 95446  +160% ▁▂▄▆▇   Sonoma               │
   │ ▸ sort by growth   (436 rows)             │
   └───────────────────────────────────────────┘
```

### 7. Your District Is on the FAIR Plan (`#districts`) — NEW (derived)

- **Headline + copy:** "Every district has constituents on the FAIR Plan." Voice cue:
  civic, addressable, non-partisan in framing even though party is in the data. Hook
  placeholder: *"Find your state senator and the [X] households they represent who are now
  on California's insurer of last resort."*
- **Headline number:** Range across the 40 districts, or the single highest-exposure
  district ("[61,000] FAIR Plan policies in one Senate district").
- **Chart type:** **Searchable / lookup table with an inline 5-year sparkline per district**,
  plus an optional **40-district small-multiples sparkline grid** for the at-a-glance "every
  district is rising" read. A full Senate-district choropleth is *possible* but expensive
  (new district topojson, bundle cost) and adds little over the lookup — recommend deferring
  the map to Phase 2+ and shipping the lookup + sparkline grid first.
- **Data binding:** senate-district analysis export (`senate_district`, `senator_name`,
  `party`, `policy_count_2019…2025`, `cdi_total_pif_2023`, `cdi_fair_plan_pif_2023`).
  **Requires a new export (flagged for Phase 2).** All 40 rows are populated with senator
  names and party (30 D / 10 R) — verified, no blanks.
- **Interaction:** search/filter by district number, senator name, or county; sort by
  current count or growth; keyboard-focusable search and rows. Lookup table is its own
  fallback.
- **Mobile:** Search box full-width; results as stacked cards (district, senator, current
  count, sparkline), not a wide table.
- **Naming caveat:** Whether to display individual senator names is a **pre-flight / legal
  open question** flagged in the brief and unresolved. The section is designed to degrade
  gracefully: if naming is not approved, it renders district number + party + counts and
  drops the name column, with no layout change. Default the spec to "named," contingent on
  sign-off.
- **Wireframe:**
```
   Every district has constituents on the FAIR Plan
   ▸ Search district / senator / county [__________]
   Dist  Senator (party)         Now    5-yr trend
   SD-04 M. Alvarado-Gil (R)    70,232  ▁▂▃▄▆▇
   SD-01 M. Dahle (R)           49,198  ▁▂▃▄▅▇
   SD-29 E. Gómez Reyes (D)     27,589  ▁▂▃▄▅▆
   ▸ sort by growth        (40 districts)
```

### 8. What Has to Change / Take Action (`#act`) — rebuild Solutions + keep Signup

- **Headline + copy:** "Depopulating the FAIR Plan." Voice cue: forward-looking, concrete
  asks, ties back to the argument the page just made (market failure + safeguard gap →
  policy levers). Final email-capture CTA.
- **Headline number:** None — this is the call to action, not a stat. Optionally restate the
  hero number as a closing reminder.
- **Chart type:** None. Prose + the email signup form.
- **Data binding:** none (signup posts to the existing email webhook).
- **Interaction:** email form (already exists), fully keyboard-accessible.
- **Mobile:** Form full-width; asks stack.
- **Wireframe:**
```
   ┌───────────────────────────────────────────┐
   │  Depopulating the FAIR Plan                │
   │  • restore a functioning voluntary market  │
   │  • align distress flags with the data      │
   │  • [policy ask 3]                          │
   │  Get updates: [ email ________ ] [ Join ]  │
   └───────────────────────────────────────────┘
```

### Methodology & Data strip (`#data`) — replaces the `/data` page

- **Purpose:** Honor the disclosure constraint ("methodology in disclosures") and preserve
  the download/citation role of the retired `/data` page. A compact strip near the footer:
  one line of provenance, links to every published CSV, the open-source pipeline, and
  per-source freshness dates. Not a section in the argument — it is the citation apparatus.
- **Chart type:** None; a list of dataset links + a "data current through [date]" badge.
- **Interaction:** links only; keyboard-accessible.
- **Mobile:** Links stack.

---

## 3. Summary-panel system (reusable)

Six composable panels so the page reads as one design system, not a collage. Each is used by
≥2 sections. Visual language inherits the existing palette (patriot-red / navy / amber
accents, rounded cards, left-border callouts).

1. **Headline-Stat card.** Big numeral + label + small detail line + optional direction
   arrow. *Used by:* Crisis (×3), Hero (as a degenerate single-stat), Districts header,
   Cost header. The page's atomic unit.

2. **Dual-Metric callout.** Two related figures side by side with a connective phrase
   ("$621 → $7,234, a 12x spread"; "voluntary down, FAIR up"). *Used by:* Cost (premium vs.
   insured value), Market (total market vs. FAIR share).

3. **Top-N list with sparkline.** Ranked rows, each a name + current value + tiny 5-year
   trend sparkline; sortable; doubles as its own keyboard fallback. *Used by:* Distressed
   (unflagged ZIPs), Districts (40 districts), ZIP drill-down inside the map section.

4. **Distressed-flag chip.** Small labeled status pill ("State: not flagged" / "FAIR data:
   distressed") usable inline in any table row. *Used by:* Distressed section list, ZIP
   drill-down rows, can annotate Market section county rows.

5. **Time-context badge.** A small "data current through [date]" / "latest available: 2023"
   badge that travels with any chart bound to a dataset whose coverage differs from the
   headline date. *Used by:* Trajectory, Market (the 2023 ceiling), Methodology strip, Map.
   This panel exists specifically to keep the mixed-cadence and CDI-2023-ceiling honesty
   visible everywhere it matters.

6. **Section-handoff callout.** The existing left-border "Why this matters" block,
   generalized into the connective tissue that ends one beat and previews the next. *Used
   by:* Crisis→Trajectory, Map→Cost, Market→Distressed. This is what makes the page read as a
   sequenced argument rather than stacked widgets.

(A 7th, "Shareable stat card / embed," is intentionally *out* of the panel set — see open
questions; it is a candidate for the system but only if press-embed scope is confirmed.)

---

## 4. Story arc

A reader scrolling top to bottom should build the argument in this order, each section
earning the next:

**Crisis (Hero + §1 Three Numbers)** — one undeniable, dated number and the multiplier land
the scale: the insurer of last resort has become a primary insurer. → **Why now (§2
Trajectory)** — the curve shows it isn't a one-time spike but an accelerating trend that a
healthy backstop would never show. → **Where (§3 Map + concentration stat)** — it's
statewide but concentrated; a handful of ZIPs carry a disproportionate share, so this is
both everyone's problem and a targetable one. → **Why it matters to everyone (§4 Cost)** —
this isn't abstract; it's a 12x cost-of-coverage gap families actually pay. → **What's
broken, part 1 (§5 Market failure)** — the growth tracks the voluntary market's retreat,
not just fire risk, so the cause is market structure, not only climate. → **What's broken,
part 2 (§6 The map the state is missing)** — the official safeguard that should catch this
disagrees with the data in 436 ZIPs, so the system meant to respond is mis-calibrated. →
**Who can act (§7 Districts)** — the crisis has a name and a district attached to every
policy, making it addressable. → **Act (§8 Take Action)** — concrete asks + signup, tied
back to the two "what's broken" beats.

The two "what's broken" sections (5 and 6) are the redesign's center of gravity — they are
what move the argument past "the FAIR Plan is big" to "the system is failing and
mis-measured." Everything before them is setup; everything after is the call.

---

## 5. `/data` retirement note

The `/data` page is retired. Its three tabs survive as follows:

| Old tab (`?tab=`) | Fate | New home | Redirect target |
|---|---|---|---|
| `statewide_history` (also bare `/data`, the default tab) | **Rebuilt** as section 2 | The Trajectory | `/#trajectory` |
| `zip_history` | **Rebuilt** (folded) into section 3's ZIP drill-down | Where It's Concentrated | `/#map` |
| `fair_share` | **Rebuilt + extended** as section 5 | A Market Failure | `/#market` |

Redirect rules (301, to preserve press/research citations):

- `/data` (no query) → `/#trajectory` (the default tab was statewide history).
- `/data?tab=statewide_history` → `/#trajectory`
- `/data?tab=zip_history` → `/#map`
- `/data?tab=fair_share` → `/#market`
- `/data?tab=<anything else>` → `/#data` (the methodology/downloads strip — safe fallback).
- The legacy `?page=data` query (still handled today on the home page) → continue
  redirecting to `/data`, which then 301s onward per the above. Two hops is acceptable for a
  deprecated URL form.

Nothing from `/data` is dropped outright: every tab either becomes a section or folds into
one, and the download/methodology function moves to the `#data` strip. The hidden
`?view=zip` home experiment is **retired** as a top-level toggle and **re-homed** as the
in-section county/ZIP drill-down in section 3.

---

## 6. Open design questions

1. **Baseline year for the headline multiplier.** 2019 gives "4.2x," 2021 gives "2.8x."
   Which baseline is the canonical story? It changes the most-quoted number on the site and
   should be a deliberate editorial decision, not an artifact of which row the code picks.

2. **Senator naming sign-off.** The Districts section defaults to displaying individual
   senator names (data supports it — all 40 named, with party). The brief's pre-flight flags
   this as needing confirmation/legal comfort. If not approved, the section degrades to
   district number + party + counts. Need a yes/no to finalize the wireframe.

3. **How is the FAIR Plan "distress flag" defined?** The 436-ZIP divergence is the sharpest
   claim on the page and an accountability claim against CDI, so the growth-rate threshold
   that defines "FAIR data says distressed" must be explicit, defensible, and published. What
   threshold did the pipeline use, and are we comfortable defending it publicly?

4. **Concentration stat: top 10 (8.6%) or top 25 (16.1%)?** Both are real and quotable; 10 is
   punchier, 25 is more robust to a single ZIP. Pick one as the canonical map-section hook.

5. **Press-embed / shareable-stat scope.** The brief lists this as "implicit via summary
   panels." Is a shareable stat-card / "embed this number" treatment in scope for this
   redesign (which would add a 7th panel and per-stat share affordances), or deferred? It
   affects the panel system's surface area.

6. **Cost section depends on a not-yet-published export.** The premium/insured-value-per-
   policy section (§4) and the divergence section (§6) and the districts section (§7) all
   require *new* entries in the export contract (the underlying processed data exists, but
   it is not in today's 8 published exports). Is the team willing to ship those exports as
   part of this redesign? If only the already-exported data can be used, §5 (market share)
   survives intact but §4, §6, and §7 cannot bind to published data — confirm appetite for
   the pipeline-side additions before Phase 2 plans them.
