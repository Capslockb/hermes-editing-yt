#!/usr/bin/env python3
"""
SORA Agent Editor — Oneshot Installer
======================================

Walks the user through:

  1. Environment detection (OS, Python, ffmpeg, GPU, faster-whisper)
  2. Output dir + optional Whisper endpoint (or local GPU)
  3. pip install of the plugin's requirements
  4. Unit-test gate (35 tests must pass)
  5. Hermes MCP registration (`hermes mcp add oceanus`)
  6. Skill doc install to ~/AppData/Local/hermes/skills/media/oceanus-autoedit/
  7. Final summary + the exact tool call to try next

Uses only stdlib + rich (color/tables). No external CLI deps beyond
what's already in a fresh Python 3.11+ install.

Usage:
    python installer/install.py
    python installer/install.py --non-interactive  # accept all defaults
    python installer/install.py --uninstall        # remove plugin
"""
from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

# --- rich is the only external dep (optional; installer works without it) -
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
    from rich.prompt import Confirm, Prompt
    from rich.table import Table
    from rich.text import Text
    HAS_RICH = True
except ImportError:  # pragma: no cover
    HAS_RICH = False

# ============================================================================
# Configuration
# ============================================================================

REPO_NAME = "veo-editor"
PLUGIN_NAME = "oceanus"          # what `hermes mcp add` will register
PLUGIN_DIR_NAME = "oceanus-autoedit"  # dir under skills/ and plugins/
PLUGIN_TITLE = "SORA agent editor"

# Defaults — overridable via env / CLI
DEFAULT_HERMES_HOME = Path(os.environ.get("HERMES_HOME") or Path.home() / "AppData" / "Local" / "hermes")
DEFAULT_PLUGIN_DEST = DEFAULT_HERMES_HOME / "plugins" / PLUGIN_DIR_NAME
DEFAULT_SKILL_DEST = DEFAULT_HERMES_HOME / "skills" / "media" / PLUGIN_DIR_NAME
DEFAULT_OUTPUT_DIR = Path.home() / "veo-editor-output"

REPO_DIR = Path(__file__).resolve().parent.parent
PLUGIN_SRC = REPO_DIR / "plugin"
SKILL_SRC = REPO_DIR / "skills" / PLUGIN_DIR_NAME
REQUIREMENTS_FILE = PLUGIN_SRC / "requirements.txt"


# ============================================================================
# Pretty-print helpers (work with or without rich)
# ============================================================================

class UI:
    """Thin wrapper that no-ops rich features when rich isn't available."""

    def __init__(self, no_color: bool = False):
        self.no_color = no_color or (not sys.stdout.isatty())
        if HAS_RICH and not self.no_color:
            self.console = Console()
        else:
            self.console = None

    def header(self, text: str) -> None:
        bar = "=" * (len(text) + 4)
        msg = f"\n{bar}\n  {text}\n{bar}\n"
        if self.console:
            self.console.print(Panel(Text(msg.strip(), style="bold cyan")))
        else:
            print(msg)

    def info(self, msg: str) -> None:
        if self.console:
            self.console.print(f"[blue]ℹ[/blue]  {msg}")
        else:
            print(f"[i] {msg}")

    def ok(self, msg: str) -> None:
        if self.console:
            self.console.print(f"[green]✓[/green]  {msg}")
        else:
            print(f"[+] {msg}")

    def warn(self, msg: str) -> None:
        if self.console:
            self.console.print(f"[yellow]![/yellow]  {msg}")
        else:
            print(f"[!] {msg}")

    def err(self, msg: str) -> None:
        if self.console:
            self.console.print(f"[red]✗[/red]  {msg}")
        else:
            print(f"[-] {msg}", file=sys.stderr)

    def table(self, title: str, rows: list[tuple[str, str]]) -> None:
        if self.console:
            t = Table(title=title, show_header=False, title_style="bold")
            t.add_column("Key", style="cyan", no_wrap=True)
            t.add_column("Value", style="white")
            for k, v in rows:
                t.add_row(k, v)
            self.console.print(t)
        else:
            print(f"\n--- {title} ---")
            for k, v in rows:
                print(f"  {k:24} {v}")

    def ask(self, prompt: str, default: str = "", password: bool = False) -> str:
        if HAS_RICH and self.console:
            return Prompt.ask(prompt, default=default or ..., password=password).strip()
        if default:
            val = input(f"{prompt} [{default}]: ").strip()
        else:
            val = input(f"{prompt}: ").strip()
        return val or default

    def confirm(self, prompt: str, default: bool = True) -> bool:
        if HAS_RICH and self.console:
            return Confirm.ask(prompt, default=default)
        suffix = " [Y/n]" if default else " [y/N]"
        val = input(f"{prompt}{suffix}: ").strip().lower()
        if not val:
            return default
        return val in ("y", "yes")

    def auto_confirm(self, prompt: str, default: bool, non_interactive: bool) -> bool:
        """In --non-interactive mode, return `default` without prompting.

        In TTY mode, prompt as usual. The non_interactive check happens
        first to prevent any stdin read in CI / piped contexts.
        """
        if non_interactive:
            return default
        return self.confirm(prompt, default=default)

    def step(self, label: str) -> None:
        self.header(f"STEP — {label}")


