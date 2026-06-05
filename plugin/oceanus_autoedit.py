"""
oceanus_autoedit — subtitle-driven auto video editor (library + CLI).

Refactored from the original `auto_video_workflow.py` so the same logic is
exposed as:

  * A clean importable library  (parse_srt, build_segments, build_markers,
    extract_audio, render_autocut, run_pipeline, …)
  * A backwards-compatible CLI (preserves the previous argparse UX)
  * A FastMCP server surface    (see `mcp_server.py`)

Defaults are now config-driven (env vars / keyword args) instead of the
hardcoded `G:\\- OCEANUS` paths. The CLI still defaults to the original
OCEANUS layout so existing scripts keep working.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable, List, Optional, Sequence


# --------------------------------------------------------------------------- #
# Configuration                                                               #
# --------------------------------------------------------------------------- #

WHISPER_URL: str = os.environ.get("OCEANUS_WHISPER_URL", "http://127.0.0.1:51746/transcribe")
DEFAULT_OUTPUT: Path = Path(os.environ.get("OCEANUS_OUTPUT_DIR", r"G:\- OCEANUS\output"))
DEFAULT_RAW_FOLDER: Path = Path(os.environ.get("OCEANUS_RAW_DIR", r"G:\- OCEANUS\Unedited (RAW)"))

VIDEO_EXTENSIONS = {".mp4", ".mkv", ".mov", ".avi", ".m4v", ".webm"}
SRT_EXTENSIONS = {".srt", ".vtt"}

# Segmentation knobs (configurable per-call for the MCP tool)
LEAD_IN_SECONDS: float = 0.30
TAIL_OUT_SECONDS: float = 0.45
MERGE_GAP_SECONDS: float = 1.20
MIN_SEGMENT_SECONDS: float = 0.85

# Render knobs
RENDER_VIDEO_CODEC: str = "libx264"
RENDER_PRESET: str = "medium"
RENDER_CRF: int = 18
RENDER_AUDIO_CODEC: str = "aac"
RENDER_AUDIO_BITRATE: str = "192k"

HIGHLIGHT_KEYWORDS: tuple[str, ...] = (
    "boss", "spawn", "rare", "legendary", "died", "death", "killed",
    "what", "wait", "wow", "no way", "lets go", "let's go",
    "insane", "crazy", "finally",
)


# --------------------------------------------------------------------------- #
# Data classes                                                                #
# --------------------------------------------------------------------------- #

@dataclass
class Cue:
    index: int
    start: float
    end: float
    text: str


@dataclass
class Segment:
    start: float
    end: float
    reason: str
    source_indexes: List[int] = field(default_factory=list)


@dataclass
class Marker:
    time: float
    label: str
    marker_type: str
    source_index: Optional[int] = None


@dataclass
class PipelineConfig:
    """All knobs the pipeline needs. Pre-baked from env / CLI / MCP args."""
    lead_in: float = LEAD_IN_SECONDS
    tail_out: float = TAIL_OUT_SECONDS
    merge_gap: float = MERGE_GAP_SECONDS
    min_segment: float = MIN_SEGMENT_SECONDS
    highlight_keywords: tuple[str, ...] = HIGHLIGHT_KEYWORDS
    render_video_codec: str = RENDER_VIDEO_CODEC
    render_preset: str = RENDER_PRESET
    render_crf: int = RENDER_CRF
    render_audio_codec: str = RENDER_AUDIO_CODEC
    render_audio_bitrate: str = RENDER_AUDIO_BITRATE
    # Transcription backend: "faster-whisper" (local GPU) or "http" (legacy Whisper server).
    transcribe_backend: str = "faster-whisper"
    # faster-whisper model args
    whisper_model: str = os.environ.get("OCEANUS_WHISPER_MODEL", "large-v3")
    whisper_device: str = os.environ.get("OCEANUS_WHISPER_DEVICE", "cuda")
    whisper_compute_type: str = os.environ.get("OCEANUS_WHISPER_COMPUTE", "float16")
    whisper_language: Optional[str] = os.environ.get("OCEANUS_WHISPER_LANG") or None
    whisper_beam_size: int = int(os.environ.get("OCEANUS_WHISPER_BEAM", "5"))


@dataclass
class PipelineResult:
    mode: str
    video: Path
    output_dir: Path
    duration_seconds: float
    audio_only_mp3: Path
    whisper_input_wav: Path
    srt: Path
    keep_segments: List[Segment]
    markers: List[Marker]
    rendered_video: Optional[Path] = None
    plan_path: Optional[Path] = None
    segments_csv: Optional[Path] = None
    markers_csv: Optional[Path] = None
    transcription: Optional["TranscriptionResult"] = None  # populated when GPU backend runs


# --------------------------------------------------------------------------- #
# Errors                                                                      #
# --------------------------------------------------------------------------- #

class OceanusError(RuntimeError):
    """Raised for any user-facing pipeline failure (clean message, no traceback)."""


# Lazy-loaded faster-whisper model cache. Keyed by (model_name, device,
# compute_type) so swapping models mid-session triggers a reload.
_FW_MODEL_CACHE: Dict[str, Any] = {}


def _ensure_cublas12_on_path() -> None:
    """Add the nvidia-cublas-cu12 bin dir to the DLL search path on Windows.

    PyTorch 2.12+cu130 ships cublas64_13.dll, but ctranslate2 (the
    faster-whisper engine) is built against CUDA 12 and asks for
    cublas64_12.dll. The pip package `nvidia-cublas-cu12` ships the
    matching DLL under `site-packages/nvidia/cublas/bin/` — but Windows
    doesn't search that path by default, so we have to register it.
    Safe to call multiple times; cheap (one os.add_dll_directory).
    """
    if sys.platform != "win32":
        return
    import os
    import site

    candidates: list[str] = []
    # 1) If `nvidia.cublas` is importable, use its __file__.
    try:
        import nvidia.cublas  # type: ignore
        cublas_init = getattr(nvidia.cublas, "__file__", None)
        if cublas_init:
            candidates.append(os.path.join(os.path.dirname(cublas_init), "bin"))
    except Exception:
        pass
    # 2) Fallback: scan known site-packages roots.
    roots: list[str] = []
    try:
        roots.extend(site.getsitepackages())
    except Exception:
        pass
    try:
        user_site = site.getusersitepackages()
        if user_site:
            roots.append(user_site)
    except Exception:
        pass
    # 3) The current Python's prefix (handles venvs + custom installs).
    if sys.prefix:
        roots.append(os.path.join(sys.prefix, "Lib", "site-packages"))
    for root in roots:
        candidates.append(os.path.join(root, "nvidia", "cublas", "bin"))

    for d in candidates:
        if d and os.path.isdir(d):
            try:
                os.add_dll_directory(d)
            except (AttributeError, OSError):
                pass
            if d not in os.environ.get("PATH", ""):
                os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", "")
            return


# --------------------------------------------------------------------------- #
# Low-level helpers                                                           #
# --------------------------------------------------------------------------- #

def run_cmd(command: Sequence[str]) -> subprocess.CompletedProcess:
    return subprocess.run(list(command), capture_output=True, text=True, check=False)


def require_ffmpeg() -> None:
    for binary in ("ffmpeg", "ffprobe"):
        result = run_cmd([binary, "-version"])
        if result.returncode != 0:
            raise OceanusError(f"Required binary not available: {binary}")


def parse_timecode(value: str) -> float:
    """Parse `HH:MM:SS,mmm` (SRT) or `HH:MM:SS.mmm` (VTT) timecode to seconds."""
    hours, minutes, seconds = value.replace(",", ".").split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def format_seconds(value: float) -> str:
    """Format seconds as `HH:MM:SS,mmm` SRT timecode."""
    value = max(0.0, value)
    hours = int(value // 3600)
    minutes = int((value % 3600) // 60)
    seconds = value % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:06.3f}".replace(".", ",")


def is_video(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTENSIONS


def is_subtitle(path: Path) -> bool:
    return path.suffix.lower() in SRT_EXTENSIONS


# --------------------------------------------------------------------------- #
# SRT / VTT parsing                                                           #
# --------------------------------------------------------------------------- #

_VTT_TIMESTAMP_LINE = re.compile(r"^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}")


def _strip_vtt_cue_settings(line: str) -> str:
    """Drop VTT cue settings (the part after the second timestamp)."""
    return line.split(" ", 3)[0:2] if False else line  # placeholder; not used


def parse_subtitles(text: str) -> List[Cue]:
    """Parse SRT or WebVTT into a list of Cue. WebVTT cue settings are tolerated."""
    text = text.lstrip("\ufeff")
    # Strip a leading WEBVTT header if present.
    if text.startswith("WEBVTT"):
        text = re.sub(r"^WEBVTT[^\n]*\n", "", text, count=1)
    blocks = re.split(r"\r?\n\r?\n", text.strip())
    cues: List[Cue] = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        # Find the timestamp line (skip optional cue identifier).
        ts_index: Optional[int] = None
        for i, line in enumerate(lines):
            if "-->" in line:
                ts_index = i
                break
        if ts_index is None:
            continue
        # Strip VTT cue settings after the second timestamp.
        ts_line = lines[ts_index]
        ts_line = re.split(r"\s+", ts_line.strip(), maxsplit=2)[0:2]
        if len(ts_line) < 2:
            continue
        start_raw, end_raw = [part.strip() for part in ts_line[0].split("-->") + [ts_line[1]]]
        # Re-extract cleanly.
        parts = re.split(r"\s*-->\s*", lines[ts_index])
        if len(parts) < 2:
            continue
        start_raw, end_raw = parts[0].strip(), parts[1].strip()
        # Drop VTT cue settings after end timecode.
        end_raw = re.split(r"\s+", end_raw, maxsplit=1)[0]
        try:
            start = parse_timecode(start_raw)
            end = parse_timecode(end_raw)
        except (ValueError, IndexError):
            continue
        text_lines = [ln for ln in lines[ts_index + 1:] if ln and not ln.startswith("NOTE")]
        cue_text = " ".join(text_lines).strip()
        if not cue_text:
            continue
        # SRT index = first line if it's a bare integer; otherwise auto-assign.
        if ts_index == 1 and lines[0].isdigit():
            index = int(lines[0])
        else:
            index = len(cues) + 1
        cues.append(Cue(index=index, start=start, end=end, text=cue_text))
    if not cues:
        raise OceanusError("No subtitle cues could be parsed from the input.")
    return cues


# Backwards-compat alias (the original used `parse_srt`).
def parse_srt(srt_text: str) -> List[Cue]:
    return parse_subtitles(srt_text)


# --------------------------------------------------------------------------- #
# Segment / marker construction                                               #
# --------------------------------------------------------------------------- #

def build_segments(
    cues: List[Cue],
    duration: float,
    *,
    lead_in: float = LEAD_IN_SECONDS,
    tail_out: float = TAIL_OUT_SECONDS,
    merge_gap: float = MERGE_GAP_SECONDS,
    min_segment: float = MIN_SEGMENT_SECONDS,
) -> List[Segment]:
    """Pad each cue, merge neighbours closer than `merge_gap`, clamp to `duration`."""
    segments: List[Segment] = []
    for cue in cues:
        start = max(0.0, cue.start - lead_in)
        end = min(duration, cue.end + tail_out)
        if end - start < min_segment:
            pad = (min_segment - (end - start)) / 2
            start = max(0.0, start - pad)
            end = min(duration, end + pad)
        if segments and start - segments[-1].end <= merge_gap:
            segments[-1].end = max(segments[-1].end, end)
            segments[-1].source_indexes.append(cue.index)
            continue
        segments.append(Segment(start=start, end=end, reason="subtitle_activity", source_indexes=[cue.index]))
    return segments


def build_markers(
    cues: List[Cue],
    segments: List[Segment],
    *,
    highlight_keywords: Sequence[str] = HIGHLIGHT_KEYWORDS,
) -> List[Marker]:
    """Cut markers from segments + highlight markers from emphatic/keyword cues."""
    markers: List[Marker] = []
    for segment in segments:
        markers.append(Marker(
            time=segment.start, label="AUTO CUT START",
            marker_type="cut", source_index=segment.source_indexes[0],
        ))
        markers.append(Marker(
            time=segment.end, label="AUTO CUT END",
            marker_type="cut", source_index=segment.source_indexes[-1],
        ))
    keywords_lower = tuple(k.lower() for k in highlight_keywords)
    for cue in cues:
        lowered = cue.text.lower()
        if any(k in lowered for k in keywords_lower) or "!" in cue.text or "?" in cue.text:
            snippet = cue.text[:72].strip() or "Highlight"
            markers.append(Marker(
                time=cue.start, label=snippet,
                marker_type="suggestion", source_index=cue.index,
            ))
    markers.sort(key=lambda item: item.time)
    return markers


# --------------------------------------------------------------------------- #
# ffprobe / ffmpeg wrappers                                                   #
# --------------------------------------------------------------------------- #

def get_duration(video_path: Path) -> float:
    result = run_cmd([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(video_path),
    ])
    if result.returncode != 0:
        raise OceanusError(result.stderr.strip() or f"Unable to read video duration: {video_path}")
    try:
        return float(result.stdout.strip())
    except ValueError as exc:
        raise OceanusError(f"ffprobe returned non-numeric duration: {result.stdout!r}") from exc


def extract_audio(video_path: Path, output_dir: Path, stem: str) -> tuple[Path, Path]:
    """Produce a 44.1kHz stereo MP3 (delivery) + 16kHz mono WAV (Whisper input)."""
    output_dir.mkdir(parents=True, exist_ok=True)
    mp3_path = output_dir / f"{stem}_audio_only.mp3"
    wav_path = output_dir / f"{stem}_whisper_input.wav"
    if not mp3_path.exists():
        result = run_cmd([
            "ffmpeg", "-y", "-i", str(video_path),
            "-vn", "-ac", "2", "-ar", "44100", str(mp3_path),
        ])
        if result.returncode != 0:
            raise OceanusError(result.stderr.strip() or "Audio extraction failed.")
    if not wav_path.exists():
        result = run_cmd([
            "ffmpeg", "-y", "-i", str(video_path),
            "-vn", "-ac", "1", "-ar", "16000", str(wav_path),
        ])
        if result.returncode != 0:
            raise OceanusError(result.stderr.strip() or "Whisper WAV extraction failed.")
    return mp3_path, wav_path


def render_autocut(
    video_path: Path,
    output_path: Path,
    segments: Sequence[Segment],
    *,
    config: PipelineConfig,
) -> Path:
    """Render only the keep-segments, concatenated into `output_path`."""
    if not segments:
        raise OceanusError("No keep segments were generated, nothing to render.")
    with tempfile.TemporaryDirectory(prefix="oceanus_segments_") as temp_dir:
        temp_root = Path(temp_dir)
        segment_paths: List[Path] = []
        for idx, segment in enumerate(segments, start=1):
            segment_path = temp_root / f"segment_{idx:03d}.mp4"
            result = run_cmd([
                "ffmpeg", "-y",
                "-ss", f"{segment.start:.3f}",
                "-to", f"{segment.end:.3f}",
                "-i", str(video_path),
                "-c:v", config.render_video_codec,
                "-preset", config.render_preset,
                "-crf", str(config.render_crf),
                "-c:a", config.render_audio_codec,
                "-b:a", config.render_audio_bitrate,
                str(segment_path),
            ])
            if result.returncode != 0:
                raise OceanusError(result.stderr.strip() or f"Failed to render segment {idx}.")
            segment_paths.append(segment_path)

        concat_file = temp_root / "concat.txt"
        concat_file.write_text(
            "\n".join(f"file '{p.as_posix()}'" for p in segment_paths) + "\n",
            encoding="utf-8",
        )
        result = run_cmd([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_file), "-c", "copy", str(output_path),
        ])
        if result.returncode != 0:
            raise OceanusError(result.stderr.strip() or "Final concat render failed.")
    return output_path


# --------------------------------------------------------------------------- #
# Whisper / SRT discovery                                                     #
# --------------------------------------------------------------------------- #

def _encode_multipart(file_path: Path, field_name: str = "file", format_name: str = "srt") -> tuple[bytes, str]:
    boundary = f"----OceanusBoundary{uuid.uuid4().hex}"
    mime_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    with file_path.open("rb") as handle:
        payload = handle.read()
    parts = [
        f"--{boundary}\r\n".encode(),
        f'Content-Disposition: form-data; name="{field_name}"; filename="{file_path.name}"\r\n'.encode(),
        f"Content-Type: {mime_type}\r\n\r\n".encode(),
        payload,
        b"\r\n",
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="format"\r\n\r\n',
        format_name.encode(),
        b"\r\n",
        f"--{boundary}--\r\n".encode(),
    ]
    return b"".join(parts), boundary


@dataclass
class TranscriptionResult:
    """Side info returned by the GPU transcription path."""
    srt_text: str
    segment_count: int
    duration_seconds: float
    model: str
    device: str
    compute_type: str
    language: Optional[str] = None
    elapsed_seconds: float = 0.0


def transcribe_with_faster_whisper(
    wav_path: Path,
    *,
    model: str = "large-v3",
    device: str = "cuda",
    compute_type: str = "float16",
    language: Optional[str] = None,
    beam_size: int = 5,
) -> TranscriptionResult:
    """Local GPU transcription via faster-whisper (CTranslate2 engine).

    Returns a TranscriptionResult whose `.srt_text` is ready to be written
    to disk and parsed. Falls back to CPU float32 if `device == "cpu"` is
    requested (and CUDA is unavailable).

    The Whisper model is lazy-loaded on first call and cached at module
    level (`_FW_MODEL_CACHE`) so repeated pipeline runs don't pay the
    model-load tax each time.

    Raises OceanusError on missing dependency, unreadable audio, or
    transcription failure.
    """
    import time as _time

    # Register the nvidia-cublas-cu12 bin dir BEFORE the import below —
    # otherwise ctranslate2 (transitively loaded by faster_whisper) fails
    # with "Library cublas64_12.dll is not found" on systems where torch
    # ships cublas64_13.dll.
    _ensure_cublas12_on_path()

    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise OceanusError(
            "faster-whisper is not installed. Run: pip install faster-whisper"
        ) from exc

    # Belt-and-suspenders: re-register after the import in case ctranslate2
    # resolved its DLLs lazily. This is a no-op when the path is already
    # on the search list.
    _ensure_cublas12_on_path()

    wav_path = wav_path.expanduser().resolve()
    if not wav_path.exists():
        raise OceanusError(f"WAV not found: {wav_path}")

    cache_key = (model, device, compute_type)
    t0 = _time.perf_counter()
    if _FW_MODEL_CACHE.get("key") != cache_key:
        try:
            model_obj = WhisperModel(model, device=device, compute_type=compute_type)
        except Exception as exc:
            # Auto-fallback: cuda failed → retry on CPU float32 (e.g. no cuDNN).
            if device != "cpu":
                try:
                    model_obj = WhisperModel(model, device="cpu", compute_type="float32")
                    device = "cpu"
                    compute_type = "float32"
                except Exception as exc2:
                    raise OceanusError(
                        f"faster-whisper load failed on {device}/{compute_type} "
                        f"({exc}) and CPU fallback also failed ({exc2})"
                    ) from exc2
            else:
                raise OceanusError(f"faster-whisper load failed: {exc}") from exc
        _FW_MODEL_CACHE["key"] = cache_key
        _FW_MODEL_CACHE["model"] = model_obj
    model_obj = _FW_MODEL_CACHE["model"]

    try:
        segments_iter, info = model_obj.transcribe(
            str(wav_path),
            beam_size=beam_size,
            language=language,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
        )
        # Materialize generator → list (we need segment_count + SRT bytes).
        segments = list(segments_iter)
    except Exception as exc:
        raise OceanusError(f"faster-whisper transcription failed: {exc}") from exc

    # Build SRT in memory. faster-whisper segments are 0-indexed, with
    # `.start`, `.end` (float seconds), `.text` (str), `.words` (optional).
    lines: List[str] = []
    for idx, seg in enumerate(segments, start=1):
        lines.append(str(idx))
        lines.append(f"{format_seconds(seg.start)} --> {format_seconds(seg.end)}")
        lines.append(seg.text.strip())
        lines.append("")  # blank separator
    srt_text = "\n".join(lines).rstrip() + "\n"

    elapsed = _time.perf_counter() - t0
    return TranscriptionResult(
        srt_text=srt_text,
        segment_count=len(segments),
        duration_seconds=float(getattr(info, "duration", 0.0)) or 0.0,
        model=model,
        device=device,
        compute_type=compute_type,
        language=getattr(info, "language", language),
        elapsed_seconds=round(elapsed, 3),
    )


def transcribe_to_srt(
    wav_path: Path,
    srt_path: Path,
    *,
    url: str = WHISPER_URL,
    timeout: float = 3600.0,
) -> Path:
    """POST the WAV to a local Whisper server and persist the returned SRT."""
    body, boundary = _encode_multipart(wav_path)
    request = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise OceanusError(f"Whisper server request failed: {detail or exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise OceanusError(
            "Whisper server is not reachable. Start it or pass an existing --srt."
        ) from exc
    text = payload.get("text", "").strip() if isinstance(payload, dict) else ""
    if not text:
        raise OceanusError("Whisper server returned an empty transcript.")
    srt_path.parent.mkdir(parents=True, exist_ok=True)
    srt_path.write_text(text + "\n", encoding="utf-8")
    return srt_path


def choose_existing_srt(
    video_path: Path,
    output_dir: Path,
    stem: str,
    provided_srt: Optional[Path],
) -> Path:
    if provided_srt:
        return provided_srt.resolve()
    candidates = [
        output_dir / f"{stem}.srt",
        output_dir / f"{stem}_captions.srt",
        video_path.with_suffix(".srt"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    return (output_dir / f"{stem}.srt").resolve()


# --------------------------------------------------------------------------- #
# Output writers                                                              #
# --------------------------------------------------------------------------- #

def write_csv(path: Path, rows: List[dict]) -> None:
    if not rows:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_plan(result: PipelineResult, plan_path: Path) -> Path:
    plan_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "mode": result.mode,
        "video": str(result.video),
        "output_dir": str(result.output_dir),
        "duration_seconds": result.duration_seconds,
        "audio_only_mp3": str(result.audio_only_mp3),
        "whisper_input_wav": str(result.whisper_input_wav),
        "srt": str(result.srt),
        "keep_segments": [asdict(seg) for seg in result.keep_segments],
        "markers": [asdict(m) for m in result.markers],
    }
    if result.rendered_video:
        payload["rendered_video"] = str(result.rendered_video)
    if result.transcription:
        payload["transcription"] = {
            "model": result.transcription.model,
            "device": result.transcription.device,
            "compute_type": result.transcription.compute_type,
            "language": result.transcription.language,
            "segment_count": result.transcription.segment_count,
            "elapsed_seconds": result.transcription.elapsed_seconds,
        }
    plan_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return plan_path


# --------------------------------------------------------------------------- #
# Top-level pipeline                                                           #
# --------------------------------------------------------------------------- #

def safe_stem(video_path: Path) -> str:
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", video_path.stem).strip("._") or "video"
    return stem


def run_pipeline(
    *,
    mode: str,
    video_path: Path,
    output_dir: Path,
    srt_path: Optional[Path] = None,
    config: Optional[PipelineConfig] = None,
    whisper_url: str = WHISPER_URL,
) -> PipelineResult:
    """End-to-end: extract audio → obtain SRT → build segments/markers → optionally render.

    Transcription backend is selected by `config.transcribe_backend`:
      * "faster-whisper" (default) — local GPU via CTranslate2, no network.
      * "http"                     — POST the WAV to a remote Whisper server.
      * "none"                     — caller must provide `srt_path`; pipeline
                                     will not attempt to transcribe.
    """
    if mode not in {"automark", "autocut", "autoedit"}:
        raise OceanusError(f"Unknown mode: {mode!r} (use automark/autocut/autoedit)")
    video_path = video_path.resolve()
    if not video_path.exists():
        raise OceanusError(f"Video not found: {video_path}")
    if not is_video(video_path):
        raise OceanusError(f"Unsupported video type: {video_path.suffix}")
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    config = config or PipelineConfig()
    require_ffmpeg()
    duration = get_duration(video_path)
    stem = safe_stem(video_path)
    audio_mp3, whisper_wav = extract_audio(video_path, output_dir, stem)

    chosen_srt = choose_existing_srt(video_path, output_dir, stem, srt_path)
    transcription: Optional[TranscriptionResult] = None

    if not chosen_srt.exists():
        if config.transcribe_backend == "faster-whisper":
            transcription = transcribe_with_faster_whisper(
                whisper_wav,
                model=config.whisper_model,
                device=config.whisper_device,
                compute_type=config.whisper_compute_type,
                language=config.whisper_language,
                beam_size=config.whisper_beam_size,
            )
            chosen_srt.parent.mkdir(parents=True, exist_ok=True)
            chosen_srt.write_text(transcription.srt_text, encoding="utf-8")
        elif config.transcribe_backend == "http":
            chosen_srt = transcribe_to_srt(whisper_wav, chosen_srt, url=whisper_url)
        else:  # "none" or any other value → surface clear error
            raise OceanusError(
                f"No SRT found at {chosen_srt} and transcribe_backend="
                f"{config.transcribe_backend!r} cannot produce one. "
                f"Pass srt_path=... or set transcribe_backend='faster-whisper'/'http'."
            )
    else:
        # If the SRT is outside the output dir, mirror it in for the bundle.
        bundled = (output_dir / f"{stem}.srt").resolve()
        if chosen_srt.resolve() != bundled:
            bundled.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(chosen_srt, bundled)
            chosen_srt = bundled

    cues = parse_subtitles(chosen_srt.read_text(encoding="utf-8", errors="ignore"))
    segments = build_segments(
        cues, duration,
        lead_in=config.lead_in, tail_out=config.tail_out,
        merge_gap=config.merge_gap, min_segment=config.min_segment,
    )
    markers = build_markers(cues, segments, highlight_keywords=config.highlight_keywords)

    result = PipelineResult(
        mode=mode, video=video_path, output_dir=output_dir,
        duration_seconds=duration,
        audio_only_mp3=audio_mp3, whisper_input_wav=whisper_wav, srt=chosen_srt,
        keep_segments=segments, markers=markers,
        transcription=transcription,
    )

    plan_path = output_dir / f"{stem}_{mode}_plan.json"
    segments_csv = output_dir / f"{stem}_{mode}_segments.csv"
    markers_csv = output_dir / f"{stem}_{mode}_markers.csv"

    result.plan_path = write_plan(result, plan_path)
    result.segments_csv = segments_csv
    result.markers_csv = markers_csv
    write_csv(segments_csv, [
        {
            "start_seconds": round(seg.start, 3),
            "end_seconds": round(seg.end, 3),
            "start_srt": format_seconds(seg.start),
            "end_srt": format_seconds(seg.end),
            "reason": seg.reason,
            "source_indexes": ",".join(str(i) for i in seg.source_indexes),
        }
        for seg in segments
    ])
    write_csv(markers_csv, [
        {
            "time_seconds": round(m.time, 3),
            "time_srt": format_seconds(m.time),
            "label": m.label,
            "marker_type": m.marker_type,
            "source_index": m.source_index or "",
        }
        for m in markers
    ])

    if mode in {"autocut", "autoedit"}:
        render_path = output_dir / f"{stem}_{mode}.mp4"
        result.rendered_video = render_autocut(video_path, render_path, segments, config=config)

    return result


# --------------------------------------------------------------------------- #
# CLI (preserved for backwards compat)                                        #
# --------------------------------------------------------------------------- #

def _ask_path(prompt: str, default: Optional[Path] = None, must_exist: bool = True) -> Path:
    suffix = f" [{default}]" if default else ""
    while True:
        raw = input(f"{prompt}{suffix}: ").strip().strip('"')
        if not raw and default is not None:
            candidate = default
        else:
            candidate = Path(raw).expanduser()
        if must_exist and not candidate.exists():
            print(f"Path not found: {candidate}")
            continue
        return candidate.resolve()


def _ask_mode(initial: Optional[str]) -> str:
    if initial:
        return initial.lower()
    while True:
        value = input("Mode (automark/autocut/autoedit): ").strip().lower()
        if value in {"automark", "autocut", "autoedit"}:
            return value
        print("Enter automark, autocut, or autoedit.")


def main(argv: Optional[Iterable[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Subtitle-driven autoedit workflow")
    parser.add_argument("mode", nargs="?", choices=["automark", "autocut", "autoedit"])
    parser.add_argument("--video", dest="video")
    parser.add_argument("--output-dir", dest="output_dir")
    parser.add_argument("--srt", dest="srt")
    parser.add_argument("--raw-folder", dest="raw_folder")
    parser.add_argument("--whisper-url", dest="whisper_url", default=WHISPER_URL)
    args = parser.parse_args(list(argv) if argv is not None else None)

    require_ffmpeg()
    mode = _ask_mode(args.mode)
    video_path = Path(args.video).resolve() if args.video else _ask_path("Exact source video file")
    if not is_video(video_path):
        raise OceanusError(f"Unsupported video type: {video_path.suffix}")
    raw_folder_default = video_path.parent
    confirmed_raw = Path(args.raw_folder).resolve() if args.raw_folder else _ask_path(
        "Confirm raw footage folder", default=raw_folder_default,
    )
    if confirmed_raw != video_path.parent.resolve():
        print(f"Note: source file is in {video_path.parent.resolve()}, confirmation folder is {confirmed_raw}")
    output_dir = Path(args.output_dir).resolve() if args.output_dir else _ask_path(
        "Output folder for audio, SRT, plan, and render",
        default=DEFAULT_OUTPUT, must_exist=False,
    )

    result = run_pipeline(
        mode=mode, video_path=video_path, output_dir=output_dir,
        srt_path=Path(args.srt) if args.srt else None,
        whisper_url=args.whisper_url,
    )
    print(f"Mode: {result.mode}")
    print(f"Video: {result.video}")
    print(f"Output: {result.output_dir}")
    print("Saved artifacts:")
    print(f"- Audio only: {result.audio_only_mp3}")
    print(f"- Whisper WAV: {result.whisper_input_wav}")
    print(f"- SRT: {result.srt}")
    print(f"- Plan JSON: {result.plan_path}")
    print(f"- Segments CSV: {result.segments_csv}")
    print(f"- Markers CSV: {result.markers_csv}")
    if result.rendered_video:
        print(f"- Rendered video: {result.rendered_video}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Cancelled by user.")
        raise SystemExit(130)
    except OceanusError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
