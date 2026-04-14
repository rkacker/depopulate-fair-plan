"""Build a static GitHub Pages site from pipeline outputs.

Reads CSVs from data/processed/ and data/exports/, Markdown from insights/,
and generates a single-page HTML site with rendered tables and formatted text.

Usage:
    PYTHONPATH=src python site/build.py --output-dir _site
"""

from __future__ import annotations

import argparse
import csv
import html
import re
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
    ("Distressed County PIF", "data/processed/analysis/distressed_county_pif.csv"),
    ("Distressed ZIP PIF", "data/processed/analysis/distressed_zip_pif.csv"),
    ("Site Stats Export", "data/exports/site_stats.json"),
    ("County Data Export", "data/exports/california_county_data.csv"),
]


def render_markdown(text: str) -> str:
    """Minimal Markdown to HTML: headings, bold, code, lists, paragraphs."""
    lines = text.split("\n")
    out: list[str] = []
    in_list = False

    for line in lines:
        stripped = line.strip()

        # Headings
        if m := re.match(r"^(#{1,6})\s+(.*)", stripped):
            if in_list:
                out.append("</ul>")
                in_list = False
            level = len(m.group(1))
            content = inline_format(m.group(2))
            out.append(f"<h{level}>{content}</h{level}>")
            continue

        # List items
        if stripped.startswith("- "):
            if not in_list:
                out.append("<ul>")
                in_list = True
            content = inline_format(stripped[2:])
            out.append(f"<li>{content}</li>")
            continue

        # Close list if we hit a non-list line
        if in_list and not stripped.startswith("- "):
            out.append("</ul>")
            in_list = False

        # Empty line
        if not stripped:
            continue

        # Paragraph
        out.append(f"<p>{inline_format(stripped)}</p>")

    if in_list:
        out.append("</ul>")

    return "\n".join(out)


def inline_format(text: str) -> str:
    """Handle bold, inline code, backtick spans."""
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`(.+?)`", r"<code>\1</code>", text)
    return text


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


def json_to_block(path: Path) -> str:
    """Render a JSON file as a formatted code block."""
    text = path.read_text(encoding="utf-8")
    return f'<pre><code>{html.escape(text)}</code></pre>'


def build_nav(insight_files: list[Path]) -> str:
    """Build navigation sidebar content."""
    parts = ['<nav id="nav">']
    parts.append('<h2>Insights</h2><ul>')
    for f in insight_files:
        slug = f.stem
        label = f.stem.replace("_", " ").title()
        parts.append(f'<li><a href="#insight-{slug}">{label}</a></li>')
    parts.append("</ul>")
    parts.append('<h2>Data Tables</h2><ul>')
    for label, path_str in CSV_SECTIONS:
        if Path(ROOT / path_str).exists():
            slug = Path(path_str).stem
            parts.append(f'<li><a href="#table-{slug}">{label}</a></li>')
    parts.append("</ul></nav>")
    return "\n".join(parts)


def build_site(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    # Collect insights
    insights_dir = ROOT / "insights"
    insight_files = sorted(insights_dir.glob("*.md")) if insights_dir.exists() else []

    # Build insights HTML
    insights_html = []
    for f in insight_files:
        slug = f.stem
        label = f.stem.replace("_", " ").title()
        content = render_markdown(f.read_text(encoding="utf-8"))
        insights_html.append(
            f'<section id="insight-{slug}" class="insight">'
            f"<h2>{label}</h2>{content}</section>"
        )

    # Build tables HTML
    tables_html = []
    for label, path_str in CSV_SECTIONS:
        path = ROOT / path_str
        if not path.exists():
            continue
        slug = path.stem
        if path.suffix == ".json":
            content = json_to_block(path)
        else:
            content = csv_to_table(path)
        tables_html.append(
            f'<section id="table-{slug}" class="data-table">'
            f"<h2>{label}</h2>"
            f'<p class="file-path">{path_str}</p>'
            f"{content}</section>"
        )

    nav = build_nav(insight_files)

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
pre {{ background: var(--card-bg); padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.8125rem; }}
code {{ font-family: var(--mono); }}
.insight {{ background: var(--card-bg); padding: 1.5rem; border-radius: 6px; }}
.insight h2 {{ border: none; padding: 0; }}
.insight h3 {{ margin-top: 1rem; }}
.insight p {{ margin: 0.5rem 0; }}
.insight ul {{ margin: 0.5rem 0 0.5rem 1.5rem; }}
.insight li {{ margin: 0.25rem 0; }}
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
<p>Pipeline outputs from <a href="https://github.com/rkacker/depopulate-fair-plan">depopulate-fair-plan</a>.
Data from the <a href="https://www.cfpnet.com/key-statistics-data/">California FAIR Plan</a>
and <a href="https://www.insurance.ca.gov/01-consumers/200-wrr/DataAnalysisOnWildfiresAndInsurance.cfm">California Department of Insurance</a>.</p>
</header>
{"".join(insights_html)}
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
