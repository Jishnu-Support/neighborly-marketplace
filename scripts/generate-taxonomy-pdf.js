import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rawData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "taxonomy-tree-data.json"), "utf8"));

// Macro sectors mapping
const macroDivisions = [
  {
    name: "Mobility & Heavy Industry",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    sectors: ["Automobiles", "Heavy Industries & Machinery", "Industrial & B2B Manufacturing"],
  },
  {
    name: "Technology, Electrical & Hardware",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    sectors: ["Electronics", "Electricals", "Hardware", "Home Appliances"],
  },
  {
    name: "Living, Property & Retail",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    sectors: ["Real Estate & Construction", "Home & furniture", "Fashion", "Books & Stationery", "Toys & Fancy Stores"],
  },
  {
    name: "Community, Dining & Healthcare",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    sectors: ["Food & dining", "Health & wellness", "Sports & fitness", "Public & Common Places"],
  },
  {
    name: "Services, Events & Logistics",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    sectors: ["Everyday services", "Events & Weddings", "Travel"],
  },
  {
    name: "Agriculture, Nurseries & Education",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    sectors: ["Agriculture, Nurseries & Pets", "Education & Coaching"],
  },
];

function buildSectorTree(paths) {
  const tree = {};
  for (const p of paths) {
    const l1 = (p[0] || "General").trim();
    const l2 = (p[1] || "General").trim();
    const l3 = (p[2] || "").trim();
    const l4 = (p[3] || "").trim();

    if (!tree[l1]) tree[l1] = {};
    if (!tree[l1][l2]) tree[l1][l2] = [];

    let leaf = "";
    if (l3 && l4) {
      leaf = `${l3} (${l4})`;
    } else if (l3) {
      leaf = l3;
    } else if (l4) {
      leaf = l4;
    }

    if (leaf && !tree[l1][l2].includes(leaf)) {
      tree[l1][l2].push(leaf);
    }
  }
  return tree;
}

let sectorsHtml = "";

