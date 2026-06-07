# Changelog

All notable changes to **hermes-editing-yt** are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/), and the project
adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-05

### Added
- **Library** (`plugin/hermes_editing_yt.py`): pure-Python subtitle-driven auto-cut engine.
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
- **Skill doc** (`skills/hermes-editing-yt/SKILL.md`): copied to `~/AppData/Local/hermes/skills/media/`.
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

[0.1.0]: https://github.com/Capslockb/hermes-editing-yt/releases/tag/v0.1.0

## [0.1.1] — 2026-06-07

### Changed
- **Brand rename**: `veo-editor` → `hermes-editing-yt`. The short, single-word
  Google pattern was a naming-collision liability (Google's own video model is
  called Veo). `hermes-editing-yt` carries the Hermes plugin lineage and
  signals the YouTube target.
- **Internal rename**: every `oceanus` reference gone — code, env vars, plugin
  name, skill dir, install paths, class names, error strings, docstrings,
  tests, and the website copy. The plugin now registers as
  `hermes-editing-yt` in Hermes, env-var prefix is `HERMES_EDITING_YT_*`.
- **README honesty fix**: the prior "10:08 → 9:51" example came from a
  recording with almost no silence (gameplay commentary, 17s of dead air
  total). README now states the realistic outcome: 5–15% shorter on a
  typical vlog, tunable via `HERMES_EDITING_YT_MERGE_GAP` (default 1.20s).

### Added
- New env var: `HERMES_EDITING_YT_MERGE_GAP` (float, default `1.20`). Set
  `2.5–3.0` for an aggressive 10-min → 8-min cut; `0.6–1.0` for a light
  breath-preserving trim.

### Notes for existing users
- If you installed v0.1.0 with the old `oceanus` name, run the new
  installer once. It will register the new plugin name and remove the
  old one. No data loss — your SRT cache, output MP4s, and config
  are untouched.

[0.1.1]: https://github.com/Capslockb/hermes-editing-yt/releases/tag/v0.1.1

## [0.1.2] — 2026-06-07

### Fixed
- **Site blank page**: after ~5 seconds the page turned grey blank.
  Root cause was `react-router-dom`'s `<Link to="https://...">` in
  the Banner and Footer components — `<Link>` doesn't accept external
  URLs and throws at render time, unmounting the whole tree. Replaced
  with plain `<a href>`.
- **PageErrorBoundary added** at the app root so a single misbehaving
  component can no longer wipe the whole page. If anything else throws
  the user sees a styled fallback with the GitHub link, not grey.
- **README Gallery** described the old "obsidian V with cyan glow"
  icon (the old Veo brand). Replaced with an "ed" monogram and
  regenerated the app icon at `docs/media/logo.png`.
- **Corrupted Windows paths**: `G:\- hermes-editing-ytEditing\...`
  was missing its separator slash in 7 places (README, scripts,
  SKILL.md). Fixed.
- **Navbar leak**: "Veo Editor" was still showing in the logo
  text on the live site. Now says "hermes-editing-yt".
- **Architecture / MCP-tools SVGs**: still had "Veo Editor" in the
  architecture title and "OCEANUS" in two box labels. Replaced.
- **Tailwind color names**: `veo-cyan` / `veo-magenta` → `accent-cyan` /
  `accent-magenta` to match the no-leak brand.

### Changed
- App icon is now an "ed" monogram (obsidian glass, cyan + magenta
  rim) instead of a "V" glyph. Mirrored to `site/public/og-image.png`
  and `site/public/media/logo.png`.

[0.1.2]: https://github.com/Capslockb/hermes-editing-yt/releases/tag/v0.1.2

## [0.1.3] — 2026-06-07

### Fixed
- **3D model 404 on GitHub Pages**: the hero scene's `desktop_pc` and
  `planet` models were multi-file glTF (a `.gltf` JSON, a `.bin` buffer,
  and a `textures/` directory). GitHub Pages' CDN refused to serve
  `.bin` files. The GLTFLoader fetched the `.gltf`, tried to fetch
  `scene.bin` relative to the document root, got a 404, threw. The
  PageErrorBoundary (added in v0.1.2) caught the throw and displayed
  the styled fallback.
  - **Fix**: pack each model into a single self-contained `.glb` file
    (binary glTF, served as `model/gltf-binary`) using
    `@gltf-transform/core`. Added `site/scripts/pack-glb.cjs` and a
    `prebuild` npm script.
  - **Also**: `useGLTF` was passed a relative path (`./desktop_pc/scene.gltf`),
    which works on a domain-root deploy but breaks on the GitHub
    Pages subpath `/hermes-editing-yt/`. Replaced with
    `${import.meta.env.BASE_URL}desktop_pc/scene.glb` so the prefix
    is correct on every deploy.
- **CI build failed** because the `.bin` files needed by the prebuild
  packer were gitignored (`*.bin` is the Hugging Face weights rule
  in the root .gitignore). Added an override
  (`!site/public/**/scene.bin`) and a `.gitattributes` line
  (`*.bin binary`) so they're tracked.

[0.1.3]: https://github.com/Capslockb/hermes-editing-yt/releases/tag/v0.1.3
