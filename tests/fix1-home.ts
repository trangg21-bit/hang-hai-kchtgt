import { readFileSync, writeFileSync } from 'fs';
const filePath = 'frontend/src/pages/Home.tsx';
let content = readFileSync(filePath, 'utf8');

// Fix 1: Split import — use exact string from file
const oldLine1 = "import { dashboardApi, MOCK_DATA } from '../services/dashboardApi';";
const newLine1 = "import { dashboardApi } from '../services/dashboardApi';";
const oldLine2 = "import type { DashboardData } from '../services/dashboardTypes';";
const newLines2 = `import { MOCK_DATA } from '../services/dashboardMockData';
import type { DashboardData, BlockState } from '../services/dashboardTypes';`;

if (content.includes(oldLine1)) {
  content = content.replace(oldLine1, newLine1);
  content = content.replace(oldLine2, newLines2);
  writeFileSync(filePath, content);
  console.log('Fix 1 applied successfully');
} else {
  console.log('ERROR: old import line not found');
  // Debug: show lines 25-28
  const lines = content.split('\n');
  for (let i = 24; i < 30 && i < lines.length; i++) {
    console.log(`  Line ${i+1}: [${lines[i]}]`);
  }
}
