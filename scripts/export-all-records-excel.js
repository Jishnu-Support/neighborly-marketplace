import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const content = fs.readFileSync('app/home-client.tsx', 'utf8');
const match = content.match(/const initialBusinesses: Business\[\] = (\[[\s\S]*?\n\];)/);
let jsonStr = match[1].trim();
if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
const list = new Function('return ' + jsonStr)();

console.log('Successfully loaded ' + list.length + ' businesses from app/home-client.tsx');

function determineSubSector(b) {
  const isCommonPlace = b.category === 'Public & Common Places' || (b.categories && b.categories.includes('Public & Common Places'));
  if (isCommonPlace) return 'Civic & Public Services';
  
  const name = b.name.toLowerCase();
  const desc = (b.description || '').toLowerCase();
  const cat = b.category || '';
  const subcats = (b.subcategories || []).map(s => s.toLowerCase());
  const tags = (b.taxonomyTags || []).map(t => t.toLowerCase());
  const products = (b.products || []).map(p => (p.name + ' ' + (p.description || '')).toLowerCase());
  const allText = name + ' ' + desc + ' ' + subcats.join(' ') + ' ' + tags.join(' ') + ' ' + products.join(' ');

  if (cat === 'Health & wellness' && /hospital|clinic|lungs care|dental|laser/.test(allText)) {
    return 'Services';
  }
  if (/academy|institute|college/.test(name) || cat === 'Education & Coaching') {
    return 'Services';
  }
  if (/dealership|authorized dealer|showroom & service|sales and service|sales & full after-sales|sales of.*service/.test(allText)) {
    return 'Sales & Services';
  }
  if ((allText.includes('sales') || allText.includes('showroom') || allText.includes('dealer')) && (allText.includes('service') || allText.includes('repair') || allText.includes('maintenance'))) {
    return 'Sales & Services';
  }

  if (['Education & Coaching', 'Events & Weddings', 'Everyday services'].includes(cat)) return 'Services';
  if (cat === 'Sports & fitness' && !/sports store|equipment shop/.test(allText)) return 'Services';
  if (cat === 'Travel') return 'Services';
  if (cat === 'Real Estate & Construction' && /contractor|architect|consultant|builders/.test(allText)) return 'Services';
  if (cat === 'Heavy Industries & Machinery' && /hire|rental|contractor|movers|services/.test(allText)) return 'Services';
  if (cat === 'Industrial & B2B Manufacturing') return 'Sales & Services (Manufacturing & Fabrication)';

  if (['Food & dining', 'Fashion', 'Books & Stationery', 'Toys & Fancy Stores', 'Hardware'].includes(cat)) return 'Sales';
  if (cat === 'Health & wellness' && /pharmacy|chemist|medical store/.test(allText)) return 'Sales';
  if (cat === 'Home & furniture' && /supermarket|departmental|grocery/.test(allText)) return 'Sales';
  if (cat === 'Electricals' && !/service|installation|repair/.test(allText)) return 'Sales';

  const hasSales = /sales|retail|store|shop|showroom|dealer|bakery|cafe|restaurant|jeweller|pharmacy|supermarket|bazaar/.test(allText);
  const hasService = /service|repair|maintenance|hospital|clinic|treatment|coaching|gym|fitness|consulting|contractor|rental|lodging|hotel|resort/.test(allText);

  if (hasSales && hasService) return 'Sales & Services';
  if (hasSales) return 'Sales';
  if (hasService) return 'Services';
  return 'Sales & Services';
}

function formatRow(b, idx) {
  const isCommonPlace = b.category === 'Public & Common Places' || (b.categories && b.categories.includes('Public & Common Places'));
  const addr = b.address || {};
  const fullAddress = [
    addr.doorNumber,
    addr.street,
    addr.area,
    addr.cityTown,
    addr.taluka,
    addr.district ? (addr.district + ' District') : '',
    addr.state ? (addr.state + (addr.pincode ? ' - ' + addr.pincode : '')) : addr.pincode
  ].filter(Boolean).join(', ');

  const offerings = (b.products || []).map(p => {
    let priceStr = '';
    if (typeof p.price === 'number') {
      priceStr = ' (₹' + p.price.toLocaleString('en-IN') + (p.unit ? '/' + p.unit : '') + ')';
    } else if (p.price) {
      priceStr = ' (' + p.price + ')';
    }
    return p.name + priceStr;
  }).join('; ');

  return {
    'S.No': idx + 1,
    'Record Type': isCommonPlace ? 'Common Place' : 'Business',
    'Business / Place Name': b.name || '',
    'Mobile / Contact Number': b.phone || '',
    'Sector (Category)': b.category || '',
    'Sub Sector (Activity)': determineSubSector(b),
    'Sub Categories': (b.subcategories || []).join(', '),
    'Door / Building No.': addr.doorNumber || '',
    'Street / Landmark': addr.street || '',
    'Locality / Area': addr.area || '',
    'City / Town': addr.cityTown || 'Hosur',
    'Taluka': addr.taluka || 'Hosur Taluk',
    'District': addr.district || 'Krishnagiri',
    'State': addr.state || 'Tamil Nadu',
    'Pincode': addr.pincode || '635109',
    'Full Formatted Address': fullAddress,
    'Latitude': b.coordinates ? b.coordinates.latitude : (b.demoCoordinates ? b.demoCoordinates.latitude : ''),
    'Longitude': b.coordinates ? b.coordinates.longitude : (b.demoCoordinates ? b.demoCoordinates.longitude : ''),
    'Rating': b.rating || '',
    'Review Count': b.reviews || '',
    'Price Info': b.price || '',
    'Tag / Badge': b.tag || '',
    'Key Offerings & Products': offerings,
    'Full Description': b.description || '',
    'Taxonomy & Search Tags': (b.taxonomyTags || []).join(', ')
  };
}

