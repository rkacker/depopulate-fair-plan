from __future__ import annotations

import argparse
from pathlib import Path

from fairplan.pipeline import build_exports, build_report, fetch_command, normalize


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CA FAIR Plan residential data pipeline")
    subparsers = parser.add_subparsers(dest="command", required=True)

    fetch = subparsers.add_parser("fetch", help="Download upstream source documents")
    fetch.add_argument("--manifest", default="config/sources.toml")
    fetch.add_argument("--raw-dir", default="data/raw")

    normalize_parser = subparsers.add_parser("normalize", help="Normalize raw files into canonical tables")
    normalize_parser.add_argument("--manifest", default="config/sources.toml")
    normalize_parser.add_argument("--raw-dir", default="data/raw")
    normalize_parser.add_argument("--processed-dir", default="data/processed")

    exports = subparsers.add_parser("build-exports", help="Build chart and website export outputs")
    exports.add_argument("--processed-dir", default="data/processed")
    exports.add_argument("--exports-dir", default="data/exports")

    report = subparsers.add_parser("report", help="Build the Markdown market report")
    report.add_argument("--processed-dir", default="data/processed")
    report.add_argument("--exports-dir", default="data/exports")
    report.add_argument("--reports-dir", default="reports")

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "fetch":
        fetch_command(Path(args.raw_dir), Path(args.manifest))
    elif args.command == "normalize":
        normalize(Path(args.raw_dir), Path(args.processed_dir), Path(args.manifest))
    elif args.command == "build-exports":
        build_exports(Path(args.processed_dir), Path(args.exports_dir))
    elif args.command == "report":
        build_report(Path(args.processed_dir), Path(args.exports_dir), Path(args.reports_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
