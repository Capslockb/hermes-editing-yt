"use client";

import dynamic from "next/dynamic";

const Hero = dynamic(() => import("@/components/hero-home"), { ssr: false });
const Workflows = dynamic(() => import("@/components/workflows"), { ssr: false });
const Features = dynamic(() => import("@/components/features"), { ssr: false });
const Showcase = dynamic(() => import("@/components/showcase"), { ssr: false });
const TerminalDemo = dynamic(() => import("@/components/terminal-demo"), { ssr: false });
const Testimonials = dynamic(() => import("@/components/testimonials"), { ssr: false });
const Cta = dynamic(() => import("@/components/cta"), { ssr: false });

export default function HomeClient() {
  return (
    <>
      <Hero />
      <Workflows />
      <Features />
      <Showcase />
      <TerminalDemo />
      <Testimonials />
      <Cta />
    </>
  );
}