const allRows = list.map((b, idx) => formatRow(b, idx));
const businessRows = allRows.filter(r => r['Record Type'] === 'Business').map((r, i) => ({ ...r, 'S.No': i + 1 }));
const commonPlaceRows = allRows.filter(r => r['Record Type'] === 'Common Place').map((r, i) => ({ ...r, 'S.No': i + 1 }));

console.log('All records:', allRows.length);
console.log('Businesses:', businessRows.length);
console.log('Common places:', commonPlaceRows.length);

const sectorStats = {};
allRows.forEach(r => {
  const cat = r['Sector (Category)'];
  const type = r['Record Type'];
  const sub = r['Sub Sector (Activity)'];
  if (!sectorStats[cat]) {
    sectorStats[cat] = { Sector: cat, 'Record Type': type, 'Total Count': 0, 'Sales': 0, 'Services': 0, 'Sales & Services': 0, 'Civic Services': 0 };
  }
  sectorStats[cat]['Total Count']++;
  if (sub.includes('Civic')) sectorStats[cat]['Civic Services']++;
  else if (sub.includes('&')) sectorStats[cat]['Sales & Services']++;
  else if (sub.includes('Sales')) sectorStats[cat]['Sales']++;
  else sectorStats[cat]['Services']++;
});

const summaryRows = Object.values(sectorStats);

const wb = XLSX.utils.book_new();

const wsAll = XLSX.utils.json_to_sheet(allRows);
const wsBiz = XLSX.utils.json_to_sheet(businessRows);
const wsPlaces = XLSX.utils.json_to_sheet(commonPlaceRows);
const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

const colWidths = [
  { wch: 6 },
  { wch: 14 },
  { wch: 38 },
  { wch: 22 },
  { wch: 26 },
  { wch: 24 },
  { wch: 32 },
  { wch: 18 },
  { wch: 32 },
  { wch: 28 },
  { wch: 14 },
  { wch: 16 },
  { wch: 16 },
  { wch: 14 },
  { wch: 10 },
  { wch: 60 },
  { wch: 12 },
  { wch: 12 },
  { wch: 8 },
  { wch: 12 },
  { wch: 20 },
  { wch: 24 },
  { wch: 60 },
  { wch: 60 },
  { wch: 45 }
];

wsAll['!cols'] = colWidths;
wsBiz['!cols'] = colWidths;
wsPlaces['!cols'] = colWidths;
wsSummary['!cols'] = [
  { wch: 30 },
  { wch: 16 },
  { wch: 14 },
  { wch: 12 },
  { wch: 12 },
  { wch: 18 },
  { wch: 16 }
];

XLSX.utils.book_append_sheet(wb, wsAll, 'All 122 Records');
XLSX.utils.book_append_sheet(wb, wsBiz, '113 Businesses');
XLSX.utils.book_append_sheet(wb, wsPlaces, '9 Common Places');
XLSX.utils.book_append_sheet(wb, wsSummary, 'Sector Summary');

const paths = [
  'bizearch-all-122-businesses-and-common-places.xlsx',
  'public/bizearch-all-122-businesses-and-common-places.xlsx',
  'C:/Users/HP/.gemini/antigravity/brain/0fe4e467-267e-429d-ae61-38221343dd7c/bizearch-all-122-businesses-and-common-places.xlsx'
];

paths.forEach(p => {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    XLSX.writeFile(wb, p);
    console.log('Saved XLSX to:', p);
  } catch (err) {
    console.error('Failed to write to', p, err.message);
  }
});

const csvContent = XLSX.utils.sheet_to_csv(wsAll);
const csvPaths = [
  'bizearch-all-122-businesses-and-common-places.csv',
  'public/bizearch-all-122-businesses-and-common-places.csv',
  'C:/Users/HP/.gemini/antigravity/brain/0fe4e467-267e-429d-ae61-38221343dd7c/bizearch-all-122-businesses-and-common-places.csv'
];

csvPaths.forEach(cp => {
  try {
    fs.mkdirSync(path.dirname(cp), { recursive: true });
    fs.writeFileSync(cp, csvContent, 'utf8');
    console.log('Saved CSV to:', cp);
  } catch (err) {
    console.error('Failed to write CSV to', cp, err.message);
  }
});
