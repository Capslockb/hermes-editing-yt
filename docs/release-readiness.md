# Release readiness

## Status legend

| Label | Meaning |
|---|---|
| **Working** | Code exists in the repo and has an executable verification path. |
| **Partial** | Code exists but depends on a local service, credential, or binary that the user must provide. |
| **Planned** | Roadmapped design; implementation not yet in `main`. |
| **Research** | Mentioned only as a future integration target until code + tests land. |

## Current repository truth table

| Area | Status | Verification command |
|---|---|---|
| SRT / WebVTT parsing | Working | `python3 -m pytest tests/test_hermes_editing_yt.py::TestParseSrt -q` |
| Segment + marker building | Working | `python3 -m pytest tests/test_hermes_editing_yt.py::TestBuildSegments -q` |
| ffmpeg render path | Working | `python3 -m pytest tests/test_hermes_editing_yt.py -q` (render uses ffmpeg indirectly in full E2E) |
| Local GPU Whisper transcription | Working | `python3 scripts/run_gpu_demo.py` (needs real video + GPU) |
| MCP server — 11 tools | Working | `python3 tests/test_mcp_server.py` |
| Oneshot installer | Working | `python3 installer/install.py --non-interactive --skip-deps` |
| Website (React + Three.js) | Working | `npm --prefix site run build` |
| CI lint + unit test | Working | See `.github/workflows/test.yml` |
| HTTP Whisper backend | Partial | `whisper_transcribe` needs a running Whisper server at the configured URL. |
| Standalone CLI beyond MCP | Planned | CLI entry in `hermes_editing_yt.py` exists; `__main__` packaging planned. |
| Batch / folder pipeline | Planned | `list_videos`/`list_subtitles` primitives only. |
| GUI timeline editor | Research | No code. |
| Cloud transcription | Research | HTTP hook only. |

## Hard release rules

1. Do not call a feature "supported" unless there is working code **and** a verification command in this repo.
2. Do not claim automatic cloud transcription without a bundled cloud backend.
3. Do not claim GPU transcription works without documenting the CUDA + cuBLAS 12 requirement.
4. Do not leak secrets in prompts, transcripts, plans, messages, issues, or docs.
5. README, raw docs, and docs-site must use the same status labels.

## E2E smoke checklist

Run before tagging a release:

```bash
# 1. Static syntax
python3 -m py_compile plugin/*.py scripts/*.py

# 2. Unit tests
python3 -m pytest tests/test_hermes_editing_yt.py -q

# 3. MCP server smoke
python3 tests/test_mcp_server.py

# 4. Installer gate
python3 installer/install.py --non-interactive --skip-deps

# 5. Site builds
npm --prefix site install --legacy-peer-deps
npm --prefix site run build

# 6. Docs site builds
python3 scripts/build_docs_site.py
```

## Release-blocking gaps

| Gap | Status | Owner / next step |
|---|---|---|
| HTTP Whisper backend needs a documented reference server. | Partial | Provide example server command or Docker image. |
| Batch/folder runner is not implemented. | Planned | Add `batch_autocut` tool or script. |
| No standalone first-class CLI entry (`python -m hermes_editing_yt`). | Planned | Add `__main__.py` and console script. |
| Website and generated docs site are separate deploy targets. | Working | Document that `site/` is the canonical rich site; `docs-site/` is the generated docs mirror. |
| GUI timeline editor does not exist. | Research | Keep out of release claims. |