rawData.sectors.forEach((sector, index) => {
  const tree = buildSectorTree(sector.paths);
  const subSectorKeys = Object.keys(tree);

  let totalSubcats = 0;
  let totalLeaves = 0;
  for (const s of subSectorKeys) {
    const subcats = Object.keys(tree[s]);
    totalSubcats += subcats.length;
    for (const sc of subcats) {
      totalLeaves += tree[s][sc].length;
    }
  }

  // Find macro division
  const macro = macroDivisions.find((m) => m.sectors.includes(sector.name)) || macroDivisions[0];

  // Visual Mind Map rendering
  let mindMapBranchesHtml = "";
  subSectorKeys.forEach((subSector) => {
    const subcatObj = tree[subSector];
    const subcatKeys = Object.keys(subcatObj);

    let subcatNodesHtml = "";
    subcatKeys.slice(0, 6).forEach((scKey) => {
      const leaves = subcatObj[scKey];
      const previewLeaves = leaves.slice(0, 3).join(", ") + (leaves.length > 3 ? ` +${leaves.length - 3} more` : "");

      subcatNodesHtml += `
        <div class="tree-subcat-node">
          <div class="tree-subcat-header">
            <span class="subcat-bullet">▸</span>
            <strong>${scKey}</strong>
            <span class="subcat-badge">${leaves.length} types</span>
          </div>
          ${previewLeaves ? `<div class="tree-leaf-preview">${previewLeaves}</div>` : ""}
        </div>
      `;
    });

    if (subcatKeys.length > 6) {
      subcatNodesHtml += `
        <div class="tree-subcat-more">+ ${subcatKeys.length - 6} additional subcategories in table below</div>
      `;
    }

    mindMapBranchesHtml += `
      <div class="tree-subsector-card">
        <div class="tree-subsector-title">
          <span class="pill-dot"></span>
          <span>${subSector}</span>
          <span class="subsector-badge">${subcatKeys.length} subcategories</span>
        </div>
        <div class="tree-subcat-container">
          ${subcatNodesHtml}
        </div>
      </div>
    `;
  });

  // Detailed Classification Table
  let tableRowsHtml = "";
  let rowIndex = 1;
  subSectorKeys.forEach((subSector) => {
    const subcatObj = tree[subSector];
    const subcatKeys = Object.keys(subcatObj);

    subcatKeys.forEach((scKey, scIdx) => {
      const leaves = subcatObj[scKey];
      const itemsFormatted = leaves.length > 0 ? leaves.join(" • ") : "Standard Sector Specifications";

      tableRowsHtml += `
        <tr>
          <td class="col-idx">${rowIndex++}</td>
          <td class="col-subsector"><strong>${subSector}</strong></td>
          <td class="col-subcat">${scKey}</td>
          <td class="col-offerings">${itemsFormatted}</td>
        </tr>
      `;
    });
  });

  sectorsHtml += `
    <section class="sector-page">
      <div class="sector-header" style="border-left: 6px solid ${macro.color};">
        <div class="sector-title-row">
          <div class="sector-name-box">
            <span class="sector-icon">${sector.icon}</span>
            <div>
              <div class="sector-tag" style="color: ${macro.color}; background: ${macro.bg}; border: 1px solid ${macro.border};">
                ${macro.name} · SECTOR #${index + 1}
              </div>
              <h2 class="sector-name">${sector.name}</h2>
            </div>
          </div>
          <div class="sector-stats">
            <div class="stat-pill"><strong>${subSectorKeys.length}</strong> Sub-Sectors</div>
            <div class="stat-pill"><strong>${totalSubcats}</strong> Subcategories</div>
            <div class="stat-pill"><strong>${totalLeaves}</strong> Classified Nodes</div>
          </div>
        </div>
      </div>

      <div class="mindmap-container">
        <div class="mindmap-label">🌲 ${sector.name} — Visual Taxonomy Mind Map</div>
        <div class="mindmap-root-banner" style="background: ${macro.bg}; border-color: ${macro.border};">
          <span style="font-size: 16px;">${sector.icon}</span>
          <strong>${sector.name} Core Sector</strong>
          <span style="font-size: 10px; color: #64748b;">(Structural Root)</span>
        </div>
        <div class="tree-subsectors-grid">
          ${mindMapBranchesHtml}
        </div>
      </div>

      <div class="table-container avoid-break">
        <div class="table-label">📋 Full Taxonomy Structure & Scope (Without Data)</div>
        <table class="taxonomy-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 25%;">Sub-Sector (Vertical)</th>
              <th style="width: 30%;">Subcategory (Classification Group)</th>
              <th style="width: 40%;">Core Scope / Classifications / Types</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </section>
  `;
});

// Table of Contents HTML
let tocHtml = "";
rawData.sectors.forEach((s, i) => {
  const tree = buildSectorTree(s.paths);
  const subKeys = Object.keys(tree);
  let subcatCount = 0;
  for (const k of subKeys) subcatCount += Object.keys(tree[k]).length;

  tocHtml += `
    <div class="toc-item">
      <span class="toc-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="toc-icon">${s.icon}</span>
      <span class="toc-name"><strong>${s.name}</strong></span>
      <span class="toc-dots"></span>
      <span class="toc-meta">${subKeys.length} sub-sectors · ${subcatCount} subcategories</span>
    </div>
  `;
});

