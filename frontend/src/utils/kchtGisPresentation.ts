export interface KchtOrgNode {
  id: string;
  code?: string;
  name?: string;
  children?: KchtOrgNode[];
}

const DEFAULT_MARITIME_AUTHORITY_CODE = 'G17.43';
const DEFAULT_MARITIME_AUTHORITY_NAME = 'cục hàng hải và đường thủy việt nam';

const normalizeText = (value?: string): string => (value || '').trim().toLocaleLowerCase('vi-VN');

/** Tìm đơn vị Cục trong cả dữ liệu phẳng và cây đơn vị. */
export const findDefaultMaritimeAuthorityOrgId = (organizations: KchtOrgNode[]): string | undefined => {
  const nodes: KchtOrgNode[] = [...organizations];
  let nameMatch: string | undefined;

  while (nodes.length > 0) {
    const node = nodes.shift()!;
    if (normalizeText(node.code) === normalizeText(DEFAULT_MARITIME_AUTHORITY_CODE)) return node.id;
    if (!nameMatch && normalizeText(node.name).includes(DEFAULT_MARITIME_AUTHORITY_NAME)) nameMatch = node.id;
    if (node.children?.length) nodes.push(...node.children);
  }

  return nameMatch;
};

export const getKchtOperationalStatusText = (status?: string | boolean | null): string => {
  if (status === undefined || status === null || status === '') return '—';
  const normalized = String(status).toUpperCase();
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
