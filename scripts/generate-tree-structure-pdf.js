import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rawData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "taxonomy-tree-data.json"), "utf8"));

// 6 Macro Divisions
const macroDivisions = [
  {
    name: "Mobility & Heavy Industry",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#93c5fd",
    sectors: ["Automobiles", "Heavy Industries & Machinery", "Industrial & B2B Manufacturing"],
  },
  {
    name: "Technology, Electrical & Hardware",
    color: "#0e7490",
    bg: "#ecfeff",
    border: "#67e8f9",
    sectors: ["Electronics", "Electricals", "Hardware", "Home Appliances"],
  },
  {
    name: "Living, Property & Retail",
    color: "#047857",
    bg: "#f0fdf4",
    border: "#86efac",
    sectors: ["Real Estate & Construction", "Home & furniture", "Fashion", "Books & Stationery", "Toys & Fancy Stores"],
  },
  {
    name: "Community, Dining & Healthcare",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    sectors: ["Food & dining", "Health & wellness", "Sports & fitness", "Public & Common Places"],
  },
  {
    name: "Services, Events & Logistics",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    sectors: ["Everyday services", "Events & Weddings", "Travel"],
  },
  {
    name: "Agriculture & Education",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#86efac",
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
      leaf = `${l3} → ${l4}`;
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

// Generate the Macro Tree overview
let macroTreeHtml = `
  <div class="tree-root-container">
    <div class="root-badge">
      <span class="root-circle">🌳</span>
      <div>
        <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #166534; font-weight: 800;">Root Node</div>
        <div style="font-size: 14px; font-weight: 900; color: #0f172a;">BIZEARCH PLATFORM DIRECTORY (22 SECTORS)</div>
      </div>
    </div>
    <div class="macro-tree-branches">
`;

macroDivisions.forEach((macro) => {
  macroTreeHtml += `
    <div class="macro-branch-group">
      <div class="macro-node" style="border-left: 4px solid ${macro.color}; background: ${macro.bg};">
        <span class="macro-dot" style="background: ${macro.color};"></span>
        <strong style="color: ${macro.color};">${macro.name}</strong>
        <span class="macro-count">${macro.sectors.length} Sectors</span>
      </div>
      <div class="macro-sectors-subgroup">
  `;

  macro.sectors.forEach((secName) => {
    const secData = rawData.sectors.find((s) => s.name === secName);
    const icon = secData ? secData.icon : "📁";
    macroTreeHtml += `
      <div class="macro-sector-leaf">
        <span class="leaf-line"></span>
        <span class="leaf-icon">${icon}</span>
        <span class="leaf-name"><strong>${secName}</strong></span>
      </div>
    `;
  });

  macroTreeHtml += `
      </div>
    </div>
  `;
});

macroTreeHtml += `
    </div>
  </div>
`;

// Generate individual sector tree diagrams
let sectorPagesHtml = "";

rawData.sectors.forEach((sector, idx) => {
  const tree = buildSectorTree(sector.paths);
  const subSectorKeys = Object.keys(tree);
  const macro = macroDivisions.find((m) => m.sectors.includes(sector.name)) || macroDivisions[0];

  let subcatTotal = 0;
  let itemsTotal = 0;
  for (const k of subSectorKeys) {
    const scKeys = Object.keys(tree[k]);
    subcatTotal += scKeys.length;
    for (const sc of scKeys) {
      itemsTotal += tree[k][sc].length;
    }
  }

  let subSectorsTreeHtml = "";

  subSectorKeys.forEach((subSector, sIdx) => {
    const subcats = tree[subSector];
    const subcatKeys = Object.keys(subcats);

    let subcatBranchesHtml = "";

    subcatKeys.forEach((scName) => {
      const leaves = subcats[scName];

      let leavesHtml = "";
      if (leaves && leaves.length > 0) {
        leavesHtml = `
          <div class="leaves-container">
            ${leaves
              .map(
                (leaf) => `
              <div class="leaf-pill">
                <span class="leaf-bullet">•</span>
                <span class="leaf-text">${leaf}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      }

      subcatBranchesHtml += `
        <div class="subcat-tree-item">
          <div class="subcat-node">
            <span class="node-elbow">├──</span>
            <span class="node-folder">📂</span>
            <strong class="node-title">${scName}</strong>
            <span class="node-pill-count">${leaves.length} types</span>
          </div>
          ${leavesHtml}
        </div>
      `;
    });

    subSectorsTreeHtml += `
      <div class="subsector-tree-branch">
        <div class="subsector-node-header" style="border-left: 3px solid ${macro.color};">
          <span class="subsector-trunk-line"></span>
          <span class="subsector-pill-badge" style="background: ${macro.color};">${sIdx + 1}</span>
          <strong class="subsector-name">${subSector}</strong>
          <span class="subsector-meta">${subcatKeys.length} Subcategories</span>
        </div>
        <div class="subcat-tree-group">
          ${subcatBranchesHtml}
        </div>
      </div>
    `;
  });

  sectorPagesHtml += `
    <div class="sector-tree-page">
      <div class="sector-tree-header" style="border-bottom: 2px solid ${macro.color};">
        <div class="header-left">
          <span class="header-icon">${sector.icon}</span>
          <div>
            <div class="header-breadcrumb">${macro.name} / Sector #${idx + 1}</div>
            <h2 class="header-sector-title">${sector.name} — Tree Diagram</h2>
          </div>
        </div>
        <div class="header-stats">
          <span class="stat-badge"><strong>${subSectorKeys.length}</strong> Sub-Sectors</span>
          <span class="stat-badge"><strong>${subcatTotal}</strong> Subcategories</span>
          <span class="stat-badge"><strong>${itemsTotal}</strong> Leaf Classifications</span>
        </div>
      </div>

      <!-- VISUAL TREE DIAGRAM -->
      <div class="tree-canvas">
        <div class="tree-root-box" style="background: ${macro.bg}; border: 1.5px solid ${macro.border};">
          <span style="font-size: 16px;">${sector.icon}</span>
          <div>
            <div style="font-size: 7.5px; font-weight: 800; text-transform: uppercase; color: ${macro.color};">SECTOR ROOT NODE</div>
            <div style="font-size: 12px; font-weight: 800; color: #0f172a;">${sector.name}</div>
          </div>
        </div>

        <div class="tree-branches-wrapper">
          ${subSectorsTreeHtml}
        </div>
      </div>

      <div class="sector-footer-note">
        <span>🌲 Bizearch Platform Schema Hierarchy · Pure Taxonomic Tree Structure (Without Data)</span>
        <span>Sector ${idx + 1} of 22</span>
      </div>
    </div>
  `;
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bizearch Category & Sector Hierarchy Tree</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
      @bottom-right {
        content: "Page " counter(page);
        font-size: 8px;
        color: #94a3b8;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-size: 9px;
      line-height: 1.4;
    }
    .cover-page {
      page-break-after: always;
      min-height: 94vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px 0;
    }
    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #166534;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-logo-sq {
      width: 28px;
      height: 28px;
      background: #166534;
      color: #fff;
      border-radius: 6px;
      display: grid;
      place-items: center;
      font-size: 15px;
      font-weight: 900;
    }
    .badge-doc {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: #f1f5f9;
      color: #475569;
      padding: 4px 10px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
    }
    .cover-body {
      margin: 25px 0;
    }
    .cover-eyebrow {
      font-size: 9.5px;
      font-weight: 800;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 8px;
    }
    .cover-main-heading {
      font-size: 30px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 10px 0;
      letter-spacing: -0.6px;
      line-height: 1.15;
    }
    .cover-desc {
      font-size: 12px;
      color: #475569;
      max-width: 650px;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 25px;
    }
    .metric-cell strong {
      display: block;
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
    }
    .metric-cell span {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    /* MACRO TREE OVERVIEW */
    .macro-tree-wrapper {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .tree-root-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .root-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      padding: 8px 14px;
      border-radius: 8px;
    }
    .root-circle {
      font-size: 20px;
    }
    .macro-tree-branches {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding-left: 20px;
      border-left: 3px solid #cbd5e1;
      margin-left: 15px;
    }
    .macro-branch-group {
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .macro-node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9.5px;
      margin-bottom: 6px;
    }
    .macro-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .macro-count {
      font-size: 7.5px;
      color: #64748b;
      margin-left: auto;
      font-weight: 600;
    }
    .macro-sectors-subgroup {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-left: 12px;
      border-left: 1.5px dashed #cbd5e1;
      margin-left: 8px;
    }
    .macro-sector-leaf {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      color: #1e293b;
      padding: 1.5px 0;
    }
    .leaf-icon {
      font-size: 10px;
    }
    .cover-foot {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #94a3b8;
    }

    /* INDIVIDUAL SECTOR TREE PAGE */
    .sector-tree-page {
      page-break-before: always;
      padding-top: 5px;
    }
    .sector-tree-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-icon {
      font-size: 26px;
      line-height: 1;
    }
    .header-breadcrumb {
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.6px;
      margin-bottom: 2px;
    }
    .header-sector-title {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .header-stats {
      display: flex;
      gap: 5px;
    }
    .stat-badge {
      font-size: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 3px 6px;
      color: #334155;
    }

    /* TREE CANVAS */
    .tree-canvas {
      position: relative;
      padding-left: 10px;
    }
    .tree-root-box {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 6px;
      margin-bottom: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .tree-branches-wrapper {
      position: relative;
      padding-left: 20px;
      border-left: 2px solid #94a3b8;
      margin-left: 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .subsector-tree-branch {
      position: relative;
    }
    .subsector-node-header {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
    }
    .subsector-node-header::before {
      content: "";
      position: absolute;
      left: -22px;
      top: 50%;
      width: 20px;
      height: 2px;
      background: #94a3b8;
    }
    .subsector-pill-badge {
      color: #ffffff;
      font-size: 7px;
      font-weight: 800;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: grid;
      place-items: center;
    }
    .subsector-name {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
    }
    .subsector-meta {
      font-size: 7.5px;
      color: #64748b;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 4px;
    }

    /* SUBCATEGORY TWIGS */
    .subcat-tree-group {
      position: relative;
      padding-left: 18px;
      border-left: 1.5px solid #cbd5e1;
      margin-left: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .subcat-tree-item {
      position: relative;
    }
    .subcat-tree-item::before {
      content: "";
      position: absolute;
      left: -18px;
      top: 10px;
      width: 16px;
      height: 1.5px;
      background: #cbd5e1;
    }
    .subcat-node {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      color: #0f172a;
    }
    .node-elbow {
      color: #94a3b8;
      font-family: monospace;
      font-size: 9px;
    }
    .node-folder {
      font-size: 9px;
    }
    .node-title {
      font-size: 9px;
      font-weight: 700;
      color: #166534;
    }
    .node-pill-count {
      font-size: 7px;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0 4px;
      border-radius: 3px;
    }

    /* LEAF CLASSIFICATION PILLS */
    .leaves-container {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin-top: 4px;
      padding-left: 18px;
      border-left: 1px dashed #e2e8f0;
      margin-left: 12px;
    }
    .leaf-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 1.5px 5px;
      font-size: 7.5px;
      color: #334155;
    }
    .leaf-bullet {
      color: #94a3b8;
      font-size: 8px;
    }
    .leaf-text {
      line-height: 1.2;
    }

    .sector-footer-note {
      margin-top: 15px;
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE WITH MACRO-TREE -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="brand-title">
        <span class="brand-logo-sq">B</span>
        <span>bizearch<span style="color: #22c55e;">.</span></span>
      </div>
      <div class="badge-doc">Enterprise Taxonomy Tree Architecture</div>
    </div>

    <div class="cover-body">
      <div class="cover-eyebrow">Multi-Tier Classification Schema</div>
      <h1 class="cover-main-heading">Sector &amp; Subcategory Tree Structure</h1>
      <p class="cover-desc">
        A hierarchical tree diagram showing all 22 commercial sectors, sub-sector verticals, subcategory branches, and classified product/service leaves without store or merchant data.
      </p>

      <div class="metrics-row">
        <div class="metric-cell">
          <strong>22</strong>
          <span>Root Sectors</span>
        </div>
        <div class="metric-cell">
          <strong>114+</strong>
          <span>Sub-Sector Verticals</span>
        </div>
        <div class="metric-cell">
          <strong>250+</strong>
          <span>Subcategory Branches</span>
        </div>
        <div class="metric-cell">
          <strong>1,400+</strong>
          <span>Leaf Classifications</span>
        </div>
      </div>

      <div class="macro-tree-wrapper">
        <div style="font-size: 9.5px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px;">
          🌳 Master Macro-Divisions Tree Overview
        </div>
        ${macroTreeHtml}
      </div>
    </div>

    <div class="cover-foot">
      <div><strong>Bizearch Platform Directory</strong> · Built by Jishnu Infotech</div>
      <div>Official Tree Structure Specification · Date: ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>

  <!-- 22 INDIVIDUAL SECTOR TREE PAGES -->
  ${sectorPagesHtml}

</body>
</html>
`;

const htmlPath = path.join(process.cwd(), "scripts", "pure-tree-structure.html");
fs.writeFileSync(htmlPath, html, "utf8");
console.log(`Generated HTML Tree at: ${htmlPath} (${Math.round(html.length / 1024)} KB)`);

const outputPdfPath = path.join(process.cwd(), "public", "bizearch-sectors-tree-structure.pdf");
const appDataPdfPath = path.join("C:", "Users", "HP", ".gemini", "antigravity", "brain", "0fe4e467-267e-429d-ae61-38221343dd7c", "bizearch-sectors-tree-structure.pdf");
const scratchPdfPath = path.join("C:", "Users", "HP", ".gemini", "antigravity", "scratch", "bizearch-sectors-tree-structure.pdf");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

console.log(`Compiling tree PDF via ${browserExe}...`);
execFileSync(browserExe, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${outputPdfPath}`,
  htmlPath,
]);

if (fs.existsSync(outputPdfPath)) {
  const stat = fs.statSync(outputPdfPath);
  console.log(`Successfully compiled Tree PDF: ${outputPdfPath} (${Math.round(stat.size / 1024)} KB)`);

  fs.copyFileSync(outputPdfPath, appDataPdfPath);
  console.log(`Copied to brain artifacts: ${appDataPdfPath}`);

  fs.copyFileSync(outputPdfPath, scratchPdfPath);
  console.log(`Copied to scratch: ${scratchPdfPath}`);
} else {
  console.error("PDF generation failed: Output file not found.");
}
