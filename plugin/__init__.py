"""Veo Editor — Hermes MCP plugin entry point.

The plugin is a thin wrapper that re-exports the library surface so that
`import plugin` works for tests. The MCP server (mcp_server.py) is the
process entry point and is started by `hermes mcp add oceanus` or by
the installer.

Tolerant re-exports: if a symbol is renamed/removed in the library in the
future, plugin-level import still succeeds (only the missing name is
dropped from `dir(plugin)`).
"""
from . import oceanus_autoedit as _lib

__version__ = "0.1.0"

_PUBLIC_NAMES = [
    # Data classes
    "Cue",
    "Segment",
    "Marker",
    "PipelineConfig",
    "PipelineResult",
    "TranscriptionResult",
    "OceanusError",
    # Pure functions
    "parse_subtitles",
    "parse_srt",
    "parse_timecode",
    "format_seconds",
    "build_segments",
    "build_markers",
    # Pipeline + I/O
    "extract_audio",
    "get_duration",
    "render_autocut",
    "transcribe_with_faster_whisper",
    "transcribe_to_srt",
    "run_pipeline",
    # CLI back-compat
    "main",
    "require_ffmpeg",
    "is_video",
    "is_subtitle",
    "safe_stem",
    "write_csv",
    "write_plan",
]

__all__ = []
for _name in _PUBLIC_NAMES:
    if hasattr(_lib, _name):
        globals()[_name] = getattr(_lib, _name)
        __all__.append(_name)
    else:
        # Surface a missing-name in the module's repr but don't crash.
        globals()[_name] = None  # type: ignore[assignment]
