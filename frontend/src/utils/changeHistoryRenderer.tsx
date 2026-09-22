import React from 'react';
import { Typography } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeSm,
  fontSizeMd,
  fontWeightMedium,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceXl,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from '../themetokenchk';
import { VIETNAM_PROVINCES } from '../types/common';
import { formatHistoryNumber } from './numFmt';
import { getServicesProvidedHistoryDelta, isServicesProvidedHistoryField } from './serviceHistoryDelta';
import {
  formatMaritimeServicesDisplay,
  resolveMaritimeServiceLabel,
  parseMaritimeServiceTokens,
} from '../constants/maritimeServices';

export const isBlankOrDash = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return (
    s === '' ||
    s === '—' ||
    s === '-' ||
    s === '–' ||
    s === '(null)' ||
    s === 'null' ||
    s === 'undefined' ||
    s.toLowerCase() === 'chưa có'
  );
};

/**
 * Compare the ordered coordinate positions only. Geometry serialization may
 * legitimately differ (for example LINESTRING vs MULTIPOINT) while the user
 * has not changed a single coordinate.
 */
export const areEquivalentCoordinatePositions = (
  first: string | null | undefined,
  second: string | null | undefined,
): boolean => {
  const normalize = (value: string | null | undefined): string | null => {
    if (isBlankOrDash(value)) return null;
    const withoutSrid = String(value).trim().replace(/^SRID=\d+\s*;/i, '');
    const numbers = withoutSrid.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g);
    if (!numbers || numbers.length === 0) {
      return withoutSrid.replace(/\s+/g, ' ').toUpperCase();
    }
    return numbers.map((number) => String(Number(number))).join(',');
  };

  return normalize(first) === normalize(second);
};