# ============================================================================
# Environment detection
# ============================================================================

@dataclass
class EnvReport:
    os_name: str
    os_release: str
    python: str
    python_ok: bool
    ffmpeg: Optional[str]
    ffmpeg_ok: bool
    hermes_home: Path
    hermes_home_ok: bool
    hermes_cli: Optional[str]
    hermes_cli_ok: bool
    nvidia_smi: Optional[str]
    gpu_name: Optional[str]
    faster_whisper: bool
    cublas12_dir: Optional[str]
    plugin_src_ok: bool
    requirements_ok: bool

    def summary_rows(self) -> list[tuple[str, str]]:
        return [
            ("OS", f"{self.os_name} {self.os_release}"),
            ("Python", f"{self.python}{'' if self.python_ok else '  (need 3.10+)' }"),
            ("ffmpeg", self.ffmpeg or "NOT FOUND — install via choco/scoop/apt"),
            ("Hermes home", str(self.hermes_home) + ("" if self.hermes_home_ok else "  (NOT FOUND)")),
            ("hermes CLI", self.hermes_cli or "NOT FOUND — pip install hermes-agent"),
            ("NVIDIA driver", (self.nvidia_smi or "n/a")[:80]),
            ("GPU", self.gpu_name or "no CUDA GPU detected"),
            ("faster-whisper", "yes" if self.faster_whisper else "no (will install)"),
            ("cublas v12 path", self.cublas12_dir or "(installer will resolve at runtime)"),
            ("Plugin source", str(PLUGIN_SRC) + ("" if self.plugin_src_ok else "  MISSING")),
            ("requirements.txt", "present" if self.requirements_ok else "MISSING"),
        ]


def detect_env() -> EnvReport:
    py = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    py_ok = sys.version_info >= (3, 10)

    ffmpeg = shutil.which("ffmpeg")
    ffmpeg_ok = ffmpeg is not None

    hermes_home = DEFAULT_HERMES_HOME
    hermes_home_ok = hermes_home.exists() and hermes_home.is_dir()

    hermes_cli = shutil.which("hermes")
    hermes_cli_ok = hermes_cli is not None

    nvidia_smi = None
    gpu_name = None
    smi = shutil.which("nvidia-smi")
    if smi:
        try:
            r = subprocess.run([smi, "--query-gpu=name,driver_version", "--format=csv,noheader"],
                               capture_output=True, text=True, timeout=5)
            if r.returncode == 0 and r.stdout.strip():
                nvidia_smi = r.stdout.strip().splitlines()[0]
                gpu_name = nvidia_smi.split(",")[0].strip()
        except Exception:
            pass

    faster_whisper = False
    try:
        import faster_whisper  # noqa: F401
        faster_whisper = True
    except ImportError:
        pass

    cublas12_dir = None
    # Quick scan for nvidia-cublas-cu12 in common Python prefixes.
    candidates = [Path(p) for p in sys.path if p and "site-packages" in p]
    for sp in candidates:
        for nm in ("nvidia", "nvidia_cublas_cu12"):
            d = sp / nm / "cublas" / "bin"
            if d.exists() and (d / "cublas64_12.dll").exists():
                cublas12_dir = str(d)
                break
        if cublas12_dir:
            break

    plugin_src_ok = PLUGIN_SRC.exists() and (PLUGIN_SRC / "mcp_server.py").exists()
    requirements_ok = REQUIREMENTS_FILE.exists()

    return EnvReport(
        os_name=platform.system(),
        os_release=platform.release(),
        python=py,
        python_ok=py_ok,
        ffmpeg=ffmpeg,
        ffmpeg_ok=ffmpeg_ok,
        hermes_home=hermes_home,
        hermes_home_ok=hermes_home_ok,
        hermes_cli=hermes_cli,
        hermes_cli_ok=hermes_cli_ok,
        nvidia_smi=nvidia_smi,
        gpu_name=gpu_name,
        faster_whisper=faster_whisper,
        cublas12_dir=cublas12_dir,
        plugin_src_ok=plugin_src_ok,
        requirements_ok=requirements_ok,
    )


