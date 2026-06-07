"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    label: "Transcribe",
    title: "GPU Whisper large-v3",
    desc: "Automatic transcription with near-perfect accuracy. Fast enough for iterative editing.",
    img: "/hermes-editing-yt/images/editing-desk.jpg",
  },
  {
    num: "02",
    label: "Analyze",
    title: "Smart Silence Detection",
    desc: "Detects pauses and sentence boundaries. Mark what to keep, cut the rest.",
    img: "/hermes-editing-yt/images/code-screen.jpg",
  },
  {
    num: "03",
    label: "Render",
    title: "ffmpeg + libx264",
    desc: "Renders the final cut at sentence boundaries. SRT/ASS subtitle support built in.",
    img: "/hermes-editing-yt/images/server-rack.jpg",
  },
];

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

                  {/* Image */}
                  <motion.div
                    className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-gray-800/60"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${step.img})` }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-950/90 via-gray-950/30 to-transparent" />
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
