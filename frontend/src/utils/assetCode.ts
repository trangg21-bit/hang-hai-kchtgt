/**
 * Utility chuẩn hóa và định dạng mã tài sản Kết Cấu Hạ Tầng (KCHT) hàng hải.
 * Chuẩn định dạng: TSKCHT_{LOẠI}-{STT_6_CHỮ_SỐ} (Ví dụ: TSKCHT_BC-000011, TSKCHT_TD-000001)
 */

export const ASSET_CODE_PREFIX_MAP: Record<string, string> = {
  // Cảng biển & KCHT hàng hải
  PORT_TERMINAL: 'TSKCHT_BC-',
  PIER: 'TSKCHT_CC-',
  DRY_PORT: 'TSKCHT_CC-',
  TRANSFER_AREA: 'TSKCHT_KCT-',
  STORM_SHELTER: 'TSKCHT_TB-',
  BUOY_BERTH: 'TSKCHT_BP-',
  BUOY: 'TSKCHT_PT-',
  ANCHORAGE: 'TSKCHT_ND-',
  LIGHTHOUSE: 'TSKCHT_DB-',
  NAVIGATION_CHANNEL: 'TSKCHT_LHH-',
  DIKE_REVETMENT: 'TSKCHT_DK-',
  RADAR_STATION: 'TSKCHT_RD-',
  AUXILIARY_EQUIPMENT: 'TSKCHT_TBPT-',
  
  // Đài trạm & Thiết bị viễn thông, bảo đảm ATHH
  TRANSMISSION: 'TSKCHT_TD-',
  VHF: 'TSKCHT_VHF-',
  VTS: 'TSKCHT_VTS-',
  AIS: 'TSKCHT_AIS-',
  CCTV: 'TSKCHT_CCTV-',
  SCADA: 'TSKCHT_SCADA-',
  LRIT: 'TSKCHT_LRIT-',
  TTDH: 'TSKCHT_TTDH-',
  INMARSAT: 'TSKCHT_INMARSAT-',
  COSPAS_SARSAT: 'TSKCHT_COSPAS-',
  TTXLTT: 'TSKCHT_TTXLTT-',
};

/**
 * Lấy tiền tố mã tài sản theo loại tài sản
 */
export function getAssetCodePrefix(assetType?: string): string {
  if (!assetType) return 'TSKCHT_';
  const upper = assetType.trim().toUpperCase();
  return ASSET_CODE_PREFIX_MAP[upper] || `TSKCHT_${upper}-`;
}

/**
 * Lấy placeholder gợi ý mã tự sinh cho Form nhập liệu
 */
export function getAssetCodePlaceholder(assetType?: string): string {
  const prefix = getAssetCodePrefix(assetType);
  return `Hệ thống tự sinh (${prefix}000001)`;
}

/**
 * Định dạng mã tài sản để hiển thị nhất quán trên toàn hệ thống
 * - Chuyển đổi mã cũ dạng 'TS-BC-...' thành 'TSKCHT_BC-...'
 * - Chuẩn hóa phần số thứ tự thành 6 chữ số: 'TSKCHT_BC-11' -> 'TSKCHT_BC-000011'
 * - Giữ nguyên mã nếu đã đúng chuẩn
 */
export function formatAssetCode(code?: string | null): string {
  if (code === undefined || code === null) {
    return '';
  }

  const trimmed = String(code).trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') {
    return trimmed;
  }

  // Nếu bắt đầu bằng TS- (chuẩn cũ), chuyển đổi TS- thành TSKCHT_
  let normalized = trimmed;
  if (/^TS-[A-Z0-9]+-/i.test(normalized)) {
    normalized = normalized.replace(/^TS-/i, 'TSKCHT_');
  }

  // Chuẩn hóa phần đuôi số nếu có: ví dụ TSKCHT_BC-11 hoặc TSKCHT_BC-001 -> TSKCHT_BC-000011
  const matchWithNumber = normalized.match(/^(TSKCHT_[A-Z0-9]+-)(\d+)$/i);
  if (matchWithNumber) {
    const prefix = matchWithNumber[1].toUpperCase();
    const numPart = matchWithNumber[2];
    const padded = numPart.padStart(6, '0');
    return `${prefix}${padded}`;
  }

  // Chuẩn hóa viết hoa tiền tố TSKCHT_ nếu có
  if (/^TSKCHT_/i.test(normalized)) {
    const parts = normalized.split('-');
    if (parts.length >= 2) {
      parts[0] = parts[0].toUpperCase();
      return parts.join('-');
    }
  }

  return normalized;
}
