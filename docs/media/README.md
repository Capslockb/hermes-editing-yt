# Visuals

This directory contains release imagery generated for the **v0.1.0** announcement
of Veo Editor. All images are MIT-licensed — the same license as the code. You
may reuse them in derivative projects, social cards, blog posts, and docs as
long as you keep the MIT notice in `LICENSE`.

## Files

| File | Use case | Size |
|---|---|---|
| `logo-icon.png` | App icon · favicon · 1:1 | ~1.1 MB |
| `hero-workstation.png` | README hero · landing banner · 16:9 | ~1.8 MB |
| `pipeline-3d.png` | README section · "how it works" social card · 16:9 | ~1.9 MB |
| `gpu-render.png` | README gallery · blog post · 16:9 | ~1.9 MB |

Mirrored copies live in `site/src/assets/media/` and `site/public/media/` for
the website build. The website itself is a 3D React + Three.js app under
[`site/`](../site/) — it does not embed these bitmaps at runtime (the 3D
canvas is the hero), but it links to them as the OpenGraph preview image.

## Generation provenance

The four images were generated on **2026-06-06** with `gpt-image-2-medium` via
the configured image backend. Prompts were:

1. `logo-icon.png` — *"Minimalist app icon for a video editor product, single
   3D letter V shape made of polished obsidian black glass with subtle cyan
   glow rim light, rounded square background with deep gradient from #0a0e1a
   to #1a1f3a, premium tech product icon style like Google Vids or Linear, no
   text, ultra clean, professional, square format"*

2. `hero-workstation.png` — *"Minimalist 3D isometric hero illustration of a
   film editing workstation, dark navy background, glowing cyan and magenta
   neon accents, a floating holographic timeline strip with cut markers, a
   translucent film reel spinning, soft volumetric lighting, glassy
   reflective surfaces, tech aesthetic inspired by Google Vids and Linear app
   design language, ultra clean composition, 16:9 cinematic, no text, no
   logos, no people"*

3. `pipeline-3d.png` — *"Abstract 3D data pipeline visualization, dark
   background with cyan and electric blue glowing nodes connected by neon
   lines, a video file on the left being sliced into segments, a GPU chip in
   the center rendering frames, an output video on the right, isometric
   perspective, glassy material, volumetric light beams, futuristic tech
   aesthetic, no text, no logos, no people, 16:9 cinematic"*

4. `gpu-render.png` — *"Futuristic 3D rendering of an NVIDIA RTX graphics
   card with glowing teal and magenta accents, in a glass case with subtle
   reflections, dark cinematic studio lighting, soft particles floating in
   the air, ultra-clean product photography style, no text, no logos, no
   people, 16:9 cinematic"*

## To regenerate

```bash
# From any Hermes chat
/image_generate "the same prompt as above" --aspect landscape
```

The output is saved to `~/.hermes/cache/images/`. Copy the new file into
this directory with the same name and re-run `cd site && npm run build`.

## Why no Google Images?

Google Images results are almost always All Rights Reserved unless the source
page explicitly says "free to use" or "no copyright". For release imagery you
control, generated assets are the safe default — no attribution graph to
maintain, no takedown risk, no surprise license change.
