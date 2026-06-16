const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\trangtt1\\Hàng Hải';

// Read data.json files
const m003Data = JSON.parse(fs.readFileSync(path.join(baseDir, 'docs', 'intel', 'modules', 'M-003.data.json'), 'utf8'));
const m004Data = JSON.parse(fs.readFileSync(path.join(baseDir, 'docs', 'intel', 'modules', 'M-004.data.json'), 'utf8'));

const implContent = '# Implementations placeholder\nwaves: []\ntasks: []\n';

function writeFeature(feature, module) {
    const targetDir = path.join(baseDir, 'docs', 'modules', module === 'M-003' ? 'M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts' : 'M-004-quan-ly-tai-san-bao-hieu-thong-tin');
    const featureDir = path.join(targetDir, '_features', feature.id);
    
    // Create directories
    if (!fs.existsSync(featureDir)) {
        fs.mkdirSync(featureDir, { recursive: true });
    }
    
    // Generate slug from name (convert to lowercase, replace spaces and diacritics)
    function generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/àáảãạăăắằẳẵặâầấẩẫậ/g, 'a')
            .replace(/đ/g, 'd')
            .replace(/èéẻẽẹêềếểễệ/g, 'e')
            .replace(/ìíỉĩị/g, 'i')
            .replace(/òóỏõọôồốổỗộơờớởỡợ/g, 'o')
            .replace(/ùúủũụưừứửữự/g, 'u')
            .replace(/ỳýỷỹỵ/g, 'y')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }
    
    // For features with existing names, use the data.json source to extract business rules
    const businessRules = feature.business_rules || [];
    const acr = feature.acceptance_criteria || [];
    
    const brief = `---
id: ${feature.id}
name: ${feature.name}
slug: ${generateSlug(feature.name)}
module: ${feature.module}
status: proposed
---

# ${feature.name}

## Description
${feature.scope || feature.name}

## Business Intent
${businessRules.join('. ')}

## Flow Summary
${feature.scope || feature.name}

## Acceptance Criteria
- ${acr.join('\n- ')}
`;
    
    fs.writeFileSync(path.join(featureDir, 'feature-brief.md'), brief, 'utf8');
    fs.writeFileSync(path.join(featureDir, 'implementations.yaml'), implContent, 'utf8');
    
    return feature.id;
}

// M-003: 30 features (F-038 to F-067)
console.log('Creating M-003 features...');
let m003Count = 0;
m003Data.features.forEach(f => {
    writeFeature(f, 'M-003');
    m003Count++;
});
console.log(`M-003: Created ${m003Count} features`);

// M-004: 54 features (F-068 to F-121)
console.log('Creating M-004 features...');
let m004Count = 0;
m004Data.features.forEach(f => {
    writeFeature(f, 'M-004');
    m004Count++;
});
console.log(`M-004: Created ${m004Count} features`);

console.log(`\nTotal: ${m003Count + m004Count} features created`);
