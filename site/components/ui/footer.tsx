import Image from "next/image";
import FooterIllustration from "@/public/images/footer-illustration.svg";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Footer illustration */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
          aria-hidden="true"
        >
          <Image
            className="max-w-none"
            src={FooterIllustration}
            width={1076}
            height={378}
            alt="Footer illustration"
          />
        </div>

        <div className="flex flex-col items-center py-10 text-center md:py-16">
          {/* Brand row */}
          <div className="mb-6 flex items-center gap-2">
            <img
              src="/hermes-editing-yt/images/hermes-mark.svg"
              alt="Hermes Agent"
              className="w-5 h-5 text-indigo-400/60"
            />
            <span className="font-nacelle text-lg font-semibold text-gray-200">
              hermes-editing-yt
            </span>
          </div>

          {/* Contact — primary way to reach the maintainer */}
          <div className="mb-6 max-w-xl">
            <p className="text-xs uppercase tracking-wider text-indigo-300/70 font-semibold mb-2">
              Get in touch
            </p>
            <p className="text-sm text-indigo-200/80 mb-3">
              Bug reports, feature requests, collaboration, or just to say
              it works — open an issue, send a PR, or ping me directly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <a
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-800/70 border border-gray-700/60 px-3 py-1.5 text-gray-200 hover:text-white hover:border-indigo-500/50 transition"
                href="https://github.com/Capslockb/hermes-editing-yt/issues"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.77.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.61-5.49 5.91.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 0z" />
                </svg>
                <span>Issues</span>
              </a>
              <a
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-800/70 border border-gray-700/60 px-3 py-1.5 text-gray-200 hover:text-white hover:border-indigo-500/50 transition"
                href="https://github.com/Capslockb/hermes-editing-yt/discussions"
              >
                <svg
                  className="w-4 h-4"
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
                <span>Discussions</span>
              </a>
              <a
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-800/70 border border-gray-700/60 px-3 py-1.5 text-gray-200 hover:text-white hover:border-indigo-500/50 transition"
                href="https://github.com/Capslockb"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.77.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.61-5.49 5.91.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 0z" />
                </svg>
                <span>@Capslockb</span>
              </a>
            </div>
          </div>

          {/* Legal + meta row */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-indigo-200/65">
            <span>© 2026 Capslockb</span>
            <span className="hidden sm:inline text-indigo-200/30">·</span>
            <a
              className="hover:text-indigo-300 transition"
              href="https://github.com/Capslockb/hermes-editing-yt/blob/main/LICENSE"
            >
              MIT License
            </a>
            <span className="hidden sm:inline text-indigo-200/30">·</span>
            <a
              className="hover:text-indigo-300 transition"
              href="https://github.com/Capslockb/hermes-editing-yt"
            >
              Source
            </a>
          </div>

          {/* Solo-dev credit — capslockb-oriented footing */}
          <p className="text-xs text-indigo-200/40 max-w-md">
            Built and maintained solo by{" "}
            <a
              href="https://github.com/Capslockb"
              className="underline hover:text-indigo-300 transition"
            >
              Capslockb
            </a>
            . No team, no funding, no VC. Just a tool I needed for myself — open
            source because someone else might too.
          </p>
        </div>
      </div>
    </footer>
  );
}
