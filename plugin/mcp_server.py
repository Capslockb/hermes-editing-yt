"""
oceanus_autoedit MCP server (FastMCP 3.x, stdio transport).

Exposes the OCEANUS autoedit pipeline as a small, focused tool surface so
any MCP client (Hermes Agent, Claude Desktop, Cursor, mcporter, …) can drive
it without touching ffmpeg or the local Whisper server.

Tools
-----
* list_videos(root)            — discover .mp4/.mkv/... under a folder
* list_subtitles(root)         — discover .srt/.vtt under a folder
* parse_srt_text(text)         — parse SRT/VTT into JSON cues (pure, no I/O)
* build_segments_from_srt(...) — build keep-segments + markers JSON (pure)
* autoedit(video, output_dir, …) — full pipeline (audio + srt + render)
* autocut(video, output_dir, …)  — like autoedit but renders too
* automark(video, output_dir, …) — markers + plan, no render
* whisper_transcribe(wav, out) — POST a wav to the local Whisper server
* server_info()                — health/version/config snapshot

Run with stdio transport (the default for Hermes Agent):

    python mcp_server.py

Or to start a debug HTTP endpoint on 127.0.0.1:8765:

    python mcp_server.py --http 8765
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Make sure the sibling library module is importable when launched as
# `python mcp_server.py` from the tools/video_workflow/ directory.
_THIS_DIR = Path(__file__).resolve().parent
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))

import oceanus_autoedit as lib  # noqa: E402

try:
    from fastmcp import FastMCP
except ImportError as exc:  # pragma: no cover
    print("ERROR: fastmcp is required. Install with: pip install fastmcp", file=sys.stderr)
    raise SystemExit(2) from exc


SERVER_NAME = "oceanus-autoedit"
SERVER_VERSION = "1.0.0"
SERVER_INSTRUCTIONS = (
    "OCEANUS autoedit — subtitle-driven video editor. Use list_videos/list_subtitles "
    "to discover inputs, parse_srt_text/build_segments_from_srt to preview cuts, "
    "and autoedit/autocut/automark to run the full ffmpeg+Whisper pipeline. "
    "All paths are absolute. The default output root is configurable via the "
    "OCEANUS_OUTPUT_DIR env var. Whisper URL via OCEANUS_WHISPER_URL."
)

mcp = FastMCP(name=SERVER_NAME, instructions=SERVER_INSTRUCTIONS)


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #

def _to_json(payload: Any) -> str:
    """Compact JSON for MCP tool results — keeps token cost down."""
    return json.dumps(payload, default=_json_default, ensure_ascii=False)


def _json_default(obj: Any) -> Any:
    if isinstance(obj, Path):
        return str(obj)
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    return str(obj)


def _segment_dicts(segs) -> List[Dict[str, Any]]:
    return [
        {
            "start_seconds": round(s.start, 3),
            "end_seconds": round(s.end, 3),
            "start_srt": lib.format_seconds(s.start),
            "end_srt": lib.format_seconds(s.end),
            "reason": s.reason,
            "source_indexes": list(s.source_indexes),
        }
        for s in segs
    ]


def _marker_dicts(markers) -> List[Dict[str, Any]]:
    return [
        {
            "time_seconds": round(m.time, 3),
            "time_srt": lib.format_seconds(m.time),
            "label": m.label,
            "marker_type": m.marker_type,
            "source_index": m.source_index,
        }
        for m in markers
    ]


def _result_summary(result: lib.PipelineResult) -> Dict[str, Any]:
    summary = {
        "mode": result.mode,
        "video": str(result.video),
        "output_dir": str(result.output_dir),
        "duration_seconds": result.duration_seconds,
        "audio_only_mp3": str(result.audio_only_mp3),
        "whisper_input_wav": str(result.whisper_input_wav),
        "srt": str(result.srt),
        "plan_path": str(result.plan_path) if result.plan_path else None,
        "segments_csv": str(result.segments_csv) if result.segments_csv else None,
        "markers_csv": str(result.markers_csv) if result.markers_csv else None,
        "rendered_video": str(result.rendered_video) if result.rendered_video else None,
        "segment_count": len(result.keep_segments),
        "marker_count": len(result.markers),
        "kept_duration_seconds": round(
            sum(max(0.0, s.end - s.start) for s in result.keep_segments), 3
        ),
    }
    if result.transcription:
        summary["transcription"] = {
            "model": result.transcription.model,
            "device": result.transcription.device,
            "compute_type": result.transcription.compute_type,
            "language": result.transcription.language,
            "segment_count": result.transcription.segment_count,
            "elapsed_seconds": result.transcription.elapsed_seconds,
        }
    return summary


# --------------------------------------------------------------------------- #
# Pure tools (no ffmpeg)                                                      #
# --------------------------------------------------------------------------- #

@mcp.tool()
def list_videos(root: str) -> str:
    """Recursively list video files under `root`. Returns JSON: {root, count, files:[{path,size_mb,mtime}]}."""
    base = Path(root).expanduser().resolve()
    if not base.is_dir():
        return _to_json({"error": f"not_a_directory: {base}", "files": [], "count": 0})
    files = []
    for p in sorted(base.rglob("*")):
        if p.is_file() and lib.is_video(p):
            try:
                stat = p.stat()
                files.append({
                    "path": str(p),
                    "name": p.name,
                    "size_mb": round(stat.st_size / 1024 / 1024, 2),
                    "mtime": stat.st_mtime,
                })
            except OSError:
                continue
    return _to_json({"root": str(base), "count": len(files), "files": files})


@mcp.tool()
def list_subtitles(root: str) -> str:
    """Recursively list .srt/.vtt under `root`. Returns JSON: {root, count, files:[{path,size_bytes}]}."""
    base = Path(root).expanduser().resolve()
    if not base.is_dir():
        return _to_json({"error": f"not_a_directory: {base}", "files": [], "count": 0})
    files = []
    for p in sorted(base.rglob("*")):
        if p.is_file() and lib.is_subtitle(p):
            try:
                files.append({
                    "path": str(p),
                    "name": p.name,
                    "size_bytes": p.stat().st_size,
                })
            except OSError:
                continue
    return _to_json({"root": str(base), "count": len(files), "files": files})


@mcp.tool()
def parse_srt_text(text: str) -> str:
    """Parse SRT or WebVTT text into JSON cues. Pure function — no I/O.

    Returns JSON: {count, cues:[{index,start,end,text}]}.
    Raises a JSON error object if the text is empty/unparseable.
    """
    try:
        cues = lib.parse_subtitles(text)
        return _to_json({
            "count": len(cues),
            "cues": [
                {"index": c.index, "start": c.start, "end": c.end, "text": c.text}
                for c in cues
            ],
        })
    except lib.OceanusError as exc:
        return _to_json({"error": str(exc), "count": 0, "cues": []})


@mcp.tool()
def build_segments_from_srt(
    text: str,
    duration_seconds: float,
    lead_in: float = lib.LEAD_IN_SECONDS,
    tail_out: float = lib.TAIL_OUT_SECONDS,
    merge_gap: float = lib.MERGE_GAP_SECONDS,
    min_segment: float = lib.MIN_SEGMENT_SECONDS,
) -> str:
    """Build keep-segments + markers from SRT/VTT text + known duration.

    Pure function — no ffmpeg, no I/O. Useful for previewing cuts before
    running the full pipeline. Returns JSON with cues, segments, markers.
    """
    try:
        cues = lib.parse_subtitles(text)
        segments = lib.build_segments(
            cues, duration_seconds,
            lead_in=lead_in, tail_out=tail_out,
            merge_gap=merge_gap, min_segment=min_segment,
        )
        markers = lib.build_markers(cues, segments)
        return _to_json({
            "duration_seconds": duration_seconds,
            "cue_count": len(cues),
            "segment_count": len(segments),
            "marker_count": len(markers),
            "kept_duration_seconds": round(
                sum(max(0.0, s.end - s.start) for s in segments), 3
            ),
            "segments": _segment_dicts(segments),
            "markers": _marker_dicts(markers),
        })
    except lib.OceanusError as exc:
        return _to_json({"error": str(exc)})


# --------------------------------------------------------------------------- #
# Whisper / render tools                                                      #
# --------------------------------------------------------------------------- #

@mcp.tool()
def whisper_transcribe(wav_path: str, output_srt_path: str, url: Optional[str] = None) -> str:
    """POST a 16kHz mono WAV to the local Whisper server and save the SRT.

    `url` defaults to OCEANUS_WHISPER_URL or http://127.0.0.1:51746/transcribe.
    Returns JSON: {srt_path, byte_count, server_url}.
    """
    try:
        wav = Path(wav_path).expanduser().resolve()
        out = Path(output_srt_path).expanduser().resolve()
        if not wav.exists():
            return _to_json({"error": f"wav_not_found: {wav}"})
        used_url = url or lib.WHISPER_URL
        written = lib.transcribe_to_srt(wav, out, url=used_url)
        return _to_json({
            "srt_path": str(written),
            "byte_count": written.stat().st_size,
            "server_url": used_url,
        })
    except lib.OceanusError as exc:
        return _to_json({"error": str(exc)})


@mcp.tool()
def render_segments(
    video_path: str,
    output_mp4_path: str,
    segments_json: str,
    video_codec: str = lib.RENDER_VIDEO_CODEC,
    preset: str = lib.RENDER_PRESET,
    crf: int = lib.RENDER_CRF,
    audio_codec: str = lib.RENDER_AUDIO_CODEC,
    audio_bitrate: str = lib.RENDER_AUDIO_BITRATE,
) -> str:
    """Render the keep-segments from a JSON list into a single MP4.

    `segments_json` should be a JSON array of {start, end} in seconds —
    the same shape returned by `build_segments_from_srt`.
    """
    try:
        v = Path(video_path).expanduser().resolve()
        if not v.exists():
            return _to_json({"error": f"video_not_found: {v}"})
        seg_specs = json.loads(segments_json)
        if not isinstance(seg_specs, list) or not seg_specs:
            return _to_json({"error": "segments_json must be a non-empty JSON array"})
        segments = [
            lib.Segment(
                start=float(s["start"]),
                end=float(s["end"]),
                reason="user_supplied",
                source_indexes=list(s.get("source_indexes", [])),
            )
            for s in seg_specs
        ]
        config = lib.PipelineConfig(
            render_video_codec=video_codec, render_preset=preset, render_crf=crf,
            render_audio_codec=audio_codec, render_audio_bitrate=audio_bitrate,
        )
        out = Path(output_mp4_path).expanduser().resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        written = lib.render_autocut(v, out, segments, config=config)
        return _to_json({
            "output_mp4": str(written),
            "size_mb": round(written.stat().st_size / 1024 / 1024, 2),
            "segment_count": len(segments),
        })
    except lib.OceanusError as exc:
        return _to_json({"error": str(exc)})
    except (KeyError, TypeError, ValueError) as exc:
        return _to_json({"error": f"invalid_segments_json: {exc}"})


# --------------------------------------------------------------------------- #
# Pipeline tools                                                              #
# --------------------------------------------------------------------------- #

def _run_pipeline_tool(
    mode: str,
    video_path: str,
    output_dir: str,
    srt_path: Optional[str] = None,
    whisper_url: Optional[str] = None,
    transcribe_backend: Optional[str] = None,
    whisper_model: Optional[str] = None,
    whisper_device: Optional[str] = None,
    whisper_compute_type: Optional[str] = None,
    whisper_language: Optional[str] = None,
    whisper_beam_size: Optional[int] = None,
    lead_in: float = lib.LEAD_IN_SECONDS,
    tail_out: float = lib.TAIL_OUT_SECONDS,
    merge_gap: float = lib.MERGE_GAP_SECONDS,
    min_segment: float = lib.MIN_SEGMENT_SECONDS,
) -> str:
    try:
        v = Path(video_path).expanduser().resolve()
        out = Path(output_dir).expanduser().resolve()
        srt = Path(srt_path).expanduser().resolve() if srt_path else None
        # Start from the defaults (so env-var defaults still apply), then
        # override per-call args only when the caller actually supplied them.
        config = lib.PipelineConfig(
            lead_in=lead_in, tail_out=tail_out,
            merge_gap=merge_gap, min_segment=min_segment,
        )
        if transcribe_backend is not None:
            config.transcribe_backend = transcribe_backend
        if whisper_model is not None:
            config.whisper_model = whisper_model
        if whisper_device is not None:
            config.whisper_device = whisper_device
        if whisper_compute_type is not None:
            config.whisper_compute_type = whisper_compute_type
        if whisper_language is not None:
            config.whisper_language = whisper_language
        if whisper_beam_size is not None:
            config.whisper_beam_size = whisper_beam_size

        result = lib.run_pipeline(
            mode=mode, video_path=v, output_dir=out,
            srt_path=srt, config=config,
            whisper_url=whisper_url or lib.WHISPER_URL,
        )
        return _to_json(_result_summary(result))
    except lib.OceanusError as exc:
        return _to_json({"error": str(exc), "mode": mode})


@mcp.tool()
def automark(
    video_path: str,
    output_dir: str,
    srt_path: Optional[str] = None,
    whisper_url: Optional[str] = None,
    transcribe_backend: Optional[str] = None,
    whisper_model: Optional[str] = None,
    whisper_device: Optional[str] = None,
    whisper_compute_type: Optional[str] = None,
    whisper_language: Optional[str] = None,
    whisper_beam_size: Optional[int] = None,
    lead_in: float = lib.LEAD_IN_SECONDS,
    tail_out: float = lib.TAIL_OUT_SECONDS,
    merge_gap: float = lib.MERGE_GAP_SECONDS,
    min_segment: float = lib.MIN_SEGMENT_SECONDS,
) -> str:
    """Run the pipeline in 'automark' mode: audio + SRT + plan + CSVs (no render).

    Transcription backend: pass `transcribe_backend="faster-whisper"` (default
    if no SRT exists) for local GPU Whisper, or `"http"` for a remote
    Whisper server. Override `whisper_model` (e.g. `"large-v3"`, `"medium"`,
    `"small"`) and `whisper_device` (`"cuda"` / `"cpu"`) per call.
    """
    return _run_pipeline_tool(
        "automark", video_path, output_dir, srt_path, whisper_url,
        transcribe_backend, whisper_model, whisper_device, whisper_compute_type,
        whisper_language, whisper_beam_size,
        lead_in, tail_out, merge_gap, min_segment,
    )


@mcp.tool()
def autocut(
    video_path: str,
    output_dir: str,
    srt_path: Optional[str] = None,
    whisper_url: Optional[str] = None,
    transcribe_backend: Optional[str] = None,
    whisper_model: Optional[str] = None,
    whisper_device: Optional[str] = None,
    whisper_compute_type: Optional[str] = None,
    whisper_language: Optional[str] = None,
    whisper_beam_size: Optional[int] = None,
    lead_in: float = lib.LEAD_IN_SECONDS,
    tail_out: float = lib.TAIL_OUT_SECONDS,
    merge_gap: float = lib.MERGE_GAP_SECONDS,
    min_segment: float = lib.MIN_SEGMENT_SECONDS,
) -> str:
    """Run the pipeline in 'autocut' mode: automark + render MP4.

    If no SRT exists, transcribes with the local GPU (faster-whisper large-v3
    on CUDA float16) unless `transcribe_backend="http"` is passed.
    """
    return _run_pipeline_tool(
        "autocut", video_path, output_dir, srt_path, whisper_url,
        transcribe_backend, whisper_model, whisper_device, whisper_compute_type,
        whisper_language, whisper_beam_size,
        lead_in, tail_out, merge_gap, min_segment,
    )


@mcp.tool()
def autoedit(
    video_path: str,
    output_dir: str,
    srt_path: Optional[str] = None,
    whisper_url: Optional[str] = None,
    transcribe_backend: Optional[str] = None,
    whisper_model: Optional[str] = None,
    whisper_device: Optional[str] = None,
    whisper_compute_type: Optional[str] = None,
    whisper_language: Optional[str] = None,
    whisper_beam_size: Optional[int] = None,
    lead_in: float = lib.LEAD_IN_SECONDS,
    tail_out: float = lib.TAIL_OUT_SECONDS,
    merge_gap: float = lib.MERGE_GAP_SECONDS,
    min_segment: float = lib.MIN_SEGMENT_SECONDS,
) -> str:
    """Run the pipeline in 'autoedit' mode: same as autocut (full export bundle)."""
    return _run_pipeline_tool(
        "autoedit", video_path, output_dir, srt_path, whisper_url,
        transcribe_backend, whisper_model, whisper_device, whisper_compute_type,
        whisper_language, whisper_beam_size,
        lead_in, tail_out, merge_gap, min_segment,
    )


@mcp.tool()
def gpu_transcribe(
    wav_path: str,
    output_srt_path: str,
    model: str = "large-v3",
    device: str = "cuda",
    compute_type: str = "float16",
    language: Optional[str] = None,
    beam_size: int = 5,
) -> str:
    """Transcribe a 16kHz mono WAV to SRT using local GPU faster-whisper (CTranslate2).

    Default model is `large-v3` on CUDA float16. The model is loaded once
    per (model, device, compute_type) tuple and cached for the lifetime of
    the MCP server, so subsequent calls skip the multi-second model load.

    Returns JSON: {srt_path, segment_count, duration_seconds, model, device,
    compute_type, language, elapsed_seconds}.

    Falls back to CPU float32 if CUDA init fails (e.g. missing cuDNN).
    """
    try:
        wav = Path(wav_path).expanduser().resolve()
        out = Path(output_srt_path).expanduser().resolve()
        if not wav.exists():
            return _to_json({"error": f"wav_not_found: {wav}"})
        result = lib.transcribe_with_faster_whisper(
            wav, model=model, device=device, compute_type=compute_type,
            language=language, beam_size=beam_size,
        )
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(result.srt_text, encoding="utf-8")
        return _to_json({
            "srt_path": str(out),
            "byte_count": out.stat().st_size,
            "segment_count": result.segment_count,
            "duration_seconds": result.duration_seconds,
            "model": result.model,
            "device": result.device,
            "compute_type": result.compute_type,
            "language": result.language,
            "elapsed_seconds": result.elapsed_seconds,
        })
    except lib.OceanusError as exc:
        return _to_json({"error": str(exc)})


@mcp.tool()
def server_info() -> str:
    """Return a JSON snapshot of the server: version, default paths, ffmpeg/Whisper health."""
    ffmpeg_ok = False
    ffprobe_ok = False
    try:
        lib.require_ffmpeg()
        ffmpeg_ok = ffprobe_ok = True
    except lib.OceanusError:
        pass
    return _to_json({
        "server": SERVER_NAME,
        "version": SERVER_VERSION,
        "fastmcp": getattr(__import__("fastmcp"), "__version__", "?"),
        "default_output_dir": str(lib.DEFAULT_OUTPUT),
        "default_raw_dir": str(lib.DEFAULT_RAW_FOLDER),
        "whisper_url": lib.WHISPER_URL,
        "ffmpeg_available": ffmpeg_ok,
        "ffprobe_available": ffprobe_ok,
        "video_extensions": sorted(lib.VIDEO_EXTENSIONS),
        "subtitle_extensions": sorted(lib.SRT_EXTENSIONS),
        "highlight_keywords": list(lib.HIGHLIGHT_KEYWORDS),
        "segmentation_defaults": {
            "lead_in": lib.LEAD_IN_SECONDS,
            "tail_out": lib.TAIL_OUT_SECONDS,
            "merge_gap": lib.MERGE_GAP_SECONDS,
            "min_segment": lib.MIN_SEGMENT_SECONDS,
        },
        "render_defaults": {
            "video_codec": lib.RENDER_VIDEO_CODEC,
            "preset": lib.RENDER_PRESET,
            "crf": lib.RENDER_CRF,
            "audio_codec": lib.RENDER_AUDIO_CODEC,
            "audio_bitrate": lib.RENDER_AUDIO_BITRATE,
        },
        "env_overrides": {
            "OCEANUS_WHISPER_URL": os.environ.get("OCEANUS_WHISPER_URL"),
            "OCEANUS_OUTPUT_DIR": os.environ.get("OCEANUS_OUTPUT_DIR"),
            "OCEANUS_RAW_DIR": os.environ.get("OCEANUS_RAW_DIR"),
        },
    })


# --------------------------------------------------------------------------- #
# Entry point                                                                 #
# --------------------------------------------------------------------------- #

def _parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="OCEANUS autoedit MCP server")
    parser.add_argument(
        "--http", type=int, default=None, metavar="PORT",
        help="Run as HTTP/StreamableHTTP server on PORT (default: stdio)",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = _parse_args(argv)
    if args.http:
        # StreamableHTTP transport for browser-based MCP clients.
        mcp.run(transport="http", host="127.0.0.1", port=args.http)
    else:
        mcp.run(transport="stdio")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
