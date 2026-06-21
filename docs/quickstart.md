# Quickstart

Five commands, two minutes — from clone to your first MCP call.

## Install

### Requirements

- Python 3.10+
- ffmpeg + ffprobe on PATH
- Optional but recommended: CUDA-capable GPU (RTX 5060 verified) with cuBLAS 12 + cuDNN
- `hermes-agent` CLI if you want automatic MCP registration

### One-shot installers

**Windows (PowerShell):**
```powershell
iwr -useb https://raw.githubusercontent.com/Capslockb/hermes-editing-yt/main/installer/install.ps1 | iex
```

**Linux / macOS (bash):**
```bash
curl -sSL https://raw.githubusercontent.com/Capslockb/hermes-editing-yt/main/installer/install.sh | bash
```

### TUI install from a local clone

```bash
git clone https://github.com/Capslockb/hermes-editing-yt.git
cd hermes-editing-yt
python3 -m pip install -r plugin/requirements.txt
python3 installer/install.py
```

### Non-interactive / CI install

```bash
git clone https://github.com/Capslockb/hermes-editing-yt.git
cd hermes-editing-yt
python3 -m pip install -r plugin/requirements.txt
python3 installer/install.py --non-interactive
```

## First session

After install, the plugin is registered as `hermes-editing-yt` in Hermes. Open any Hermes chat and ask:

```text
Use the hermes-editing-yt MCP tools to autocut /path/to/video.mp4
with output to /path/to/output/my-first-cut
```

If you already have an SRT next to the video, the pipeline will use it. If not, it will transcribe with the local GPU Whisper (default: `large-v3`, CUDA, float16).

To preview cuts without rendering, use the pure helper:

```text
Use hermes-editing-yt build_segments_from_srt to preview cuts from
<srt_text> for a video 600 seconds long
```

## Verify

Run the release checklist locally:

```bash
# Static syntax
python3 -m py_compile plugin/*.py scripts/*.py

# Unit tests
python3 -m pytest tests/test_hermes_editing_yt.py -q

# MCP server smoke (11 tools)
python3 tests/test_mcp_server.py

# Installer dry-run
python3 installer/install.py --non-interactive --skip-deps

# Hermes registration
hermes mcp test hermes-editing-yt
```

You should see version `1.0.0`, `ffmpeg_available: true`, and all 11 tools listed.

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `Required binary not available: ffmpeg` | ffmpeg is not on PATH. | `winget install Gyan.FFmpeg` (Windows), `brew install ffmpeg` (macOS), `sudo apt install ffmpeg` (Debian/Ubuntu). |
| `Library cublas64_12.dll is not found` | PyTorch ships cublas v13 but ctranslate2 needs v12. | `pip install nvidia-cublas-cu12`. |
| `hermes mcp add` fails silently | The CLI prompts "Enable all tools?" and EOF cancels it. | In CI, pipe `y`: `echo "y" | hermes mcp add hermes-editing-yt --command ... --args ...`. |
| `Whisper server is not reachable` | You passed `transcribe_backend="http"` but no server is running. | Use `transcribe_backend="faster-whisper"` for local GPU, or start your own Whisper server. |
| Windows paths look broken in chat | Hermes sometimes strips backslashes from chat paths. | Wrap paths in double quotes or provide them as explicit tool arguments. |

## Next

- Read the full pipeline design in [`architecture.md`](architecture.md).
- Browse the 11 MCP tools in [`mcp-tools.md`](mcp-tools.md).
- Tune defaults in [`env-vars.md`](env-vars.md).
- If something fails, see [`troubleshooting.md`](troubleshooting.md).
