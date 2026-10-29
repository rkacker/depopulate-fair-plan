from __future__ import annotations

import tomllib
from pathlib import Path

from fairplan.models import SourceConfig


def load_sources(manifest_path: Path) -> list[SourceConfig]:
    payload = tomllib.loads(manifest_path.read_text())
    return [SourceConfig(**row) for row in payload["sources"]]



def load_corrections(corrections_path: Path) -> list[dict[str, object]]:
    """Load documented source-data corrections (see config/corrections.toml).

    Returns an empty list when the file does not exist.
    """
    if not corrections_path.exists():
        return []
    payload = tomllib.loads(corrections_path.read_text())
    return list(payload.get("corrections", []))
