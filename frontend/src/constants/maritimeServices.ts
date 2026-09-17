export interface MaritimeServiceOption {
  value: string;
  label: string;
}

/**
 * Danh mục 9 dịch vụ viễn thông hàng hải chính thức dùng chung cho 5 phân hệ Đài:
 * 1. Đài Thông tin duyên hải (Đài TTDH)
 * 2. Đài LRIT
 * 3. Đài Cospas-Sarsat
 * 4. Đài Inmarsat
 * 5. Đài TTXLTT Hà Nội (Đài Thông tin Hàng hải Hà Nội)
 */
export const MARITIME_SERVICES_OPTIONS: MaritimeServiceOption[] = [
  { value: 'INMARSAT_DISTRESS', label: 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)' },
  { value: 'COSPAS_SARSAT_DISTRESS', label: 'Dịch vụ trực canh cấp cứu COSPAS-SARSAT (COSPASSARSAT Distress Watch-keeping Service)' },
  { value: 'DSC_DISTRESS', label: 'Dịch vụ trực canh cấp cứu DSC (DSC Distress Watch-keeping Service)' },
  { value: 'RTP_DISTRESS', label: 'Dịch vụ trực canh cấp cứu RTP (RTP Distress Watch-keeping Service)' },
  { value: 'MSI_RTP', label: 'Dịch vụ phát MSI RTP (MSI Broadcasting Service on RTP)' },
  { value: 'MSI_NAVTEX', label: 'Dịch vụ phát MSI NAVTEX (MSI Broadcasting Service via Navtex)' },
  { value: 'MSI_EGC', label: 'Dịch vụ phát MSI EGC (MSI Broadcasting Service via EGC)' },
  { value: 'LRIT', label: 'Dịch vụ thông tin nhận dạng và truy theo tầm xa LRIT (Longrange Identification and Tracking...)' },
  { value: 'MARITIME_INFO_CONNECT', label: 'Dịch vụ kết nối thông tin ngành hàng hải' },
];

/**
 * Ánh xạ các mã rút gọn / legacy từ phiên bản cũ sang nhãn chính thức để giữ tương thích ngược 100%.
 */
const LEGACY_SERVICE_LABELS: Record<string, string> = {
  INMARSAT: 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)',
  'INMARSAT-C': 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)',
  DISTRESS: 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)',
  'COSPAS-SARSAT': 'Dịch vụ trực canh cấp cứu COSPAS-SARSAT (COSPASSARSAT Distress Watch-keeping Service)',
  DSC: 'Dịch vụ trực canh cấp cứu DSC (DSC Distress Watch-keeping Service)',
  RTP: 'Dịch vụ trực canh cấp cứu RTP (RTP Distress Watch-keeping Service)',
  'MSI RTP': 'Dịch vụ phát MSI RTP (MSI Broadcasting Service on RTP)',
  'MSI NAVTEX': 'Dịch vụ phát MSI NAVTEX (MSI Broadcasting Service via Navtex)',
  'MSI EGC': 'Dịch vụ phát MSI EGC (MSI Broadcasting Service via EGC)',
  'Kết nối TT hàng hải': 'Dịch vụ kết nối thông tin ngành hàng hải',
  // Legacy Cospas beacons
  '406_MHZ_BEACON': '406 MHz Distress Beacon — Phao phát tín hiệu báo nạn 406 MHz',
  GEOSAR: 'GEOSAR — Hệ thống vệ tinh địa tĩnh Cospas-Sarsat',
  LEOSAR: 'LEOSAR — Hệ thống vệ tinh quỹ đạo thấp Cospas-Sarsat',
  MEOSAR: 'MEOSAR — Hệ thống vệ tinh quỹ đạo tầm trung thế hệ mới',
  EPIRB: 'EPIRB — Phao vô tuyến chỉ báo vị trí khẩn cấp hàng hải',
  ELT: 'ELT — Thiết bị phát sóng khẩn cấp cho máy bay',
  PLB: 'PLB — Thiết bị định vị cá nhân tìm kiếm cứu nạn',
  LUT: 'LUT — Trạm thu mặt đất xử lý tín hiệu cấp cứu',
  MCC: 'MCC — Trung tâm kiểm soát điều phối tìm kiếm cứu nạn',
};

/**
 * Trả về nhãn tiếng Việt đầy đủ cho một mã dịch vụ hoặc nhãn thô.
 */
export function resolveMaritimeServiceLabel(codeOrValue?: string | null): string {
  if (!codeOrValue) return '';
  const trimmed = codeOrValue.trim();
  const matched = MARITIME_SERVICES_OPTIONS.find((s) => s.value === trimmed || s.label === trimmed);
  if (matched) return matched.label;
  if (LEGACY_SERVICE_LABELS[trimmed]) return LEGACY_SERVICE_LABELS[trimmed];
  return trimmed;
}
