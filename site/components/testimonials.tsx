"use client";

import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Testimonials() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center">
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              See it in action
            </h2>
            <p className="text-lg text-indigo-200/65">
              Three pipelines for different depths of automation.
            </p>
          </div>

          {/* Cards */}
          <motion.div
            className="mx-auto grid max-w-sm items-start gap-6 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Card 1 — automark */}
            <motion.article
              className="relative rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-5 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
              variants={cardVariants}
            >
              <div className="mb-3">
                <span className="btn-sm relative inline-block rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-gray-700/.15),--theme(--color-gray-700/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
                  <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                    automark
                  </span>
                </span>
              </div>
              <p className="mb-2 text-sm text-indigo-200/65">
                Plan only, no rendering. Transcribe + silence detect + produce
                edit marks.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-indigo-200/80">
                <code>{`hermes run --pipeline automark \\\
  --input video.mp4`}</code>
              </pre>
            </motion.article>

            {/* Card 2 — autocut */}
            <motion.article
              className="relative rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-5 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
              variants={cardVariants}
            >
              <div className="mb-3">
                <span className="btn-sm relative inline-block rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-gray-700/.15),--theme(--color-gray-700/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
                  <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                    autocut
                  </span>
                </span>
              </div>
              <p className="mb-2 text-sm text-indigo-200/65">
                Slice from existing SRT. Read subtitle timestamps and produce a
                cut video with no re-transcription.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-indigo-200/80">
                <code>{`hermes run --pipeline autocut \\\
  --input video.mp4 \\\
  --srt subtitles.srt`}</code>
              </pre>
            </motion.article>

            {/* Card 3 — autoedit */}
            <motion.article
              className="relative rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-5 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
              variants={cardVariants}
            >
              <div className="mb-3">
                <span className="btn-sm relative inline-block rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-gray-700/.15),--theme(--color-gray-700/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
                  <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                    autoedit
                  </span>
                </span>
              </div>
              <p className="mb-2 text-sm text-indigo-200/65">
                Full pipeline. Transcribe, detect silence, render final cut.
                One command, done.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-indigo-200/80">
                <code>{`hermes run --pipeline autoedit \\\
  --input video.mp4 \\\
  --output edited.mp4 \\\
  --threshold 0.5`}</code>
              </pre>
            </motion.article>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
