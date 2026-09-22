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

export function normalizeServiceKey(str?: string | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Trả về nhãn tiếng Việt đầy đủ cho một mã dịch vụ hoặc nhãn thô.
 */
export function resolveMaritimeServiceLabel(codeOrValue?: string | null): string {
  if (!codeOrValue) return '';
  const trimmed = codeOrValue.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed === 'null' || trimmed === 'undefined') return '';

  // 1. So khớp trực tiếp chính xác
  const matchedExact = MARITIME_SERVICES_OPTIONS.find((s) => s.value === trimmed || s.label === trimmed);
  if (matchedExact) return matchedExact.label;

  if (LEGACY_SERVICE_LABELS[trimmed]) return LEGACY_SERVICE_LABELS[trimmed];

  // 2. So khớp không phân biệt hoa thường / ký tự đặc biệt
  const normKey = normalizeServiceKey(trimmed);
  const matchedNorm = MARITIME_SERVICES_OPTIONS.find((s) => {
    return normalizeServiceKey(s.value) === normKey || normalizeServiceKey(s.label) === normKey;
  });
  if (matchedNorm) return matchedNorm.label;

  for (const [k, v] of Object.entries(LEGACY_SERVICE_LABELS)) {
    if (normalizeServiceKey(k) === normKey) return v;
  }

  // 3. Fallback theo từ khóa đặc trưng
  if (normKey.includes('inmarsat') && (normKey.includes('distress') || normKey.includes('capcuu') || normKey.includes('truoccanh'))) {
    return 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)';
  }
  if (normKey.includes('cospas') && (normKey.includes('distress') || normKey.includes('capcuu') || normKey.includes('sarsat'))) {
    return 'Dịch vụ trực canh cấp cứu COSPAS-SARSAT (COSPASSARSAT Distress Watch-keeping Service)';
  }
  if (normKey.includes('dsc') && (normKey.includes('distress') || normKey.includes('capcuu'))) {
    return 'Dịch vụ trực canh cấp cứu DSC (DSC Distress Watch-keeping Service)';
  }
  if (normKey.includes('rtp') && (normKey.includes('distress') || normKey.includes('capcuu'))) {
    return 'Dịch vụ trực canh cấp cứu RTP (RTP Distress Watch-keeping Service)';
  }
  if (normKey.includes('msi') && normKey.includes('rtp')) {
    return 'Dịch vụ phát MSI RTP (MSI Broadcasting Service on RTP)';
  }
  if (normKey.includes('msi') && normKey.includes('navtex')) {
    return 'Dịch vụ phát MSI NAVTEX (MSI Broadcasting Service via Navtex)';
  }
  if (normKey.includes('msi') && normKey.includes('egc')) {
    return 'Dịch vụ phát MSI EGC (MSI Broadcasting Service via EGC)';
  }
  if (normKey === 'lrit' || (normKey.includes('lrit') && normKey.includes('dichvu'))) {
    return 'Dịch vụ thông tin nhận dạng và truy theo tầm xa LRIT (Longrange Identification and Tracking...)';
  }
  if (normKey.includes('ketnoi') || normKey.includes('connect') || normKey.includes('maritimeinfoconnect')) {
    return 'Dịch vụ kết nối thông tin ngành hàng hải';
  }

  return trimmed;
}

const KNOWN_SERVICE_CODES = new Set([
  'INMARSAT_DISTRESS',
  'COSPAS_SARSAT_DISTRESS',
  'DSC_DISTRESS',
  'RTP_DISTRESS',
  'MSI_RTP',
  'MSI_NAVTEX',
  'MSI_EGC',
  'LRIT',
  'MARITIME_INFO_CONNECT',
  'INMARSAT',
  'INMARSAT-C',
  'DISTRESS',
  'COSPAS-SARSAT',
  'DSC',
  'RTP',
  '406_MHZ_BEACON',
  'GEOSAR',
  'LEOSAR',
  'MEOSAR',
  'EPIRB',
  'ELT',
  'PLB',
  'LUT',
  'MCC',
]);

/**
 * Tách thông minh chuỗi dịch vụ cung cấp thành danh sách các token dịch vụ độc lập.
 * Hỗ trợ phân cách bằng dấu phẩy, chấm phẩy, xuống dòng hoặc khoảng trắng giữa các mã enum in hoa.
 */
export function parseMaritimeServiceTokens(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  const text = String(raw).trim();
  if (!text || text === '—' || text === '-' || text === '(null)' || text === 'null' || text === 'undefined') return [];

  // Nếu là JSON array
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parseMaritimeServiceTokens(parsed.join(', '));
      }
    } catch {
      // Bỏ qua lỗi parse JSON, tiếp tục xử lý chuỗi
    }
  }

  // Tách sơ bộ theo dấu phẩy, chấm phẩy hoặc xuống dòng
  const rawParts = text.split(/[,;\r\n]+/).map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];

  rawParts.forEach((part) => {
    // Nếu chuỗi đã là tiếng Việt có dấu hoặc là nhãn bắt đầu bằng "dịch vụ", bảo toàn nguyên vẹn
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(part);
    if (hasVietnamese || part.toLowerCase().startsWith('dịch vụ') || part.toLowerCase().startsWith('dich vu')) {
      result.push(part);
      return;
    }

    // Chỉ tách theo khoảng trắng khi chuỗi gồm các mã enum in hoa độc lập
    // Ví dụ: "INMARSAT_DISTRESS COSPAS_SARSAT_DISTRESS DSC_DISTRESS"
    const words = part.split(/\s+/).filter(Boolean);
    const allKnownCodes = words.length > 1 && words.every((w) => KNOWN_SERVICE_CODES.has(w.toUpperCase()));

    if (allKnownCodes) {
      words.forEach((w) => {
        if (w.trim()) result.push(w.trim());
      });
    } else {
      result.push(part);
    }
  });

  return result;
}

/**
 * Định dạng chuỗi dịch vụ cung cấp bất kỳ thành danh sách tên tiếng Việt đầy đủ 100%,
 * mỗi dịch vụ trên 1 dòng phân cách bằng ký tự xuống dòng (\n).
 */
export function formatMaritimeServicesDisplay(raw: unknown): string {
  const tokens = parseMaritimeServiceTokens(raw);
  if (tokens.length === 0) return '—';

  const seen = new Set<string>();
  const labels: string[] = [];

  tokens.forEach((tok) => {
    const label = resolveMaritimeServiceLabel(tok);
    if (label) {
      const key = label.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        labels.push(label);
      }
    }
  });

  return labels.length > 0 ? labels.join('\n') : '—';
}

