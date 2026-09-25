import {
  getKchtGisTypeByCategoryId,
  KCHT_GIS_TYPE_OPTIONS,
  LEGACY_KCHT_TYPE_MAP,
  normalizeKchtGisDrawType,
  normalizeKchtGisType,
  type KchtGisSearchResult,
} from '../../types/gisSearch';

export const KCHT_SCREEN_ROUTE_BY_TYPE: Readonly<Record<string, string>> = {
  SEAPORT: '/port',
  PORT_TERMINAL: '/berth',
  PIER: '/pier',
  DRY_PORT: '/dry-port',
  WATER_AREA: '/water-zone',
  ANCHORAGE_AREA: '/anchorage',
  TRANSSHIPMENT_AREA: '/transfer-area',
  STORM_SHELTER_AREA: '/storm-shelter',
  BUOY_BERTH: '/buoy-berth',
  DIKE_REVETMENT: '/dike-revetment',
  NAVIGATION_CHANNEL: '/navigation-channel',
  SHIP_REPAIR_FACILITY: '/ship-repair-facility',
  SHIP_REPAIR_YARD: '/ship-repair-yard',
  LIGHTHOUSE: '/beacon-stations',
  BUOY: '/buoys',
  BUOY_STATION: '/buoy-station',
  VTS_SYSTEM: '/vts-system',
  RADAR_STATION: '/radar-station',
  RADAR_STATION_LEGACY: '/radar-station',
  DAI_TTDH: '/dai-ttdh',
  COASTAL_RADIO_STATION: '/station/coastal',
  INMARSAT_STATION: '/station/inmarsat',
  COSPAS_SARSAT_STATION: '/station/cospas-sarsat',
  LRIT_STATION: '/station/lrit',
  HANOI_STATION: '/station/hanoi',
  VTS_OPERATION_CENTER: '/vts-operation-center',
  AIS_SYSTEM: '/ais-system',
  CCTV: '/cctv',
  SCADA: '/scada',
  TRANSMISSION: '/transmission',
  VTS_ASSIST: '/vts-assist',
};

const KCHT_TYPE_BY_LABEL = new Map(
  KCHT_GIS_TYPE_OPTIONS.map((option) => [option.label.toLocaleLowerCase('vi'), option.value]),
);

// Thứ tự này phải khớp enum InfrastructureType của backend. Các API danh mục
// đối tượng không gian trả `refType` dưới dạng ordinal thay vì tên enum.
const KCHT_TYPE_BY_BACKEND_ORDINAL: Readonly<Record<number, string>> = {
  0: 'SEAPORT',
  1: 'PORT_TERMINAL',
  2: 'PIER',
  3: 'DRY_PORT',
  4: 'WATER_AREA',
  5: 'DIKE_REVETMENT',
  6: 'NAVIGATION_CHANNEL',
  7: 'SHIP_REPAIR_FACILITY',
  8: 'LIGHTHOUSE',
  9: 'BUOY',
  10: 'VTS_SYSTEM',
  11: 'RADAR_STATION_LEGACY',
  12: 'RADAR_STATION',
  13: 'BUOY_BERTH',
  14: 'SHIP_REPAIR_YARD',
  15: 'ANCHORAGE_AREA',
  16: 'TRANSSHIPMENT_AREA',
  17: 'STORM_SHELTER_AREA',
  18: 'DAI_TTDH',
  19: 'COASTAL_RADIO_STATION',
  20: 'INMARSAT_STATION',
  21: 'COSPAS_SARSAT_STATION',
  22: 'LRIT_STATION',
  23: 'HANOI_STATION',
  24: 'BUOY_STATION',
  26: 'VTS_OPERATION_CENTER',
  27: 'AIS_SYSTEM',
  28: 'CCTV',
  30: 'SCADA',
  31: 'TRANSMISSION',
  33: 'VTS_ASSIST',
};

export interface KchtCustomFeatureReference {
  categoryId?: number | null;
  refId?: string | null;
  refType?: string | number | null;
}

export interface ResolvedKchtCustomFeatureReference {
  infrastructureType?: string;
  isSystemLinked: boolean;
  referenceId?: string;
}

export const resolveKchtCustomFeatureReference = (
  feature: KchtCustomFeatureReference,
): ResolvedKchtCustomFeatureReference => {
  const referenceId = String(feature.refId || '').trim() || undefined;
  const categoryType = getKchtGisTypeByCategoryId(feature.categoryId);
  const rawRefType = String(feature.refType ?? '').trim();
  const numericRefType = rawRefType !== '' && /^\d+$/.test(rawRefType)
    ? Number(rawRefType)
    : undefined;
  const namedRefType = normalizeKchtGisDrawType(rawRefType)
    || normalizeKchtGisType(rawRefType)
    || (rawRefType ? LEGACY_KCHT_TYPE_MAP[rawRefType] : undefined);
  const infrastructureType = categoryType
    || namedRefType
    || (numericRefType !== undefined ? KCHT_TYPE_BY_BACKEND_ORDINAL[numericRefType] : undefined);

  // DrawSaveModal dùng refType = 0 + refId để lưu quan hệ "Thuộc cảng biển"
  // cho mọi đối tượng vẽ thủ công không phải Cảng biển. refId trong trường hợp
  // này là ID cảng cha, KHÔNG phải ID của AIS/Bến cảng/... đang hiển thị.
  const isParentPortReference = numericRefType === 0
    && categoryType !== undefined
    && categoryType !== 'SEAPORT';

  return {
    // categoryId mô tả đúng loại đối tượng đang hiển thị và phải thắng dữ liệu
    // refType. Với đối tượng thủ công, refType = 0 chỉ mô tả cảng biển cha.
    infrastructureType,
    isSystemLinked: referenceId !== undefined && !isParentPortReference,
    referenceId,
  };
};

export const resolveKchtInfrastructureType = (
  record: Pick<KchtGisSearchResult, 'infrastructureType' | 'kchtTypeLabel'>,
): string => {
  const rawType = String(record.infrastructureType || '').trim();
  const normalizedType = LEGACY_KCHT_TYPE_MAP[rawType] || rawType.toUpperCase();
  if (KCHT_SCREEN_ROUTE_BY_TYPE[normalizedType]) return normalizedType;

  return KCHT_TYPE_BY_LABEL.get(String(record.kchtTypeLabel || '').trim().toLocaleLowerCase('vi'))
    || normalizedType;
};

export const isKchtSearchResultCompatibleWithFeature = (
  feature: KchtCustomFeatureReference,
  record: Pick<KchtGisSearchResult, 'infrastructureType' | 'kchtTypeLabel'>,
): boolean => {
  const expectedType = resolveKchtCustomFeatureReference(feature).infrastructureType;
  return !expectedType || resolveKchtInfrastructureType(record) === expectedType;
};

export const buildKchtScreenPath = (
  infrastructureType: string,
  id: string,
  action: 'view' | 'edit',
): string => {
  const basePath = KCHT_SCREEN_ROUTE_BY_TYPE[infrastructureType];
  if (!basePath) return '';

  const params = new URLSearchParams({
    embed: 'gis-action',
    action: action === 'edit' ? 'edit' : 'detail',
    id,
  });
  return `${basePath}?${params.toString()}`;
};
