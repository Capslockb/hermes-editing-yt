# Changelog

All notable changes to **Veo Editor** are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/), and the project
adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-05

### Added
- **Library** (`plugin/oceanus_autoedit.py`): pure-Python subtitle-driven auto-cut engine.
  - `parse_subtitles`, `build_segments`, `build_markers` (pure)
  - `extract_audio`, `render_autocut`, `run_pipeline` (I/O)
  - `transcribe_with_faster_whisper` (local GPU, cublas v12 shim)
  - `transcribe_to_srt` (HTTP Whisper endpoint)
  - 3 modes: `automark` / `autocut` / `autoedit`
- **MCP server** (`plugin/mcp_server.py`): FastMCP 3.0.2 over stdio + StreamableHTTP.
  - 11 tools: `server_info`, `list_videos`, `list_subtitles`, `parse_srt_text`,
    `build_segments_from_srt`, `whisper_transcribe`, `render_segments`,
    `automark`, `autocut`, `autoedit`, `gpu_transcribe`
- **Plugin manifest** (`plugin/plugin.yaml`): name, version, tools, optional env vars.
- **Oneshot installer** (`installer/`):
  - `install.py` — rich TUI (--non-interactive / --uninstall)
  - `install.sh` — bash curl-pipe-bash entry
  - `install.ps1` — PowerShell iwr|iex entry
- **Skill doc** (`skills/oceanus-autoedit/SKILL.md`): copied to `~/AppData/Local/hermes/skills/media/`.
- **Tests** (`tests/`): 35 unit tests, 11-tool MCP stdio smoke.
- **GPU demo** (`scripts/run_gpu_demo.py`): end-to-end on a real video.
- **CI** (`.github/workflows/`): lint + test on push and PR.
- **Docs** (`docs/`): architecture + troubleshooting.

### Verified
- 35/35 unit tests pass in ~4 s.
- MCP stdio smoke exercises all 11 tools in ~6 s, rc=0.
- Real GPU autocut on `Helgstr1.mp4` (1.43 GB, 10:08):
  - Whisper large-v3 CUDA float16: 47.3 s for 10:08 of audio (~12.8× realtime)
  - ffmpeg libx264 CRF 18 render: 3:18
  - Output: 9:51 kept (97.4%), 296 MB MP4

[0.1.0]: https://github.com/Capslockb/veo-editor/releases/tag/v0.1.0
