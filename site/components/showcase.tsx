"use client";

import { motion } from "framer-motion";

function CliIllust() {
  // Terminal + arrow showing text command becomes a cut
  return (
    <svg
      viewBox="0 0 400 225"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cliBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="cliAcc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill="url(#cliBg)" />
      {/* terminal window */}
      <rect x="40" y="40" width="220" height="145" rx="8" fill="#030712" stroke="#1f2937" strokeWidth="1" />
      {/* window dots */}
      <circle cx="56" cy="56" r="3" fill="#ef4444" />
      <circle cx="68" cy="56" r="3" fill="#f59e0b" />
      <circle cx="80" cy="56" r="3" fill="#22c55e" />
      <line x1="40" y1="72" x2="260" y2="72" stroke="#1f2937" strokeWidth="1" />
      {/* prompt lines */}
      <text x="56" y="96" fontFamily="ui-monospace, monospace" fontSize="10" fill="#a5b4fc">$</text>
      <text x="68" y="96" fontFamily="ui-monospace, monospace" fontSize="10" fill="#e5e7eb">hermes run --pipeline autoedit</text>
      <text x="56" y="116" fontFamily="ui-monospace, monospace" fontSize="10" fill="#64748b">  --input video.mp4</text>
      <text x="56" y="136" fontFamily="ui-monospace, monospace" fontSize="10" fill="#64748b">  --output edited.mp4</text>
      <text x="56" y="156" fontFamily="ui-monospace, monospace" fontSize="10" fill="#a5b4fc">$</text>
      <text x="68" y="156" fontFamily="ui-monospace, monospace" fontSize="10" fill="#22c55e">✓ done in 47s</text>
      <text x="56" y="176" fontFamily="ui-monospace, monospace" fontSize="10" fill="#a5b4fc">$</text>
      {/* cursor */}
      <rect x="68" y="168" width="7" height="11" fill="#a5b4fc" />
      {/* arrow to output video */}
      <g transform="translate(280 112)">
        <path d="M0 0 L24 0 M18 -5 L24 0 L18 5" stroke="url(#cliAcc)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* output video tile */}
      <rect x="310" y="80" width="60" height="65" rx="5" fill="#030712" stroke="url(#cliAcc)" strokeWidth="1.2" />
      <path d="M332 102 L344 112 L332 122 Z" fill="#a5b4fc" />
    </svg>
  );
}

function GpuIllust() {
  // GPU card outline with lightning/data flow
  return (
    <svg
      viewBox="0 0 400 225"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gpuBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="gpuAcc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill="url(#gpuBg)" />
      {/* GPU card */}
      <rect x="60" y="55" width="280" height="120" rx="10" fill="#030712" stroke="url(#gpuAcc)" strokeWidth="1.2" />
      {/* shroud vents */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1={78 + i * 16}
          y1={75}
          x2={78 + i * 16}
          y2={105}
          stroke="#1f2937"
          strokeWidth="1.5"
        />
      ))}
      {/* heatsink */}
      <rect x="78" y="115" width="244" height="30" rx="3" fill="#1f2937" />
      {Array.from({ length: 18 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={82 + i * 14}
          y1={120}
          x2={82 + i * 14}
          y2={140}
          stroke="#374151"
          strokeWidth="1"
        />
      ))}
      {/* fan */}
      <circle cx="200" cy="92" r="16" fill="#0b1220" stroke="#1f2937" strokeWidth="1" />
      <circle cx="200" cy="92" r="3" fill="#22d3ee" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i * Math.PI) / 3;
        return (
          <line
            key={`f${i}`}
            x1={200 + Math.cos(a) * 4}
            y1={92 + Math.sin(a) * 4}
            x2={200 + Math.cos(a) * 14}
            y2={92 + Math.sin(a) * 14}
            stroke="#22d3ee"
            strokeWidth="1.2"
            opacity="0.7"
          />
        );
      })}
      {/* power connector */}
      <rect x="60" y="55" width="6" height="14" fill="#374151" />
      {/* "RTX" badge */}
      <rect x="90" y="158" width="40" height="14" rx="2" fill="#22d3ee" opacity="0.15" stroke="#22d3ee" strokeWidth="0.5" />
      <text x="110" y="168" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontSize="8" fill="#22d3ee" fontWeight="600">
        LOCAL
      </text>
      {/* "local inference" subtitle indicator */}
      <circle cx="200" cy="165" r="3" fill="#22c55e" />
      <text x="208" y="168" fontFamily="ui-monospace, monospace" fontSize="8" fill="#22c55e">
        inference: local GPU
      </text>
    </svg>
  );
}

const items = [
  {
    illust: "cli",
    label: "CLI-first. No timeline, no dragging.",
  },
  {
    illust: "gpu",
    label: "GPU-accelerated. Local inference.",
  },
];

export default function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
        <div className="mx-auto max-w-3xl pb-8 text-center">
          <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
            Built for speed
          </h2>
          <p className="text-lg text-indigo-200/65">
            From development to deployment — one tool, one command.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative aspect-video rounded-2xl overflow-hidden group border border-gray-800/60 bg-gray-950"
            >
              {item.illust === "cli" ? <CliIllust /> : <GpuIllust />}
              <div className="absolute inset-0 bg-linear-to-t from-gray-950/80 via-gray-950/10 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-sm text-indigo-200/80 font-medium">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
