"use client";

export default function HeroHome() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              Your videos, editable by text
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-indigo-200/65"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                Subtitle-driven auto video editor. GPU Whisper large-v3.{" "}
                Hermes MCP plugin. One-line install.
              </p>
              <div
                className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                data-aos="fade-up"
                data-aos-delay={400}
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
                <a
                  className="btn relative w-full bg-linear-to-b from-gray-700 to-gray-700 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                  href="https://github.com/Capslockb/hermes-editing-yt"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>

          {/* Big contact choice — gives visitors a third top-level action
              in the first viewport. Three pills, no fence-sitting. */}
          <div
            className="mx-auto max-w-3xl"
            data-aos="fade-up"
            data-aos-delay={600}
          >
            <p className="mb-3 text-center text-xs uppercase tracking-wider text-indigo-300/70 font-semibold">
              Or pick how you want to connect
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                className="group relative flex flex-col items-start rounded-2xl border border-gray-800/80 bg-gray-900/60 p-4 text-left transition hover:border-indigo-500/50 hover:bg-gray-900/90"
                href="https://github.com/Capslockb/hermes-editing-yt/issues"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20">
                  <svg
                    className="h-4 w-4 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-200 mb-1 group-hover:text-white">
                  Found a bug?
                </h3>
                <p className="text-xs text-indigo-200/65 leading-relaxed">
                  Open an issue. Crash logs, expected vs actual, your OS — all
                  welcome.
                </p>
              </a>
              <a
                className="group relative flex flex-col items-start rounded-2xl border border-gray-800/80 bg-gray-900/60 p-4 text-left transition hover:border-indigo-500/50 hover:bg-gray-900/90"
                href="https://github.com/Capslockb/hermes-editing-yt/discussions"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20">
                  <svg
                    className="h-4 w-4 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.97-4.03 9-9 9a8.96 8.96 0 0 1-4.4-1.15L3 21l1.15-4.6A8.96 8.96 0 0 1 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-200 mb-1 group-hover:text-white">
                  Want a feature?
                </h3>
                <p className="text-xs text-indigo-200/65 leading-relaxed">
                  Start a discussion. Show me your workflow — I'll see what
                  fits.
                </p>
              </a>
              <a
                className="group relative flex flex-col items-start rounded-2xl border border-gray-800/80 bg-gray-900/60 p-4 text-left transition hover:border-indigo-500/50 hover:bg-gray-900/90"
                href="https://github.com/Capslockb/hermes-editing-yt"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20">
                  <svg
                    className="h-4 w-4 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6H5.515m7.477 6L20 18m-7.477-6L11 5.882"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-200 mb-1 group-hover:text-white">
                  Just like it?
                </h3>
                <p className="text-xs text-indigo-200/65 leading-relaxed">
                  Star the repo. Every star helps a solo dev keep going.
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
