"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// ── Word split animation ──────────────────────────────────────────
const WORDS = ["Your", "videos,", "editable", "by", "text"];

const wordVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

// ── Gyro / mouse parallax ─────────────────────────────────────────
function useParallax() {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isGyro, setIsGyro] = useState(false);

  // Gyroscope handler
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.gamma !== null && e.beta !== null) {
      setIsGyro(true);
      // gamma: left(-90) to right(90), beta: front(-180) to back(180)
      setRotateY(e.gamma * 0.03);
      setRotateX((e.beta - 90) * 0.03);
    }
  }, []);

  useEffect(() => {
    // Try gyroscope
    const gyroSupported =
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent;

    if (gyroSupported) {
      // iOS 13+ requires permission
      (DeviceOrientationEvent as any).requestPermission()
        .then((state: string) => {
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(() => {
          // Not available or denied — fall through to mouse
        });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, [handleOrientation]);

  // Mouse fallback for desktop
  useEffect(() => {
    if (isGyro) return; // don't clobber gyro with mouse

    const handleMouse = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setRotateY((e.clientX - cx) / cx / 25);
      setRotateX((e.clientY - cy) / cy / -25);
    };

    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [isGyro]);

  return { rotateX, rotateY };
}

// ── Component ──────────────────────────────────────────────────────
export default function HeroHome() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax values for decorative elements
  const illuY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const illuRotate = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  const gyro = useParallax();

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Background image with gyro parallax */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{
          rotateX: gyro.rotateX,
          rotateY: gyro.rotateY,
          perspective: 800,
        }}
      >
        <div
          className="absolute inset-0 bg-[url('/hermes-editing-yt/images/editing-desk.jpg')] bg-cover bg-center opacity-[0.08]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-linear-to-b from-gray-950 via-gray-950/95 to-gray-950" />
      </motion.div>

      {/* Scroll parallax decorative illustration */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/4"
        style={{ y: illuY, rotate: illuRotate, opacity: bgOpacity }}
        aria-hidden="true"
      >
        <img
          src="/hermes-editing-yt/_next/static/media/page-illustration.3cec8b53.svg"
          alt=""
          className="max-w-none"
          width={846}
          height={594}
        />
      </motion.div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="pb-12 text-center md:pb-20">
            {/* Animated hero words */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              className="inline-flex flex-wrap justify-center gap-x-[0.25em] pb-5"
              style={{ perspective: 800 }}
            >
              {WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  custom={i}
                  variants={wordVariants}
                  className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
                  style={{
                    display: "inline-block",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>

            <div className="mx-auto max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 text-xl text-indigo-200/65"
              >
                Subtitle-driven auto video editor. GPU Whisper large-v3.{" "}
                Hermes MCP plugin. One-line install.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
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
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                >
                  <a
                    className="btn relative w-full bg-linear-to-b from-gray-700 to-gray-700/90 bg-[length:100%_100%] bg-[bottom] text-white font-medium before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-600),var(--color-gray-500),var(--color-gray-600))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                    href="https://github.com/Capslockb/hermes-editing-yt"
                  >
                    View on GitHub
                  </a>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
