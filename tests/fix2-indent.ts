import { readFileSync, writeFileSync } from 'fs';
const filePath = 'frontend/src/services/dashboardApi.ts';
let content = readFileSync(filePath, 'utf8');

// Fix indentation: remove extra leading spaces from the inserted lines
content = content.replace(
  '    if (!currentRes.data.success) throw new Error(currentRes.data.message || \'API returned unsuccessful response\');',
  '  if (!currentRes.data.success) throw new Error(currentRes.data.message || \'API returned unsuccessful response\');'
);
content = content.replace(
  '    if (!previousRes.data.success) throw new Error(previousRes.data.message || \'API returned unsuccessful response\');',
  '  if (!previousRes.data.success) throw new Error(previousRes.data.message || \'API returned unsuccessful response\');'
);

writeFileSync(filePath, content);
console.log('Fix 2 indentation corrected');
