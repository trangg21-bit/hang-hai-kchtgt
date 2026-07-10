const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/trangtt1/Hàng Hải/docs/intel/modules/M-004.data.json', 'utf8'));
const cat = JSON.parse(fs.readFileSync('C:/Users/trangtt1/Hàng Hải/docs/intel/catalog.json', 'utf8'));
const m004 = cat.modules['M-004'];

const base = 'C:/Users/trangtt1/Hàng Hải/docs/modules/M-004-quan-ly-tai-san-bao-hieu-thong-tin/_features/';

const featureIds = ['F-079','F-080','F-081','F-082','F-083','F-084','F-085',
  'F-086','F-087','F-088','F-089','F-090','F-091',
  'F-092','F-093','F-094','F-095','F-096','F-097',
  'F-098','F-099','F-100','F-101','F-102','F-103',
  'F-104','F-105','F-106','F-107','F-108','F-109',
  'F-110','F-111','F-112','F-113','F-114','F-115',
  'F-116','F-117','F-118','F-119','F-120','F-121'];

featureIds.forEach(fid => {
  const featureData = data.features.find(f => f.id === fid);
  const catalogEntry = m004.features[fid];
  
  if (catalogEntry) {
    // Update name from M-004.data.json (has proper diacritics)
    catalogEntry.name = featureData.name;
    
    // Update feature-brief.md frontmatter name
    const dirName = fid + '-' + catalogEntry.slug;
    const briefPath = base + dirName + '/feature-brief.md';
    let brief = fs.readFileSync(briefPath, 'utf8');
    
    // Replace name in YAML frontmatter
    brief = brief.replace(/^(name: ").*?(\n)/m, '$1' + featureData.name + '$2');
    // Replace feature title
    brief = brief.replace(/^(# Feature: ).*?\n/m, '$1' + featureData.name + '\n');
    
    fs.writeFileSync(briefPath, brief, 'utf8');
  }
});

fs.writeFileSync('C:/Users/trangtt1/Hàng Hải/docs/intel/catalog.json', JSON.stringify(cat, null, 2), 'utf8');
console.log('Updated names for 43 features from M-004.data.json');