export function normalizeHistoryKey(key: string): string {
  return (key || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const GLOBAL_KCHT_FIELD_LABELS: Record<string, string> = {
  // Common identity
  code: 'Mã',
  name: 'Tên',
  type: 'Loại',
  status: 'Trạng thái',
  approvalStatus: 'Trạng thái',
  operationalStatus: 'Tình trạng',
  condition: 'Tình trạng',
  conditionStatus: 'Tình trạng',
  isActive: 'Hoạt động',

  // Organizations & relations
  orgUnitId: 'Đơn vị quản lý',
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  usingOrgUnitId: 'Đơn vị sử dụng',
  unitId: 'Đơn vị quản lý',
  operatorOrgUnitId: 'Đơn vị khai thác',
  operatingUnit: 'Đơn vị khai thác',

  // Location & GIS
  province: 'Địa điểm (Tỉnh/Thành phố)',
  provinceId: 'Địa điểm (Tỉnh/Thành phố)',
  address: 'Địa chỉ',
  locationDetail: 'Địa điểm chi tiết',
  coordinates: 'Tọa độ GPS',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  geometryType: 'Loại đối tượng',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',

  // Technical & dimensions
  length: 'Chiều dài (m)',
  width: 'Chiều rộng (m)',
  area: 'Diện tích (m²)',
  totalArea: 'Tổng diện tích (m²)',
  constructionYear: 'Năm xây dựng',
  useDate: 'Ngày đưa vào sử dụng',
  landArea: 'Diện tích đất (m²)',
  floorArea: 'Diện tích sàn (m²)',
  model: 'Model',
  serialNumber: 'Số serial',
  countryOfOrigin: 'Xuất xứ',
  manufacturer: 'Hãng sản xuất',
  assetLocation: 'Vị trí tài sản',
  quantity: 'Số lượng',
  quantityUnit: 'Đơn vị tính',
  assetGroup: 'Nhóm tài sản',
  assetSubgroup: 'Phân nhóm tài sản',
  origin: 'Nguồn gốc',
  barcode: 'Barcode',
  assetCondition: 'Tình trạng tài sản',
  usageStatus: 'Hiện trạng sử dụng',

  // Financial & Depreciation
  originalValue: 'Nguyên giá (VNĐ)',
  depreciationRate: 'Tỷ lệ hao mòn (%/năm)',
  accumulatedDepreciation: 'Hao mòn/khấu hao lũy kế (VNĐ)',
  remainingValue: 'Giá trị còn lại (VNĐ)',
  assignmentDecisionNumber: 'Số quyết định giao tài sản',
  depreciationStartDate: 'Ngày bắt đầu tính hao mòn',
  depreciationMonths: 'Thời gian sử dụng (tháng)',
  depreciationEndDate: 'Ngày kết thúc tính hao mòn',
  monthlyDepreciation: 'Mức hao mòn/khấu hao tháng (VNĐ)',
  declarationDate: 'Ngày kê khai',
  disposalMethod: 'Hình thức xử lý',

  // Reference IDs
  beaconStationId: 'Mã đèn biển/nhà trạm',
  dikeRevetmentId: 'Mã đê kè',
  anchorageId: 'Mã khu neo đậu',
  berthId: 'Mã bến cảng',
  pierId: 'Mã cầu cảng',
  buoyId: 'Mã phao tiêu',

  // Documents & Notes
  documentNumber: 'Số văn bản',
  documentDate: 'Ngày văn bản',
  remarks: 'Ghi chú',
  note: 'Ghi chú',
  description: 'Mô tả',

  // Attachments
  attachments: 'File đính kèm',
  attachmentName: 'Tài liệu đính kèm',
};

export function autoFormatHistoryValue(fn: string, raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (isBlankOrDash(s)) return null;

  const normKey = normalizeHistoryKey(fn);

  // 0. Services Provided (Dịch vụ cung cấp viễn thông hàng hải)
  if (isServicesProvidedHistoryField(fn) || normKey.includes('services') || normKey.includes('dichvu')) {
    const formatted = formatMaritimeServicesDisplay(s);
    if (formatted && formatted !== '—') return formatted;
  }

  // 1. Booleans
  if (s.toLowerCase() === 'true' || (s === '1' && (normKey === 'isactive' || normKey === 'hoatdong' || normKey === 'receiveslargevessel' || normKey === 'nhantaulon'))) {
    if (normKey === 'isactive' || normKey === 'hoatdong') return 'Hoạt động';
    return 'Có';
  }
  if (s.toLowerCase() === 'false' || (s === '0' && (normKey === 'isactive' || normKey === 'hoatdong' || normKey === 'receiveslargevessel' || normKey === 'nhantaulon'))) {
    if (normKey === 'isactive' || normKey === 'hoatdong') return 'Ngừng';
    return 'Không';
  }

  // 2. Approval Status
  const approvalMap: Record<string, string> = {
    DRAFT: 'Lưu tạm',
    NHAP: 'Lưu tạm',
    '0': 'Lưu tạm',
    PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
    CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
    CHO_PD_CAP_CUC: 'Chờ phê duyệt cấp Cục',
    PROPOSED: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
    APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
    APPROVED_L1: 'Chờ phê duyệt cấp Cục',
    SUBMITTED_PORT_AUTHORITY: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
    CHO_DUYET_CAP_1: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
    SUBMITTED_DEPARTMENT: 'Chờ phê duyệt cấp Cục',
    CHO_DUYET_CAP_2: 'Chờ phê duyệt cấp Cục',
    APPROVED_LEVEL2: 'Đã phê duyệt',
    APPROVED_L2: 'Đã phê duyệt',
    APPROVED: 'Đã phê duyệt',
    DA_PHE_DUYET: 'Đã phê duyệt',
    DA_DUYET: 'Đã phê duyệt',
    PUBLISHED: 'Đã phê duyệt',
    REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
    REJECTED_L1: 'Từ chối cấp Cảng vụ/Chi cục',
    REJECTED_LEVEL2: 'Từ chối cấp Cục',
    REJECTED_L2: 'Từ chối cấp Cục',
    REJECTED: 'Từ chối',
    TU_CHOI: 'Từ chối',
    ARCHIVED: 'Đã xóa',
    DA_XOA: 'Đã xóa',
    DELETED: 'Đã xóa',
  };
  if (approvalMap[s.toUpperCase()]) {
    return approvalMap[s.toUpperCase()];
  }

  // 3. Operational / Condition Status
  const conditionMap: Record<string, string> = {
    OPERATIONAL: 'Đang hoạt động',
    DANG_HOAT_DONG: 'Đang hoạt động',
    DANG_KHAI_THAC: 'Đang khai thác',
    STOPPED: 'Dừng hoạt động',
    DUNG_HOAT_DONG: 'Dừng hoạt động',
    TAM_DUNG: 'Tạm dừng',
    DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    MAINTENANCE: 'Đang bảo trì',
    BAO_TRI: 'Đang bảo trì',
    UNDER_CONSTRUCTION: 'Đang xây dựng',
    XAY_DUNG: 'Đang xây dựng',
    NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
    CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
    SUSPENDED: 'Dừng khai thác/vận hành',
    ABANDONED: 'Không sử dụng',
    GOOD: 'Tốt',
    TOT: 'Tốt',
    FAIR: 'Trung bình',
    TRUNG_BINH: 'Trung bình',
    POOR: 'Kém',
    KEM: 'Kém',
    DAMAGED: 'Hư hỏng',
    HU_HONG: 'Hư hỏng',
  };
  if (conditionMap[s.toUpperCase()]) {
    return conditionMap[s.toUpperCase()];
  }

  // 3b. Asset Type / Classification
  const assetTypeMap: Record<string, string> = {
    PORT_TERMINAL: 'Tài sản bến cảng',
    TRANSFER_AREA: 'Tài sản khu chuyển tải',
    STORM_SHELTER: 'Tài sản khu tránh, trú bão',
    BUOY_BERTH: 'Tài sản bến phao',
    PIER: 'Tài sản cầu cảng',
    ANCHORAGE: 'Tài sản khu neo đậu',
    ANCHORAGE_AREA: 'Tài sản khu neo đậu',
    LIGHTHOUSE: 'Tài sản đèn biển',
    DIKE_REVETMENT: 'Tài sản đê chắn sóng, kè bảo vệ',
    DRY_PORT: 'Tài sản cảng cạn',
    SHIP_REPAIR_YARD: 'Tài sản cơ sở sửa chữa, đóng tàu',
    CHANNEL: 'Tài sản luồng hàng hải',
    BUOY: 'Tài sản phao tiêu',
    BEACON: 'Tài sản tiêu biển',
    RADAR_STATION: 'Tài sản trạm radar',
    VTS_SYSTEM: 'Tài sản hệ thống VTS',
    VTS_OPERATION_CENTER: 'Tài sản trung tâm điều hành VTS',
    VTS_ASSIST: 'Tài sản hệ thống phụ trợ VTS',
    CCTV: 'Tài sản hệ thống CCTV',
    TRANSMISSION: 'Tài sản hệ thống truyền dẫn',
    VHF: 'Tài sản đài thông tin VHF',
    SCADA: 'Tài sản hệ thống SCADA',
    AIS_SYSTEM: 'Tài sản hệ thống trạm bờ AIS',
    LRIT_STATION: 'Tài sản đài LRIT',
    INMARSAT_STATION: 'Tài sản đài Inmarsat',
    COSPAS_SARSAT_STATION: 'Tài sản đài Cospas-Sarsat',
    TTXLTT_STATION: 'Tài sản đài TTXLTT',
    TTDH_STATION: 'Tài sản đài TTDH',
  };
  if (assetTypeMap[s.toUpperCase()]) {
    return assetTypeMap[s.toUpperCase()];
  }

  // 3c. Asset Usage Status
  const usageStatusMap: Record<string, string> = {
    MANAGED: 'Đang quản lý',
    USING: 'Đang sử dụng',
    UNUSED: 'Chưa sử dụng',
    DISPOSED: 'Đã thanh lý',
    DANG_QUAN_LY: 'Đang quản lý',
    DANG_SU_DUNG: 'Đang sử dụng',
    CHUA_SU_DUNG: 'Chưa sử dụng',
    KHONG_SU_DUNG_DUOC: 'Không sử dụng được',
    HU_HONG_CAN_SUA_CHUA: 'Hư hỏng cần sửa chữa',
    DA_THANH_LY: 'Đã thanh lý',
  };
  if (usageStatusMap[s.toUpperCase()]) {
    return usageStatusMap[s.toUpperCase()];
  }

  // 4. Structure Type (Pier/Berth/StormShelter)
  if (normKey.includes('structuretype') || normKey.includes('loaiketcau')) {
    const structureMap: Record<string, string> = {
      '1': 'Kết cấu bệ cọc cao',
      '2': 'Kết cấu cường từ',
      '3': 'Kết cấu trọng lực',
      '4': 'Kết cấu khác',
    };
    if (structureMap[s]) return structureMap[s];
  }

  // 5. Construction Grade
  if (normKey.includes('constructiongrade') || normKey.includes('capcongtrinh') || normKey.includes('phancapcongtrinh')) {
    const gradeMap: Record<string, string> = {
      '1': 'Cấp đặc biệt',
      '2': 'Cấp 1',
      '3': 'Cấp 2',
      '4': 'Cấp 3',
      '5': 'Cấp 4',
    };
    if (gradeMap[s]) return gradeMap[s];
  }

  // 6. Buoy Classification
  if (normKey === 'classificationbuoy' || normKey === 'phanloaiphao') {
    const buoyClassMap: Record<string, string> = {
      '1': 'Báo hiệu luồng bên trái',
      '2': 'Báo hiệu luồng bên phải',
      '3': 'Báo hiệu chướng ngại biệt lập',
      '4': 'Báo hiệu vùng nước an toàn',
      '5': 'Báo hiệu chuyên dùng',
      '6': 'Báo hiệu chướng ngại mới phát hiện',
      TRAI: 'Báo hiệu luồng bên trái',
      PHAI: 'Báo hiệu luồng bên phải',
      BIET_LAP: 'Báo hiệu chướng ngại biệt lập',
      AN_TOAN: 'Báo hiệu vùng nước an toàn',
      CHUYEN_DUNG: 'Báo hiệu chuyên dùng',
      DAC_BIET: 'Báo hiệu chuyên dùng',
      NGUY_HIEM_MOI: 'Báo hiệu chướng ngại mới phát hiện',
    };
    if (buoyClassMap[s.toUpperCase()]) return buoyClassMap[s.toUpperCase()];
  }

  // 7. Light Color / Color
  if (normKey.includes('color') || normKey.includes('mausac') || normKey.includes('lightcolor')) {
    const colorMap: Record<string, string> = {
      RED: 'Đỏ',
      DO: 'Đỏ',
      GREEN: 'Xanh lục',
      XANH_LUC: 'Xanh lục',
      WHITE: 'Trắng',
      TRANG: 'Trắng',
      YELLOW: 'Vàng',
      VANG: 'Vàng',
      BLACK: 'Đen',
      DEN: 'Đen',
      YELLOW_BLACK: 'Vàng - Đen',
      RED_WHITE: 'Đỏ - Trắng',
    };
    if (colorMap[s.toUpperCase()]) return colorMap[s.toUpperCase()];
  }

  // 8. Power supply
  if (normKey.includes('powersupply') || normKey.includes('nguoncap')) {
    const powerMap: Record<string, string> = {
      SOLAR: 'Năng lượng mặt trời',
      GRID: 'Điện lưới',
      BATTERY: 'Ắc quy / Pin',
    };
    if (powerMap[s.toUpperCase()]) return powerMap[s.toUpperCase()];
  }

  // 9. Coordinate System & Geometry
  if (normKey.includes('coordinatesystem') || normKey.includes('hequychieu')) {
    if (s === '1' || s.toUpperCase() === 'WGS84' || s.toUpperCase() === 'WGS_84') return 'WGS-84';
    if (s === '2' || s.toUpperCase() === 'VN2000' || s.toUpperCase() === 'VN_2000') return 'VN-2000';
  }
  if (normKey.includes('geometrytype') || normKey.includes('loaidoituong')) {
    const geoMap: Record<string, string> = {
      POINT: 'Điểm',
      LINE: 'Đường',
      LINESTRING: 'Đường',
      POLYGON: 'Vùng',
      MULTIPOINT: 'Đa điểm',
      MULTILINESTRING: 'Đa đường',
      MULTIPOLYGON: 'Đa vùng',
    };
    if (geoMap[s.toUpperCase()]) return geoMap[s.toUpperCase()];
  }

  // 10. Province (province / provinceId)
  if (normKey === 'province' || normKey === 'provinceid' || normKey === 'tinhthanhpho' || normKey === 'diadiemtinhthanhpho') {
    const pIdx = parseInt(s, 10);
    if (!isNaN(pIdx) && pIdx >= 1 && pIdx <= VIETNAM_PROVINCES.length) {
      return VIETNAM_PROVINCES[pIdx - 1];
    }
  }

  // 11. ISO Date formatting (e.g. 2026-08-15T10:20:30 or 2026-08-15)
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s)) {
    const d = dayjs(s);
    if (d.isValid()) {
      if (s.includes('T')) {
        return d.format('DD/MM/YYYY HH:mm');
      }
      return d.format('DD/MM/YYYY');
    }
  }

  // 12. Pure numbers with thousand separators
  return formatHistoryNumber(s);
}

