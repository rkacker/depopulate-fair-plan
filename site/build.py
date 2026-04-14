"""Build a static GitHub Pages site from pipeline outputs.

Reads normalized CSVs from data/processed/fair/ and data/processed/cdi/
and generates a single-page HTML site with rendered tables.

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

    parts = ['<div class="table-wrap"><table>']
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
    parts.append("</tbody></table></div>")
    return "\n".join(parts)


def build_nav() -> str:
    """Build navigation sidebar content."""
    parts = ['<nav id="nav">']
    parts.append('<h2>Data Tables</h2><ul>')
    for label, path_str in CSV_SECTIONS:
        if (ROOT / path_str).exists():
            slug = Path(path_str).stem
            parts.append(f'<li><a href="#table-{slug}">{label}</a></li>')
    parts.append("</ul></nav>")
    return "\n".join(parts)


def build_site(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build tables HTML
    tables_html = []
    for label, path_str in CSV_SECTIONS:
        path = ROOT / path_str
        if not path.exists():
            continue
        slug = path.stem
        content = csv_to_table(path)
        tables_html.append(
            f'<section id="table-{slug}" class="data-table">'
            f"<h2>{label}</h2>"
            f'<p class="file-path">{path_str}</p>'
            f"{content}</section>"
        )

    nav = build_nav()

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
  --card-bg: #f8f9fa;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: var(--font); color: var(--fg); background: var(--bg); line-height: 1.6; }}
.layout {{ display: flex; min-height: 100vh; }}
nav {{
  width: 260px; flex-shrink: 0; padding: 2rem 1.5rem;
  border-right: 1px solid var(--border); position: sticky; top: 0;
  height: 100vh; overflow-y: auto; background: var(--card-bg);
}}
nav h2 {{ font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin: 1.5rem 0 0.5rem; }}
nav h2:first-child {{ margin-top: 0; }}
nav ul {{ list-style: none; }}
nav li {{ margin: 0.25rem 0; }}
nav a {{ color: var(--fg); text-decoration: none; font-size: 0.875rem; }}
nav a:hover {{ color: var(--accent); }}
main {{ flex: 1; padding: 2rem 3rem; max-width: 1200px; }}
header {{ margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; }}
header h1 {{ font-size: 1.75rem; margin-bottom: 0.25rem; }}
header p {{ color: var(--muted); }}
section {{ margin-bottom: 3rem; }}
section h2 {{ font-size: 1.25rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }}
.file-path {{ font-family: var(--mono); font-size: 0.75rem; color: var(--muted); margin-bottom: 0.75rem; }}
.table-wrap {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; font-size: 0.8125rem; }}
th, td {{ padding: 0.4rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }}
th {{ background: var(--card-bg); font-weight: 600; position: sticky; top: 0; }}
tr:hover {{ background: #f0f4ff; }}
@media (max-width: 768px) {{
  .layout {{ flex-direction: column; }}
  nav {{ width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--border); }}
  main {{ padding: 1.5rem; }}
}}
</style>
</head>
<body>
<div class="layout">
{nav}
<main>
<header>
<h1>CA FAIR Plan Data</h1>
<p>Normalized tables from <a href="https://github.com/rkacker/depopulate-fair-plan">depopulate-fair-plan</a>.
Data from the <a href="https://www.cfpnet.com/key-statistics-data/">California FAIR Plan</a>
and <a href="https://www.insurance.ca.gov/01-consumers/200-wrr/DataAnalysisOnWildfiresAndInsurance.cfm">California Department of Insurance</a>.</p>
</header>
{"".join(tables_html)}
</main>
</div>
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
