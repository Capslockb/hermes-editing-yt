"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    label: "Transcribe",
    title: "GPU Whisper large-v3",
    desc: "Automatic transcription with near-perfect accuracy. Fast enough for iterative editing.",
    illust: "transcribe",
  },
  {
    num: "02",
    label: "Analyze",
    title: "Smart Silence Detection",
    desc: "Detects pauses and sentence boundaries. Mark what to keep, cut the rest.",
    illust: "analyze",
  },
  {
    num: "03",
    label: "Render",
    title: "ffmpeg + libx264",
    desc: "Renders the final cut at sentence boundaries. SRT/ASS subtitle support built in.",
    illust: "render",
  },
];

function Illust({ name }: { name: string }) {
  if (name === "transcribe") {
    // Audio waveform with subtitle ribbon
    return (
      <svg
        viewBox="0 0 200 150"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* waveform bars */}
        {Array.from({ length: 28 }).map((_, i) => {
          const h = 10 + Math.abs(Math.sin(i * 0.7) * 60) + (i % 3) * 6;
          return (
            <rect
              key={i}
              x={10 + i * 6.5}
              y={75 - h / 2}
              width="3.5"
              height={h}
              rx="1.5"
              fill="url(#wf)"
            />
          );
        })}
        {/* subtitle ribbon */}
        <rect
          x="20"
          y="118"
          width="160"
          height="18"
          rx="3"
          fill="#0b1220"
          stroke="#1f2937"
          strokeWidth="0.5"
        />
        <rect x="28" y="124" width="48" height="3" rx="1.5" fill="#a5b4fc" />
        <rect x="28" y="129" width="80" height="3" rx="1.5" fill="#6366f1" opacity="0.7" />
      </svg>
    );
  }
  if (name === "analyze") {
    // Sentence with a cut/snip between two segments
    return (
      <svg
        viewBox="0 0 200 150"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="snip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        {/* kept segment 1 */}
        <rect x="20" y="50" width="55" height="8" rx="2" fill="#a5b4fc" />
        <rect x="20" y="62" width="40" height="8" rx="2" fill="#a5b4fc" opacity="0.7" />
        {/* gap indicator (silence) */}
        <line
          x1="85"
          x2="115"
          y1="60"
          y2="60"
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text
          x="100"
          y="55"
          textAnchor="middle"
          fontSize="7"
          fill="#64748b"
          fontFamily="ui-monospace, monospace"
        >
          silence
        </text>
        {/* scissors / snip icon at the cut point */}
        <g transform="translate(100 78)">
          <circle cx="-4" cy="0" r="3" fill="none" stroke="url(#snip)" strokeWidth="1.2" />
          <circle cx="4" cy="0" r="3" fill="none" stroke="url(#snip)" strokeWidth="1.2" />
          <line x1="-4" y1="0" x2="4" y2="0" stroke="url(#snip)" strokeWidth="1.2" />
        </g>
        {/* kept segment 2 */}
        <rect x="125" y="50" width="55" height="8" rx="2" fill="#a5b4fc" />
        <rect x="140" y="62" width="40" height="8" rx="2" fill="#a5b4fc" opacity="0.7" />
        {/* timeline ruler */}
        <line x1="20" y1="110" x2="180" y2="110" stroke="#1f2937" strokeWidth="0.8" />
        {/* keep bars (green) */}
        <rect x="20" y="105" width="55" height="10" rx="2" fill="#22c55e" opacity="0.55" />
        <rect x="85" y="105" width="30" height="10" rx="2" fill="#334155" opacity="0.6" />
        <rect x="125" y="105" width="55" height="10" rx="2" fill="#22c55e" opacity="0.55" />
      </svg>
    );
  }
  // render — film strip / frame sequence
  return (
    <svg
      viewBox="0 0 200 150"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="film" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      {/* film strip */}
      <rect x="10" y="40" width="180" height="70" rx="4" fill="#0b1220" stroke="url(#film)" strokeWidth="1" />
      {/* sprocket holes top */}
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={`t${i}`}
          x={16 + i * 20}
          y={46}
          width="12"
          height="4"
          rx="1"
          fill="#1f2937"
        />
      ))}
      {/* sprocket holes bottom */}
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={`b${i}`}
          x={16 + i * 20}
          y={100}
          width="12"
          height="4"
          rx="1"
          fill="#1f2937"
        />
      ))}
      {/* frames */}
      {Array.from({ length: 3 }).map((_, i) => (
        <g key={`f${i}`}>
          <rect
            x={26 + i * 56}
            y={56}
            width="48"
            height="38"
            rx="2"
            fill="url(#film)"
            opacity={0.4 + i * 0.2}
          />
          <path
            d={`M${38 + i * 56} 75 L${48 + i * 56} 65 L${60 + i * 56} 75 L${48 + i * 56} 85 Z`}
            fill="#a5b4fc"
            opacity="0.9"
          />
        </g>
      ))}
      {/* playhead */}
      <line x1="100" y1="38" x2="100" y2="112" stroke="#22d3ee" strokeWidth="1.2" />
      <circle cx="100" cy="38" r="2" fill="#22d3ee" />
    </svg>
  );
}

export default function PipelineFlow() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
        {/* Section header */}
        <div className="mx-auto max-w-3xl pb-12 text-center">
          <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-indigo-200/50">
            <span className="inline-flex bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
              Pipeline
            </span>
          </div>
          <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
            From video to edit in three steps
          </h2>
          <p className="text-lg text-indigo-200/65">
            Transcribe, detect silence, render. Each stage is a standalone tool you can also use independently.
          </p>
        </div>

        {/* Pipeline flow */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-px bg-linear-to-r from-indigo-500/20 via-indigo-500/40 to-indigo-500/20 -translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative group"
              >
                {/* Arrow connector (mobile) */}
                {i < STEPS.length - 1 && (
                  <div className="lg:hidden flex justify-center py-2">
                    <svg className="w-5 h-5 text-indigo-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}

                {/* Node */}
                <div className="flex flex-col items-center">
                  {/* Step number */}
                  <div className="relative mb-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
                      <span className="text-indigo-300 font-bold text-sm">{step.num}</span>
                    </div>
                    {/* Desktop arrow */}
                    {i < STEPS.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 left-full w-8 translate-x-2 -translate-y-1/2">
                        <svg className="w-full text-indigo-400/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Illustration */}
                  <motion.div
                    className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-gray-800/60 bg-gray-950"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Illust name={step.illust} />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-950/80 via-gray-950/20 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs font-semibold text-indigo-300 bg-gray-950/60 px-2 py-0.5 rounded-full">
                        {step.label}
                      </span>
                    </div>
                  </motion.div>

                  {/* Text */}
                  <div className="text-center">
                    <h3 className="font-nacelle text-lg font-semibold text-gray-200 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-indigo-200/65 leading-relaxed max-w-xs">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
