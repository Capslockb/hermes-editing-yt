# Environment variables

hermes-editing-yt can be configured entirely through environment variables. Tool arguments take precedence over env vars; env vars take precedence over the baked-in defaults.

## Paths

| Var | Default | Purpose |
|---|---|---|
| `HERMES_EDITING_YT_OUTPUT_DIR` | `~/hermes-editing-yt-output` | Default output root for `automark`, `autocut`, and `autoedit`. |
| `HERMES_EDITING_YT_RAW_DIR` | `G:\- hermes-editing-yt\Unedited (RAW)` (Windows) / same as output dir (elsewhere) | Legacy raw-footage confirmation folder used by the interactive CLI. |

## Local Whisper (faster-whisper)

| Var | Default | Purpose |
|---|---|---|
| `HERMES_EDITING_YT_WHISPER_MODEL` | `large-v3` | Model name passed to faster-whisper. Also accepts `tiny`, `base`, `small`, `medium`. |
| `HERMES_EDITING_YT_WHISPER_DEVICE` | `cuda` | Compute device: `cuda` or `cpu`. |
| `HERMES_EDITING_YT_WHISPER_COMPUTE` | `float16` | Compute type: `float16`, `float32`, `int8`, `int8_float16`. |
| `HERMES_EDITING_YT_WHISPER_LANG` | *(unset)* | Optional ISO language code (e.g. `en`, `sv`). Auto-detect if omitted. |
| `HERMES_EDITING_YT_WHISPER_BEAM` | `5` | Whisper beam size. |

## HTTP Whisper endpoint

| Var | Default | Purpose |
|---|---|---|
| `HERMES_EDITING_YT_WHISPER_URL` | `http://127.0.0.1:51746/transcribe` | URL for the `whisper_transcribe` tool. Leave empty to force local GPU. |

## Segmentation

| Var | Default | Purpose |
|---|---|---|
| `HERMES_EDITING_YT_MERGE_GAP` | `1.20` | Maximum seconds of silence between cues to merge into the same keep-segment. Increase for more aggressive cuts; decrease to preserve breath beats. |

There are no env vars for `lead_in`, `tail_out`, `min_segment`, `highlight_keywords`, or render knobs today — pass them as tool arguments.

## Render defaults

Render defaults are constants in `plugin/hermes_editing_yt.py`:

| Knob | Default | Override |
|---|---|---|
| Video codec | `libx264` | `video_codec` arg on `render_segments` / full pipeline tools. |
| Preset | `medium` | `preset` arg. |
| CRF | `18` | `crf` arg. |
| Audio codec | `aac` | `audio_codec` arg. |
| Audio bitrate | `192k` | `audio_bitrate` arg. |

## Installer behavior

The installer reads the env vars above and writes them into the Hermes config prompt defaults. It does not modify shell profiles.

## Example `.env` snippet

```bash
# ~/.config/hermes/editing-yt.env
HERMES_EDITING_YT_OUTPUT_DIR="$HOME/hermes-editing-yt-output"
HERMES_EDITING_YT_WHISPER_URL=""
HERMES_EDITING_YT_WHISPER_MODEL="large-v3"
HERMES_EDITING_YT_WHISPER_DEVICE="cuda"
HERMES_EDITING_YT_WHISPER_COMPUTE="float16"
HERMES_EDITING_YT_MERGE_GAP="1.20"
```

Load it before running Hermes:

```bash
set -a; source ~/.config/hermes/editing-yt.env; set +a
hermes gateway start
```
