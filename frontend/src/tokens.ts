// ============================================================
// tokens.ts — Semantic design token architecture
// Principle: tokens describe ROLE, not VALUE
// ============================================================

// --- COLOR PALETTE (13 tokens, CLOSED — no additions without design review) ---

// Action — the accent color, MAX 3 uses per screen
export const actionPrimary = '#0E6FD6';        // deeper blue — more authoritative
export const actionHover = '#0A5AB8';

// Status — semantic meaning, NOT color names
export const statusOperational = '#1BAF7A';   // good, operating, increase
export const statusAttention = '#EDA100';     // pending, warning, not-exploited
export const statusCritical = '#E34948';      // bad, stopped, rejected, decrease
export const statusDraft = '#93a3b3';         // draft, inactive

// Data — chart series, NOT "blue" / "pink"
export const dataPrimary = '#2A78D6';         // main data series (domestic, primary)
export const dataSecondary = '#E87BA4';       // secondary data series (transshipment)

// Surface — backgrounds
export const surfaceCard = '#FFFFFF';         // elevated cards
export const surfacePage = '#eaf0f6';         // page background — blue-ish tint, cards pop more

// Text — hierarchy encoded, NOT arbitrary grays
export const textPrimary = '#0c2438';         // KPIs, titles — deepest navy
export const textSecondary = '#566a7c';       // labels, descriptions
export const textTertiary = '#93a3b3';        // metadata, timestamps, placeholders

// Border
export const borderDefault = 'rgba(11,46,79,0.09)';

// Data series — 6-color sea gradient for charts
export const dataNavy = '#0b2e4f';
export const dataSea0 = '#123a63';
export const dataSea1 = '#2769b3';
export const dataSea2 = '#4f9bd8';
export const dataSea3 = '#9ecdf0';
export const dataTeal = '#bedaf2';    // icy light blue — continues sea gradient past dataSea3 (was teal #0ea5a3)

// Font families
export const fontSans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const fontMono = "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace";

// Shadows
export const shadowSm = '0 1px 2px rgba(11,46,79,0.04)';
export const shadowMd = '0 2px 4px rgba(11,46,79,0.05), 0 12px 28px rgba(11,46,79,0.07)';
export const shadowLg = '0 8px 24px rgba(11,46,79,0.12), 0 24px 60px rgba(11,46,79,0.14)';


// --- NUMBER SCALES (closed sets — no "in-between" values allowed) ---

// Radius: only 5 values. 6, 7, 10, 14 are BANNED.
export const radiusSm = 4;
export const radiusMd = 8;
export const radiusLg = 12;
export const radiusXl = 18;
export const radiusPill = 999;

// Spacing: tighter small, wider large — creates breathing room
export const spaceXs = 4;
export const spaceSm = 6;
export const spaceMd = 16;
export const spaceLg = 24;
export const spaceXl = 32;
export const spaceXxl = 48;

// Font size: 7 values — stronger hierarchy
export const fontSizeSm = 10;   // metadata, captions — clearly subordinate
export const fontSizeMd = 13;   // labels, body
export const fontSizeLg = 15;   // card titles, section headers
export const fontSizeXl = 18;   // page titles
export const fontSizeHeading = 22;
export const fontSizeDisplay = 28;
export const fontSizeStat = 34; // KPI numbers — dominant, immediate impact

// Font weight: 3 values. 450, 550, 700+ are BANNED unless exceptional.
export const fontWeightNormal = 400;
export const fontWeightMedium = 500;
export const fontWeightBold = 600;


// --- CONTENT-TYPE CONVENTIONS (fixed mappings, apply everywhere) ---

// Metadata style (timestamps, counts, captions)
export const metaStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  fontWeight: fontWeightNormal,
};

// Card container style
export const cardStyle: React.CSSProperties = {
  background: surfaceCard,
  border: `0.5px solid ${borderDefault}`,
  borderRadius: radiusLg,
  padding: spaceMd,
};

// Separator / hairline
export const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${borderDefault}`,
  margin: `${spaceMd}px 0`,
};

// Action / pill button style
export const actionStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  color: actionPrimary,
  fontWeight: fontWeightMedium,
  cursor: 'pointer',
};

// Status badge base
export const badgeBaseStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  fontWeight: fontWeightMedium,
  padding: `2px ${spaceSm}px`,
  borderRadius: radiusPill,
  display: 'inline-block',
};

// Chart ECharts defaults
export const chartGrid = { top: 16, right: 16, bottom: 16, left: 16, containLabel: true };
export const chartTooltip = {
  backgroundColor: '#0b2e4f',
  borderColor: 'transparent',
  textStyle: { color: '#eaf4fc', fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace", fontSize: 12 },
  extraCssText: 'border-radius:10px;padding:10px 14px;box-shadow:none;',
};
export const chartTextStyle = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: 11,
  color: '#93a3b3',
};


// --- ACCENT BUDGET TRACKER (documentation) ---
// Per-page limit: actionPrimary appears MAX 3 times.
// Current dashboard usage:
//   1. KpiCard variant="action" (Hồ sơ chờ duyệt) — action border/color
//   2. TrendChartCard error state "Thử lại" button
//   3. (reserved for future)
// Status colors, data colors, text colors do NOT count against budget.
