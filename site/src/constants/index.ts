// Contains constant data for using in website
// ! Don't remove anything from here if not sure

import {
  mobile,
  backend,
  creator,
  web,
  javascript,
  typescript,
  html,
  css,
  reactjs,
  redux,
  tailwind,
  nodejs,
  mongodb,
  git,
  figma,
  docker,
  threejs,
  feature1,
  feature2,
  feature3,
  feature4,
  feature5,
  heroWorkstation,
  pipeline3d,
  gpuRender,
  user1,
  user2,
  user3,
  youtube,
  linkedin,
  twitter,
  github,
} from "../assets";

// Navbar Links
export const NAV_LINKS = [
  {
    id: "features",
    title: "Features",
    link: null,
  },
  {
    id: "pipeline",
    title: "Pipeline",
    link: null,
  },
  {
    id: "tech",
    title: "Tools",
    link: null,
  },
  {
    id: "install",
    title: "Install",
    link: null,
  },
  {
    id: "source-code",
    title: "GitHub",
    link: "https://github.com/Capslockb/hermes-editing-yt",
  },
] as const;

// Services (feature cards)
export const SERVICES = [
  {
    title: "Subtitle-Driven Cut",
    icon: web,
  },
  {
    title: "GPU Transcription",
    icon: backend,
  },
  {
    title: "MCP Server",
    icon: creator,
  },
  {
    title: "Oneshot Installer",
    icon: mobile,
  },
] as const;

// Technologies (shown as 3D spheres)
export const TECHNOLOGIES = [
  {
    name: "Python",
    icon: backend,
  },
  {
    name: "FastMCP",
    icon: threejs,
  },
  {
    name: "FFmpeg",
    icon: docker,
  },
  {
    name: "Whisper",
    icon: typescript,
  },
  {
    name: "PyTorch",
    icon: reactjs,
  },
  {
    name: "CUDA",
    icon: nodejs,
  },
  {
    name: "Git",
    icon: git,
  },
] as const;

// Experiences / Release Timeline
export const EXPERIENCES = [
  {
    title: "Subtitle-Driven Cut",
    company_name: "v0.1.0 — Initial Launch",
    icon: web,
    iconBg: "#383E56",
    date: "March 2025",
    points: [
      "First public release of hermes-editing-yt with subtitle-driven auto-editing pipeline.",
      "Automark + Autocut modes: parse SRT/ass subtitles and slice video at sentence boundaries.",
      "Hermes MCP integration with 11 tools for programmatic video editing.",
      "Local ffmpeg + libx264 rendering — no cloud dependency.",
    ],
  },
  {
    title: "GPU Transcription",
    company_name: "v0.2.0 — Whisper large-v3",
    icon: backend,
    iconBg: "#E6DEDD",
    date: "May 2025",
    points: [
      "Integrated GPU-accelerated Whisper large-v3 for local speech-to-text.",
      "Transcribe any video file to SRT/ass with word-level timestamps.",
      "RTX 5060 support with CUDA-optimized batching for real-time transcription.",
      "Automatic language detection and multi-language subtitle generation.",
    ],
  },
  {
    title: "MCP Server Integration",
    company_name: "v0.3.0 — FastMCP 3.0",
    icon: creator,
    iconBg: "#383E56",
    date: "June 2025",
    points: [
      "Refactored to FastMCP 3.0.2 with SSE and stdio transport support.",
      "Added hermes_editing_yt.py — full auto-edit pipeline composing all tools.",
      "Context-aware tool chaining: transcribe → automark → autocut → encode.",
      "Plugin now lives at plugin/hermes_editing_yt.py with 11 MCP tools.",
    ],
  },
  {
    title: "Oneshot Installer",
    company_name: "v1.0.0 — TUI Installer",
    icon: mobile,
    iconBg: "#E6DEDD",
    date: "July 2025",
    points: [
      "Zero-dependency oneshot installer: PowerShell (Windows) and bash (Linux/macOS).",
      "TUI installer with interactive menu: install, update, uninstall, and doctor.",
      "Automatic detection of GPU, Python, ffmpeg, and CUDA availability.",
      "npm-free: no Node.js required — pure Python + shell installer.",
    ],
  },
] as const;

// Testimonials
export const TESTIMONIALS = [
  {
    testimonial:
      "hermes-editing-yt transformed my workflow. I can now cut a 2-hour interview into highlight clips in under 5 minutes by just editing the subtitle file. The GPU transcription is insanely fast on my RTX card.",
    name: "Marcus",
    designation: "Video Editor",
    company: "Freelance",
    image: user1,
  },
  {
    testimonial:
      "The MCP server integration is brilliant. I wired hermes-editing-yt into my Hermes agent workflow and it handles automated batch processing of incoming footage. The 11 tools give me everything I need for programmatic editing.",
    name: "Elena",
    designation: "MCP Developer",
    company: "Agent Studio",
    image: user2,
  },
  {
    testimonial:
      "Finally an open-source video editor that respects privacy — everything runs locally on my own GPU. The oneshot installer had me up and running in under 2 minutes. No subscription, no cloud uploads, just pure local power.",
    name: "Priya",
    designation: "Content Creator",
    company: "YouTube",
    image: user3,
  },
] as const;

