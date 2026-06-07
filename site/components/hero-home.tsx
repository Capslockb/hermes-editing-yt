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

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export default function HeroHome() {
  return (
    <section className="relative">
      {/* Background image with overlay */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-[url('/hermes-editing-yt/images/editing-desk.jpg')] bg-cover bg-center opacity-[0.08]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-linear-to-b from-gray-950 via-gray-950/95 to-gray-950" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
                variants={itemVariants}
              >
                Your videos, editable by text
              </motion.h1>
              <div className="mx-auto max-w-3xl">
                <motion.p
                  className="mb-8 text-xl text-indigo-200/65"
                  variants={itemVariants}
                >
                  Subtitle-driven auto video editor. GPU Whisper large-v3. Hermes
                  MCP plugin. One-line install.
                </motion.p>
                <motion.div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  variants={itemVariants}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <a
                      className="btn group mb-4 w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                      href="#install"
                    >
                      <span className="relative inline-flex items-center">
                        Install Now
                        <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                          -&gt;
                        </span>
                      </span>
                    </a>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <a
                      className="btn relative w-full bg-linear-to-b from-gray-800 to-gray-800/60 bg-[length:100%_100%] bg-[bottom] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                      href="https://github.com/Capslockb/hermes-editing-yt"
                    >
                      View on GitHub
                    </a>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
