import { readFileSync, writeFileSync } from 'fs';
const filePath = 'frontend/src/services/dashboardApi.ts';
let content = readFileSync(filePath, 'utf8');

// === Fix 3a: Add yearOverYear to Promise.allSettled destructuring ===
// Find: approvals,
// Replace: approvals,\n    yearOverYear,

content = content.replace(
  `    approvals,
  ] = await Promise.allSettled([`,
  `    approvals,
    yearOverYear,
  ] = await Promise.allSettled([`
);

// === Fix 3b: Add fetchYearOverYear(year, 'ANNUAL') to the Promise.allSettled array ===
// Find: fetchApprovals(0, 500),
// Replace: fetchApprovals(0, 500),\n    fetchYearOverYear(year, 'ANNUAL'),

content = content.replace(
  `    fetchApprovals(0, 500),
  ]);`,
  `    fetchApprovals(0, 500),
    fetchYearOverYear(year, 'ANNUAL'),
  ]);`
);

// === Fix 3c: Update heroKpi block to use YoY data when both cargoTotal and yearOverYear succeed ===
// Find the heroKpi block and replace it

const heroOld = `  // Hero KPI + KPI Card 1 (from cargoTotal or cargoAnnual)
  if (cargoTotal.status === 'fulfilled') {
    const transformResult = transformCargoTotals(cargoTotal.value, year);
    data.heroKpi = transformResult.heroKpi;
    states.heroKpi = { state: 'data', isMockFallback: false };
  } else {
    data.heroKpi = MOCK_DATA.heroKpi;
    states.heroKpi = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoTotal.reason?.message || 'API unavailable',
    };
    console.warn(
      \`[Dashboard] Block 'heroKpi' falling back to mock data: \${cargoTotal.reason?.message || 'API unavailable'}\`
    );
  }`;

const heroNew = `  // Hero KPI + KPI Card 1 (from cargoTotal or cargoAnnual)
  if (cargoTotal.status === 'fulfilled') {
    const transformResult = transformCargoTotals(cargoTotal.value, year);
    if (yearOverYear.status === 'fulfilled') {
      data.heroKpi = {
        ...transformResult.heroKpi,
        deltaPercent: yearOverYear.value.deltaPercent,
        deltaDirection: yearOverYear.value.deltaDirection,
        previousYearValue: yearOverYear.value.previousValue,
      };
    } else {
      data.heroKpi = transformResult.heroKpi;
    }
    states.heroKpi = { state: 'data', isMockFallback: false };
  } else {
    data.heroKpi = MOCK_DATA.heroKpi;
    states.heroKpi = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoTotal.reason?.message || 'API unavailable',
    };
    console.warn(
      \`[Dashboard] Block 'heroKpi' falling back to mock data: \${cargoTotal.reason?.message || 'API unavailable'}\`
    );
  }`;

if (content.includes(heroOld)) {
  content = content.replace(heroOld, heroNew);
  writeFileSync(filePath, content);
  console.log('Fix 3 applied successfully');
} else {
  console.log('ERROR: heroKpi block pattern not found');
  // Debug: show the actual heroKpi block
  const heroIdx = content.indexOf('// Hero KPI + KPI Card 1');
  if (heroIdx >= 0) {
    console.log('Found at:', heroIdx);
    console.log('Actual content:');
    console.log(content.substring(heroIdx, heroIdx + 500));
  }
}
