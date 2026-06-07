// Mobile audit for hermes-editing-yt
// Loads the live site at iPhone 12 Pro viewport and screenshots each
// section. Also runs a few assertions for common mobile bugs:
//  - horizontal overflow (should be 0px)
//  - tiny touch targets (>= 44px)
//  - the copy button in how-it-works must not be clipped

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const URL = "https://capslockb.github.io/hermes-editing-yt/";
const OUT = "/home/caps/hermes-workspace/veo-editor-build/veo-editor/screenshots";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  // Use the full Chromium binary (already cached), not the headless
  // shell which isn't installed in this image.
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/home/caps/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(`console.error: ${m.text()}`);
  });

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  // Let 3D models + framer animations settle
  await page.waitForTimeout(2500);

  // 1. Horizontal overflow
  const docOverflow = await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    return { docW, winW, overflow: Math.max(0, docW - winW) };
  });
  console.log("[doc overflow]", JSON.stringify(docOverflow));

  // 2. Find the copy buttons in the how-it-works section and check
  //    that their bounding box is fully inside the viewport.
  const copyButtons = await page.locator("#how-it-works button:has-text('Copy')").all();
  console.log(`[copy buttons in how-it-works] ${copyButtons.length}`);
  for (let i = 0; i < copyButtons.length; i++) {
    const box = await copyButtons[i].boundingBox();
    if (!box) continue;
    const right = box.x + box.width;
    const inside = right <= 390 + 1; // 1px tolerance
    console.log(
      `  [${i}] x=${box.x.toFixed(0)} w=${box.width.toFixed(0)} right=${right.toFixed(0)} insideViewport=${inside}`,
    );
  }

  // 3. Touch-target sizes
  const tinyTargets = await page.evaluate(() => {
    const sel = "button, a[href]";
    const els = document.querySelectorAll(sel);
    const tiny = [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // Only count visible elements in viewport
      if (r.top > window.innerHeight) return;
      if (r.bottom < 0) return;
      if (r.width < 44 || r.height < 44) {
        tiny.push({
          tag: el.tagName,
          text: (el.textContent || "").trim().slice(0, 30),
          w: r.width,
          h: r.height,
        });
      }
    });
    return tiny.slice(0, 10);
  });
  console.log(`[touch targets < 44x44]`, JSON.stringify(tinyTargets, null, 2));

  // 4. Screenshots of each section
  const sections = [
    "how-it-works",
    "features",
    "pipelines",
    "tech",
    "resources",
    "install",
  ];
  for (const s of sections) {
    try {
      const el = await page.locator(`#${s}`).first();
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(OUT, `mobile-${s}.png`),
          fullPage: false,
        });
        console.log(`[screenshot] mobile-${s}.png`);
      }
    } catch (e) {
      console.log(`[screenshot skip] ${s}: ${e.message}`);
    }
  }

  // 5. Full-page screenshot
  await page.screenshot({
    path: path.join(OUT, "mobile-full.png"),
    fullPage: true,
  });
  console.log(`[screenshot] mobile-full.png`);

  console.log(`[page errors] ${errs.length}`);
  errs.forEach((e) => console.log(`  ${e}`));

  await browser.close();
  console.log("DONE");
})();
