const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  console.log('Generating pristine PWA and WebAPK icons...');

  // 1. Get trimmed source logo
  const trimmed = await sharp('public/bizearch-logo.png')
    .trim()
    .toBuffer({ resolveWithObject: true });

  const logoWidth = trimmed.info.width;
  const logoHeight = trimmed.info.height;
  const aspectRatio = logoWidth / logoHeight;
  console.log('Trimmed source logo:', logoWidth, 'x', logoHeight, 'Aspect:', aspectRatio);

  // In a 512x512 square, safe zone circle has diameter 410px (radius 205px).
  // Target width 370px ensures all 4 corners of the logo bounding box sit comfortably inside 193px radius.
  const targetWidth = 370;
  const targetHeight = Math.round(targetWidth / aspectRatio);
  console.log('Target logo size inside 512x512:', targetWidth, 'x', targetHeight);

  const resizedLogo = await sharp(trimmed.data)
    .resize(targetWidth, targetHeight, { fit: 'contain' })
    .toBuffer();

  // Create 512x512 master icon on pure white (#ffffff) background
  const master512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: resizedLogo,
      gravity: 'centre'
    }
  ])
  .png()
  .toBuffer();

  // Write 512x512 icons
  await sharp(master512).toFile('public/icon-512.png');
  await sharp(master512).toFile('public/icon-maskable-512.png');
  await sharp(master512).toFile('public/bizearch-square.png'); // Replace legacy square icon
  console.log('Saved 512x512 icons: icon-512.png, icon-maskable-512.png, bizearch-square.png');

  // Generate 192x192
  const icon192 = await sharp(master512)
    .resize(192, 192)
    .png()
    .toBuffer();
  await sharp(icon192).toFile('public/icon-192.png');
  await sharp(icon192).toFile('public/icon-maskable-192.png');
  console.log('Saved 192x192 icons: icon-192.png, icon-maskable-192.png');

  // Generate 384x384
  await sharp(master512)
    .resize(384, 384)
    .png()
    .toFile('public/icon-384.png');
  console.log('Saved 384x384 icon');

  // Generate apple-touch-icon 180x180
  await sharp(master512)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Saved apple-touch-icon.png');

  // Also create a clean square SVG for bizearch-mark.svg
  const base64Png = master512.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#ffffff"/>
  <image href="data:image/png;base64,${base64Png}" width="512" height="512"/>
</svg>`;
  fs.writeFileSync('public/bizearch-mark.svg', svgContent, 'utf8');
  console.log('Updated public/bizearch-mark.svg to clean 512x512 SVG');

  // Clean up any test file
  if (fs.existsSync('public/bizearch-square-new-test.png')) {
    fs.unlinkSync('public/bizearch-square-new-test.png');
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
