# Dynamic Config Surface for BlackRoad OS Operator

This repository now exports a **dynamic config snapshot** that tracks every YAML/JSON/CSV artifact under `config/`. The goal is to keep the operator aware of drift, publish hashes for downstream runners, and make it easy to wire the state into automation pipelines.

## What changed
- `config/dynamic/manifest.yaml` declares refresh cadences, owners, and target outputs.
- `scripts/dynamic_config_refresh.py` crawls the config tree, computes SHA-256 fingerprints, and writes `config/dynamic/state.json`.
- The state file includes per-file metadata, roll-ups, and embeds the manifest so jobs can reason about intent.

## Usage
Run a single refresh (default paths):

```bash
python scripts/dynamic_config_refresh.py
```

Run continuously with a 1-minute loop:

```bash
python scripts/dynamic_config_refresh.py --interval 60
```

Publish to an alternative location:

```bash
python scripts/dynamic_config_refresh.py \
  --config-dir config \
  --output config/dynamic/state.json \
  --manifest config/dynamic/manifest.yaml
```

The script has minimal dependencies (only PyYAML) and is suitable for CI, Railway, or cron. Because it writes deterministic JSON (sorted file ordering and stable keys), downstream diffs are predictable while still reflecting real-time changes.
