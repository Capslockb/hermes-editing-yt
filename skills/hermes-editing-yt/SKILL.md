---
name: hermes-editing-yt
description: "Use when driving the hermes-editing-yt subtitle-driven auto video editor through MCP. Wraps the local Python pipeline (ffmpeg + Whisper + SRT parsing) as 11 tools (autoedit, autocut, automark, render_segments, parse_srt_text, build_segments_from_srt, whisper_transcribe, gpu_transcribe, list_videos, list_subtitles, server_info) so any MCP client (Hermes Agent, Claude Desktop, Cursor) can cut long gameplay/long-form video into highlight reels without touching ffmpeg flags."
version: 1.1.0
author: Bernardo (hermes-editing-yt project) + black-wave (Hermes Agent)
license: MIT
metadata:
  hermes:
    tags: [video, editing, ffmpeg, whisper, mcp, hermes-editing-yt, autoedit, pipeline, subtitles, gpu]
    related_skills: [native-mcp, hermes-agent]
---

# hermes-editing-yt Autoedit MCP Plugin

A standalone MCP server that wraps the hermes-editing-yt auto video editor — the
pipeline originally built for the Helgstr1 / MOTNH 2 / Deerclops workflow on
the G: SSD — into a clean tool surface that any MCP-speaking agent can
call. Same ffmpeg + local-Whisper logic, no hardcoded paths, no interactive
prompts.

## Overview

The hermes-editing-yt pipeline is subtitle-driven: it takes a long `.mp4`, extracts
audio, transcribes it via local GPU Whisper (or reuses an existing `.srt`),
groups nearby subtitle cues into keep-segments, marks highlights from
keywords / punctuation, then optionally renders the concatenated segments
back out as a single MP4. This skill packages that pipeline as a
`FastMCP 3.x` server (11 tools) plus a `skill_manage`-style description
block that loads automatically when the tools are discovered by Hermes.

The server is pure-Python and dependency-light: `fastmcp`, `ffmpeg`,
`ffprobe`, `faster-whisper`, plus an NVIDIA GPU with working
CUDA + cuBLAS + cuDNN for the local transcription path.

## When to Use

- An MCP client (Hermes Agent, Claude Desktop, Cursor, mcporter) needs to
  cut a long video into a highlight reel from a transcript.
- A workflow has raw footage + an SRT and wants a deterministic,
  re-runnable cut plan as JSON / CSV.
- A different agent (Codex, Claude Code, OpenCode) needs the same
  autoedit pipeline without rebuilding the ffmpeg command line.
- You want a quick `list_videos` / `parse_srt_text` /
  `build_segments_from_srt` preview before paying for the full
  ffmpeg/Whisper run.
- You have raw audio and need an SRT fast — call `gpu_transcribe` directly
  without going through the full pipeline.

**Don't use for:** semantic / visual scene selection (this pipeline is
subtitle-driven only — it doesn't read video frames); for that, layer a
vision model on top of `parse_srt_text` first.

## Tool Reference

