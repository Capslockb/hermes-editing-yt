"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Showcase() {
  const images = [
    {
      src: "/hermes-editing-yt/images/code-screen.jpg",
      alt: "Code and development workstation",
      label: "CLI-first. No timeline, no dragging.",
    },
    {
      src: "/hermes-editing-yt/images/server-rack.jpg",
      alt: "GPU server infrastructure",
      label: "GPU-accelerated. Local inference.",
    },
  ];

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
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative rounded-2xl overflow-hidden group"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={1400}
                height={900}
                className="w-full h-auto object-cover aspect-video transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-gray-950/90 via-gray-950/20 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-sm text-indigo-200/80 font-medium">
                {img.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