export interface ParsedWharfAreaHistoryItem {
  name: string;
  code?: string;
  func?: string;
  scope?: string;
  doc?: string;
  notes?: string;
}

export function parseWharfAreaHistory(rawV: unknown): ParsedWharfAreaHistoryItem[] {
  if (isBlankOrDash(rawV)) return [];
  const text = String(rawV).trim();

  // Tách từng khu bến: ưu tiên phân cách xuống dòng '\n' hoặc dấu ';'
  let segments: string[];
  if (text.includes('\n')) {
    segments = text.split(/\r?\n/).map((s) => s.replace(/;$/, '').trim()).filter(Boolean);
  } else if (text.includes(';')) {
    segments = text.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
  } else if (text.includes(' | ')) {
    segments = [text];
  } else {
    // Định dạng cũ ngăn cách dấu phẩy: "Khu A (Mã A), Khu B (Mã B)"
    segments = text.split(/\s*,\s*(?=[^()]*(?:\(|$))/).map((s) => s.trim()).filter(Boolean);
  }

  const items: ParsedWharfAreaHistoryItem[] = [];
  for (const seg of segments) {
    if (!seg || isBlankOrDash(seg)) continue;

    if (seg.includes(' | ') || seg.startsWith('Tên:')) {
      const parts = seg.split(/\s*\|\s*/);
      const parsed: ParsedWharfAreaHistoryItem = { name: '' };
      for (const p of parts) {
        const idx = p.indexOf(':');
        if (idx > 0) {
          const key = p.slice(0, idx).trim().toLowerCase();
          const val = p.slice(idx + 1).trim();
          if (!val || isBlankOrDash(val)) continue;

          if (key === 'tên' || key.includes('tên')) {
            parsed.name = val;
          } else if (key === 'mã' || key.includes('mã')) {
            parsed.code = val;
          } else if (key.includes('chức năng')) {
            parsed.func = val;
          } else if (key.includes('phạm vi') || key.includes('địa bàn')) {
            parsed.scope = val;
          } else if (key.includes('văn bản') || key.includes('quy định')) {
            parsed.doc = val;
          } else if (key.includes('ghi chú')) {
            parsed.notes = val;
          }
        } else if (!parsed.name) {
          parsed.name = p.trim();
        }
      }
      if (parsed.name || parsed.code) {
        items.push(parsed);
      }
    } else {
      // Định dạng cũ: "Tên khu bến (Mã khu bến)"
      const m = seg.match(/^(.*?)\s*\(\s*([^)]+)\s*\)\s*$/);
      if (m) {
        const name = m[1].trim();
        const code = m[2].trim();
        if (name && !isBlankOrDash(name)) {
          items.push({ name, code });
        }
      } else {
        if (!isBlankOrDash(seg)) {
          items.push({ name: seg });
        }
      }
    }
  }

  return items;
}