# ============================================================================
# Steps
# ============================================================================

def step_detect(ui: UI) -> EnvReport:
    ui.step("1 / 7 — Detect environment")
    env = detect_env()
    ui.table("Environment", env.summary_rows())
    if not env.python_ok:
        ui.err("Python 3.10+ is required.")
        sys.exit(2)
    if not env.plugin_src_ok:
        ui.err(f"Plugin source not found at {PLUGIN_SRC}. "
               f"Are you running this from the {REPO_NAME} repo?")
        sys.exit(2)
    if not env.requirements_ok:
        ui.err(f"requirements.txt missing at {REQUIREMENTS_FILE}")
        sys.exit(2)
    if not env.ffmpeg_ok:
        ui.warn("ffmpeg is not on PATH. The MCP server will start, but "
                "autocut/autoedit will fail until you install ffmpeg.")
    if not env.hermes_cli_ok:
        ui.warn("hermes CLI not on PATH. The plugin will be installed, but "
                "`hermes mcp add oceanus` will fail. Run `pip install "
                "hermes-agent` first if you want MCP auto-registration.")
    if not env.hermes_home_ok:
        ui.warn(f"Hermes home not found at {env.hermes_home}. Plugin files "
                "will be installed in-place under this repo, not under Hermes.")
    return env


def step_configure(ui: UI, non_interactive: bool) -> dict:
    ui.step("2 / 7 — Configure")
    cfg = {}
    if non_interactive:
        cfg["output_dir"] = DEFAULT_OUTPUT_DIR
        cfg["whisper_url"] = os.environ.get("OCEANUS_WHISPER_URL", "")
        cfg["whisper_model"] = os.environ.get("OCEANUS_WHISPER_MODEL", "large-v3")
        cfg["whisper_device"] = os.environ.get("OCEANUS_WHISPER_DEVICE", "cuda")
        cfg["whisper_compute"] = os.environ.get("OCEANUS_WHISPER_COMPUTE", "float16")
        ui.info(f"Output dir: {cfg['output_dir']}")
        ui.info(f"Whisper model: {cfg['whisper_model']} on {cfg['whisper_device']} "
                f"({cfg['whisper_compute']})")
        return cfg

    ui.info("Press Enter to accept the default shown in [brackets].")
    out = ui.ask("Output directory for autocut/autoedit renders", str(DEFAULT_OUTPUT_DIR))
    cfg["output_dir"] = Path(out).expanduser()
    cfg["whisper_url"] = ui.ask(
        "External Whisper HTTP endpoint (blank = use built-in GPU transcriber)",
        os.environ.get("OCEANUS_WHISPER_URL", ""))
    if not cfg["whisper_url"]:
        cfg["whisper_model"] = ui.ask("Local faster-whisper model", "large-v3")
        cfg["whisper_device"] = ui.ask("Compute device (cuda / cpu)", "cuda")
        cfg["whisper_compute"] = ui.ask("Compute type (float16 / float32 / int8)", "float16")
    else:
        cfg["whisper_model"] = "large-v3"
        cfg["whisper_device"] = "cuda"
        cfg["whisper_compute"] = "float16"
    return cfg


