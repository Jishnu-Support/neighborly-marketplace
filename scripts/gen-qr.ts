import QRCode from "qrcode";
import fs from "fs";
import path from "path";

async function main() {
  const url = "https://bizearch.in";
  const pngPath = path.join(process.cwd(), "public", "bizearch-qr.png");
  const svgPath = path.join(process.cwd(), "public", "bizearch-qr.svg");

  await QRCode.toFile(pngPath, url, {
    width: 600,
    margin: 1,
    color: { dark: "#002B49", light: "#FFFFFF" }
  });

  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: { dark: "#002B49", light: "#FFFFFF" }
  });

  fs.writeFileSync(svgPath, svg, "utf-8");
  console.log("QR Codes generated at:", pngPath, svgPath);
}

main().catch(console.error);