export function renderWharfAreaHistory(rawV: unknown): React.ReactNode {
  const items = parseWharfAreaHistory(rawV);
  if (items.length === 0) return '';

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
      {items.map((x, i) => {
        const parts: string[] = [];
        if (x.name) parts.push(`Tên: ${x.name}`);
        if (x.code) parts.push(`Mã: ${x.code}`);
        if (x.func) parts.push(`Chức năng: ${x.func}`);
        if (x.scope) parts.push(`Phạm vi: ${x.scope}`);
        if (x.doc) parts.push(`Văn bản: ${x.doc}`);
        if (x.notes) parts.push(`Ghi chú: ${x.notes}`);
        return (
          <span key={i}>
            {parts.join(', ')}
          </span>
        );
      })}
    </span>
  );
}

export interface RawHistoryRecord {
  id?: string;
  refId?: string;
  entityId?: string;
  entityType?: string;
  refType?: string | number;
  status?: string | number;
  fieldName?: string;
  changedField?: string;
  oldValue?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  value?: string | null;
  changedBy?: string | null;
  createdBy?: string | null;
  approvedBy?: string | null;
  actorName?: string | null;
  changedAt?: string | null;
  createdAt?: string | null;
  approvedDate?: string | null;
  reason?: string | null;
  orgUnitId?: string | null;
  orgUnitName?: string | null;
  unitName?: string | null;
  [key: string]: unknown;
}