def step_install_deps(ui: UI, non_interactive: bool) -> bool:
    ui.step("3 / 7 — Install Python dependencies")
    if not ui.auto_confirm(f"Run `pip install -r {REQUIREMENTS_FILE.name}`?",
                            default=True, non_interactive=non_interactive):
        ui.warn("Skipping dep install. The plugin may not work.")
        return False
    cmd = [sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS_FILE)]
    ui.info(f"$ {' '.join(cmd)}")
    rc = subprocess.call(cmd)
    if rc != 0:
        ui.err("pip install failed. Re-run with verbose output to debug.")
        return False
    ui.ok("Dependencies installed.")
    return True


def step_run_tests(ui: UI) -> bool:
    ui.step("4 / 7 — Run unit tests (gate)")
    cmd = [sys.executable, "-m", "pytest", str(REPO_DIR / "tests" / "test_oceanus_autoedit.py"),
           "-q", "--tb=short"]
    ui.info(f"$ {' '.join(cmd)}")
    rc = subprocess.call(cmd)
    if rc != 0:
        ui.err("Unit tests failed. Fix the issues above before continuing.")
        return False
    ui.ok("All unit tests pass.")
    return True


def step_install_plugin(ui: UI, env: EnvReport) -> Optional[Path]:
    ui.step("5 / 7 — Install plugin into Hermes")
    if not env.hermes_home_ok:
        ui.warn("Hermes home not found — skipping copy. The plugin lives in "
                f"this repo at {PLUGIN_SRC} and you can register it manually.")
        return None
    dest = DEFAULT_PLUGIN_DEST
    if dest.exists():
        ui.warn(f"Plugin already exists at {dest} — overwriting.")
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(PLUGIN_SRC, dest)
    ui.ok(f"Plugin copied to {dest}")
    return dest


def step_install_skill(ui: UI, env: EnvReport) -> Optional[Path]:
    ui.step("6 / 7 — Install skill doc")
    if not env.hermes_home_ok:
        ui.warn("Hermes home not found — skipping skill install.")
        return None
    dest = DEFAULT_SKILL_DEST
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(SKILL_SRC, dest)
    ui.ok(f"Skill doc installed at {dest}")
    return dest


def step_register_mcp(ui: UI, env: EnvReport, plugin_dest: Optional[Path],
                      cfg: dict, non_interactive: bool) -> bool:
    ui.step("7 / 7 — Register MCP server with Hermes")
    if not env.hermes_cli_ok:
        ui.warn("hermes CLI not on PATH. Skipping auto-register. "
                "Run `hermes mcp add oceanus --command ... --args ...` manually.")
        return False

    if not plugin_dest:
        # Use in-repo plugin path
        server_script = str((PLUGIN_SRC / "mcp_server.py").resolve())
    else:
        server_script = str((plugin_dest / "mcp_server.py").resolve())

    if not Path(server_script).exists():
        ui.err(f"Server script missing: {server_script}")
        return False

    # Use the same Python that's running the installer (most reliable on Windows).
    python_exe = sys.executable
    cmd = [
        "hermes", "mcp", "add", PLUGIN_NAME,
        "--command", python_exe,
        "--args", server_script,
    ]
    # Unregister first to keep the operation idempotent
    remove = ["hermes", "mcp", "remove", PLUGIN_NAME]
    if not ui.auto_confirm(f"Run `{' '.join(cmd)}`?", default=True,
                            non_interactive=non_interactive):
        ui.warn("Skipping MCP register. You can run it manually later.")
        return False
    ui.info(f"$ {' '.join(remove)} (idempotent reset)")
    subprocess.run(remove, capture_output=True)
    ui.info(f"$ {' '.join(cmd)}")
    # In --non-interactive mode, `hermes mcp add` prompts "Enable all N tools? [Y/n/select]"
    # and silently cancels on EOF. Pipe `y` so the registration persists.
    # (subprocess.call doesn't accept `input=`; subprocess.run does.)
    if non_interactive:
        rc = subprocess.run(cmd, input=b"y\n").returncode
    else:
        rc = subprocess.call(cmd)
    if rc != 0:
        ui.err("hermes mcp add failed. Re-run with --verbose to debug.")
        return False
    ui.ok("MCP server registered as `oceanus`.")
    return True