| Tool | Pure? | Purpose |
|------|-------|---------|
| `server_info` | yes | Health/version snapshot, default paths, env overrides |
| `list_videos(root)` | I/O | Recursive .mp4/.mkv/.mov/.avi/.m4v/.webm discovery |
| `list_subtitles(root)` | I/O | Recursive .srt/.vtt discovery |
| `parse_srt_text(text)` | yes | Parse SRT/WebVTT → `{count, cues:[{index,start,end,text}]}` |
| `build_segments_from_srt(text, duration_seconds, ...)` | yes | Preview keep-segments + markers from SRT text + known duration |
| `whisper_transcribe(wav_path, output_srt_path, url?)` | I/O + net | POST a 16kHz mono WAV to local Whisper HTTP server, save SRT |
| `gpu_transcribe(wav_path, output_srt_path, model?, device?, ...)` | GPU | Transcribe via local faster-whisper (CTranslate2), no HTTP hop |
| `render_segments(video_path, output_mp4_path, segments_json, ...)` | ffmpeg | Render a JSON list of `{start,end}` segments into a single MP4 |
| `automark(video_path, output_dir, ...)` | full | Audio + SRT + plan + CSVs (no render) |
| `autocut(video_path, output_dir, ...)` | full | `automark` + render MP4 |
| `autoedit(video_path, output_dir, ...)` | full | Same as `autocut` (the original CLI's "full export bundle") |

All segmentation/render knobs from the original script are exposed as
keyword args on the relevant tool:

- `lead_in` (0.30 s), `tail_out` (0.45 s), `merge_gap` (1.20 s),
  `min_segment` (0.85 s) — `automark` / `autocut` / `autoedit` /
  `build_segments_from_srt` / `render_segments`
- `video_codec` (libx264), `preset` (medium), `crf` (18),
  `audio_codec` (aac), `audio_bitrate` (192k) — `autocut` / `autoedit` /
  `render_segments`

Transcription knobs (apply to `gpu_transcribe` AND `autoedit`/`autocut`/
`automark` when no SRT is provided):

- `transcribe_backend` (`"faster-whisper"` default / `"http"` / `"none"`)
- `whisper_model` (`"large-v3"`, `"medium"`, `"small"`, `"tiny"`)
- `whisper_device` (`"cuda"` default / `"cpu"`)
- `whisper_compute_type` (`"float16"` default / `"int8"` / etc.)
- `whisper_language` (optional ISO code, auto-detect if omitted)
- `whisper_beam_size` (default 5)

## Install (Hermes Agent)

1. **Install Python deps** for the hermes-editing-yt server itself (one-time, in
   the Python the MCP server will run under — e.g.
   `C:\Users\Bernardo\AppData\Local\Programs\Python\Python314\python.exe`):
   ```bash
   PY="C:\Users\Bernardo\AppData\Local\Programs\Python\Python314\python.exe"
   "$PY" -m pip install fastmcp faster-whisper pytest
   "$PY" -m pip install "nvidia-cublas-cu12==12.9.2.10"  # see references/windows-gpu-whisper-setup.md
   ```
   `ffmpeg` and `ffprobe` must be on `PATH`. The skill will fail loudly
   (`server_info.ffmpeg_available == false`) if they're missing.
   `winget install Gyan.FFmpeg` is the easiest install on Windows.

2. **Install the MCP SDK in the Hermes venv.** Hermes's Windows venv is
   stripped (no pip) per the `hermes-agent` skill notes. Use `uv`:
   ```bash
   cd "C:\Users\Bernardo\AppData\Local\hermes\hermes-agent"
   uv pip install --python ./venv/Scripts/python.exe mcp
   ```
   Without this, `hermes mcp add hermes-editing-yt` will fail with
   *"MCP server 'hermes-editing-yt' requires the 'mcp' Python SDK, but it is not
   installed"*. See `references/windows-gpu-whisper-setup.md` for the
   full cuBLAS + Hermes venv install recipe.

3. **Wire into Hermes** with the official helper (it writes the
   right block in `~\AppData\Local\hermes\config.yaml` for you):
   ```bash
   cd "C:\Users\Bernardo\AppData\Local\hermes\hermes-agent"
   echo "y" | ./venv/Scripts/hermes mcp add hermes-editing-yt \
     --command "C:\\Users\\Bernardo\\AppData\\Local\\Programs\\Python\\Python314\\python.exe" \
     --args "G:\\- hermes-editing-yt\tools\\video_workflow\\mcp_server.py"
   ```
   The MCP server has 11 tools; the prompt asks you to enable all of
   them — accept the default.

4. **Restart the gateway** (or `/reset` in chat):
   ```bash
   hermes gateway restart
   ```

5. **Verify**:
   ```bash
   hermes mcp list                  # hermes-editing-yt appears with "✓ enabled"
   hermes mcp test hermes-editing-yt          # 11 tools discovered
   ```
   In chat, ask the agent: "Call `mcp_hermes-editing-yt_server_info`" — you
   should see the 11-tool manifest including `gpu_transcribe`.

6. **Optional env overrides** (set before `hermes` starts, or in
   `~\AppData\Local\hermes\.env`):
   ```bash
   HERMES_EDITING_YT_WHISPER_URL=http://127.0.0.1:51746/transcribe
   HERMES_EDITING_YT_OUTPUT_DIR=G:\- hermes-editing-yt\output
   HERMES_EDITING_YT_RAW_DIR=G:\- hermes-editing-yt\Unedited (RAW)
   HERMES_EDITING_YT_WHISPER_MODEL=large-v3
   HERMES_EDITING_YT_WHISPER_DEVICE=cuda
   HERMES_EDITING_YT_WHISPER_COMPUTE=float16
   ```
   These only affect `server_info` defaults — the MCP tool args take
   precedence when supplied.

## Common Workflows

### 1. Preview a cut plan from an existing SRT (no ffmpeg)

```text
User:  Use hermes-editing-yt to preview a cut plan from
       G:\- hermes-editing-yt\Editing\New folder\Untitled - February 8, 2026 (1).srt
       for a 10000s video.

Agent: mcp_hermes-editing-yt_build_segments_from_srt(
          text=<file_contents>,
          duration_seconds=10000)
       → JSON with segment_count, kept_duration_seconds, segments[], markers[]
```

### 2. Full autocut with existing SRT (no transcription needed)

```text
User:  autocut Helgstr1.mp4 to G:\- hermes-editing-yt\output\preview

Agent: mcp_hermes-editing-yt_autocut(
          video_path="G:\\- hermes-editing-yt\Editing\\New folder\\Helgstr1.mp4",
          output_dir="G:\\- hermes-editing-yt\output\\preview",
          srt_path="G:\\- hermes-editing-yt\Editing\\New folder\\Untitled - February 8, 2026 (1).srt")
       → JSON with rendered_video, segment_count, plan_path, …
```

### 3. End-to-end autocut with LOCAL GPU Whisper (no SRT, no network)

This is the new default. The MCP server calls faster-whisper on the
RTX 5060 directly — no HTTP server hop, no need to start a separate
Whisper process.

```text
User:  autoedit Helgstr1.mp4 with GPU transcription

Agent: mcp_hermes_editing_yt(
          video_path="G:\\- hermes-editing-yt\Editing\\New folder\\Helgstr1.mp4",
          output_dir="G:\\- hermes-editing-yt\output\\gpu_helgstr1",
          whisper_model="large-v3",   # or "medium" / "small" for speed
          whisper_device="cuda",      # "cpu" to force fallback
          whisper_compute_type="float16")
```

The model is loaded **once per session** and cached, so repeat runs
(plan → autocut → re-render) skip the multi-second model-load tax.

### 4. Transcribe only (no cut, no render)

```text
User:  Transcribe Helgstr1.wav to an SRT

Agent: mcp_hermes-editing-yt_gpu_transcribe(
          wav_path="G:\\- hermes-editing-yt\output\\some\\Helgstr1_whisper_input.wav",
          output_srt_path="G:\\- hermes-editing-yt\output\\some\\Helgstr1.srt",
          model="medium",            # faster than large-v3 for a quick pass
          language="en")             # skip auto-detect
```

### 5. Transcribe via remote HTTP server (legacy path)

Set `transcribe_backend="http"` and the `whisper_url` to your server:

```text
mcp_hermes_editing_yt(
   video_path=...,
   output_dir=...,
   transcribe_backend="http",
   whisper_url="http://127.0.0.1:51746/transcribe")
```

## CLI / Library (unchanged from the original)

The refactor is **backwards-compatible**. The original CLI still works:

```powershell
python "G:\- hermes-editing-yttools\video_workflow\auto_video_workflow.py" autoedit `
  --video "G:\- hermes-editing-yt\Editing\New folder\Helgstr1.mp4" `
  --output-dir "G:\- hermes-editing-yt\output\cli-run"
```

And the library can be imported directly:

```python
import sys
sys.path.insert(0, r"G:\- hermes-editing-yttools\video_workflow")
import hermes_editing_yt as lib

result = lib.run_pipeline(
    mode="autocut",
    video_path=Path(".../Helgstr1.mp4"),
    output_dir=Path(".../run"),
    config=lib.PipelineConfig(lead_in=0.5, tail_out=0.6, crf=20),
)
print(result.rendered_video, len(result.keep_segments), "segments")
```

## Files in this plugin

```
G:\- hermes-editing-yttools\video_workflow\
├── auto_video_workflow.py            # ORIGINAL CLI (preserved, untouched)
├── auto_video_workflow.legacy.bak.py # Pre-refactor safety copy
├── hermes_editing_yt.py               # Refactored library + CLI entry
├── mcp_server.py                     # FastMCP 3.x server (this plugin)
├── README.md                         # Original README (preserved)
├── run_gpu_helgstr1.py               # end-to-end Helgstr1 smoke script
├── tests/
│   ├── test_hermes_editing_yt.py      # 35 pytest cases, all pure functions
│   └── test_mcp_server.py            # MCP smoke over stdio, 11 tools
└── __pycache__/                      # bytecode
```

The references/ folder lives next to `SKILL.md` in
`~\AppData\Local\hermes\skills\media\hermes-editing-yt\references\`:

- `references/windows-gpu-whisper-setup.md` — cuBLAS 12 vs 13 fix,
  Hermes venv pip, nvidia-cublas-cu12 install, full error→fix table
- `references/mcp-smoke-test-pattern.md` — how to write smoke tests
  for MCP servers with heavy first-call costs (3-layer pattern: tiny
  model + CPU + pass-through assertions)

## Common Pitfalls

1. **"ffmpeg not available"** — install from gyan.dev / brew / apt, or
   point `PATH` at an existing build. The original hermes-editing-yt box already has
   it at `C:\Users\Bernardo\AppData\Local\Microsoft\WinGet\Links\ffmpeg`.
   `server_info()` reports `ffmpeg_available` directly.

2. **"MCP server requires the 'mcp' Python SDK"** — the Hermes venv
   doesn't ship with the MCP SDK. Install with
   `uv pip install --python <hermes-venv>/Scripts/python.exe mcp`. See
   `references/windows-gpu-whisper-setup.md` for why this is needed
   (Hermes's `mcp` client lives in its own venv, not the system Python
   that the hermes-editing-yt server itself uses).

3. **No SRT and transcribe_backend="none"** — pass
   `transcribe_backend="faster-whisper"` (default) or `"http"`, OR
   pre-supply an `srt_path`. The pipeline raises a clear EditingYtError
   if it can't find an SRT and the backend can't produce one.

4. **GPU transcription first call is slow** — `large-v3` is ~3 GB and
   the first call pays a multi-second model-load + cuDNN init tax.
   Subsequent calls in the same MCP server session reuse the cached
   model. The transcription itself runs at near-realtime on the RTX
   5060 (sm_120, 8 GB). Use `whisper_model="medium"` or `"small"` for
   faster (but less accurate) transcriptions.

5. **Whisper HTTP server unreachable (legacy path)** — when using
   `transcribe_backend="http"`, the `whisper_transcribe` tool returns a
   JSON `{"error": "Whisper server is not reachable..."}`. Either start
   your Whisper server (the hermes-editing-yt box uses port 51746) or just use
   the GPU backend instead.

6. **`autocut` takes a long time** — ffmpeg re-encodes each segment
   (`libx264 medium CRF 18`). A 1-hour source typically renders in
   5–15 min on a modern CPU. The MCP `timeout` must be ≥ 600 s for the
   `hermes-editing-yt` server entry.

7. **CUDA float16 fails (no cuDNN / wrong driver / cuBLAS 12 missing)**
   — the GPU backend auto-falls-back to CPU float32 and returns the
   actual `device` / `compute_type` in the result JSON. If even CPU
   fails, you get a clear `EditingYtError`. On RTX 5060 + PyTorch
   2.12+cu130 specifically, you'll hit
   `cublas64_12.dll is not found or cannot be loaded` because torch
   ships v13 but ctranslate2 wants v12 — the library's
   `_ensure_cublas12_on_path()` registers the right directory
   automatically. Full diagnosis in
   `references/windows-gpu-whisper-setup.md`.

8. **Output dir doesn't exist** — `run_pipeline` calls
   `mkdir(parents=True, exist_ok=True)`, so this is automatic. But the
   *parent* must be writable — on the hermes-editing-yt box, `G:\- hermes-editing-yt\output`
   is fine, but a sandboxed Hermes profile running under a different
   user might not have write access. Check ACLs.

9. **Long paths on Windows** — keep paths under ~250 chars to avoid
   `OSError 206` ("filename or extension too long"). The
   `Helgstr1_8m.mp3` / `Helgstr1_CUT.mp4` workflow hits this occasionally;
   the refactored code uses `Path.resolve()` to canonicalize but doesn't
   shorten.

10. **SRT cue numbering is wrong** — the original CLI's `parse_srt` used
    the SRT index field literally. The new `parse_subtitles` auto-assigns
    if the first line isn't a bare integer (e.g. WebVTT cues), so the
    `source_index` on markers can differ by ±1 between old and new runs
    for mixed-format inputs. Pure-SRT inputs are unchanged.

11. **Smoke test for the MCP server times out** — the first call to
    `gpu_transcribe` triggers a 3 GB model download (large-v3) +
    multi-second load. The shipped `tests/test_mcp_server.py` uses
    `model="tiny"`, `device="cpu"`, `compute_type="float32"` so the
    smoke stays under 30 s. If you write your own smoke, follow the
    3-layer pattern in `references/mcp-smoke-test-pattern.md`.

## Verification Checklist

- [ ] `python -c "import hermes_editing_yt, mcp_server"` works from
      `G:\- hermes-editing-yttools\video_workflow\`
- [ ] `pytest tests/test_hermes_editing_yt.py` → 35 passed
- [ ] `python mcp_server.py --help` shows `--http PORT` flag
- [ ] `hermes mcp list` lists `hermes-editing-yt` with "✓ enabled"
- [ ] `hermes mcp test hermes-editing-yt` shows "connected, 11 tools" (was 10
      before `gpu_transcribe` was added)
- [ ] In chat: "Use mcp_hermes-editing-yt_server_info" returns the JSON snapshot
      including `transcription_backend: "faster-whisper"` and
      `ffmpeg_available: true`
- [ ] In chat: "Use mcp_hermes-editing-yt_list_videos on
      G:\\- hermes-editing-yt\Editing\\New folder" returns the Helgstr1 files
- [ ] In chat: "Use mcp_hermes-editing-yt_gpu_transcribe on
      G:\\- hermes-editing-yt\output\\gpu_helgstr1_test\\Helgstr1_whisper_input.wav
      with model=large-v3" — should return a `transcription` block
      with `device=cuda, compute_type=float16, language=en`
- [ ] `pytest tests/ -v` still passes after a clean re-run

## Run Tests

```bash
unset PYTHONPATH    # the broken hermes venv pydantic leaks in sometimes
cd "G:\- hermes-editing-yttools\video_workflow"
python -m pytest tests/ -v
```

Expected: **35 pure unit tests pass in <1 s** + the MCP smoke
exercises 11 tools (smoke takes ~30 s; the `gpu_transcribe` call
inside the smoke uses the `tiny` model + CPU to stay fast).

## Run the Server Manually (for debugging)

```bash
# stdio (what Hermes uses)
python "G:\- hermes-editing-yttools\video_workflow\mcp_server.py"

# HTTP/StreamableHTTP for browser-based MCP clients
python "G:\- hermes-editing-yttools\video_workflow\mcp_server.py" --http 8765
# → http://127.0.0.1:8765/mcp
```

## Reference: env vars & defaults

| Env var | Default | Used by |
|---------|---------|---------|
| `HERMES_EDITING_YT_WHISPER_URL`     | `http://127.0.0.1:51746/transcribe` | `whisper_transcribe` tool (HTTP backend) |
| `HERMES_EDITING_YT_OUTPUT_DIR`      | `G:\- hermes-editing-yt\output`                | `server_info` default_output_dir |
| `HERMES_EDITING_YT_RAW_DIR`         | `G:\- hermes-editing-yt\Unedited (RAW)`        | `server_info` default_raw_dir |
| `HERMES_EDITING_YT_WHISPER_MODEL`   | `large-v3`                           | GPU backend default model |
| `HERMES_EDITING_YT_WHISPER_DEVICE`  | `cuda`                               | GPU backend default device |
| `HERMES_EDITING_YT_WHISPER_COMPUTE` | `float16`                            | GPU backend default compute type |
| `HERMES_EDITING_YT_WHISPER_LANG`    | (auto-detect)                        | GPU backend default language code |
| `HERMES_EDITING_YT_WHISPER_BEAM`    | `5`                                  | GPU backend default beam size |

The MCP tool args (`video_path`, `output_dir`, `whisper_url`,
`whisper_model`, …) always take precedence over the env defaults.

## See also

- `native-mcp` — how Hermes Agent's built-in MCP client works
  (stdio/HTTP transport, tool naming, security model)
- `hermes-agent` — `hermes mcp add/list/test` CLI
- The original `auto_video_workflow.py` CLI (preserved for one-shots)
- `tests/test_hermes_editing_yt.py` — 35 reference cases for the library
- `tests/test_mcp_server.py` — full MCP smoke over stdio
- `references/windows-gpu-whisper-setup.md` — cuBLAS 12 vs 13 fix,
  Hermes venv pip, nvidia-cublas-cu12 install, full error→fix table
- `references/mcp-smoke-test-pattern.md` — how to write smoke tests
  for MCP servers with heavy first-call costs
