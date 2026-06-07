"""
End-to-end GPU autocut on Helgstr1.mp4.
- Extracts audio via ffmpeg
- Transcribes with faster-whisper large-v3 on CUDA float16 (RTX 5060)
- Builds keep-segments + markers from the SRT
- Renders the cut into an MP4

Outputs to: G:\- hermes-editing-yt\output\gpu_helgstr1_test\
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import hermes_editing_yt as lib  # noqa: E402

VIDEO = Path(r"G:\- hermes-editing-yt\Editing\New folder\Helgstr1.mp4")
OUT = Path(r"G:\- hermes-editing-yt\output\gpu_helgstr1_test")


def main() -> int:
    if not VIDEO.exists():
        print(f"FATAL: video not found: {VIDEO}", file=sys.stderr)
        return 2

    OUT.mkdir(parents=True, exist_ok=True)
    print(f"=== Hermes Editing YT GPU autocut on Helgstr1 ===")
    print(f"video:    {VIDEO} ({VIDEO.stat().st_size / 1024**3:.2f} GB)")
    print(f"output:   {OUT}")
    print(f"backend:  faster-whisper large-v3, cuda, float16")
    print()

    config = lib.PipelineConfig(
        transcribe_backend="faster-whisper",
        whisper_model="large-v3",
        whisper_device="cuda",
        whisper_compute_type="float16",
        whisper_beam_size=5,
    )

    t0 = time.perf_counter()
    result = lib.run_pipeline(
        mode="autocut",
        video_path=VIDEO,
        output_dir=OUT,
        config=config,
    )
    elapsed = time.perf_counter() - t0

    summary = {
        "mode": result.mode,
        "video": str(result.video),
        "output_dir": str(result.output_dir),
        "duration_seconds": result.duration_seconds,
        "kept_duration_seconds": round(
            sum(max(0.0, s.end - s.start) for s in result.keep_segments), 3
        ),
        "kept_ratio": round(
            sum(max(0.0, s.end - s.start) for s in result.keep_segments) / max(result.duration_seconds, 1e-6), 3
        ),
        "segment_count": len(result.keep_segments),
        "marker_count": len(result.markers),
        "srt": str(result.srt),
        "rendered_video": str(result.rendered_video) if result.rendered_video else None,
        "rendered_size_mb": round(result.rendered_video.stat().st_size / 1024**2, 2) if result.rendered_video else 0,
        "transcription": {
            "model": result.transcription.model,
            "device": result.transcription.device,
            "compute_type": result.transcription.compute_type,
            "language": result.transcription.language,
            "segment_count": result.transcription.segment_count,
            "elapsed_seconds": result.transcription.elapsed_seconds,
        } if result.transcription else None,
        "total_elapsed_seconds": round(elapsed, 1),
    }

    print()
    print("=== RESULT ===")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
