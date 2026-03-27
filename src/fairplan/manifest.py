from __future__ import annotations

import tomllib
from pathlib import Path

from fairplan.models import SourceConfig


def load_sources(manifest_path: Path) -> list[SourceConfig]:
    payload = tomllib.loads(manifest_path.read_text())
    return [SourceConfig(**row) for row in payload["sources"]]

