# Troubleshooting

## `cublas64_12.dll is not found or cannot be loaded`

PyTorch 2.12+cu130 ships `cublas64_13.dll` only, but `ctranslate2`
(the engine `faster-whisper` uses) is built against CUDA 12.x and wants
`cublas64_12.dll`.

**Fix:** install the `nvidia-cublas-cu12` wheel:

```bash
pip install nvidia-cublas-cu12
```

The library's `_ensure_cublas12_on_path()` helper scans
`site-packages/nvidia/cublas/bin/` for the DLL and registers it via
`os.add_dll_directory()` before `ctranslate2` imports. So you do NOT
need to add it to your system PATH.

If the wheel isn't installable in your environment, you can also drop
a `cublas64_12.dll` from a CUDA 12.x toolkit into the directory where
Python is running.

## `ffmpeg not found`

The plugin shells out to ffmpeg for audio extraction, cut, and concat.
ffmpeg is **not** a pip dependency — it must be on PATH.

- Windows: `choco install ffmpeg` or `scoop install ffmpeg`
- Debian/Ubuntu: `sudo apt install ffmpeg`
- Fedora: `sudo dnf install ffmpeg`
- macOS: `brew install ffmpeg`

`require_ffmpeg()` raises `EditingYtError("ffmpeg is not on PATH...")`
with a clear message.

## `Whisper server is not reachable` (HTTP backend)

`whisper_transcribe` posts to `HERMES_EDITING_YT_WHISPER_URL`
(default: `http://127.0.0.1:51746/transcribe`). If that endpoint is
down, the tool returns an `error` JSON envelope — not a crash.

**Fix options:**
1. Start your Whisper server (e.g. `whisper-server` from the
   `whisper-cpp` project, or `faster-whisper-server`).
2. Or just use `gpu_transcribe` (no HTTP needed; uses the local GPU).
3. Or set `transcribe_backend="none"` in the pipeline and pass an
   existing SRT.

## `hermes` CLI not on PATH

The installer tries to call `hermes mcp add hermes-editing-yt` to register the
plugin. If the CLI is missing, the install still completes — it just
prints a warning. You can register manually:

```bash
hermes mcp add hermes-editing-yt \
    --command "$(which python)" \
    --args "$(pwd)/plugin/mcp_server.py"
```

## 11 tools exercise in test, but `gpu_transcribe` hangs the smoke

The smoke test schema-checks the tool rather than calling it live —
a 16-byte fake WAV would hang in CTranslate2's audio loader. The real
GPU path is exercised by `scripts/run_gpu_demo.py`.

## Tests pass locally but fail on Linux/macOS

The Windows-specific paths in the smoke test (`C:\\...`) are guarded
behind `tmp_path` from pytest, so the unit tests are platform-agnostic.
The MCP smoke test does:

```python
env={**os.environ, "HERMES_EDITING_YT_OUTPUT_DIR": str(tmp_path)}
```

If you see path-related failures, check that `HERMES_EDITING_YT_OUTPUT_DIR`
isn't being inherited from your shell and pointing at a Windows path.

## Render is much slower than expected

Three knobs in order of impact:

1. **CRF** — `CRF 18` is visually lossless. `CRF 23` is the libx264
   default and ~2× faster. `CRF 28` is fine for a YouTube upload.
2. **Preset** — `medium` is the default. `veryfast` is 5-8× faster
   but larger output. `slow` is 2-3× slower, slightly smaller.
3. **Hardware decode/encode** — on NVIDIA, add `-c:v h264_nvenc`
   instead of `libx264` for ~10× speed (loss of CRF fine-tuning).
