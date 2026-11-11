import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

async function exportPosters() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const outDir = path.join(process.cwd(), "public");
  const artifactDir = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\0fe4e467-267e-429d-ae61-38221343dd7c";

  const p1Url = "file:///" + path.join(outDir, "poster-merchant.html").replace(/\\/g, "/");
  const p2Url = "file:///" + path.join(outDir, "poster-features.html").replace(/\\/g, "/");

  console.log("Launching Chrome at:", chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--allow-file-access-from-files",
      "--hide-scrollbars"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1420, deviceScaleFactor: 2 });

    // Poster 1: Merchant Growth
    console.log("Rendering Poster 1 from:", p1Url);
    await page.goto(p1Url, { waitUntil: "networkidle0" });
    
    const p1PngPublic = path.join(outDir, "poster-1-business-growth.png");
    const p1PdfPublic = path.join(outDir, "poster-1-business-growth.pdf");
    const p1PngArtifact = path.join(artifactDir, "poster-1-business-growth.png");
    const p1PdfArtifact = path.join(artifactDir, "poster-1-business-growth.pdf");

    await page.screenshot({ path: p1PngPublic, fullPage: true });
    await page.pdf({
      path: p1PdfPublic,
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    fs.copyFileSync(p1PngPublic, p1PngArtifact);
    fs.copyFileSync(p1PdfPublic, p1PdfArtifact);
    console.log("Saved Poster 1 PNG and PDF.");

    // Poster 2: All Features
    console.log("Rendering Poster 2 from:", p2Url);
    await page.goto(p2Url, { waitUntil: "networkidle0" });

    const p2PngPublic = path.join(outDir, "poster-2-all-features.png");
    const p2PdfPublic = path.join(outDir, "poster-2-all-features.pdf");
    const p2PngArtifact = path.join(artifactDir, "poster-2-all-features.png");
    const p2PdfArtifact = path.join(artifactDir, "poster-2-all-features.pdf");

    await page.screenshot({ path: p2PngPublic, fullPage: true });
    await page.pdf({
      path: p2PdfPublic,
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    fs.copyFileSync(p2PngPublic, p2PngArtifact);
    fs.copyFileSync(p2PdfPublic, p2PdfArtifact);
    console.log("Saved Poster 2 PNG and PDF.");

    console.log("All posters exported successfully from file URLs!");
  } finally {
    await browser.close();
  }
}

exportPosters().catch((err) => {
  console.error("Export error:", err);
  process.exit(1);
});
