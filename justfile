set shell := ["zsh", "-lc"]

setup:
	export UV_CACHE_DIR=.uv-cache && uv venv --python /opt/homebrew/bin/python3.11
	export UV_CACHE_DIR=.uv-cache && uv sync

test:
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run pytest

build:
	mkdir -p data/processed/fair data/processed/cdi data/processed/analysis data/exports reports
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli normalize --raw-dir data/raw --processed-dir data/processed
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli build-exports --processed-dir data/processed --exports-dir data/exports
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli build-senate --processed-dir data/processed
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli report --processed-dir data/processed --exports-dir data/exports --reports-dir reports

fixture-build:
	mkdir -p data/processed/fair data/processed/cdi data/processed/analysis data/exports reports
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli normalize --raw-dir tests/fixtures/raw --processed-dir data/processed
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli build-exports --processed-dir data/processed --exports-dir data/exports
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli build-senate --processed-dir data/processed
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli report --processed-dir data/processed --exports-dir data/exports --reports-dir reports

publish site_repo="../depopulate-fair-plan-new":
	just fixture-build
	mkdir -p {{site_repo}}/client/public/data
	cp data/exports/site_stats.json {{site_repo}}/client/public/data/site_stats.json
	cp data/exports/california_county_data.csv {{site_repo}}/client/public/california_county_data.csv
	@echo "Published to {{site_repo}}/client/public/"

clean:
	rm -rf data/processed data/exports reports
	mkdir -p data/processed data/exports reports
