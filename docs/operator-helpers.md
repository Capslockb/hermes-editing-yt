# Operator helpers

The operator-friendly surface of hermes-editing-yt is the set of MCP tools and the skill doc that make the editing pipeline discoverable, safe, and easy to drive from any Hermes agent.

## Current status

| Helper | Status | Notes |
|---|---|---|
| `server_info` | Working | Health/version/config snapshot. |
| `list_videos` / `list_subtitles` | Working | Recursively discover inputs. |
| `parse_srt_text` / `build_segments_from_srt` | Working | Pure preview tools. |
| `automark` / `autocut` / `autoedit` | Working | Full pipeline modes. |
| Skill doc (`skills/hermes-editing-yt/SKILL.md`) | Working | Copied to Hermes skills dir by the installer. |
| Batch runner | Planned | Not yet implemented. |
| GUI timeline editor | Research | No code. |

## What it adds

1. **Discovery tools** — agents can list videos and subtitles on disk instead of guessing paths.
2. **Pure preview tools** — `parse_srt_text` and `build_segments_from_srt` let an agent preview cuts before committing to a long ffmpeg/Whisper run.
3. **Three depth levels** — `automark` (plan only), `autocut` (render), `autoedit` (full bundle).
4. **Skill doc** — a structured prompt block that Hermes loads automatically when the tools are discovered.

## Wire into the plugin

The oneshot installer does this automatically. To do it manually:

```bash
# 1. Install the Python deps
python3 -m pip install -r plugin/requirements.txt

# 2. Copy the skill doc into Hermes
mkdir -p ~/.local/share/hermes/skills/media/hermes-editing-yt
cp skills/hermes-editing-yt/SKILL.md ~/.local/share/hermes/skills/media/hermes-editing-yt/

# 3. Register the MCP server
hermes mcp add hermes-editing-yt \
    --command "$(which python3)" \
    --args "$(pwd)/plugin/mcp_server.py"

# 4. Restart the gateway
hermes gateway restart
```

On Windows, adjust the paths and use the absolute Python executable.

## Safety contract

- All paths are resolved with `Path.expanduser().resolve()` before any I/O.
- The server never writes outside the configured output directory.
- `render_segments` refuses empty segment lists.
- The HTTP Whisper tool returns a JSON `error` object instead of crashing if the server is unreachable.
- GPU transcription falls back to CPU float32 if CUDA init fails.

## Example use

### Preview cuts from an existing SRT

```text
User: Use hermes-editing-yt to preview a cut plan from
       /home/caps/videos/Helgstr1.srt for a 600 second video

Agent: mcp_hermes-editing-yt_build_segments_from_srt(
         text=<file contents>,
         duration_seconds=600)
```

### Full autocut with local GPU

```text
User: Use hermes-editing-yt to autoedit
       /home/caps/videos/Helgstr1.mp4
       to /home/caps/output/gpu-cut

Agent: mcp_hermes-editing-yt_autoedit(
         video_path="/home/caps/videos/Helgstr1.mp4",
         output_dir="/home/caps/output/gpu-cut",
         whisper_model="large-v3",
         whisper_device="cuda",
         whisper_compute_type="float16")
```

## Cross-exam checks before release

- [ ] `hermes mcp list` shows `hermes-editing-yt` with 11 tools.
- [ ] `hermes mcp test hermes-editing-yt` returns `ffmpeg_available: true`.
- [ ] `parse_srt_text` returns the expected cue count for a known SRT.
- [ ] `build_segments_from_srt` returns at least two cut markers per segment.
- [ ] `automark` on a test video writes `*_automark_plan.json`, `*_automark_segments.csv`, and `*_automark_markers.csv`.
- [ ] The skill doc is present in the Hermes skills directory.

## What this is not

- It is not a fully automated YouTube publishing pipeline.
- It is not a visual/video-frame editor — all decisions come from subtitles.
- It is not a multi-user SaaS — it runs locally on one GPU.
