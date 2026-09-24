const NUMERIC_OPERATIONAL_STATUS_BY_TYPE: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  RADAR_STATION: {
    '0': 'Chưa khai thác/vận hành',
    '1': 'Đang khai thác/vận hành',
    '2': 'Dừng khai thác/vận hành',
  },
  RADAR_STATION_LEGACY: {
    '0': 'Chưa khai thác/vận hành',
    '1': 'Đang khai thác/vận hành',
    '2': 'Dừng khai thác/vận hành',
  },
  LIGHTHOUSE: {
    '0': 'Chưa khai thác/vận hành',
    '1': 'Đang khai thác/vận hành',
    '2': 'Dừng khai thác/vận hành',
  },
  DIKE_REVETMENT: {
    '1': 'Chưa khai thác/vận hành',
    '2': 'Đang khai thác/vận hành',
    '3': 'Dừng khai thác/vận hành',
  },
};

const UNIT_OF_MEASURE_LABELS: Readonly<Record<string, string>> = {
  '1': 'Bộ',
  '2': 'Bến',
  '3': 'Bản quyền',
  '4': 'Chiếc',
  '5': 'Cổng',
  '6': 'Cái',
  '7': 'Cột',
  '8': 'Cầu',
  '9': 'Đường truyền',
  '10': 'Héc-ta',
  '11': 'Hạng mục',
  '12': 'Hệ thống',
  '13': 'Kho',
  '14': 'Khu',
  '15': 'Ki-lô-mét',
  '16': 'Mét',
  '17': 'Mét vuông',
  '18': 'Nhà',
  '19': 'Phòng',
  '20': 'Phân hệ',
  '21': 'Quả',
  '22': 'Tuyến',
  '23': 'Tấn',
  '24': 'Trạm',
  '25': 'Tháp',
  '26': 'Trụ',
  '27': 'VNĐ',
};

export const getKchtUnitOfMeasureText = (value?: string | number | null): string => {
  if (value === undefined || value === null) return '—';
  const normalized = String(value).trim();
  if (!normalized || normalized === '(null)' || normalized.toLowerCase() === 'null') return '—';
  return UNIT_OF_MEASURE_LABELS[normalized] || normalized;
};

export const getKchtOperationalStatusText = (
  status?: string | boolean | null,
  infrastructureType?: string | null,
): string => {
  if (status === undefined || status === null || status === '') return '—';
  const normalized = String(status).toUpperCase();
  const numericLabel = infrastructureType
    ? NUMERIC_OPERATIONAL_STATUS_BY_TYPE[infrastructureType.toUpperCase()]?.[normalized]
    : undefined;
  if (numericLabel) return numericLabel;
  const labels: Record<string, string> = {
    HIEN_HANH: 'Đang khai thác/vận hành',
    ACTIVE: 'Đang khai thác/vận hành',
    OPERATIONAL: 'Đang khai thác/vận hành',
    DANG_KHAI_THAC: 'Đang khai thác/vận hành',
    NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
    CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
    TAM_NGUNG: 'Dừng khai thác/vận hành',
    INACTIVE: 'Dừng khai thác/vận hành',
    STOPPED: 'Dừng khai thác/vận hành',
    SUSPENDED: 'Dừng khai thác/vận hành',
    DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    MAINTENANCE: 'Đang bảo trì',
    UNDER_CONSTRUCTION: 'Đang xây dựng',
    TRUE: 'Đang khai thác/vận hành',
    FALSE: 'Dừng khai thác/vận hành',
  };
  return labels[normalized] || String(status);
};

export const getKchtStructureTypeText = (value?: string | number | null): string => {
  if (value === undefined || value === null || value === '') return '—';
  const labels: Record<string, string> = {
    '1': 'Kết cấu bệ cọc cao',
    '2': 'Kết cấu cường từ',
    '3': 'Kết cấu trọng lực',
    '4': 'Kết cấu khác',
  };
  return labels[String(value)] || String(value);
};

const KCHT_SYMBOL_CODE_BY_TYPE: Record<string, string> = {
  SEAPORT: 'SEAPORT',
  PORT_TERMINAL: 'TERMINAL',
  PIER: 'QUAY',
  DRY_PORT: 'DRY_PORT',
  BUOY_BERTH: 'MOORING',
  STORM_SHELTER_AREA: 'SHELTER',
  TRANSSHIPMENT_AREA: 'TRANSSHIP',
  ANCHORAGE_AREA: 'ANCHORAGE',
  SHIP_REPAIR_FACILITY: 'SHIPYARD',
  LIGHTHOUSE: 'LIGHTHOUSE',
  BUOY: 'BUOY',
  BUOY_STATION: 'BUOY',
  VTS_SYSTEM: 'VTS',
  RADAR_STATION_LEGACY: 'RADAR',
  DIKE_REVETMENT: 'BREAKWATER',
  NAVIGATION_CHANNEL: 'CHANNEL',
  COASTAL_RADIO_STATION: 'RADIO',
  INMARSAT_STATION: 'INMARSAT',
  COSPAS_SARSAT_STATION: 'COSPAS',
  LRIT_STATION: 'LRIT',
  HANOI_STATION: 'MARITIME_CTR',
};

/** Mã biểu tượng mặc định theo đúng loại nghiệp vụ, dùng khi bản ghi chưa gán biểu tượng riêng. */
export const getKchtSymbolCode = (infrastructureType?: string | null): string | undefined => (
  infrastructureType ? KCHT_SYMBOL_CODE_BY_TYPE[infrastructureType.toUpperCase()] : undefined
);