// Macro divisions summary cards
let macroCardsHtml = "";
macroDivisions.forEach((m) => {
  macroCardsHtml += `
    <div class="macro-card" style="border-top: 4px solid ${m.color}; background: #ffffff;">
      <h4 style="color: ${m.color}; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${m.name}</h4>
      <div style="font-size: 10.5px; color: #334155; line-height: 1.5;">
        ${m.sectors.map((sec) => `• <strong>${sec}</strong>`).join("<br>")}
      </div>
    </div>
  `;
});

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bizearch Enterprise Taxonomy & Category Hierarchy Tree</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10.5px;
      line-height: 1.45;
    }
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 96vh;
      padding: 15px 0;
    }
    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 15px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 800;
      color: #166534;
      letter-spacing: -0.5px;
    }
    .brand-mark {
      width: 26px;
      height: 26px;
      background: #166534;
      color: #ffffff;
      border-radius: 6px;
      display: grid;
      place-items: center;
      font-size: 14px;
      font-weight: 900;
    }
    .cover-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 5px 12px;
      background: #f1f5f9;
      color: #475569;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
    }
    .cover-hero {
      margin: 35px 0;
    }
    .cover-pretitle {
      font-size: 11px;
      font-weight: 800;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    .cover-title {
      font-size: 32px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin: 0 0 14px 0;
      letter-spacing: -0.8px;
    }
    .cover-subtitle {
      font-size: 14px;
      color: #475569;
      max-width: 650px;
      line-height: 1.6;
      margin: 0;
    }
    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 25px 0;
    }
    .meta-box strong {
      display: block;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .meta-box span {
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .cover-clusters {
      margin: 25px 0;
    }
    .clusters-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    .macro-card {
      padding: 12px 14px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
    .toc-page {
      page-break-after: always;
      padding-top: 10px;
    }
    .toc-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 15px 0;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 25px;
      row-gap: 6px;
    }
    .toc-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5px;
      padding: 3px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
    .toc-num {
      font-weight: 800;
      color: #94a3b8;
      width: 18px;
    }
    .toc-icon {
      font-size: 12px;
    }
    .toc-name {
      color: #1e293b;
      white-space: nowrap;
    }
    .toc-dots {
      flex: 1;
    }
    .toc-meta {
      font-size: 8.5px;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }
    .sector-page {
      page-break-before: always;
      padding-top: 5px;
    }
    .sector-header {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .sector-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sector-name-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sector-icon {
      font-size: 26px;
      line-height: 1;
    }
    .sector-tag {
      display: inline-block;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 2px 7px;
      border-radius: 4px;
      margin-bottom: 2px;
    }
    .sector-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .sector-stats {
      display: flex;
      gap: 6px;
    }
    .stat-pill {
      font-size: 8.5px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      color: #334155;
    }
    .stat-pill strong {
      color: #0f172a;
    }
    .mindmap-container {
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 14px;
    }
    .mindmap-label {
      font-size: 10px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .mindmap-root-banner {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid;
      font-size: 10.5px;
      margin-bottom: 10px;
    }
    .tree-subsectors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    .tree-subsector-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .tree-subsector-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .pill-dot {
      width: 6px;
      height: 6px;
      background: #166534;
      border-radius: 50%;
    }
    .subsector-badge {
      font-size: 7.5px;
      background: #f1f5f9;
      color: #475569;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: auto;
      font-weight: 600;
    }
    .tree-subcat-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .tree-subcat-node {
      background: #f8fafc;
      border-left: 2px solid #94a3b8;
      padding: 4px 6px;
      border-radius: 0 4px 4px 0;
    }
    .tree-subcat-header {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      color: #1e293b;
    }
    .subcat-bullet {
      color: #64748b;
      font-size: 8px;
    }
    .subcat-badge {
      font-size: 7px;
      color: #64748b;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 1px 4px;
      border-radius: 3px;
      margin-left: auto;
    }
    .tree-leaf-preview {
      font-size: 8px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.3;
      padding-left: 10px;
    }
    .tree-subcat-more {
      font-size: 7.5px;
      color: #64748b;
      font-style: italic;
      text-align: center;
      padding-top: 2px;
    }
    .table-container {
      margin-top: 10px;
    }
    .table-label {
      font-size: 9.5px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .taxonomy-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      border: 1px solid #e2e8f0;
    }
    .taxonomy-table th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 5px 8px;
      font-weight: 700;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .taxonomy-table td {
      padding: 4.5px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }
    .taxonomy-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .col-idx {
      font-weight: 700;
      color: #94a3b8;
      text-align: center;
    }
    .col-subsector {
      color: #0f172a;
    }
    .col-subcat {
      font-weight: 700;
      color: #166534;
    }
    .col-offerings {
      color: #334155;
    }
    .avoid-break {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="brand-logo">
        <span class="brand-mark">B</span>
        <span>bizearch<span style="color: #22c55e;">.</span></span>
      </div>
      <div class="cover-badge">Architecture &amp; Taxonomy Reference Guide</div>
    </div>

    <div class="cover-hero">
      <div class="cover-pretitle">Platform Schema &amp; Classification Standards</div>
      <h1 class="cover-title">Enterprise Category Tree &amp; Mind Map</h1>
      <p class="cover-subtitle">
        A structured, multi-tier taxonomy and mind map covering all 22 commercial sectors, sub-sectors, and subcategory trees without merchant data. Designed for marketplace search indexing, business onboardings, cataloging, and local business directory mapping.
      </p>

      <div class="cover-meta-grid">
        <div class="meta-box">
          <strong>22</strong>
          <span>Commercial Sectors</span>
        </div>
        <div class="meta-box">
          <strong>114+</strong>
          <span>Sub-Sector Verticals</span>
        </div>
        <div class="meta-box">
          <strong>250+</strong>
          <span>Subcategory Groups</span>
        </div>
        <div class="meta-box">
          <strong>1,400+</strong>
          <span>Classified Offerings</span>
        </div>
      </div>

      <div class="cover-clusters">
        <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;">
          Macro-Industrial Sectors Architecture
        </div>
        <div class="clusters-grid">
          ${macroCardsHtml}
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div><strong>Bizearch Platform Engine</strong> · Powered by Jishnu Infotech</div>
      <div>Official Taxonomy Specification · Exported: ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="toc-page">
    <h2 class="toc-title">Table of Contents · Master Sector Directory</h2>
    <div class="toc-grid">
      ${tocHtml}
    </div>
  </div>

  <!-- SECTOR PAGES -->
  ${sectorsHtml}

</body>
</html>
`;

const htmlFilePath = path.join(process.cwd(), "scripts", "taxonomy-mindmap-guide.html");
fs.writeFileSync(htmlFilePath, htmlContent, "utf8");
console.log(`HTML generated at ${htmlFilePath} (${Math.round(htmlContent.length / 1024)} KB)`);

// Output PDF paths
const outputPdfPath = path.join(process.cwd(), "public", "bizearch-sectors-taxonomy-mindmap.pdf");
const appDataPdfPath = path.join("C:", "Users", "HP", ".gemini", "antigravity", "brain", "0fe4e467-267e-429d-ae61-38221343dd7c", "bizearch-sectors-taxonomy-mindmap.pdf");
const scratchPdfPath = path.join("C:", "Users", "HP", ".gemini", "antigravity", "scratch", "bizearch-sectors-taxonomy-mindmap.pdf");

// Try edge first, then chrome
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

console.log(`Compiling PDF using ${browserExe}...`);
execFileSync(browserExe, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${outputPdfPath}`,
  htmlFilePath,
]);

if (fs.existsSync(outputPdfPath)) {
  const stat = fs.statSync(outputPdfPath);
  console.log(`Successfully compiled PDF to: ${outputPdfPath} (${Math.round(stat.size / 1024)} KB)`);

  // Copy to artifacts and scratch
  fs.copyFileSync(outputPdfPath, appDataPdfPath);
  console.log(`Copied PDF to brain artifacts: ${appDataPdfPath}`);

  fs.copyFileSync(outputPdfPath, scratchPdfPath);
  console.log(`Copied PDF to scratch: ${scratchPdfPath}`);
} else {
  console.error("PDF generation failed: Output file not found.");
}
