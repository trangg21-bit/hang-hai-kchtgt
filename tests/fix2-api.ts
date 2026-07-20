import { readFileSync, writeFileSync } from 'fs';
const filePath = 'frontend/src/services/dashboardApi.ts';
let content = readFileSync(filePath, 'utf8');

// Read actual context around currentRes
const cIdx = content.indexOf('const currentRes = await api.get<ApiResponse<Page<CargoAggregate>>>(');
const pIdx = content.indexOf('const previousRes = await api.get<ApiResponse<Page<CargoAggregate>>>(', cIdx);
const cdIdx = content.indexOf('const currentData = currentRes.data.data.content.filter(', cIdx);
const pdIdx = content.indexOf('const previousData = previousRes.data.data.content.filter(', pIdx);

console.log('currentRes found at:', cIdx);
console.log('previousRes found at:', pIdx);
console.log('currentData at:', cdIdx);
console.log('previousData at:', pdIdx);

if (cdIdx > 0) {
  const lines = content.split('\n');
  for (let i = Math.floor(cdIdx / content.indexOf('  const currentRes')); i < 30; i++) {
    // just scan
  }
  // Find the line number of cdIdx
  const upToCd = content.substring(0, cdIdx);
  const lineNumCd = upToCd.split('\n').length;
  const upToPd = content.substring(0, pdIdx);
  const lineNumPd = upToPd.split('\n').length;
  
  console.log('Line around currentData:', lineNumCd, ':', lines[lineNumCd - 1] ? lines[lineNumCd - 1] : 'N/A');
  console.log('Line around previousData:', lineNumPd, ':', lines[lineNumPd - 1] ? lines[lineNumPd - 1] : 'N/A');
  
  // Insert validation BEFORE the const currentData line
  const insert1 = '  if (!currentRes.data.success) throw new Error(currentRes.data.message || \'API returned unsuccessful response\');\n  ';
  const insert2 = '  if (!previousRes.data.success) throw new Error(previousRes.data.message || \'API returned unsuccessful response\');\n  ';
  
  content = content.substring(0, cdIdx) + insert1 + content.substring(cdIdx);
  
  // After inserting above, previousData line shifts
  const newPdIdx = content.indexOf('const previousData = previousRes.data.data.content.filter(');
  content = content.substring(0, newPdIdx) + insert2 + content.substring(newPdIdx);
  
  writeFileSync(filePath, content);
  console.log('Fix 2 applied successfully');
} else {
  console.log('ERROR: could not find target lines');
}
