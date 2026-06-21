# Troubleshooting

## `cublas64_12.dll is not found or cannot be loaded`

PyTorch 2.12+cu130 ships `cublas64_13.dll` only, but `ctranslate2` (the engine `faster-whisper` uses) is built against CUDA 12.x and wants `cublas64_12.dll`.

**Fix:** install the `nvidia-cublas-cu12` wheel:

```bash
pip install nvidia-cublas-cu12
```

The library's `_ensure_cublas12_on_path()` helper scans `site-packages/nvidia/cublas/bin/` for the DLL and registers it via `os.add_dll_directory()` before `ctranslate2` imports. So you do **not** need to add it to your system PATH.

If the wheel isn't installable in your environment, drop a `cublas64_12.dll` from a CUDA 12.x toolkit into the directory where Python is running.

## `ffmpeg not found`

The plugin shells out to ffmpeg for audio extraction, cut, and concat. ffmpeg is **not** a pip dependency — it must be on PATH.

- Windows: `winget install Gyan.FFmpeg` or `choco install ffmpeg`
- Debian/Ubuntu: `sudo apt install ffmpeg`
- Fedora: `sudo dnf install ffmpeg`
- macOS: `brew install ffmpeg`

`require_ffmpeg()` raises `EditingYtError("Required binary not available: ...")` with a clear message.

## `Whisper server is not reachable` (HTTP backend)

`whisper_transcribe` posts to `HERMES_EDITING_YT_WHISPER_URL` (default: `http://127.0.0.1:51746/transcribe`). If that endpoint is down, the tool returns an `error` JSON envelope — not a crash.

**Fix options:**

1. Start your own Whisper server (e.g. `whisper-server` from whisper.cpp, or `faster-whisper-server`).
2. Use `gpu_transcribe` or pass `transcribe_backend="faster-whisper"` to skip the HTTP hop.
3. Pass an existing SRT and set `transcribe_backend="none"`.

## `hermes` CLI not on PATH

The installer tries to call `hermes mcp add hermes-editing-yt` to register the plugin. If the CLI is missing, the install still completes but prints a warning. Register manually:

```bash
hermes mcp add hermes-editing-yt \
    --command "$(which python3)" \
    --args "$(pwd)/plugin/mcp_server.py"
```

## `gpu_transcribe` hangs the smoke test

The smoke test validates the `gpu_transcribe` tool schema rather than calling it live — a fake WAV would hang in CTranslate2's audio loader. The real GPU path is exercised by `scripts/run_gpu_demo.py` with a real video.

## Tests pass locally but fail on another machine

The MCP smoke test sets `HERMES_EDITING_YT_OUTPUT_DIR` to a temporary directory. If you see path-related failures, check that `HERMES_EDITING_YT_OUTPUT_DIR` is not being inherited from your shell and pointing at a non-existent path.

## Render is much slower than expected

Three knobs in order of impact:

1. **CRF** — `CRF 18` is visually lossless. `CRF 23` is the libx264 default and ~2× faster. `CRF 28` is fine for a YouTube upload.
2. **Preset** — `medium` is the default. `veryfast` is 5-8× faster but larger output. `slow` is 2-3× slower, slightly smaller.
3. **Hardware encode** — on NVIDIA, add `-c:v h264_nvenc` instead of `libx264` for ~10× speed (loss of CRF fine-tuning).

## Site shows a grey blank page

If the React site crashes, the `PageErrorBoundary` displays a styled fallback. Check the browser console for a model/texture 404 — make sure the GLB assets are in `site/public/` and that the deploy base path matches `site/next.config.js`.

## Still stuck?

Open an issue with:

- `python3 --version`
- `ffmpeg -version` (first line)
- `nvidia-smi` output (if using GPU)
- The exact tool call or command that failed
- The full error traceback or `error` JSON object
