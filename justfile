set shell := ["zsh", "-lc"]

setup:
	export UV_CACHE_DIR=.uv-cache && uv venv --python /opt/homebrew/bin/python3.11
	export UV_CACHE_DIR=.uv-cache && uv sync

test:
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run pytest

build:
	mkdir -p data/processed/fair data/processed/cdi data/processed/analysis data/exports insights
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli normalize --processed-dir data/processed
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli exports --processed-dir data/processed --exports-dir data/exports
	export UV_CACHE_DIR=.uv-cache && PYTHONPATH=src uv run python -m fairplan.cli insights --processed-dir data/processed --exports-dir data/exports --insights-dir insights

publish site_repo="../depopulate-fair-plan-new":
	just build
	mkdir -p {{site_repo}}/client/public/data
	cp data/exports/site_stats.json {{site_repo}}/client/public/data/site_stats.json
	cp data/exports/california_county_data.csv {{site_repo}}/client/public/california_county_data.csv
	@echo "Published to {{site_repo}}/client/public/"

clean:
	rm -rf data/processed data/exports insights
	mkdir -p data/processed data/exports insights
