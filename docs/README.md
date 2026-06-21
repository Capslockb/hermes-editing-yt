# hermes-editing-yt — raw docs

This directory is the **single source of truth** for the project's written documentation. Pages here are Markdown-first; the generated site in [`../docs-site/`](../docs-site/) is produced by [`../scripts/build_docs_site.py`](../scripts/build_docs_site.py).

The rich public website lives in [`../site/`](../site/) and deploys separately to https://capslockb.github.io/hermes-editing-yt/.

## Status legend

Every capability in this tree is tagged with one of these labels:

| Label | Meaning |
|---|---|
| **Working** | Code exists in the repo and has an executable verification path. |
| **Partial** | Code exists but depends on a local service, credential, or binary that the user must provide. |
| **Planned** | Roadmapped design; implementation not yet in `main`. |
| **Research** | Mentioned only as a future integration target until code + tests land. |

## Doc index

| Page | What it covers |
|---|---|
| [`quickstart.md`](quickstart.md) | Clone, install, first MCP call, verify, common pitfalls. |
| [`architecture.md`](architecture.md) | System map, pipeline stages, runtime/dataflow, threading model, lifecycle, key files, env vars, integration boundaries. |
| [`mcp-tools.md`](mcp-tools.md) | The 11 MCP tools, parameters, examples, and StreamableHTTP transport. |
| [`operator-helpers.md`](operator-helpers.md) | The operator-friendly tool surface and how to wire the skill doc into Hermes. |
| [`env-vars.md`](env-vars.md) | Exhaustive environment variable reference by category. |
| [`troubleshooting.md`](troubleshooting.md) | Common failures, fixes, and log locations. |
| [`release-readiness.md`](release-readiness.md) | Status legend, truth table, hard release rules, E2E smoke checklist, release-blocking gaps. |

## High-level status table

| Area | Status | Notes |
|---|---|---|
| SRT / WebVTT parsing | Working | Pure Python; 35 unit tests. |
| Segment + marker building | Working | Pure function; configurable. |
| ffmpeg render path | Working | Needs ffmpeg on PATH. |
| Local GPU Whisper transcription | Working | RTX 5060 verified; cuBLAS 12 shim included. |
| MCP server — 11 tools | Working | FastMCP 3.0.2 stdio + StreamableHTTP. |
| Oneshot installer | Working | TUI + non-interactive + uninstall. |
| React/Three.js website | Working | Auto-deployed from `site/`. |
| HTTP Whisper backend | Partial | Needs a separate Whisper server. |
| Standalone CLI beyond MCP | Planned | Backwards-compat CLI exists; first-class module entry planned. |
| Batch / folder pipeline | Planned | `list_videos` exists; multi-file runner not yet built. |
| GUI timeline editor | Research | No code yet. |
| Cloud transcription | Research | HTTP hook only. |
