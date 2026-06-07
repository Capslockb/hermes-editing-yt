import PageIllustration from "@/components/page-illustration";
import HomeClient from "@/components/home-client";

export const metadata = {
  title: "hermes-editing-yt — Subtitle-Driven Auto Video Editor",
  description:
    "A subtitle-driven auto video editor. Hermes MCP plugin with GPU Whisper large-v3, ffmpeg+libx264. One-line npm-free installer.",
};

export default function Home() {
  return (
    <>
      <PageIllustration />
      <HomeClient />
    </>
  );
}
