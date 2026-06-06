#!/usr/bin/env bash
# ============================================================================
#  Veo Editor — Linux/macOS one-shot installer
# ============================================================================
#  Downloads the repo, runs the Python installer with --non-interactive.
#
#  Usage:
#    curl -sSL https://raw.githubusercontent.com/Capslockb/veo-editor/main/installer/install.sh | bash
#
#  Override defaults:
#    OCEANUS_OUTPUT_DIR=/tmp/renders \
#    OCEANUS_WHISPER_URL=http://127.0.0.1:51746/transcribe \
#    bash install.sh
# ============================================================================

set -euo pipefail

REPO_URL="https://github.com/Capslockb/veo-editor.git"
REPO_NAME="veo-editor"
BRANCH="main"
INSTALL_DIR="${HOME}/code/${REPO_NAME}"
# Override by exporting VEO_INSTALLER_ARGS before running this script.
# Example:  VEO_INSTALLER_ARGS="--non-interactive --skip-deps" bash install.sh
INSTALLER_ARGS="${VEO_INSTALLER_ARGS:---non-interactive}"

# --- logging helpers --------------------------------------------------------
ts() { date +"%H:%M:%S"; }
status() { printf "\033[1;36m[%s]\033[0m %s\n" "$(ts)" "$1"; }
ok()     { printf "\033[1;32m[%s]\033[0m %s\n" "$(ts)" "$1"; }
warn()   { printf "\033[1;33m[%s]\033[0m %s\n" "$(ts)" "$1"; }
err()    { printf "\033[1;31m[%s]\033[0m %s\n" "$(ts)" "$1" >&2; }

status "Veo Editor — Linux/macOS one-shot installer"
status "Target: $INSTALL_DIR"

# --- 1. pick a Python 3.10+ ------------------------------------------------
PY=""
for cand in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$cand" >/dev/null 2>&1; then
        if "$cand" -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
            PY="$cand"
            break
        fi
    fi
done
if [ -z "$PY" ]; then
    err "Python 3.10+ not found. Install via your package manager first."
    exit 2
fi
ok "Using Python: $PY ($($PY --version 2>&1))"

# --- 2. git available? -----------------------------------------------------
if ! command -v git >/dev/null 2>&1; then
    err "git not found. Install via your package manager first."
    exit 2
fi

# --- 3. clone or update the repo -------------------------------------------
if [ -d "$INSTALL_DIR" ]; then
    warn "Existing install at $INSTALL_DIR — pulling latest"
    pushd "$INSTALL_DIR" >/dev/null
    git pull --rebase --autostash || { err "git pull failed"; popd >/dev/null; exit 3; }
    popd >/dev/null
else
    status "Cloning $REPO_URL → $INSTALL_DIR"
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR" \
        || { err "git clone failed"; exit 3; }
fi

# --- 4. ffmpeg check -------------------------------------------------------
if ! command -v ffmpeg >/dev/null 2>&1; then
    warn "ffmpeg not found. Install via:"
    warn "  sudo apt install ffmpeg      # Debian/Ubuntu"
    warn "  sudo dnf install ffmpeg      # Fedora"
    warn "  brew install ffmpeg          # macOS"
    warn "(continuing — autocut/autoedit will fail without ffmpeg)"
else
    ok "ffmpeg found: $(command -v ffmpeg)"
fi

# --- 5. run the Python installer ------------------------------------------
status "Launching installer/install.py"
pushd "$INSTALL_DIR" >/dev/null
set +e
"$PY" installer/install.py $INSTALLER_ARGS
RC=$?
set -e
popd >/dev/null

if [ "$RC" -ne 0 ]; then
    err "Installer exited with code $RC"
    warn "Re-run without --non-interactive for the TUI:  $PY installer/install.py"
    exit "$RC"
fi

ok "Done. Try:  hermes mcp test oceanus"
