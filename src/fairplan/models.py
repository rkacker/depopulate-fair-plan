from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SourceConfig:
    id: str
    family: str
    dataset: str
    format: str
    url: str
    published_date: str
    coverage_end: str
    file_name: str

    def output_path(self, raw_dir: Path) -> Path:
        return raw_dir / self.family / self.file_name

