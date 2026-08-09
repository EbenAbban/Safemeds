// Generates the PWA icon set from the brand mark in src/app/icon.svg.
//
// Run once and commit the output — this is not a build step, so the production
// build never depends on sharp being installable:
//
//   node scripts/generate-icons.mjs
//
// Uses the sharp that ships with Next.js.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("sharp is required to regenerate icons. Install it with: npm i -D sharp");
  process.exit(1);
}

// The brand mark, inlined so the script stays independent of how Next handles
// src/app/icon.svg. `rounded` matches the favicon; `fullBleed` is for maskable
// and Apple touch icons, where the platform applies its own mask and any
// corner radius we bake in shows up as ugly clipping.
const mark = ({ rounded }) => `
<svg width="512" height="512" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="#16a34a"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" ${rounded ? 'rx="16"' : ""} fill="url(#g)"/>
  <rect x="27" y="14" width="10" height="36" rx="3" fill="white"/>
  <rect x="14" y="27" width="36" height="10" rx="3" fill="white"/>
</svg>`;

const targets = [
  { file: "icon-192.png", size: 192, rounded: true },
  { file: "icon-512.png", size: 512, rounded: true },
  // Maskable: Android crops to a platform-chosen shape (circle, squircle…).
  // The cross occupies the middle ~56% of the canvas, comfortably inside the
  // 80% safe zone, so no extra padding is needed — only the full bleed.
  { file: "icon-maskable-512.png", size: 512, rounded: false },
  // iOS ignores maskable and applies its own corner radius.
  { file: "apple-touch-icon.png", size: 180, rounded: false },
];

await mkdir(outDir, { recursive: true });

for (const { file, size, rounded } of targets) {
  const png = await sharp(Buffer.from(mark({ rounded })))
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(path.join(outDir, file), png);
  console.log(`wrote public/icons/${file} (${size}x${size})`);
}
