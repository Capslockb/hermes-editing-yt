"use client";

import { motion } from "framer-motion";

export default function Community() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge: new release */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600/15 border border-indigo-500/30 px-4 py-1.5 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-300 tracking-wider uppercase">
              New Release — v1.0.0
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl"
          >
            Built by one dev, for everyone
          </motion.h2>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-indigo-200/65 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            <span className="text-gray-200 font-medium">hermes-editing-yt</span> is a fresh
            v1.0 release — built solo by{" "}
            <a
              href="https://github.com/Capslockb"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              Capslockb
            </a>
            . No team, no funding, no VC. Just a tool I needed for myself.
          </motion.p>

          {/* Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left"
          >
            {/* Card 1 */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-5 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Contribute</h3>
              <p className="text-indigo-200/60 text-xs leading-relaxed">
                Found a bug? Want a feature? PRs welcome. The project is open source and
                actively maintained.
              </p>
              <a
                href="https://github.com/Capslockb/hermes-editing-yt/blob/main/CONTRIBUTING.md"
                className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Contributing guide →
              </a>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-5 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 3.5a6.5 6.5 0 00-6.5 6.5c0 2.87 1.86 5.31 4.44 6.17.33.06.44-.14.44-.31v-1.1c-1.8.39-2.18-.87-2.18-.87-.3-.75-.72-.95-.72-.95-.59-.4.04-.39.04-.39.65.05.99.67.99.67.58.99 1.52.7 1.89.54.06-.42.23-.7.42-.86-1.44-.16-2.96-.72-2.96-3.2 0-.7.25-1.28.66-1.73-.07-.16-.29-.82.06-1.71 0 0 .54-.17 1.77.66a6.13 6.13 0 013.22 0c1.23-.83 1.77-.66 1.77-.66.35.89.13 1.55.06 1.71.41.45.66 1.03.66 1.73 0 2.49-1.52 3.04-2.97 3.2.23.2.44.6.44 1.22v1.81c0 .17.11.37.45.31A6.5 6.5 0 0016.5 10 6.5 6.5 0 0010 3.5z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Open Issues</h3>
              <p className="text-indigo-200/60 text-xs leading-relaxed">
                Good first issues tagged for new contributors. Pick one up or
                suggest your own improvement.
              </p>
              <a
                href="https://github.com/Capslockb/hermes-editing-yt/issues"
                className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Browse issues →
              </a>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-5 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9 2a8 8 0 000 16v-2a6 6 0 110-12V2zm4.3 2.3l-1.4 1.4A4 4 0 0110 4.83V2.84a6 6 0 014.3 7.76l-1.43-1.43A4 4 0 0013.3 4.3z" />
                  <path d="M12.3 8.3l-1.4 1.4a2 2 0 01-2.83-2.83l1.4-1.4a2 2 0 012.83 2.83z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Spread the word</h3>
              <p className="text-indigo-200/60 text-xs leading-relaxed">
                Star the repo, share it with your team, or write about it. Every
                bit helps a solo dev project grow.
              </p>
              <a
                href="https://github.com/Capslockb/hermes-editing-yt"
                className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Star on GitHub →
              </a>
            </div>
          </motion.div>

          {/* Solo dev footer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-xs text-indigo-200/30"
          >
            v1.0.0 &middot; MIT &middot; built by{" "}
            <a href="https://github.com/Capslockb" className="underline hover:text-indigo-400 transition-colors">
              @Capslockb
            </a>{" "}
            &middot;{" "}
            <a href="https://github.com/Capslockb/hermes-editing-yt/graphs/contributors" className="underline hover:text-indigo-400 transition-colors">
              first contributors welcome
            </a>
          </motion.p>
        </div>
      </div>
    </section>
  );
}
