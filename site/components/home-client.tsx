"use client";

import dynamic from "next/dynamic";

const Hero = dynamic(() => import("@/components/hero-home"));
const PipelineFlow = dynamic(() => import("@/components/pipeline-flow"));
const Features = dynamic(() => import("@/components/features"));
const Showcase = dynamic(() => import("@/components/showcase"));
const TerminalDemo = dynamic(() => import("@/components/terminal-demo"));
const Community = dynamic(() => import("@/components/community"));
const Testimonials = dynamic(() => import("@/components/testimonials"));
const Cta = dynamic(() => import("@/components/cta"));

export default function HomeClient() {
  return (
    <>
      <Hero />
      <PipelineFlow />
      <Features />
      <Showcase />
      <TerminalDemo />
      <Community />
      <Testimonials />
      <Cta />
    </>
  );
}
