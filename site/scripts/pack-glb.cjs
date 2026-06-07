// Pack multi-file glTF into a single .glb so GitHub Pages serves it
// (Pages doesn't serve .bin or .gltf external buffer references).
//
// Usage: node scripts/pack-glb.cjs <input.gltf> <output.glb>
const fs = require('fs');
const path = require('path');
const { NodeIO } = require('@gltf-transform/core');

async function pack(inputGltf, outputGlb) {
  const io = new NodeIO();
  const doc = await io.read(inputGltf);
  // .write() with { format: 'glb' } produces a single binary file
  // with all textures and buffers inlined. No external references.
  const glb = await io.writeBinary(doc);
  fs.writeFileSync(outputGlb, glb);
  const sizeMB = (glb.byteLength / 1024 / 1024).toFixed(2);
  console.log(`  wrote ${outputGlb} (${sizeMB} MB)`);
}

(async () => {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Usage: node pack-glb.cjs <input.gltf> <output.glb>');
    process.exit(1);
  }
  console.log(`Packing ${input} -> ${output}`);
  await pack(input, output);
})();
