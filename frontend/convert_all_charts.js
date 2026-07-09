import { parseS57, toGeoJSON } from '@s57-parser/s57';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OBJL_MAP = {
  3: 'ACHARE',
  5: 'BCNCAR',
  8: 'BCNLAT',
  12: 'BRIDGE',
  14: 'BUAARE',
  15: 'BOYCAR',
  17: 'BOYLAT',
  19: 'BOYSAW',
  20: 'BOYSPP',
  30: 'COALNE',
  42: 'DEPARE',
  43: 'DEPCNT',
  71: 'LNDARE',
  75: 'LIGHTS',
  77: 'LNDMRK',
  86: 'OBSTRN',
  112: 'RESARE',
  129: 'SOUNDG',
  154: 'UWTROC',
  159: 'WRECKS',
  302: 'M_COVR',
  301: 'M_CSCL',
  308: 'M_QUAL'
};

function getScaleFromCellName(cellName) {
  const band = cellName.charAt(2);
  switch (band) {
    case '1': return 1500000;
    case '2': return 350000;
    case '3': return 90000;
    case '4': return 25000;
    case '5': return 12000;
    case '6': return 4000;
    default: return 25000;
  }
}

function geojsonToWkt(geometry) {
  if (!geometry) return '';
  const type = geometry.type.toUpperCase();
  if (type === 'POINT') {
    const [x, y] = geometry.coordinates;
    return `POINT(${x} ${y})`;
  } else if (type === 'LINESTRING') {
    const coords = geometry.coordinates.map(([x, y]) => `${x} ${y}`).join(', ');
    return `LINESTRING(${coords})`;
  } else if (type === 'POLYGON') {
    const rings = geometry.coordinates.map(ring => {
      const coords = ring.map(([x, y]) => `${x} ${y}`).join(', ');
      return `(${coords})`;
    }).join(', ');
    return `POLYGON(${rings})`;
  } else if (type === 'MULTIPOINT') {
    const coords = geometry.coordinates.map(([x, y]) => `${x} ${y}`).join(', ');
    return `MULTIPOINT(${coords})`;
  } else if (type === 'MULTILINESTRING') {
    const lines = geometry.coordinates.map(line => {
      const coords = line.map(([x, y]) => `${x} ${y}`).join(', ');
      return `(${coords})`;
    }).join(', ');
    return `MULTILINESTRING(${lines})`;
  } else if (type === 'MULTIPOLYGON') {
    const polys = geometry.coordinates.map(poly => {
      const rings = poly.map(ring => {
        const coords = ring.map(([x, y]) => `${x} ${y}`).join(', ');
        return `(${coords})`;
      }).join(', ');
      return `(${rings})`;
    }).join(', ');
    return `MULTIPOLYGON(${polys})`;
  }
  return '';
}

function accumulateCoordinates(geom, coordsList) {
  if (!geom || !geom.coordinates) return;
  const traverse = (val) => {
    if (Array.isArray(val) && val.length === 2 && typeof val[0] === 'number') {
      coordsList.push(val);
    } else if (Array.isArray(val)) {
      val.forEach(traverse);
    }
  };
  traverse(geom.coordinates);
}

const chartsDir = path.join(__dirname, '../src/main/resources/charts');
const outputDir = path.join(__dirname, '../src/main/resources/charts_json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Scanning S-57 charts from:', chartsDir);
const files = fs.readdirSync(chartsDir).filter(f => f.toLowerCase().endsWith('.000'));
console.log(`Found ${files.length} chart files. Starting conversion...`);

let successCount = 0;
let failCount = 0;

for (const file of files) {
  const filePath = path.join(chartsDir, file);
  const cellName = file.replace(/\.000$/i, '').toUpperCase();
  const outputPath = path.join(outputDir, `${cellName}.json`);

  try {
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const dataset = parseS57(arrayBuffer);
    const geojson = toGeoJSON(dataset);

    const features = [];
    const allCoords = [];

    if (geojson.features) {
      for (const f of geojson.features) {
        if (!f.geometry || !f.geometry.coordinates) continue;

        const wkt = geojsonToWkt(f.geometry);
        if (!wkt) continue;

        accumulateCoordinates(f.geometry, allCoords);

        const objl = f.properties.OBJL;
        const code = OBJL_MAP[objl] || `UNKNOWN_${objl}`;
        const name = f.properties.OBJNAM || f.properties.NOBJNM || code;
        let geometryType = f.geometry.type.toUpperCase().replace('MULTI', '');
        if (geometryType === 'LINESTRING') {
          geometryType = 'LINE';
        }

        features.push({
          featureCode: code,
          geometryType: geometryType,
          featureName: name,
          coordinates: wkt,
          attributesJson: JSON.stringify(f.properties)
        });
      }
    }

    // Calculate center based on actual geometry coordinates bounding box
    let centerLat = 16.0;
    let centerLon = 108.0;
    if (allCoords.length > 0) {
      let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
      for (const [lon, lat] of allCoords) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      }
      centerLat = (minLat + maxLat) / 2;
      centerLon = (minLon + maxLon) / 2;
    }

    const scale = getScaleFromCellName(cellName);

    const outputData = {
      cellName: cellName,
      producer: 'VMS-N',
      edition: 1,
      scale: scale,
      updateNumber: 0,
      releaseDate: new Date().toISOString().split('T')[0],
      latitude: centerLat,
      longitude: centerLon,
      features: features
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    successCount++;
    if (successCount % 10 === 0 || successCount === files.length) {
      console.log(`Converted ${successCount}/${files.length} charts...`);
    }
  } catch (e) {
    console.error(`Failed to convert ${file}:`, e.message);
    failCount++;
  }
}

console.log(`Conversion finished. Success: ${successCount}, Failed: ${failCount}. Saved to: ${outputDir}`);
