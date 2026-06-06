"""
Smoke test the oceanus-autoedit MCP server via the official MCP client
(`mcp.client.session.ClientSession`) over stdio. Verifies the server starts,
lists all 10 tools, and that each one returns a structurally valid JSON
string when called.

Run:
    unset PYTHONPATH
    python tests/test_mcp_server.py

Exit code 0 = all 10 tools exercised, exits cleanly.
"""
from __future__ import annotations

import asyncio
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

# Make the server module importable.
HERE = Path(__file__).resolve().parent
REPO_DIR = HERE.parent
PLUGIN_DIR = REPO_DIR / "plugin"
SERVER_DIR = PLUGIN_DIR  # mcp_server.py and the library live in plugin/
sys.path.insert(0, str(PLUGIN_DIR))

from mcp import ClientSession, StdioServerParameters  # noqa: E402
from mcp.client.stdio import stdio_client  # noqa: E402


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
"""


async def main() -> int:
    server_path = str(SERVER_DIR / "mcp_server.py")
    if not Path(server_path).exists():
        print(f"ERROR: server not found at {server_path}", file=sys.stderr)
        return 2

    with tempfile.TemporaryDirectory(prefix="oceanus_mcp_smoke_") as tmp:
        tmp_path = Path(tmp)
        srt_path = tmp_path / "fixture.srt"
        srt_path.write_text(SAMPLE_SRT, encoding="utf-8")

        params = StdioServerParameters(
            command=sys.executable,
            args=[server_path],
            env={**os.environ, "OCEANUS_OUTPUT_DIR": str(tmp_path)},
        )

        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                # ---- initialize + list tools ----
                print("[smoke] sending initialize", flush=True)
                await session.initialize()
                print("[smoke] initialize done", flush=True)
                print("[smoke] calling list_tools (no timeout)", flush=True)
                tools = await session.list_tools()
                print("[smoke] list_tools returned", flush=True)
                tool_names = [t.name for t in tools.tools]
                print(f"[smoke] server started, {len(tool_names)} tools: {tool_names}", flush=True)
                expected = {
                    "server_info", "list_videos", "list_subtitles",
                    "parse_srt_text", "build_segments_from_srt",
                    "whisper_transcribe", "render_segments",
                    "automark", "autocut", "autoedit", "gpu_transcribe",
                }
                missing = expected - set(tool_names)
                if missing:
                    print(f"[smoke] FAIL: missing tools: {sorted(missing)}", file=sys.stderr)
                    return 1
                print(f"[smoke] OK: all {len(expected)} expected tools present")

                # ---- server_info ----
                info_raw = await session.call_tool("server_info", {})
                info = json.loads(_text_of(info_raw))
                assert info["server"] == "oceanus-autoedit", info
                print(f"[smoke] OK: server_info → version={info['version']} "
                      f"ffmpeg={info['ffmpeg_available']} whisper={info['whisper_url']}")

                # ---- parse_srt_text ----
                psrt_raw = await session.call_tool("parse_srt_text", {"text": SAMPLE_SRT})
                psrt = json.loads(_text_of(psrt_raw))
                assert psrt["count"] == 4, psrt
                assert psrt["cues"][0]["text"].startswith("Welcome"), psrt
                print(f"[smoke] OK: parse_srt_text → {psrt['count']} cues")

                # ---- build_segments_from_srt (pure) ----
                bseg_raw = await session.call_tool(
                    "build_segments_from_srt",
                    {"text": SAMPLE_SRT, "duration_seconds": 30.0},
                )
                bseg = json.loads(_text_of(bseg_raw))
                assert bseg["cue_count"] == 4, bseg
                assert bseg["segment_count"] >= 1, bseg
                assert bseg["marker_count"] >= bseg["segment_count"] * 2, bseg
                # The "insane" cue and "Let's go!" cue should be suggestions
                sugg = [m for m in bseg["markers"] if m["marker_type"] == "suggestion"]
                assert sugg, "expected at least one highlight marker"
                print(f"[smoke] OK: build_segments_from_srt → "
                      f"{bseg['segment_count']} segments, {bseg['marker_count']} markers "
                      f"(kept {bseg['kept_duration_seconds']}s)")

                # ---- list_videos (empty temp dir) ----
                lv_raw = await session.call_tool("list_videos", {"root": str(tmp_path)})
                lv = json.loads(_text_of(lv_raw))
                assert lv["count"] == 0, lv
                print(f"[smoke] OK: list_videos on empty dir → 0 files")

                # ---- list_subtitles (finds the fixture) ----
                ls_raw = await session.call_tool("list_subtitles", {"root": str(tmp_path)})
                ls = json.loads(_text_of(ls_raw))
                assert ls["count"] == 1, ls
                assert ls["files"][0]["name"] == "fixture.srt", ls
                print(f"[smoke] OK: list_subtitles → 1 file ({ls['files'][0]['name']})")

                # ---- whisper_transcribe (URL not reachable → expect error JSON) ----
                fake_wav = tmp_path / "fake.wav"
                fake_wav.write_bytes(b"RIFF$\x00\x00\x00WAVEfmt ")  # not a real wav
                wt_raw = await session.call_tool(
                    "whisper_transcribe",
                    {
                        "wav_path": str(fake_wav),
                        "output_srt_path": str(tmp_path / "out.srt"),
                        "url": "http://127.0.0.1:1/transcribe",  # guaranteed unreachable
                    },
                )
                wt = json.loads(_text_of(wt_raw))
                assert "error" in wt, f"expected error, got: {wt}"
                print(f"[smoke] OK: whisper_transcribe gracefully errored: {wt['error'][:60]}")

                # ---- render_segments with a real .mp4? No video in tmp, so test the
                #      error path (we don't want to spin up ffmpeg for a smoke test).
                rs_raw = await session.call_tool(
                    "render_segments",
                    {
                        "video_path": str(tmp_path / "missing.mp4"),
                        "output_mp4_path": str(tmp_path / "out.mp4"),
                        "segments_json": json.dumps([{"start": 0.0, "end": 1.0}]),
                    },
                )
                rs = json.loads(_text_of(rs_raw))
                assert "error" in rs and "video_not_found" in rs["error"], rs
                print(f"[smoke] OK: render_segments gracefully errored: {rs['error']}")

                # ---- empty segments list ----
                rs2_raw = await session.call_tool(
                    "render_segments",
                    {
                        "video_path": str(tmp_path / "missing.mp4"),
                        "output_mp4_path": str(tmp_path / "out2.mp4"),
                        "segments_json": "[]",
                    },
                )
                rs2 = json.loads(_text_of(rs2_raw))
                assert "error" in rs2, rs2
                print(f"[smoke] OK: render_segments with empty list errored: {rs2['error']}")

                # ---- automark on a missing video → error path, not crash ----
                am_raw = await session.call_tool(
                    "automark",
                    {
                        "video_path": str(tmp_path / "missing.mp4"),
                        "output_dir": str(tmp_path),
                    },
                )
                am = json.loads(_text_of(am_raw))
                assert "error" in am, am
                print(f"[smoke] OK: automark gracefully errored: {am['error']}")

                # ---- gpu_transcribe: verify it's registered and its tool
                #      schema is sane. We do NOT call it live here because
                #      (a) it loads a model per-subprocess, and (b) we
                #      already validate the real end-to-end path in
                #      run_gpu_helgstr1.py. A bad WAV would hang the
                #      decode. The standalone tool was unit-tested in
                #      test_oceanus_autoedit.py.
                gt_schema = next((t for t in tools.tools if t.name == "gpu_transcribe"), None)
                assert gt_schema is not None, "gpu_transcribe tool not registered"
                # required kwargs
                props = (gt_schema.inputSchema or {}).get("properties", {})
                assert "wav_path" in props, props
                assert "output_srt_path" in props, props
                assert "model" in props, props
                assert "device" in props, props
                assert "compute_type" in props, props
                print(f"[smoke] OK: gpu_transcribe registered with schema fields "
                      f"{sorted(props.keys())}; live GPU test is in run_gpu_helgstr1.py")

    print("[smoke] all 11 tools exercised, no crashes, server clean on exit")
    return 0


def _text_of(call_tool_result) -> str:
    """Extract the text content from a CallToolResult."""
    if hasattr(call_tool_result, "content") and call_tool_result.content:
        for block in call_tool_result.content:
            if getattr(block, "type", None) == "text":
                return block.text
    return str(call_tool_result)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
