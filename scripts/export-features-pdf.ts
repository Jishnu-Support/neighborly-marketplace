import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

async function exportFeaturesPdf() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const outDir = path.join(process.cwd(), "public");
  const artifactDir = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\0fe4e467-267e-429d-ae61-38221343dd7c";

  const htmlUrl = "file:///" + path.join(outDir, "platform-features-spec.html").replace(/\\/g, "/");

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
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    console.log("Rendering Features Document from:", htmlUrl);
    await page.goto(htmlUrl, { waitUntil: "networkidle0" });

    const pdfPublic = path.join(outDir, "bizearch-platform-features.pdf");
    const pdfArtifact = path.join(artifactDir, "bizearch-platform-features.pdf");

    await page.pdf({
      path: pdfPublic,
      format: "A4",
      printBackground: true,
      margin: {
        top: "14mm",
        right: "12mm",
        bottom: "14mm",
        left: "12mm"
      },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 8pt; color: #64748b; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; align-items: center;">
          <span>Bizearch.in &bull; Platform Features Specification</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });

    fs.copyFileSync(pdfPublic, pdfArtifact);
    console.log("PDF generated successfully:", pdfPublic);
    console.log("PDF copied to artifacts:", pdfArtifact);
  } finally {
    await browser.close();
  }
}

exportFeaturesPdf().catch((err) => {
  console.error("Export error:", err);
  process.exit(1);
});