export interface ChangeHistoryRendererOptions {
  records: RawHistoryRecord[];
  fieldLabels?: Record<string, string> | ((field: string) => string);
  groupOrder?: string[];
  formatValue?: (field: string, rawVal: string | null) => React.ReactNode | string | undefined;
  resolveUnitName?: (record: RawHistoryRecord) => string;
  resolveActorName?: (actor: string, record: RawHistoryRecord) => string;
  ignoredFields?: Set<string>;
  emptyMessage?: string;
}

export const DEFAULT_IGNORED_FIELDS = new Set([
  'id',
  'spatialId',
  'infrastructureList_raw',
  'approvalStatus',
  'approverLevel1',
  'approvedDateLevel1',
  'approverLevel2',
  'approvedDateLevel2',
  'rejectionReason',
  'Lý do từ chối',
  'ly do tu choi',
  'Trạng thái phê duyệt',
  'trang thai phe duyet',
  'Trạng thái',
  'trạng thái',
  'deletedAt',
  'deletedBy',
  'submittedDate',
  'submittedAt',
  'submittedBy',
  'submittedForApprovalAt',
  'submittedForApprovalBy',
  'Thời điểm gửi phê duyệt',
  'Người gửi phê duyệt',
  'ngày gửi phê duyệt',
  'người gửi phê duyệt',
  'approvalContentLevel1',
  'approvalContentLevel2',
  'level1ApprovalContent',
  'level2ApprovalContent',
  'approvalContent',
  'nội dung phê duyệt',
  'cấp 1 phê duyệt',
  'cấp 2 phê duyệt',
  'portAuthorityApprovedBy',
  'portAuthorityApprovedAt',
  'portAuthorityApprovalContent',
  'departmentApprovedBy',
  'departmentApprovedAt',
  'departmentApprovalContent',
  'Thời điểm Cảng vụ phê duyệt',
  'Thời điểm Cục phê duyệt',
  'Nội dung Cảng vụ phê duyệt',
  'Nội dung Cục phê duyệt',
  'Cán bộ Cảng vụ phê duyệt',
  'Cán bộ Cục phê duyệt',
  'approvedBy',
  'approvedAt',
  'approvedRemarks',
]);

export interface HistoryUpdateSession {
  group: { tsMs: number; ts: string; actor: string; items: RawHistoryRecord[] };
  validRows: Array<{
    rowId: string;
    field: string;
    label: string;
    ov: React.ReactNode | string | null;
    nv: React.ReactNode | string | null;
  }>;
}

