"use client";

// Note: previously used framer-motion with `whileInView` which left cards
// invisible (opacity: 0) if the IntersectionObserver never fired or the
// section was scrolled past before hydration. The cards now use a CSS-only
// fade-in via @starting-style / animation that has a visible final state —
// even with JS disabled, the cards render at full opacity.

const cards = [
  {
    id: "automark",
    label: "automark",
    iconColor: "text-emerald-400",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
      </svg>
    ),
    body: "Plan only, no rendering. Transcribe + silence detect + produce edit marks.",
    code: `hermes run --pipeline automark \\
  --input video.mp4`,
  },
  {
    id: "autocut",
    label: "autocut",
    iconColor: "text-cyan-400",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="4" cy="8" r="2.5" />
        <circle cx="12" cy="8" r="2.5" />
        <line x1="6.5" y1="8" x2="9.5" y2="8" />
      </svg>
    ),
    body: "Slice from existing SRT. Read subtitle timestamps and produce a cut video with no re-transcription.",
    code: `hermes run --pipeline autocut \\
  --input video.mp4 \\
  --srt subtitles.srt`,
  },
  {
    id: "autoedit",
    label: "autoedit",
    iconColor: "text-indigo-400",
    badge: "v1.0",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 5h12M2 8h12M2 11h12" />
        <circle cx="4" cy="5" r="0.8" fill="currentColor" />
        <circle cx="8" cy="8" r="0.8" fill="currentColor" />
        <circle cx="12" cy="11" r="0.8" fill="currentColor" />
      </svg>
    ),
    body: "v1.0 preview. Transcribe, detect silence, render. Expect rough edges — early release.",
    code: `hermes run --pipeline autoedit \\
  --input video.mp4 \\
  --output edited.mp4 \\
  --threshold 0.5`,
  },
];

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

          {/* Cards — always visible, CSS-only fade-in (no JS dependency) */}
          <div className="mx-auto grid max-w-sm items-start gap-6 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
            {cards.map((c) => (
              <article
                key={c.id}
                className="relative rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-5 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
              >
                <div className="mb-3">
                  <span className="relative inline-flex items-center gap-1.5 rounded-full bg-gray-800/60 px-2.5 py-0.5 text-xs font-normal">
                    <span className={c.iconColor}>{c.icon}</span>
                    {/* Solid color fallback + gradient text enhancement. If
                        bg-clip-text is unsupported, the text still reads as
                        gray-200. The gradient is the cherry on top. */}
                    <span
                      className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent"
                      style={{ color: "#e5e7eb" }}
                    >
                      {c.label}
                    </span>
                    {c.badge && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-medium">
                        {c.badge}
                      </span>
                    )}
                  </span>
                </div>
                <p className="mb-2 text-sm text-indigo-200/65">{c.body}</p>
                <pre className="overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-indigo-200/80">
                  <code>{c.code}</code>
                </pre>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
