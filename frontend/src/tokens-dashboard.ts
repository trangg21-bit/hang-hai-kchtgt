// ============================================================
// tokens-dashboard.ts — Dashboard-specialized token layer
// Inherits from tokens.ts, adds dashboard-specific aliases only
// ============================================================

// Explicit import required — Vite dev mode does not resolve re-export bindings
// for use in the same module body (ReferenceError: dataNavy is not defined)
import {
  statusOperational, statusAttention, statusCritical, statusDraft,
  actionPrimary, actionHover,
  radiusSm, radiusMd, radiusLg, radiusXl, radiusPill,
  spaceXs, spaceSm, spaceMd, spaceLg, spaceXl, spaceXxl,
  fontWeightNormal, fontWeightMedium, fontWeightBold,
  fontSizeSm, fontSizeMd, fontSizeLg, fontSizeXl, fontSizeHeading, fontSizeDisplay, fontSizeStat,
  fontSans, fontMono,
  shadowSm, shadowMd, shadowLg,
  chartGrid, chartTooltip, chartTextStyle,
  surfacePage, surfaceCard,
  textPrimary, textSecondary, textTertiary,
  borderDefault,
  cardStyle, badgeBaseStyle, metaStyle,
  dataNavy, dataSea0, dataSea1, dataSea2, dataSea3, dataTeal,
} from './tokens';

// Re-export for downstream consumers
export {
  statusOperational, statusAttention, statusCritical, statusDraft,
  actionPrimary, actionHover,
  radiusSm, radiusMd, radiusLg, radiusXl, radiusPill,
  spaceXs, spaceSm, spaceMd, spaceLg, spaceXl, spaceXxl,
  fontWeightNormal, fontWeightMedium, fontWeightBold,
  fontSizeSm, fontSizeMd, fontSizeLg, fontSizeXl, fontSizeHeading, fontSizeDisplay, fontSizeStat,
  fontSans, fontMono,
  shadowSm, shadowMd, shadowLg,
  chartGrid, chartTooltip, chartTextStyle,
  surfacePage, surfaceCard,
  textPrimary, textSecondary, textTertiary,
  borderDefault,
  cardStyle, badgeBaseStyle, metaStyle,
  dataNavy, dataSea0, dataSea1, dataSea2, dataSea3, dataTeal,
};

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