export function buildHistoryUpdateSessions(options: ChangeHistoryRendererOptions): HistoryUpdateSession[] {
  const {
    records,
    fieldLabels = {},
    groupOrder = [],
    formatValue,
    ignoredFields = DEFAULT_IGNORED_FIELDS,
  } = options;

  const norm = (v: string | null | undefined): string | null => {
    if (isBlankOrDash(v)) return null;
    return String(v).trim();
  };

  const fieldLabel = (fn: string): string => {
    if (typeof fieldLabels === 'function') {
      const res = fieldLabels(fn);
      if (res && res !== fn) return res;
    } else if (fieldLabels && fieldLabels[fn]) {
      return fieldLabels[fn];
    }
    if (GLOBAL_KCHT_FIELD_LABELS[fn]) {
      return GLOBAL_KCHT_FIELD_LABELS[fn];
    }
    const target = normalizeHistoryKey(fn);
    if (typeof fieldLabels === 'object' && fieldLabels) {
      for (const [k, v] of Object.entries(fieldLabels)) {
        if (normalizeHistoryKey(k) === target || normalizeHistoryKey(v) === target) return v;
      }
    }
    for (const [k, v] of Object.entries(GLOBAL_KCHT_FIELD_LABELS)) {
      if (normalizeHistoryKey(k) === target || normalizeHistoryKey(v) === target) return v;
    }
    return fn;
  };

  const sorted = [...(records || [])].sort((a, b) => {
    const at = a.changedAt || a.createdAt || a.approvedDate || '';
    const bt = b.changedAt || b.createdAt || b.approvedDate || '';
    return String(bt) < String(at) ? -1 : String(bt) > String(at) ? 1 : 0;
  });

  // Gom nhóm trong khoảng 10 giây (chuẩn Cảng biển)
  const groups: { tsMs: number; ts: string; actor: string; items: RawHistoryRecord[] }[] = [];
  for (const r of sorted) {
    const ts = r.changedAt || r.createdAt || r.approvedDate || '';
    const timeMs = ts ? new Date(ts).getTime() || 0 : 0;
    const actor = String(r.changedBy ?? r.createdBy ?? r.approvedBy ?? r.actorName ?? '');
    const g = groups[groups.length - 1];
    if (g && g.actor === actor && Math.abs(g.tsMs - timeMs) <= 10000) {
      g.items.push(r);
    } else {
      groups.push({ tsMs: timeMs, ts, actor, items: [r] });
    }
  }

  const sessions: HistoryUpdateSession[] = [];

  for (const g of groups) {
    const attachmentItems: RawHistoryRecord[] = [];
    const nonAttachmentItems: RawHistoryRecord[] = [];

    for (const it of g.items) {
      const rawFn = (it.changedField ?? it.fieldName ?? '').trim();
      if (ignoredFields.has(rawFn)) continue;

      if (rawFn === 'attachments' || rawFn === 'Tài liệu đính kèm' || rawFn === 'File đính kèm') {
        attachmentItems.push(it);
      } else {
        nonAttachmentItems.push(it);
      }
    }

    const fieldMap = new Map<string, { rowId: string; field: string; oldValue: string | null; newValue: string | null }>();
    for (const it of nonAttachmentItems) {
      let fn = (it.changedField ?? it.fieldName ?? '').trim();
      if (fn === 'Danh sách hạ tầng' || fn === 'infrastructureList') {
        fn = 'Công trình KCHT trực thuộc';
      } else if (fn === 'wharfAreas' || fn === 'Danh sách khu bến') {
        fn = 'Khu bến';
      } else if (fn === 'Tọa độ GIS' || fn === 'coordinates') {
        fn = 'coordinates';
      } else if (fn === 'Loại đối tượng GIS') {
        fn = 'geometryType';
      } else if (fn === 'waterway') {
        fn = 'waterwayId';
      }

      const oldV = norm(it.oldValue ?? it.previousValue);
      const newV = norm(it.newValue ?? it.value);

      const serviceDeltas = getServicesProvidedHistoryDelta(fn, oldV, newV);
      if (isServicesProvidedHistoryField(fn)) {
        serviceDeltas.forEach((delta) => {
          fieldMap.set(delta.field, {
            rowId: String(it.id ?? `${g.tsMs}-${delta.field}`),
            field: delta.field,
            oldValue: norm(delta.oldValue),
            newValue: norm(delta.newValue),
          });
        });
        continue;
      }

      if (!fieldMap.has(fn)) {
        fieldMap.set(fn, {
          rowId: String(it.id ?? `${g.tsMs}-${fn}`),
          field: fn,
          oldValue: oldV,
          newValue: newV,
        });
      } else {
        const existing = fieldMap.get(fn)!;
        if (oldV !== null && oldV !== undefined) {
          existing.oldValue = oldV;
        }
      }
    }

    // Xử lý tệp đính kèm dạng snapshot bảng (chuẩn Cảng biển):
    if (attachmentItems.length > 0) {
      const deletedFileNames = new Set<string>();
      const addedFileNames = new Set<string>();

      for (const it of attachmentItems) {
        const reason = String(it.reason || '');
        const mDel = reason.match(/xóa.*đính kèm:\s*(.*)/i);
        if (mDel && mDel[1]?.trim()) {
          mDel[1].split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => deletedFileNames.add(f));
        }
        const mUp = reason.match(/tải lên.*đính kèm:\s*(.*)/i);
        if (mUp && mUp[1]?.trim()) {
          mUp[1].split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => addedFileNames.add(f));
        }
        const st = it.status;
        const rawOld = norm(it.previousValue ?? it.oldValue);
        const rawNew = norm(it.newValue ?? it.value);
        if (st === 8 || st === 'ATTACHMENT_DELETED' || (!isBlankOrDash(rawOld) && isBlankOrDash(rawNew))) {
          if (rawOld) {
            String(rawOld).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => deletedFileNames.add(f));
          }
        }
        if (st === 7 || st === 'ATTACHMENT_UPLOADED' || (isBlankOrDash(rawOld) && !isBlankOrDash(rawNew))) {
          if (rawNew) {
            String(rawNew).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => addedFileNames.add(f));
          }
        }
        if (!isBlankOrDash(rawOld) && !isBlankOrDash(rawNew) && rawOld !== rawNew) {
          const oldList = String(rawOld).split(',').map((s: string) => s.trim()).filter(Boolean);
          const newList = String(rawNew).split(',').map((s: string) => s.trim()).filter(Boolean);
          oldList.filter((f: string) => !newList.includes(f)).forEach((f: string) => deletedFileNames.add(f));
          newList.filter((f: string) => !oldList.includes(f)).forEach((f: string) => addedFileNames.add(f));
        }
      }

      const oldFilesList: string[] = [];
      const oldestAtt = attachmentItems[attachmentItems.length - 1];
      const oldestOldV = norm(oldestAtt?.oldValue ?? oldestAtt?.previousValue);
      if (oldestOldV) {
        oldestOldV.split(',').map((s) => s.trim()).filter(Boolean).forEach((f) => {
          if (!oldFilesList.includes(f)) oldFilesList.push(f);
        });
      }
      for (let i = attachmentItems.length - 1; i >= 0; i--) {
        const it = attachmentItems[i];
        const oldV = norm(it.oldValue ?? it.previousValue);
        if (oldV) {
          oldV.split(',').map((s) => s.trim()).filter(Boolean).forEach((f) => {
            if (!oldFilesList.includes(f)) oldFilesList.push(f);
          });
        }
      }
      for (const f of deletedFileNames) {
        if (!oldFilesList.includes(f)) {
          oldFilesList.push(f);
        }
      }

      const initialOldSet = new Set(oldestOldV ? oldestOldV.split(',').map((s) => s.trim()).filter(Boolean) : []);
      const finalOldFilesList = oldFilesList.filter((f) => {
        if (addedFileNames.has(f) && !initialOldSet.has(f) && !deletedFileNames.has(f)) {
          return false;
        }
        return true;
      });

      const newFilesList: string[] = [];
      const newestAtt = attachmentItems[0];
      const newestNewV = norm(newestAtt?.newValue ?? newestAtt?.value);
      if (newestNewV) {
        newestNewV.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => {
          if (!newFilesList.includes(f) && !deletedFileNames.has(f)) {
            newFilesList.push(f);
          }
        });
      }
      for (const f of addedFileNames) {
        if (!newFilesList.includes(f) && !deletedFileNames.has(f)) {
          newFilesList.push(f);
        }
      }
      for (const f of finalOldFilesList) {
        if (!deletedFileNames.has(f) && !newFilesList.includes(f)) {
          newFilesList.push(f);
        }
      }

      const finalOld = finalOldFilesList.length > 0 ? finalOldFilesList.join(', ') : null;
      const finalNew = newFilesList.length > 0 ? newFilesList.join(', ') : null;

      if (finalOld !== finalNew) {
        fieldMap.set('File đính kèm', {
          rowId: `att-${g.tsMs}`,
          field: 'File đính kèm',
          oldValue: finalOld,
          newValue: finalNew,
        });
      }
    }

    const rows = Array.from(fieldMap.values()).filter((r) => {
      const o = r.oldValue?.trim() || '';
      const n = r.newValue?.trim() || '';
      if (r.field === 'coordinates' && areEquivalentCoordinatePositions(o, n)) {
        return false;
      }
      return o !== n;
    });

    const ordered = [...rows].sort((a, b) => {
      const ia = groupOrder.indexOf(a.field);
      const ib = groupOrder.indexOf(b.field);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    if (ordered.length === 0) continue;

    const paintValue = (fn: string, rawV: string | null) => {
      if (isBlankOrDash(rawV)) return '';
      if (fn === 'attachments' || fn === 'Tài liệu đính kèm' || fn === 'File đính kèm') {
        const files = String(rawV)
          .split(/\s*,\s*/)
          .map((f) => f.trim())
          .filter((f) => !isBlankOrDash(f));
        if (files.length > 0) {
          return (
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
              {files.map((file, idx) => (
                <span key={idx} style={{ wordBreak: 'break-all' }}>
                  {file}
                </span>
              ))}
            </span>
          );
        }
      }

      if ((fn === 'Công trình KCHT trực thuộc' || fn === 'Danh sách hạ tầng' || fn === 'infrastructureList') && rawV) {
        const lines = String(rawV)
          .split(/\s*,\s*/)
          .map((seg) => seg.trim())
          .filter(Boolean)
          .map((seg) => {
            const m = seg.match(/^(.*?)\s*\(\s*([\d.]+)\s*\)\s*$/);
            if (m) return { label: m[1].trim() || seg, qty: m[2] };
            return { label: seg, qty: '' };
          })
          .filter((x) => x.label && !isBlankOrDash(x.label));
        if (lines.length > 0) {
          return (
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
              {lines.map((x, i) => (
                <span key={i}>
                  Tên: {x.label}{x.qty && !isBlankOrDash(x.qty) ? `, Số lượng: ${autoFormatHistoryValue('qty', x.qty)}` : ''}
                </span>
              ))}
            </span>
          );
        }
      }

      if ((fn === 'Khu bến' || fn === 'wharfAreas' || fn === 'Danh sách khu bến') && rawV) {
        return renderWharfAreaHistory(rawV);
      }


      if (formatValue) {
        const custom = formatValue(fn, rawV);
        if (custom !== undefined && custom !== rawV) {
          if (typeof custom === 'string' && isBlankOrDash(custom)) return '';
          return custom;
        }
      }

      const formatted = autoFormatHistoryValue(fn, rawV);
      return isBlankOrDash(formatted) ? '' : formatted;
    };

    const validRows = ordered
      .map((x) => ({
        ...x,
        label: `${fieldLabel(x.field)}:`,
        ov: paintValue(x.field, x.oldValue),
        nv: paintValue(x.field, x.newValue),
      }))
      .filter((r) => {
        const oBlank = isBlankOrDash(r.ov) || (typeof r.ov === 'string' && !r.ov.trim());
        const nBlank = isBlankOrDash(r.nv) || (typeof r.nv === 'string' && !r.nv.trim());
        if (oBlank && nBlank) return false;
        if (typeof r.ov === 'string' && typeof r.nv === 'string' && r.ov.trim() === r.nv.trim()) return false;
        return true;
      });

    if (validRows.length === 0) continue;

    sessions.push({
      group: g,
      validRows,
    });
  }

  return sessions;
}

