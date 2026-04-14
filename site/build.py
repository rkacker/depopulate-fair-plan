"""Build a static GitHub Pages site from pipeline outputs.

Reads normalized CSVs from data/processed/fair/ and data/processed/cdi/
and generates a single-page HTML site with tab-switched full-page tables.

Usage:
    PYTHONPATH=src python site/build.py --output-dir _site
"""

from __future__ import annotations

import argparse
import csv
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# CSVs to display, in order. (label, path relative to ROOT)
CSV_SECTIONS: list[tuple[str, str]] = [
    ("County PIF History", "data/processed/fair/county_pif_history.csv"),
    ("ZIP PIF History", "data/processed/fair/zip_pif_history.csv"),
    ("County Rankings", "data/processed/fair/county_rankings.csv"),
    ("CDI County Yearly", "data/processed/cdi/county_yearly.csv"),
    ("CDI Statewide Yearly", "data/processed/cdi/statewide_yearly.csv"),
    ("Distressed Counties", "data/processed/cdi/distressed_counties.csv"),
    ("Distressed ZIPs", "data/processed/cdi/distressed_zips.csv"),
]


def csv_to_table(path: Path) -> str:
    """Render a CSV file as an HTML table."""
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return "<p><em>Empty file</em></p>"

    header = rows[0]
    body = rows[1:]

    parts = ["<table>"]
    parts.append("<thead><tr>")
    for col in header:
        parts.append(f"<th>{html.escape(col)}</th>")
    parts.append("</tr></thead>")
    parts.append("<tbody>")
    for row in body:
        parts.append("<tr>")
        for cell in row:
            parts.append(f"<td>{html.escape(cell)}</td>")
        parts.append("</tr>")
    parts.append("</tbody></table>")
    return "\n".join(parts)


def build_site(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    # Collect available tables
    available: list[tuple[str, str, str]] = []  # (slug, label, path_str)
    for label, path_str in CSV_SECTIONS:
        path = ROOT / path_str
        if path.exists():
            available.append((Path(path_str).stem, label, path_str))

    # Build tab buttons
    tab_buttons = []
    for i, (slug, label, _) in enumerate(available):
        active = " active" if i == 0 else ""
        tab_buttons.append(
            f'<button class="tab{active}" data-target="{slug}">{label}</button>'
        )

    # Build table panels
    panels = []
    for i, (slug, label, path_str) in enumerate(available):
        path = ROOT / path_str
        hidden = "" if i == 0 else " hidden"
        row_count = sum(1 for _ in open(path)) - 1
        table_html = csv_to_table(path)
        panels.append(
            f'<div id="panel-{slug}" class="panel{hidden}">'
            f'<div class="panel-header">'
            f"<h2>{label}</h2>"
            f'<span class="meta">{path_str} &middot; {row_count:,} rows</span>'
            f"</div>"
            f'<div class="table-wrap">{table_html}</div>'
            f"</div>"
        )

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CA FAIR Plan Data</title>
<style>
:root {{
  --bg: #fff;
  --fg: #1a1a1a;
  --muted: #666;
  --border: #e0e0e0;
  --accent: #1a56db;
  --accent-light: #e8eefb;
  --card-bg: #f8f9fa;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: var(--font); color: var(--fg); background: var(--bg); }}

/* Header */
.site-header {{
  padding: 1.25rem 2rem 0;
  border-bottom: 1px solid var(--border);
}}
.site-header h1 {{
  font-size: 1.25rem;
  margin-bottom: 0.15rem;
}}
.site-header h1 a {{
  color: var(--fg);
  text-decoration: none;
}}
.site-header p {{
  color: var(--muted);
  font-size: 0.8125rem;
  margin-bottom: 1rem;
}}
.site-header p a {{
  color: var(--muted);
  text-decoration: underline;
  text-decoration-color: var(--border);
}}
.site-header p a:hover {{
  color: var(--accent);
}}

/* Tabs */
.tabs {{
  display: flex;
  gap: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}}
.tab {{
  padding: 0.6rem 1.25rem;
  border: none;
  background: none;
  font-family: var(--font);
  font-size: 0.8125rem;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}}
.tab:hover {{
  color: var(--fg);
}}
.tab.active {{
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}}

/* Panels */
.panel {{
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}}
.panel.hidden {{
  display: none;
}}
.panel-header {{
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 1rem 2rem;
  flex-shrink: 0;
}}
.panel-header h2 {{
  font-size: 1.1rem;
  font-weight: 600;
}}
.meta {{
  font-family: var(--mono);
  font-size: 0.75rem;
  color: var(--muted);
}}

/* Table */
.table-wrap {{
  flex: 1;
  overflow: auto;
  padding: 0 2rem 2rem;
}}
table {{
  border-collapse: collapse;
  width: 100%;
  font-size: 0.8125rem;
  line-height: 1.4;
}}
th, td {{
  padding: 0.4rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}}
th {{
  background: var(--card-bg);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}}
tr:hover td {{
  background: var(--accent-light);
}}

@media (max-width: 768px) {{
  .site-header {{ padding: 1rem 1rem 0; }}
  .panel-header {{ padding: 0.75rem 1rem; }}
  .table-wrap {{ padding: 0 1rem 1rem; }}
  .tab {{ padding: 0.5rem 0.75rem; font-size: 0.75rem; }}
}}
</style>
</head>
<body>
<div class="site-header">
<h1><a href="https://github.com/rkacker/depopulate-fair-plan">CA FAIR Plan Data</a></h1>
<p>Normalized tables from the
<a href="https://www.cfpnet.com/key-statistics-data/">California FAIR Plan</a> and
<a href="https://www.insurance.ca.gov/01-consumers/200-wrr/DataAnalysisOnWildfiresAndInsurance.cfm">CA Department of Insurance</a></p>
<div class="tabs">
{"".join(tab_buttons)}
</div>
</div>
{"".join(panels)}
<script>
document.querySelectorAll(".tab").forEach(btn => {{
  btn.addEventListener("click", () => {{
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.target).classList.remove("hidden");
  }});
}});
</script>
</body>
</html>"""

    (output_dir / "index.html").write_text(page, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build static GitHub Pages site")
    parser.add_argument("--output-dir", default="_site")
    args = parser.parse_args()
    build_site(Path(args.output_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
