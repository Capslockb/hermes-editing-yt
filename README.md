# SORA Agent Editor

> Subtitle-driven auto video editor for the OCEANUS pipeline. Hermes MCP plugin with GPU Whisper (large-v3 on RTX 5060), ffmpeg + libx264 rendering, and a oneshot TUI installer.

Turn a 10-minute raw recording into a 9:52 cut with one MCP call. Sora reads your SRT (or transcribes one with the local GPU), finds the spoken segments, drops the dead air, and renders a CRF-18 MP4.

```
  raw.mp4 (10:08)  ──►  SRT (or local GPU large-v3)  ──►  segments  ──►  ffmpeg+libx264
                       (178 cues / 47s on RTX 5060)     (2 keep)        (3:18 render)
                                                                            │
                                                                            ▼
                                                       cut.mp4 (9:51, 296 MB, CRF 18)
```

## ✨ Features

| Capability | What it does |
|---|---|
| **GPU transcription** | `faster-whisper` `large-v3` on RTX 5060, float16. ~12× realtime. `cublas v12` shim baked in for sm_120. |
| **Subtitle-driven cut** | Loads an SRT (or transcribes one), finds speech segments, merges gaps ≤1.2s, drops everything else. |
| **Highlight markers** | Auto-tags "boss", "spawn", "rare", "wait", "wow", "let's go", `!`/`?` lines as suggestion markers. |
| **3 modes** | `automark` (markers + plan only, no render) · `autocut` (render, no markers) · `autoedit` (both). |
| **FastMCP 3.0.2 server** | 11 tools over stdio + StreamableHTTP. Registers as `oceanus` in Hermes. |
| **Oneshot installer** | `curl ... \| bash` (Linux/macOS) or `iwr ... \| iex` (Windows). TUI prompts, unit-test gate, auto-register. |
| **No API keys** | Local GPU. Optional HTTP Whisper endpoint if you already run one. |

## 🚀 Install

### One-shot (Windows)
```powershell
iwr -useb https://raw.githubusercontent.com/Capslockb/sora-agent-editor/main/installer/install.ps1 | iex
```

### One-shot (Linux / macOS)
```bash
curl -sSL https://raw.githubusercontent.com/Capslockb/sora-agent-editor/main/installer/install.sh | bash
```

### TUI installer (interactive)
```bash
git clone https://github.com/Capslockb/sora-agent-editor.git
cd sora-agent-editor
python installer/install.py
```

### Non-interactive (CI / scripted)
```bash
git clone https://github.com/Capslockb/sora-agent-editor.git
cd sora-agent-editor
python installer/install.py --non-interactive
```

### Uninstall
```bash
python installer/install.py --uninstall
```

## 🔧 Requirements

- Python 3.10+
- ffmpeg on PATH
- CUDA-capable GPU recommended (RTX 5060 verified; CPU works for `tiny`/`base`/`small` models)
- `hermes-agent` if you want auto-registration with the MCP gateway

The installer checks for all of these and tells you what's missing.

## 🎬 Usage

### From any Hermes chat
```
Use the oceanus MCP tools to autocut
G:\- OCEANUS\Editing\New folder\Helgstr1.mp4
with output to G:\- OCEANUS\output\my-first-cut
```

### From a script
```python
import subprocess, json
result = subprocess.run(
    ["hermes", "mcp", "call", "oceanus", "autoedit",
     "--video_path", r"G:\- OCEANUS\Editing\New folder\Helgstr1.mp4",
     "--output_dir", r"G:\- OCEANUS\output\my-first-cut"],
    capture_output=True, text=True
)
print(json.loads(result.stdout))
```

### Direct Python API
```python
from plugin import run_pipeline, PipelineConfig
cfg = PipelineConfig(
    video_path=Path("Helgstr1.mp4"),
    output_dir=Path("output"),
    mode="autoedit",
    transcribe_backend="faster-whisper",
    whisper_model="large-v3",
    whisper_device="cuda",
    whisper_compute_type="float16",
)
result = run_pipeline(cfg)
print(f"kept {result.kept_duration_seconds:.1f}s of {result.duration_seconds:.1f}s")
```

## 🔌 The 11 MCP tools

| Tool | Purpose |
|---|---|
| `server_info` | Version, ffmpeg path, Whisper URL, GPU |
| `list_videos` | Glob `*.mp4` / `*.mkv` / `*.mov` under a root |
| `list_subtitles` | Glob `*.srt` / `*.vtt` under a root |
| `parse_srt_text` | Parse SRT text → list of cues (no I/O) |
| `build_segments_from_srt` | Pure SRT → segments + markers (no render) |
| `whisper_transcribe` | HTTP Whisper endpoint → SRT |
| `render_segments` | ffmpeg concat from a segments list |
| `automark` | Markers + plan only, no render |
| `autocut` | Render, no markers |
| `autoedit` | Markers + render |
| `gpu_transcribe` | Local GPU `faster-whisper` → SRT (no HTTP needed) |

## ⚙️ Configuration (env vars)

| Var | Default | Notes |
|---|---|---|
| `OCEANUS_OUTPUT_DIR` | `~/sora-agent-editor-output` | Where autocut/autoedit writes |
| `OCEANUS_WHISPER_URL` | _(empty)_ | External Whisper endpoint. Empty = local GPU |
| `OCEANUS_WHISPER_MODEL` | `large-v3` | `tiny` / `base` / `small` / `medium` / `large-v3` |
| `OCEANUS_WHISPER_DEVICE` | `cuda` | `cpu` if no GPU |
| `OCEANUS_WHISPER_COMPUTE` | `float16` | `float32` / `int8` |

## 🧪 Testing

```bash
pip install pytest
pytest tests/ -q                       # 35 unit tests, ~4s
python tests/test_mcp_server.py        # 11-tool MCP stdio smoke, ~6s
python scripts/run_gpu_demo.py         # full GPU autocut on the bundled demo video
```

## 📁 Repo layout

```
sora-agent-editor/
├── plugin/                     # the library + MCP server (installable)
│   ├── oceanus_autoedit.py     # pure-Python pipeline (no GUI)
│   ├── mcp_server.py           # FastMCP 3.0.2 server, 11 tools
│   ├── plugin.yaml             # Hermes plugin manifest
│   ├── requirements.txt        # pip deps
│   └── __init__.py             # re-exports
├── installer/                  # the oneshot installer
│   ├── install.py              # rich TUI installer (--non-interactive / --uninstall)
│   ├── install.sh              # bash curl-pipe-bash entry
│   └── install.ps1             # PowerShell iwr|iex entry
├── skills/oceanus-autoedit/    # Hermes skill doc
│   └── SKILL.md
├── tests/                      # 35 unit tests + 11-tool MCP smoke
├── scripts/
│   └── run_gpu_demo.py         # end-to-end demo runner
├── docs/                       # architecture, troubleshooting
├── .github/workflows/          # CI: lint + test
├── CHANGELOG.md
├── LICENSE                     # MIT
└── README.md
```

## 🤝 Related repos

- `Capslockb/gemini-live-discord-bridge` — Discord voice bridge (Hermes plugin + oneshot TUI)
- `Capslockb/vapi-discord-bridge` — Vapi.ai Discord bridge
- `Capslockb/tony-stark-hand-control` — the hand-tracking project this was developed alongside of

## 📜 License

MIT — see `LICENSE`.