const renderServiceHistoryValue = (field: string, value: React.ReactNode, isOld: boolean = false) => {
  if (!isServicesProvidedHistoryField(field) || typeof value !== 'string') return value;
  const rawTokens = parseMaritimeServiceTokens(value);
  const services = rawTokens.length > 0
    ? rawTokens.map((tok) => resolveMaritimeServiceLabel(tok)).filter(Boolean)
    : value.split(/[,\r\n]+/).map((item) => resolveMaritimeServiceLabel(item)).filter(Boolean);
  const uniqueServices = Array.from(new Set(services));
  if (uniqueServices.length === 0) return value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {uniqueServices.map((service, sIdx) => (
        <div
          key={sIdx}
          style={{
            color: isOld ? textSecondary : textPrimary,
            fontWeight: isOld ? 400 : fontWeightMedium,
            lineHeight: '20px',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {service}
        </div>
      ))}
    </div>
  );
};

export function getStandardHistoryCards(options: ChangeHistoryRendererOptions): React.ReactElement[] {
  const {
    resolveUnitName,
    resolveActorName,
  } = options;

  const sessions = buildHistoryUpdateSessions(options);

  return sessions.map((session, gi) => {
    const { group: g, validRows } = session;
    const meta = g.items?.[0] || {};
    const barColor = actionPrimary;
    const accent = historyAccentBarStyle(barColor);

    const unit = resolveUnitName ? resolveUnitName(g.items[0]) : (meta.orgUnitName || meta.unitName || '');

    return (
      <div
        key={g.tsMs !== 0 && g.tsMs ? `g-${g.tsMs}-${g.actor}` : `gi-${gi}`}
        style={{ ...historyGroupGridStyle, marginBottom: gi < sessions.length - 1 ? spaceSm : 0 }}
      >
        <div style={{ minWidth: 0, paddingTop: spaceXs }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
            <Typography.Text style={historyTimeStyle}>
              {g.ts ? dayjs(g.ts).format('HH:mm DD/MM/YYYY') : ''}
            </Typography.Text>
            <span style={{ flexShrink: 0 }}>
              <span
                style={{
                  display: 'inline-flex',
                  padding: '2px 10px',
                  borderRadius: radiusPill,
                  fontSize: fontSizeSm + 1,
                  fontWeight: fontWeightMedium,
                  background: `${actionPrimary}18`,
                  color: actionPrimary,
                  border: `1px solid ${actionPrimary}40`,
                  whiteSpace: 'nowrap',
                }}
              >
                Cập nhật
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
            <Typography.Text style={historyMetaRowStyle}>
              Người cập nhật: {(() => {
                const rawActor = meta.changedBy ? String(meta.changedBy) : meta.createdBy ? String(meta.createdBy) : g.actor ? g.actor : '';
                return resolveActorName ? resolveActorName(rawActor, g.items[0]) : rawActor;
              })()}
            </Typography.Text>
            <Typography.Text style={historyMetaRowStyle}>
              Đơn vị: {unit}
            </Typography.Text>
          </div>
        </div>
        <div style={historyInfoCardStyle}>
          <div style={accent} />
          <Typography.Text style={historyInfoTitleStyle}>
            Thông tin thay đổi:
          </Typography.Text>
          {validRows.map((x, ri) => {
            return (
              <div key={x.rowId} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                <Typography.Text style={historyFieldLabelStyle}>{x.label}</Typography.Text>
                <span
                  style={historyOldValueStyle}
                  title={typeof x.ov === 'string' ? x.ov : undefined}
                >
                  {renderServiceHistoryValue(x.field, x.ov, true)}
                </span>
                <Typography.Text style={historyArrowStyle}>→</Typography.Text>
                <span
                  style={historyNewValueStyle}
                  title={typeof x.nv === 'string' ? x.nv : undefined}
                >
                  {renderServiceHistoryValue(x.field, x.nv, false)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }).filter(Boolean) as React.ReactElement[];
}

/**
 * Đếm số lần update (sessions) thay vì số trường update.
 * Gom các trường được sửa trong cùng 1 lần (<= 10s + cùng actor) thành 1 lần update.
 */
export function countHistoryUpdates(
  records: RawHistoryRecord[] | null | undefined,
  options?: Partial<ChangeHistoryRendererOptions>
): number {
  if (!records || records.length === 0) return 0;
  return buildHistoryUpdateSessions({
    records,
    ...options,
  }).length;
}

export function countStandardHistoryCards(options: ChangeHistoryRendererOptions): number {
  return getStandardHistoryCards(options).length;
}

export function renderStandardHistoryCards(options: ChangeHistoryRendererOptions): React.ReactNode {
  const { emptyMessage = 'Chưa có thay đổi nào được ghi nhận' } = options;
  const cards = getStandardHistoryCards(options);

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{emptyMessage}</div>
      </div>
    );
  }
  return cards;
}
