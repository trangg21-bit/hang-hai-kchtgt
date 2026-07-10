// ============================================================
// tokens-dashboard.ts — Dashboard design tokens (light mode)
// Principle: TWO color families, never mixed
//   - Sea gradient (navy→light): quantitative DATA ONLY
//   - Status (st-*): approval WORKFLOW ONLY
// ============================================================

// --- Background & Surface ---
export const bg = '#eaf0f6';
export const bgTint = '#f4f8fc';
export const surface = '#ffffff';

// --- Navy → Sea gradient (QUANTITATIVE DATA) ---
export const navy = '#0b2e4f';
export const sea0 = '#123a63';
export const sea1 = '#2769b3';
export const sea2 = '#4f9bd8';
export const sea3 = '#9ecdf0';
export const teal = '#0ea5a3';

// --- Status (APPROVAL WORKFLOW ONLY) ---
export const stApproved = '#16a37a';
export const stPending = '#e8912e';   // ALSO the accent color — intentional
export const stRejected = '#e05a4c';
export const stDraft = '#93a3b3';

// --- Text ---
export const ink = '#0c2438';
export const ink2 = '#566a7c';
export const ink3 = '#93a3b3';

// --- Borders / Radius / Shadow ---
export const line = 'rgba(11,46,79,0.09)';
export const rCard = 18;
export const rSm = 12;
export const rPill = 999;
export const shadowMd = '0 2px 4px rgba(11,46,79,0.05), 0 12px 28px rgba(11,46,79,0.07)';
export const shadowLg = '0 8px 24px rgba(11,46,79,0.12), 0 24px 60px rgba(11,46,79,0.14)';

// --- Typography ---
export const fontSans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const fontMono = "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace";

// --- ECharts global defaults (apply to all chart instances) ---
export const chartGrid = {
  top: 16,
  right: 16,
  bottom: 16,
  left: 16,
  containLabel: true,
};

export const chartTooltip = {
  backgroundColor: navy,
  borderColor: 'transparent',
  textStyle: {
    color: '#eaf4fc',
    fontFamily: fontMono,
    fontSize: 12,
  },
  extraCssText: 'border-radius:10px;padding:10px 14px;box-shadow:none;',
};

export const chartTextStyle = {
  fontFamily: fontSans,
  fontSize: 11,
  color: ink3,
};

// --- Accent budget: orange (stPending) MAX 3 uses ---
// 1. Hero alert "Hồ sơ chờ duyệt"
// 2. H-Bar "Chờ duyệt" segment
// 3. Donut phê duyệt "Chờ duyệt" slice