def step_summary(ui: UI, env: EnvReport, plugin_dest: Optional[Path],
                 skill_dest: Optional[Path], cfg: dict, mcp_ok: bool) -> None:
    ui.header(f"{PLUGIN_TITLE} — Install Summary")
    rows = [
        ("Plugin source", str(PLUGIN_SRC)),
        ("Plugin installed at", str(plugin_dest) if plugin_dest else "(in-repo only)"),
        ("Skill doc at", str(skill_dest) if skill_dest else "(skipped)"),
        ("Output dir", str(cfg.get("output_dir", DEFAULT_OUTPUT_DIR))),
        ("Whisper model", cfg.get("whisper_model", "n/a")),
        ("Whisper device", cfg.get("whisper_device", "n/a")),
        ("Whisper compute", cfg.get("whisper_compute", "n/a")),
        ("MCP server", "registered as `oceanus`" if mcp_ok else "(not registered)"),
    ]
    ui.table("Result", rows)
    ui.info("Try this in any Hermes chat:")
    print()
    print("  Use the oceanus MCP tools to autocut")
    print("  G:\\- OCEANUS\\Editing\\New folder\\Helgstr1.mp4")
    print("  with output to G:\\- OCEANUS\\output\\my-first-cut")
    print()
    ui.info("Or run the demo directly:")
    print(f"  {sys.executable} scripts/run_gpu_demo.py")
    print()
    ui.info("Verify the install:")
    print("  hermes mcp test oceanus")
    print()
    ui.info("Uninstall:")
    print("  python installer/install.py --uninstall")
    print()
    ui.ok("Done.")


# ============================================================================
# Uninstall
# ============================================================================

def uninstall(ui: UI, env: EnvReport) -> None:
    ui.header(f"Uninstall {PLUGIN_TITLE}")
    if env.hermes_cli_ok:
        ui.info("Removing MCP server registration…")
        subprocess.run(["hermes", "mcp", "remove", PLUGIN_NAME], capture_output=True)
    for label, path in (("plugin dir", DEFAULT_PLUGIN_DEST),
                        ("skill doc", DEFAULT_SKILL_DEST)):
        if path.exists():
            ui.info(f"Removing {label} at {path}…")
            shutil.rmtree(path)
        else:
            ui.info(f"{label} not present at {path}.")
    ui.ok("Uninstall complete.")


# ============================================================================
# Main
# ============================================================================

def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(
        description=f"{PLUGIN_TITLE} — oneshot installer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--non-interactive", action="store_true",
                   help="Accept all defaults; no prompts")
    p.add_argument("--skip-deps", action="store_true",
                   help="Skip the `pip install` step (use when deps are "
                        "already installed or you want to prove the rest "
                        "of the flow without re-downloading torch)")
    p.add_argument("--no-color", action="store_true",
                   help="Disable rich color output")
    p.add_argument("--uninstall", action="store_true",
                   help="Remove plugin and skill from Hermes")
    args = p.parse_args(argv)

    ui = UI(no_color=args.no_color)
    env = detect_env()

    if args.uninstall:
        uninstall(ui, env)
        return 0

    ui.header(f"{PLUGIN_TITLE} — Oneshot Installer")
    ui.info(f"Repo:        {REPO_NAME}")
    ui.info(f"Hermes home: {env.hermes_home}")
    ui.info(f"Python:      {env.python}")
    ui.info(f"Plugin src:  {PLUGIN_SRC}")

    if not env.plugin_src_ok:
        ui.err(f"Plugin source not found at {PLUGIN_SRC}. "
               f"Run this from inside the {REPO_NAME} repo clone.")
        return 2

    cfg = step_configure(ui, args.non_interactive)
    if args.skip_deps:
        ui.info("--skip-deps set, skipping pip install")
    elif not step_install_deps(ui, args.non_interactive):
        return 3
    if not step_run_tests(ui):
        return 4
    plugin_dest = step_install_plugin(ui, env)
    skill_dest = step_install_skill(ui, env)
    mcp_ok = step_register_mcp(ui, env, plugin_dest, cfg, args.non_interactive)
    step_summary(ui, env, plugin_dest, skill_dest, cfg, mcp_ok)
    return 0 if mcp_ok else 5


if __name__ == "__main__":
    raise SystemExit(main())
