export interface SearchQuery {
  queryType: SearchQuery.QueryType;
}

export namespace SearchQuery {
  export enum QueryType {
    TEXT = 'TEXT',
    LOCATION = 'LOCATION',
    RADIUS = 'RADIUS',
    POLYGON = 'POLYGON',
    COORDINATE = 'COORDINATE',
  }
}

export interface GisSearchRequest {
  query?: string;
  queryType: SearchQuery.QueryType;
  centerLon?: number;
  centerLat?: number;
  radius?: number;
  coordinates?: string;
  layerTypes?: string;
  statuses?: string;
  unitId?: number;
  page?: number;
  size?: number;
}

export interface SearchResultItem {
  objectId: string;
  objectType: string;
  name: string;
  code: string;
  distance?: number;
  layerType?: string;
}

export interface GisSearchResponse {
  results: SearchResultItem[];
  totalResults: number;
  page: number;
  size: number;
  durationMs: number;
}

export interface SearchHistoryItem {
  id: string;
  userId?: number;
  queryType: SearchQuery.QueryType;
  queryText: string;
  resultCount: number;
  durationMs: number;
  executedAt: string;
}

export const SEARCH_TYPE_OPTIONS = [
  { value: SearchQuery.QueryType.TEXT, label: 'Văn bản' },
  { value: SearchQuery.QueryType.LOCATION, label: 'Vị trí' },
  { value: SearchQuery.QueryType.RADIUS, label: 'bán kính' },
  { value: SearchQuery.QueryType.POLYGON, label: 'Đa giác' },
  { value: SearchQuery.QueryType.COORDINATE, label: 'Tọa độ' },
];

/** Kết quả tra cứu KCHTGIS-155 dùng chung giữa bộ lọc và bản đồ. */
export interface KchtGisSearchResult {
  id: string;
  name: string;
  code?: string;
  orgUnitId?: string;
  orgName?: string;
  infrastructureType: string;
  kchtTypeLabel: string;
  provinceId?: number;
  location?: string;
  diaChiChiTiet?: string;
  geometryType?: string;
  coordinates?: string;
  toaDo?: string;
  loaiHinhHoc?: string;
  latitude?: number;
  longitude?: number;
}

export interface KchtGisSearchPage {
  content: KchtGisSearchResult[];
  totalElements: number;
  page: number;
  size: number;
}

