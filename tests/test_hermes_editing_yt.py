"""
Unit tests for the hermes_editing_yt library. Pure functions only — no ffmpeg,
no filesystem, no network. Use pytest.

    python -m pytest tests/test_hermes_editing_yt.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Make the library importable when running from anywhere.
LIB_DIR = Path(__file__).resolve().parent.parent / "plugin"
if str(LIB_DIR) not in sys.path:
    sys.path.insert(0, str(LIB_DIR))

import hermes_editing_yt as lib  # noqa: E402


# --------------------------------------------------------------------------- #
# Fixtures                                                                    #
# --------------------------------------------------------------------------- #

SAMPLE_SRT = """\
1
00:00:01,000 --> 00:00:03,500
Welcome back to the channel, friends.

2
00:00:04,200 --> 00:00:05,800
Today we're going boss hunting.

3
00:00:06,000 --> 00:00:06,500
Let's go!

4
00:00:10,000 --> 00:00:12,000
That was insane, what just happened.

5
00:00:30,000 --> 00:00:32,000
Final thoughts on the run.
"""

SAMPLE_WEBVTT = """\
WEBVTT

00:00:01.000 --> 00:00:03.500
Welcome back to the channel, friends.

00:00:04.200 --> 00:00:05.800
Today we're going boss hunting.
"""


# --------------------------------------------------------------------------- #
# Time formatting                                                             #
# --------------------------------------------------------------------------- #

class TestFormatSeconds:
    @pytest.mark.parametrize("value,expected", [
        (0.0, "00:00:00,000"),
        (1.5, "00:00:01,500"),
        (61.25, "00:01:01,250"),
        (3661.123, "01:01:01,123"),
        (7200.0, "02:00:00,000"),
    ])
    def test_known_values(self, value, expected):
        assert lib.format_seconds(value) == expected

    def test_negative_clamps_to_zero(self):
        assert lib.format_seconds(-5.0) == "00:00:00,000"


class TestParseTimecode:
    @pytest.mark.parametrize("value,expected", [
        ("00:00:01,000", 1.0),
        ("00:00:01.500", 1.5),
        ("00:01:01,250", 61.25),
        ("01:01:01,123", 3661.123),
    ])
    def test_round_trip(self, value, expected):
        assert lib.parse_timecode(value) == pytest.approx(expected, abs=1e-6)

    def test_format_then_parse_is_identity(self):
        for v in [0.0, 1.5, 61.25, 3661.123, 7200.0]:
            assert lib.parse_timecode(lib.format_seconds(v)) == pytest.approx(v, abs=1e-3)


# --------------------------------------------------------------------------- #
# Subtitle parsing                                                            #
# --------------------------------------------------------------------------- #

class TestParseSrt:
    def test_basic_srt(self):
        cues = lib.parse_srt(SAMPLE_SRT)
        assert len(cues) == 5
        assert cues[0].index == 1
        assert cues[0].start == 1.0
        assert cues[0].end == 3.5
        assert "Welcome back" in cues[0].text
        assert cues[2].text == "Let's go!"

    def test_webvtt_header_stripped(self):
        cues = lib.parse_srt(SAMPLE_WEBVTT)
        assert len(cues) == 2
        assert cues[0].start == 1.0
        assert cues[1].text.startswith("Today")

    def test_vtt_cue_settings_tolerated(self):
        # VTT often includes settings like `align:start line:90%` after the
        # end timecode — we should still parse the cue.
        text = (
            "WEBVTT\n\n"
            "00:00:01.000 --> 00:00:02.000 align:start position:0%\n"
            "Hello world.\n\n"
            "00:00:03.000 --> 00:00:04.000\n"
            "Second cue.\n"
        )
        cues = lib.parse_srt(text)
        assert len(cues) == 2
        assert cues[0].text == "Hello world."

    def test_empty_raises(self):
        with pytest.raises(lib.EditingYtError):
            lib.parse_srt("")

    def test_garbage_raises(self):
        with pytest.raises(lib.EditingYtError):
            lib.parse_srt("this is not a subtitle file at all\n\nfoo bar\n")

    def test_unicode_text_preserved(self):
        text = "1\n00:00:01,000 --> 00:00:02,000\nHéllo, wörld! 🎬\n"
        cues = lib.parse_srt(text)
        assert cues[0].text == "Héllo, wörld! 🎬"


# --------------------------------------------------------------------------- #
# Segment construction                                                        #
# --------------------------------------------------------------------------- #

class TestBuildSegments:
    def test_basic_padding(self):
        cues = lib.parse_srt(SAMPLE_SRT)
        segs = lib.build_segments(cues, 60.0)
        # Cue 1: 1.0–3.5 → 0.7–3.95. Then cues 2 and 3 (≤ 1.2s gaps) merge in.
        assert segs[0].start == pytest.approx(0.7, abs=1e-3)
        assert segs[0].end >= 3.95  # merged with cues 2 and 3
        assert 1 in segs[0].source_indexes

    def test_merge_nearby_cues(self):
        # Cues 1, 2, 3 are all within the 1.2s merge_gap → one segment.
        cues = lib.parse_srt(SAMPLE_SRT)
        segs = lib.build_segments(cues, 60.0)
        assert 1 in segs[0].source_indexes
        assert 2 in segs[0].source_indexes
        assert segs[0].end >= 6.95  # extends through cue 3's tail

    def test_separate_far_cues(self):
        # Cues 4 and 5 are 30 - 12 = 18s apart → two segments.
        cues = lib.parse_srt(SAMPLE_SRT)
        segs = lib.build_segments(cues, 60.0)
        assert 4 in segs[-2].source_indexes
        assert 5 in segs[-1].source_indexes

    def test_min_segment_enforced(self):
        # A 200ms cue with default lead/tail should still hit MIN_SEGMENT.
        cues = [lib.Cue(index=1, start=10.0, end=10.2, text="tiny")]
        segs = lib.build_segments(cues, 20.0)
        assert (segs[0].end - segs[0].start) >= lib.MIN_SEGMENT_SECONDS - 1e-6

    def test_clamp_to_duration(self):
        cues = [lib.Cue(index=1, start=58.0, end=62.0, text="overhang")]
        segs = lib.build_segments(cues, 60.0)
        assert segs[0].end == 60.0

    def test_custom_knobs_respected(self):
        cues = [lib.Cue(index=1, start=10.0, end=11.0, text="x")]
        segs = lib.build_segments(cues, 20.0, lead_in=1.0, tail_out=1.0)
        assert segs[0].start == 9.0
        assert segs[0].end == 12.0


# --------------------------------------------------------------------------- #
# Marker construction                                                         #
# --------------------------------------------------------------------------- #

class TestBuildMarkers:
    def test_cut_markers_per_segment(self):
        cues = lib.parse_srt(SAMPLE_SRT)
        segs = lib.build_segments(cues, 60.0)
        markers = lib.build_markers(cues, segs)
        cut_starts = [m for m in markers if m.label == "AUTO CUT START"]
        cut_ends = [m for m in markers if m.label == "AUTO CUT END"]
        assert len(cut_starts) == len(segs)
        assert len(cut_ends) == len(segs)

    def test_highlight_keyword(self):
        cues = lib.parse_srt(SAMPLE_SRT)
        segs = lib.build_segments(cues, 60.0)
        markers = lib.build_markers(cues, segs)
        # "boss" → cue 2; "Let's go" → cue 3; "insane" → cue 4
        suggestions = [m for m in markers if m.marker_type == "suggestion"]
        assert any("boss" in m.label.lower() for m in suggestions)
        assert any("let's go" in m.label.lower() for m in suggestions)
        assert any("insane" in m.label.lower() for m in suggestions)

    def test_punctuation_triggers_highlight(self):
        cues = [lib.Cue(index=1, start=1.0, end=2.0, text="Wait, really?!")]
        segs = lib.build_segments(cues, 10.0)
        markers = lib.build_markers(cues, segs)
        assert any(m.marker_type == "suggestion" for m in markers)

    def test_markers_sorted_by_time(self):
        cues = lib.parse_srt(SAMPLE_SRT)
        segs = lib.build_segments(cues, 60.0)
        markers = lib.build_markers(cues, segs)
        for a, b in zip(markers, markers[1:]):
            assert a.time <= b.time

    def test_custom_keywords(self):
        cues = [lib.Cue(index=1, start=1.0, end=2.0, text="custom-keyword is here")]
        segs = lib.build_segments(cues, 10.0)
        markers = lib.build_markers(cues, segs, highlight_keywords=("custom-keyword",))
        assert any(m.marker_type == "suggestion" for m in markers)


# --------------------------------------------------------------------------- #
# Library-level integration                                                   #
# --------------------------------------------------------------------------- #

class TestHelpers:
    def test_safe_stem_special_chars(self):
        assert lib.safe_stem(Path("Helgstr1 (1).mp4")) == "Helgstr1_1"
        assert lib.safe_stem(Path("...")) == "video"

    def test_is_video(self):
        assert lib.is_video(Path("a.mp4"))
        assert lib.is_video(Path("A.MKV"))
        assert not lib.is_video(Path("a.txt"))

    def test_is_subtitle(self):
        assert lib.is_subtitle(Path("a.srt"))
        assert lib.is_subtitle(Path("a.vtt"))
        assert not lib.is_subtitle(Path("a.mp4"))

    def test_pipeline_config_defaults_match_constants(self):
        cfg = lib.PipelineConfig()
        assert cfg.lead_in == lib.LEAD_IN_SECONDS
        assert cfg.tail_out == lib.TAIL_OUT_SECONDS
        assert cfg.merge_gap == lib.MERGE_GAP_SECONDS
        assert cfg.min_segment == lib.MIN_SEGMENT_SECONDS
        assert cfg.highlight_keywords == lib.HIGHLIGHT_KEYWORDS
        assert cfg.render_crf == lib.RENDER_CRF

    def test_pipeline_config_whisper_defaults(self):
        # The new GPU transcription knobs default to local faster-whisper on
        # CUDA float16 with the large-v3 model. (Env vars can override at
        # construction time, so we don't pin the value — just pin the
        # field existence and types.)
        cfg = lib.PipelineConfig()
        assert cfg.transcribe_backend == "faster-whisper"
        assert isinstance(cfg.whisper_model, str) and cfg.whisper_model
        assert cfg.whisper_device in ("cuda", "cpu")
        assert cfg.whisper_compute_type in ("float16", "float32", "int8", "int8_float16")
        assert isinstance(cfg.whisper_beam_size, int) and cfg.whisper_beam_size > 0

    def test_transcription_result_dataclass(self):
        # The GPU backend returns a TranscriptionResult; verify shape.
        r = lib.TranscriptionResult(
            srt_text="1\n00:00:00,000 --> 00:00:01,000\nhi\n",
            segment_count=1, duration_seconds=1.0,
            model="large-v3", device="cuda", compute_type="float16",
            language="en", elapsed_seconds=0.5,
        )
        assert r.segment_count == 1
        assert r.model == "large-v3"
        assert r.device == "cuda"
        assert r.compute_type == "float16"
        assert r.elapsed_seconds == 0.5

    def test_transcribe_with_faster_whisper_missing_file(self):
        # The lib raises EditingYtError for either: (a) the WAV doesn't exist,
        # or (b) faster-whisper isn't installed in the current env. We
        # accept either error so this test runs in CI (no faster-whisper)
        # and locally (faster-whisper installed, just no WAV).
        with pytest.raises(lib.EditingYtError) as exc_info:
            lib.transcribe_with_faster_whisper(Path("Z:/no/such/file.wav"))
        msg = str(exc_info.value).lower()
        assert (
            "wav not found" in msg
            or "not found" in msg
            or "faster-whisper is not installed" in msg
            or "no such file" in msg
        ), f"unexpected error: {exc_info.value}"


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
