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

// Data — chart series, NOT "blue" / "pink"
export const dataPrimary = '#2A78D6';         // main data series (domestic, primary)
export const dataSecondary = '#E87BA4';       // secondary data series (transshipment)

// Surface — backgrounds
export const surfaceCard = '#FFFFFF';         // elevated cards
export const surfacePage = '#F1F3F5';         // page background — grayer, cards pop more

// Text — hierarchy encoded, NOT arbitrary grays
export const textPrimary = '#1F2937';         // KPIs, titles — most important
export const textSecondary = '#5F6670';       // labels, descriptions — less washed out
export const textTertiary = '#8B939D';        // metadata, timestamps, placeholders

// Border
export const borderDefault = '#DEE0E3';       // slightly more defined


// --- NUMBER SCALES (closed sets — no "in-between" values allowed) ---

// Radius: only 4 values. 6, 7, 10, 14 are BANNED.
export const radiusSm = 4;
export const radiusMd = 8;
export const radiusLg = 12;
export const radiusPill = 999;

// Spacing: tighter small, wider large — creates breathing room
export const spaceXs = 4;
export const spaceSm = 6;
export const spaceMd = 16;
export const spaceLg = 24;
export const spaceXl = 32;
export const spaceXxl = 48;

// Font size: 5 values — stronger hierarchy gap (10→34 range vs old 11→28)
export const fontSizeSm = 10;   // metadata, captions — clearly subordinate
export const fontSizeMd = 13;   // labels, body
export const fontSizeLg = 15;   // card titles, section headers
export const fontSizeXl = 18;   // page titles
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


// --- ACCENT BUDGET TRACKER (documentation) ---
// Per-page limit: actionPrimary appears MAX 3 times.
// Current dashboard usage:
//   1. KpiCard variant="action" (Hồ sơ chờ duyệt) — action border/color
//   2. TrendChartCard error state "Thử lại" button
//   3. (reserved for future)
// Status colors, data colors, text colors do NOT count against budget.
