"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ── Mock pipeline simulation ────────────────────────────────────────

type Line = { text: string; className?: string; delay: number };

const COMMANDS: Record<string, Array<Line>> = {
  autoedit: [
    {
      text: "$ hermes run --pipeline autoedit --input talk.mp4 --output clean.mp4",
      className: "text-green-400/90",
      delay: 300,
    },
    {
      text: "  ⚙ GPU Whisper large-v3: transcribing...",
      className: "text-indigo-300/70",
      delay: 1200,
    },
    {
      text: "  ✓ Transcribed: 382 words, 97.2% confidence (14.2s)",
      className: "text-indigo-300/90",
      delay: 2500,
    },
    {
      text: "  ⚙ Detecting silence gaps (threshold 0.5s)...",
      className: "text-indigo-300/70",
      delay: 3800,
    },
    {
      text: "  ✓ Found 23 gaps, 12 sentence boundaries (2.1s)",
      className: "text-indigo-300/90",
      delay: 5000,
    },
    {
      text: "  ⚙ ffmpeg + libx264: rendering at 30 fps...",
      className: "text-indigo-300/70",
      delay: 6200,
    },
    {
      text: "  ✓ Rendered: clean.mp4 (8.4 MB) — 8.7s",
      className: "text-indigo-300/90",
      delay: 8000,
    },
    {
      text: "",
      className: "",
      delay: 8300,
    },
    {
      text: "  ✓ Done — 12:34 → 9:17 (25.9% shorter)",
      className: "text-green-400 font-semibold",
      delay: 8600,
    },
    {
      text: "  ✓ Output: clean.mp4 — 1080p, h264, 30 fps",
      className: "text-green-400/80",
      delay: 9200,
    },
  ],
  automark: [
    {
      text: "$ hermes run --pipeline automark --input talk.mp4",
      className: "text-green-400/90",
      delay: 300,
    },
    {
      text: "  ⚙ Transcribing...  ✓ done (14.2s)",
      className: "text-indigo-300/70",
      delay: 1500,
    },
    {
      text: "  ⚙ Analyzing silence...  ✓ 12 boundaries found",
      className: "text-indigo-300/70",
      delay: 3500,
    },
    {
      text: "",
      className: "",
      delay: 4500,
    },
    {
      text: "  📋 Edit plan written to talk.plan.json",
      className: "text-amber-300",
      delay: 4800,
    },
    {
      text: "     Kept:    12 segments (9:17)",
      className: "text-indigo-300/80",
      delay: 5300,
    },
    {
      text: "     Removed: 11 segments (3:17)",
      className: "text-indigo-300/80",
      delay: 5800,
    },
    {
      text: "  ✓ No rendering — review plan with: herson plan show",
      className: "text-green-400/80",
      delay: 6400,
    },
  ],
  autocut: [
    {
      text: "$ hermes run --pipeline autocut --input talk.mp4 --srt subtitles.srt",
      className: "text-green-400/90",
      delay: 300,
    },
    {
      text: "  ⚙ Parsing subtitles.srt...  ✓ 45 entries (3.1s)",
      className: "text-indigo-300/70",
      delay: 1500,
    },
    {
      text: "  ⚙ Cutting at subtitle boundaries...",
      className: "text-indigo-300/70",
      delay: 3500,
    },
    {
      text: "  ✓ Cut: 12:34 → 10:02 (no re-transcribe)",
      className: "text-green-400/80",
      delay: 5500,
    },
  ],
};

export default function TerminalDemo() {
  const [activePipeline, setActivePipeline] = useState<string>("autoedit");
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = COMMANDS[activePipeline] ?? COMMANDS.autoedit;

  const play = useCallback(() => {
    setVisibleLines(0);
    setFinished(false);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing || finished) return;
    if (visibleLines >= lines.length) {
      setFinished(true);
      setPlaying(false);
      return;
    }
    const line = lines[visibleLines];
    const delay = line.delay;
    timerRef.current = setTimeout(() => {
      setVisibleLines((v) => v + 1);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, visibleLines, finished, lines]);

  // Auto-play on mount and on pipeline switch
  useEffect(() => {
    play();
  }, [activePipeline, play]);

  const pipelines = [
    { id: "autoedit", label: "autoedit", desc: "Full pipeline" },
    { id: "automark", label: "automark", desc: "Plan only" },
    { id: "autocut", label: "autocut", desc: "From SRT" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
      <div className="border-t pt-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:pt-20">
        {/* Section header */}
        <div className="mx-auto max-w-3xl pb-8 text-center">
          <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-indigo-200/50">
            <span className="inline-flex bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
              Live Demo
            </span>
          </div>
          <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
            Try it in your browser
          </h2>
          <p className="text-lg text-indigo-200/65">
            Watch hermes-editing-yt process a real video — step by step.
            Pick a pipeline below.
          </p>
        </div>

        {/* Pipeline selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePipeline(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activePipeline === p.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-gray-800/60 text-indigo-200/65 hover:bg-gray-700/60 hover:text-white"
              }`}
            >
              <span className="font-mono">{p.label}</span>
              <span className="ml-1.5 opacity-60">— {p.desc}</span>
            </button>
          ))}
        </div>

        {/* Terminal */}
        <motion.div
          key={activePipeline}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto rounded-xl bg-gray-950 border border-gray-800 shadow-2xl overflow-hidden"
        >
          {/* Terminal title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-gray-800">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-indigo-200/40 font-mono">
              hermes-cli — {activePipeline}
            </span>
          </div>

          {/* Terminal output */}
          <div className="p-4 sm:p-6 min-h-[280px] font-mono text-sm leading-relaxed overflow-x-auto">
            <AnimatePresence mode="popLayout">
              {lines.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`whitespace-pre-wrap ${line.className || "text-indigo-200/50"}`}
                >
                  {line.text || "\u00A0"}
                </motion.div>
              ))}
            </AnimatePresence>
            {!finished && playing && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-indigo-400 ml-0.5"
              />
            )}
            {finished && (
              <div className="mt-4">
                <button
                  onClick={play}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 12 12">
                    <path d="M3 1.5v9l7-4.5z" />
                  </svg>
                  Replay
                </button>
              </div>
            )}
          </div>

          {/* Fake input bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border-t border-gray-800">
            <span className="text-green-400 text-xs font-mono">$</span>
            <span className="text-indigo-200/30 text-xs font-mono italic">
              {finished
                ? "hermes run --pipeline " + activePipeline + " --input talk.mp4"
                : "Processing..."}
            </span>
          </div>
        </motion.div>

        {/* Caption */}
        <p className="text-center mt-6 text-xs text-indigo-200/30">
          Simulation — real outputs may vary by GPU, file size, and threshold config
        </p>
      </div>
    </section>
  );
}