// Features (replaces PROJECTS — 6 feature cards)
export const PROJECTS = [
  {
    name: "Subtitle-Driven Timeline",
    description:
      "Edit video by editing subtitles. Parse SRT/ass files and automatically cut video at sentence boundaries. No timeline scrubbing needed — just edit the text and the video follows.",
    tags: [
      {
        name: "subtitle",
        color: "blue-text-gradient",
      },
      {
        name: "auto-cut",
        color: "green-text-gradient",
      },
      {
        name: "srt",
        color: "pink-text-gradient",
      },
    ],
    image: feature1,
    source_code_link: "https://github.com/Capslockb/hermes-editing-yt/blob/main/plugin/hermes_editing_yt.py",
    live_site_link: "",
  },
  {
    name: "GPU Whisper Transcription",
    description:
      "Local speech-to-text using Whisper large-v3 with GPU acceleration. Generate word-level timestamps, auto-detect languages, and output SRT/ass subtitles ready for editing.",
    tags: [
      {
        name: "whisper",
        color: "blue-text-gradient",
      },
      {
        name: "gpu",
        color: "green-text-gradient",
      },
      {
        name: "cuda",
        color: "pink-text-gradient",
      },
    ],
    image: feature2,
    source_code_link: "https://github.com/Capslockb/hermes-editing-yt/blob/main/plugin/tools/transcribe_tool.py",
    live_site_link: "",
  },
  {
    name: "Hermes MCP Plugin",
    description:
      "11 MCP tools exposed via FastMCP 3.0.2 with SSE and stdio transport. Automate video editing from any Hermes agent session — transcribe, cut, encode, and manage projects programmatically.",
    tags: [
      {
        name: "mcp",
        color: "blue-text-gradient",
      },
      {
        name: "hermes",
        color: "green-text-gradient",
      },
      {
        name: "automation",
        color: "pink-text-gradient",
      },
    ],
    image: feature3,
    source_code_link: "https://github.com/Capslockb/hermes-editing-yt/blob/main/plugin/server.py",
    live_site_link: "",
  },
  {
    name: "AutoEdit Pipeline",
    description:
      "Three-stage pipeline: automark (analyze subtitles) → autocut (slice video) → autoedit (compose final render). Full auto mode with sensible defaults for rapid turnaround.",
    tags: [
      {
        name: "pipeline",
        color: "blue-text-gradient",
      },
      {
        name: "ffmpeg",
        color: "green-text-gradient",
      },
      {
        name: "libx264",
        color: "pink-text-gradient",
      },
    ],
    image: feature4,
    source_code_link: "https://github.com/Capslockb/hermes-editing-yt/blob/main/plugin/hermes_editing_yt.py",
    live_site_link: "",
  },
  {
    name: "One-Line Installer",
    description:
      "Install hermes-editing-yt with a single command — no npm, no manual setup. PowerShell for Windows, bash for Linux/macOS. Interactive TUI for install, update, uninstall, and system health checks.",
    tags: [
      {
        name: "installer",
        color: "blue-text-gradient",
      },
      {
        name: "tui",
        color: "green-text-gradient",
      },
      {
        name: "oneshot",
        color: "pink-text-gradient",
      },
    ],
    image: feature5,
    source_code_link: "https://github.com/Capslockb/hermes-editing-yt/blob/main/installer/install.py",
    live_site_link: "",
  },
  {
    name: "Local & Private",
    description:
      "Everything runs on your hardware. No cloud uploads, no API keys, no subscriptions. GPU-accelerated via CUDA, with graceful CPU fallback. Free and open-source under MIT license.",
    tags: [
      {
        name: "privacy",
        color: "blue-text-gradient",
      },
      {
        name: "local",
        color: "green-text-gradient",
      },
      {
        name: "free",
        color: "pink-text-gradient",
      },
    ],
    image: gpuRender,
    source_code_link: "https://github.com/Capslockb/hermes-editing-yt",
    live_site_link: "",
  },
] as const;

export const SOCIALS = [
  {
    name: "GitHub",
    icon: github,
    link: "https://github.com/Capslockb/hermes-editing-yt",
  },
  {
    name: "Discord",
    icon: youtube,
    link: "https://github.com/Capslockb/hermes-editing-yt",
  },
  {
    name: "YouTube",
    icon: youtube,
    link: "https://github.com/Capslockb/hermes-editing-yt",
  },
  {
    name: "Twitter",
    icon: twitter,
    link: "https://github.com/Capslockb/hermes-editing-yt",
  },
] as const;
