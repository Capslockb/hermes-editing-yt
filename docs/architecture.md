# Architecture

> Visual reference: see [`diagrams/architecture.svg`](diagrams/architecture.svg) and
> [`diagrams/mcp-tools.svg`](diagrams/mcp-tools.svg) for the rendered diagrams.

Veo Editor is a **two-layer** system:

1. **Library** (`plugin/oceanus_autoedit.py`) — pure-Python pipeline engine. No GUI, no I/O beyond files. Can be `import`-ed and used from any Python script.
2. **MCP server** (`plugin/mcp_server.py`) — a FastMCP 3.0.2 server that wraps the library and exposes 11 tools to any Hermes agent over stdio (or StreamableHTTP for browsers).

```
┌─────────────────────────────────────────────────────────────────────┐
│  Hermes Agent (any chat)                                            │
│  "Use oceanus.autoedit on Helgstr1.mp4"                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ MCP stdio (JSON-RPC over pipes)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  mcp_server.py  (FastMCP 3.0.2)                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ server_info         list_videos       list_subtitles         │   │
│  │ parse_srt_text      build_segments_from_srt                  │   │
│  │ whisper_transcribe  gpu_transcribe                           │   │
│  │ render_segments     automark / autocut / autoedit           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ in-process function calls
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  oceanus_autoedit.py  (the library)                                 │
│                                                                     │
│  parse_subtitles ─┐                                                  │
│                   ├──► build_segments ──┬──► render_autocut (ffmpeg)│
│  build_markers ───┘                    │                            │
│                                        └──► run_pipeline (orchestrator)
│  transcribe_with_faster_whisper ─┐                                  │
│  transcribe_to_srt (HTTP) ────────┴──► parse_subtitles              │
│                                                                     │
│  extract_audio (ffmpeg) ──► input.wav ──► transcribe                │
└─────────────────────────────────────────────────────────────────────┘
```

## Pipeline (mode: `autoedit`)

1. **Pick the SRT** — either the user passes `srt_path` (or `srt_text`),
   or the plugin auto-detects an existing SRT next to the video, or
   transcribes from scratch.
2. **Transcribe (if needed)** — either via the local GPU
   (`faster-whisper` large-v3 on RTX 5060, float16) or via the
   configured HTTP Whisper endpoint. Output is an SRT file.
3. **Parse** — `parse_subtitles` → list of `Cue` dataclasses.
4. **Build segments** — `build_segments` finds runs of cues whose gaps
   are ≤ 1.2 s, adds 300 ms lead-in and 450 ms tail, drops any segment
   shorter than 850 ms. Yields a list of `Segment`.
5. **Build markers** — `build_markers` produces two kinds:
   - `cut` markers: one before each segment, one after
   - `suggestion` markers: lines matching highlight keywords
     ("boss", "spawn", "rare", "wait", "wow", "let's go", etc.)
     or ending in `!` / `?`
6. **Render** — `render_autocut`:
   - Extracts audio (ffmpeg)
   - Cuts each segment (ffmpeg, `-c copy` for speed)
   - Concatenates segments with concat demuxer
   - Re-encodes to libx264 CRF 18 / AAC 192k for the final cut
7. **Write plan** — `run_pipeline` writes a JSON plan with all of
   the above so the run is reproducible.

## GPU transcription

`faster-whisper` is a CTranslate2-based reimplementation of Whisper
that is much faster than the reference implementation, especially on
CUDA. The library adds a small shim, `_ensure_cublas12_on_path()`, that
calls `os.add_dll_directory` on the `nvidia-cublas-cu12` site-packages
dir **before** `ctranslate2` is imported. This works around the
`cublas64_12.dll is not found or cannot be loaded` error that occurs
when `torch 2.12+cu130` (which ships cublas v13) is the only CUDA
runtime on the box.

If the `nvidia-cublas-cu12` package isn't installed, the shim searches
`site-packages/nvidia/cublas/bin/` for `cublas64_12.dll` and registers
it. If the file isn't there, it raises a clear error: "Install
`nvidia-cublas-cu12` or load cublas 12 from a CUDA 12.x toolkit."

## Modes

| Mode | Markers | Segments | Render |
|---|---|---|---|
| `automark` | yes | yes | **no** |
| `autocut` | no | yes | yes |
| `autoedit` | yes | yes | yes |

`automark` is for previewing cuts (cheap, no ffmpeg render) and for
importing markers into Premiere / DaVinci / OBS. The CSV output is
keyframe-friendly: `HH:MM:SS.mmm` start / end, type, and the cue text.

## Performance

Recorded on the developer's RTX 5060 (8 GB, sm_120):

| Step | Time | Notes |
|---|---|---|
| Audio extract (10:08 mp4 → 19 MB wav) | 1.2 s | ffmpeg |
| Whisper large-v3 float16 | 47.3 s | ~12.8× realtime |
| Build segments + markers | 0.1 s | pure Python |
| Cut (2 segments) | 0.5 s | ffmpeg `-c copy` |
| Concat + re-encode (libx264 CRF 18) | 3:18 | slowest step |
| **Total** | **5:06** | 1.43 GB MP4 → 296 MB cut |

The re-encode dominates. For faster renders, drop to `CRF 23` or
`-preset veryfast` (≈3× faster, slightly larger output).
