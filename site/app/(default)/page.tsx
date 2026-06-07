import PageIllustration from "@/components/page-illustration";
import Hero from "@/components/hero-home";
import Workflows from "@/components/workflows";
import Features from "@/components/features";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";

export const metadata = {
  title: "hermes-editing-yt — Subtitle-Driven Auto Video Editor",
  description:
    "A subtitle-driven auto video editor. Hermes MCP plugin with GPU Whisper large-v3, ffmpeg+libx264. One-line npm-free installer.",
};

export default function Home() {
  return (
    <>
      <PageIllustration />
      <Hero />
      <Workflows />
      <Features />
      <Testimonials />
      <Cta />
    </>
  );
}
