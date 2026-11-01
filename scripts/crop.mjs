import sharp from "sharp";

const [, , src, out, top, height, width] = process.argv;
const h = Number(height || 900);
const w = Number(width || 1440);
await sharp(src)
  .extract({ left: 0, top: Number(top || 0), width: w, height: h })
  .toFile(out);
console.log("ok", out);
