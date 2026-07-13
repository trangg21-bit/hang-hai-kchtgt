// ============================================================
// tokens-dashboard.ts — Dashboard-specialized token layer
// Inherits from tokens.ts, adds dashboard-specific aliases only
// ============================================================

export {
  // Status
  statusOperational, statusAttention, statusCritical, statusDraft,
  // Action
  actionPrimary, actionHover,
  // Radius scale
  radiusSm, radiusMd, radiusLg, radiusXl, radiusPill,
  // Spacing scale
  spaceXs, spaceSm, spaceMd, spaceLg, spaceXl, spaceXxl,
  // Font weight scale
  fontWeightNormal, fontWeightMedium, fontWeightBold,
  // Font size scale
  fontSizeSm, fontSizeMd, fontSizeLg, fontSizeXl, fontSizeHeading, fontSizeDisplay, fontSizeStat,
  // Font families
  fontSans, fontMono,
  // Shadows
  shadowSm, shadowMd, shadowLg,
  // Chart config
  chartGrid, chartTooltip, chartTextStyle,
  // Surface
  surfacePage, surfaceCard,
  // Text
  textPrimary, textSecondary, textTertiary,
  // Border
  borderDefault,
  // Content conventions
  cardStyle, badgeBaseStyle, metaStyle,
  // Data colors
  dataNavy, dataSea0, dataSea1, dataSea2, dataSea3, dataTeal,
} from './tokens';

// --- Dashboard-specific aliases ---

// Cargo chart 6-series colors
export const cargoSeriesColors = [dataNavy, dataSea0, dataSea1, dataSea2, dataSea3, dataTeal];

// Approval status → sea gradient
export const approvalApproved = dataSea0;
export const approvalPending = dataSea2;
export const approvalRejected = dataSea3;

// Pending pill states
export const pendingZeroBg = dataSea3;
export const pendingZeroColor = dataSea1;
export const pendingActiveBg = 'rgba(79,155,216,0.12)';
export const pendingActiveColor = dataSea0;

// Approval bar track
export const approvalBarTrack = 'rgba(11,46,79,0.09)';