/** Danh mục loại KCHT duy nhất cho Trang chủ và màn bản đồ. */
export const KCHT_GIS_TYPE_OPTIONS = [
  { value: 'PORT_TERMINAL', label: 'Bến cảng' },
  { value: 'BUOY_BERTH', label: 'Bến phao' },
  { value: 'SEAPORT', label: 'Cảng biển' },
  { value: 'PIER', label: 'Cầu cảng' },
  { value: 'DRY_PORT', label: 'Cảng cạn' },
  { value: 'SHIP_REPAIR_FACILITY', label: 'Cơ sở sửa chữa, đóng tàu' },
  { value: 'WATER_AREA', label: 'Vùng nước' },
  { value: 'TRANSSHIPMENT_AREA', label: 'Khu chuyển tải' },
  { value: 'LIGHTHOUSE', label: 'Đèn biển và nhà trạm gắn liền với đèn biển' },
  { value: 'DIKE_REVETMENT', label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' },
  { value: 'COASTAL_RADIO_STATION', label: 'Đài TTDH' },
  { value: 'INMARSAT_STATION', label: 'Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng' },
  { value: 'NAVIGATION_CHANNEL', label: 'Luồng hàng hải' },
  { value: 'LRIT_STATION', label: 'Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)' },
  { value: 'ANCHORAGE_AREA', label: 'Khu neo đậu' },
  { value: 'BUOY_STATION', label: 'Nhà trạm quản lý vận hành phao tiêu' },
  { value: 'BUOY', label: 'Phao, tiêu' },
  { value: 'COSPAS_SARSAT_STATION', label: 'Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam' },
  { value: 'STORM_SHELTER_AREA', label: 'Khu tránh, trú bão' },
  { value: 'HANOI_STATION', label: 'Đài Trung tâm xử lý thông tin hàng hải Hà Nội' },
  { value: 'VTS_SYSTEM', label: 'Hệ thống VTS' },
  { value: 'RADAR_STATION_LEGACY', label: 'Trạm radar' },
] as const;

export type KchtGisType = (typeof KCHT_GIS_TYPE_OPTIONS)[number]['value'];

/**
 * Danh mục dùng riêng khi vẽ/lưu đối tượng KCHT trên bản đồ.
 *
 * Màn tra cứu chỉ hỗ trợ các entity đã được KchtGis155Service tổng hợp, còn
 * popup vẽ phải giữ đủ danh mục LOAI_KCHT của hệ thống nguồn. Vì vậy không
 * dùng KCHT_GIS_TYPE_OPTIONS cho popup này.
 */
export const KCHT_DRAW_TYPE_OPTIONS = [
  { value: 'AIS_SYSTEM', label: 'Hệ thống AIS' },
  { value: 'PORT_TERMINAL', label: 'Bến cảng' },
  { value: 'BUOY_BERTH', label: 'Bến phao' },
  { value: 'SEAPORT', label: 'Cảng biển' },
  { value: 'PIER', label: 'Cầu cảng' },
  { value: 'DRY_PORT', label: 'Cảng cạn' },
  { value: 'CCTV', label: 'Hệ thống CCTV' },
  { value: 'SHIP_REPAIR_FACILITY', label: 'Cơ sở sửa chữa, đóng tàu' },
  { value: 'TRANSSHIPMENT_AREA', label: 'Khu chuyển tải' },
  { value: 'LIGHTHOUSE', label: 'Đèn biển và nhà trạm gắn liền với đèn biển' },
  { value: 'DIKE_REVETMENT', label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' },
  { value: 'COASTAL_RADIO_STATION', label: 'Đài TTDH' },
  { value: 'INMARSAT_STATION', label: 'Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng' },
  { value: 'NAVIGATION_CHANNEL', label: 'Luồng hàng hải' },
  { value: 'LRIT_STATION', label: 'Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)' },
  { value: 'ANCHORAGE_AREA', label: 'Khu neo đậu' },
  { value: 'BUOY_STATION', label: 'Nhà trạm quản lý vận hành phao tiêu' },
  { value: 'BUOY', label: 'Phao, tiêu' },
  { value: 'VTS_ASSIST', label: 'Hệ thống phụ trợ VTS' },
  { value: 'RADAR_STATION_LEGACY', label: 'Trạm Radar' },
  { value: 'COSPAS_SARSAT_STATION', label: 'Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam' },
  { value: 'SCADA', label: 'Hệ thống SCADA' },
  { value: 'TRANSMISSION', label: 'Hệ thống truyền dẫn' },
  { value: 'STORM_SHELTER_AREA', label: 'Khu tránh, trú bão' },
  { value: 'VTS_OPERATION_CENTER', label: 'Trung tâm điều hành VTS' },
  { value: 'HANOI_STATION', label: 'Đài Trung tâm xử lý thông tin hàng hải Hà Nội' },
  { value: 'VHF_SYSTEM', label: 'Hệ thống thông tin liên lạc VHF' },
  { value: 'VTS_SYSTEM', label: 'Hệ thống VTS' },
] as const;

export type KchtGisDrawType = (typeof KCHT_DRAW_TYPE_OPTIONS)[number]['value'];

/** Tương thích các tham số cũ từng được Trang chủ truyền sang màn bản đồ. */
export const LEGACY_KCHT_TYPE_MAP: Record<string, string> = {
  Berth: 'PORT_TERMINAL',
  BENPHAO: 'BUOY_BERTH',
  Port: 'SEAPORT',
  Pier: 'PIER',
  DryPort: 'DRY_PORT',
  COSO_SUACHUA: 'SHIP_REPAIR_FACILITY',
  KHUCHUYEN_TAI: 'TRANSSHIPMENT_AREA',
  DENBIEN: 'LIGHTHOUSE',
  DAI_TTDH: 'COASTAL_RADIO_STATION',
  DAI_INMARSAT: 'INMARSAT_STATION',
  DAI_LRIT: 'LRIT_STATION',
  KHUNEO_DAU: 'ANCHORAGE_AREA',
  NHATRAM_PHAO: 'BUOY_STATION',
  PHAOTIEU: 'BUOY',
  DAI_COSPAS_SARSAT: 'COSPAS_SARSAT_STATION',
  KHUTRANH_TRU_BAO: 'STORM_SHELTER_AREA',
  DAI_HANOI: 'HANOI_STATION',
  HE_THONG_VTS: 'VTS_SYSTEM',
  TRAM_RADAR: 'RADAR_STATION_LEGACY',
  RADAR_STATION: 'RADAR_STATION_LEGACY',
  WaterZone: 'WATER_AREA',
};

/**
 * Mã phân loại dùng bởi các đối tượng GIS vẽ trực tiếp trên bản đồ.
 * Giữ nguyên 1..13 để đọc đúng dữ liệu cũ; các loại còn thiếu được cấp mã
 * riêng thay vì dồn về 99 ("Khác"), tránh mất loại khi mở lại popup sửa.
 */
export const KCHT_GIS_CATEGORY_ID_BY_TYPE: Record<KchtGisType | KchtGisDrawType, number> = {
  SEAPORT: 1,
  SHIP_REPAIR_FACILITY: 2,
  DIKE_REVETMENT: 3,
  LIGHTHOUSE: 4,
  VTS_SYSTEM: 5,
  TRANSSHIPMENT_AREA: 6,
  ANCHORAGE_AREA: 7,
  STORM_SHELTER_AREA: 8,
  NAVIGATION_CHANNEL: 9,
  BUOY: 10,
  RADAR_STATION_LEGACY: 11,
  WATER_AREA: 12,
  DRY_PORT: 13,
  PORT_TERMINAL: 14,
  BUOY_BERTH: 15,
  PIER: 16,
  COASTAL_RADIO_STATION: 17,
  INMARSAT_STATION: 18,
  LRIT_STATION: 19,
  BUOY_STATION: 20,
  COSPAS_SARSAT_STATION: 21,
  HANOI_STATION: 22,
  AIS_SYSTEM: 23,
  CCTV: 24,
  VTS_ASSIST: 25,
  SCADA: 26,
  TRANSMISSION: 27,
  VTS_OPERATION_CENTER: 28,
  VHF_SYSTEM: 29,
};

const KCHT_GIS_TYPE_BY_CATEGORY_ID = Object.fromEntries(
  Object.entries(KCHT_GIS_CATEGORY_ID_BY_TYPE).map(([type, categoryId]) => [categoryId, type]),
) as Record<number, KchtGisType | KchtGisDrawType>;

const KCHT_GIS_TYPE_VALUES = new Set<string>(KCHT_GIS_TYPE_OPTIONS.map((option) => option.value));
const KCHT_DRAW_TYPE_VALUES = new Set<string>(KCHT_DRAW_TYPE_OPTIONS.map((option) => option.value));

export const normalizeKchtGisType = (value?: string | null): KchtGisType | undefined => {
  if (!value) return undefined;
  const normalized = LEGACY_KCHT_TYPE_MAP[value] || value;
  return KCHT_GIS_TYPE_VALUES.has(normalized) ? normalized as KchtGisType : undefined;
};

export const normalizeKchtGisDrawType = (value?: string | null): KchtGisDrawType | undefined => {
  if (!value) return undefined;
  const normalized = LEGACY_KCHT_TYPE_MAP[value] || value;
  return KCHT_DRAW_TYPE_VALUES.has(normalized) ? normalized as KchtGisDrawType : undefined;
};

export const getKchtGisCategoryId = (value?: string | null): number | undefined => {
  const normalized = normalizeKchtGisDrawType(value) || normalizeKchtGisType(value);
  return normalized ? KCHT_GIS_CATEGORY_ID_BY_TYPE[normalized] : undefined;
};

export const getKchtGisTypeByCategoryId = (categoryId?: number | null): KchtGisType | KchtGisDrawType | undefined =>
  categoryId == null ? undefined : KCHT_GIS_TYPE_BY_CATEGORY_ID[categoryId];

export const getKchtGisTypeLabelByCategoryId = (categoryId?: number | null): string | undefined => {
  const type = getKchtGisTypeByCategoryId(categoryId);
  return type
    ? [...KCHT_GIS_TYPE_OPTIONS, ...KCHT_DRAW_TYPE_OPTIONS].find((option) => option.value === type)?.label
    : undefined;
};
