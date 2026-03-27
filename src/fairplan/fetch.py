from __future__ import annotations

import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path

from fairplan.io_utils import ensure_directory, sha256sum
from fairplan.models import SourceConfig


def fetch_sources(sources: list[SourceConfig], raw_dir: Path) -> list[dict[str, object]]:
    fetched: list[dict[str, object]] = []
    for source in sources:
        target = source.output_path(raw_dir)
        ensure_directory(target.parent)
        urllib.request.urlretrieve(source.url, target)
        metadata = {
            "id": source.id,
            "family": source.family,
            "dataset": source.dataset,
            "url": source.url,
            "published_date": source.published_date,
            "coverage_end": source.coverage_end,
            "retrieved_at": datetime.now(UTC).isoformat(),
            "file_name": source.file_name,
            "file_path": str(target),
            "sha256": sha256sum(target),
            "size_bytes": target.stat().st_size,
        }
        target.with_suffix(target.suffix + ".metadata.json").write_text(
            json.dumps(metadata, indent=2) + "\n",
            encoding="utf-8",
        )
        fetched.append(metadata)
    return fetched

