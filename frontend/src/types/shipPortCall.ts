/**
 * ShipPortCall (Tàu biển ra vào cảng biển) — M-025 / F-300
 *
 * Mỗi bản ghi = 1 lượt tàu biển ra/vào cảng biển (sổ nhập liệu định kỳ, không có phê duyệt).
 * - Tên field/JSON = tiếng Anh camelCase (khớp design §4 + §5 — ShipPortCallCreateRequest),
 *   label/message hiển thị = tiếng Việt có dấu.
 * - Ma trận field gốc: docs/modules/M-025-quan-ly-tau-bien/ba/00-lean-spec.md §4.2 (rows 1-52).
 * - UNRESOLVED từ Excel: passengersArrival/passengersDeparture (all-false) và status — KHÔNG
 *   đưa vào create/list (design §10 U-1..U-6); ẩn cột hành khách, loại trừ trạng thái.
 */

/** Giá trị enum nhị phân — design §4: IslandRoute { NO, YES } / DangerousGoods { NO, YES }. */
export type YesNoFlag = 'NO' | 'YES';

/** DTO phản hồi (list + create projection) — gồm orgUnitName + audit cho Admin Cục. */
export interface ShipPortCallResponse {
  id: string;
  /** Đơn vị báo cáo (DataScope) — filter/save theo orgUnitId, hiển thị orgUnitName từ BE. */
  orgUnitId: string;
  orgUnitName?: string;
  /** Ngày báo cáo (yyyy-MM-dd). */
  reportDate?: string;
  /** Mã báo cáo — BE tự sinh, chỉ hiển thị (list-only). */
  reportCode?: string;
  reportName?: string;
  reportPeriod?: string;
  // ── Thông tin tàu ──
  shipName?: string;
  callSign?: string;
  imoNumber?: string;
  nationality?: string;
  shipType?: string;
  length?: number;
  draftArrivalDeparture?: number;
  dwt?: number;
  gt?: number;
  airDraftActual?: number;
  // ── Hàng hóa — Xuất khẩu ──
  exportTons?: number;
  exportTeus?: number;
  exportEmptyTeus?: number;
  // ── Hàng hóa — Nhập khẩu ──
  importTons?: number;
  importTeus?: number;
  importEmptyTeus?: number;
  // ── Hàng hóa — Nội địa đến ──
  domesticInTons?: number;
  domesticInTeus?: number;
  domesticInEmptyTeus?: number;
  // ── Hàng hóa — Nội địa rời ──
  domesticOutTons?: number;
  domesticOutTeus?: number;
  domesticOutEmptyTeus?: number;
  // ── Hàng hóa — Chuyển tải (không có Teus rỗng) ──
  transshipmentTons?: number;
  transshipmentTeus?: number;
  // ── Hàng hóa — Quá cảnh bốc dỡ (không có Teus rỗng) ──
  transitHandlingTons?: number;
  transitHandlingTeus?: number;
  // ── Hàng hóa — Quá cảnh không bốc dỡ (không có Teus rỗng) ──
  transitNoHandlingTons?: number;
  transitNoHandlingTeus?: number;
  // ── Phân loại hàng hóa chi tiết ──
  cargoGroup?: string;
  cargoType?: string;
  cargoName?: string;
  // ── Thông tin cảng ──
  lastPortOfCall?: string;
  arrivalPortName?: string;
  arrivalPortCode?: string;
  departurePortName?: string;
  departurePortCode?: string;
  destinationPort?: string;
  // ── Ngày tháng ──
  arrivalDate?: string;
  departureDate?: string;
  // ── Thông tin khác ──
  islandRoute?: YesNoFlag | null;
  dangerousGoods?: YesNoFlag | null;
  shipAgent?: string;
  enterpriseCode?: string;
  // Audit
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Request tạo mới — đúng 45 field của ma trận rows có Tạo mới = ✓
 * (rows 1-2, 7-34, 37-51; LOẠI TRỪ passengers 35/36 và status 52).
 * Recommended required (design §10.1 / U-6): orgUnitId, reportDate, shipName.
 */
export interface CreateShipPortCallRequest {
  orgUnitId: string;
  /** yyyy-MM-dd */
  reportDate: string;
  shipName: string;
  callSign?: string;
  imoNumber?: string;
  nationality?: string;
  shipType?: string;
  length?: number;
  draftArrivalDeparture?: number;
  dwt?: number;
  gt?: number;
  airDraftActual?: number;
  exportTons?: number;
  exportTeus?: number;
  exportEmptyTeus?: number;
  importTons?: number;
  importTeus?: number;
  importEmptyTeus?: number;
  domesticInTons?: number;
  domesticInTeus?: number;
  domesticInEmptyTeus?: number;
  domesticOutTons?: number;
  domesticOutTeus?: number;
  domesticOutEmptyTeus?: number;
  transshipmentTons?: number;
  transshipmentTeus?: number;
  transitHandlingTons?: number;
  transitHandlingTeus?: number;
  transitNoHandlingTons?: number;
  transitNoHandlingTeus?: number;
  cargoGroup?: string;
  cargoType?: string;
  cargoName?: string;
  lastPortOfCall?: string;
  arrivalPortName?: string;
  arrivalPortCode?: string;
  departurePortName?: string;
  departurePortCode?: string;
  destinationPort?: string;
  /** yyyy-MM-dd */
  arrivalDate?: string;
  /** yyyy-MM-dd */
  departureDate?: string;
  islandRoute?: YesNoFlag;
  dangerousGoods?: YesNoFlag;
  shipAgent?: string;
  enterpriseCode?: string;
}

/** Tham số danh sách — orgUnit cây + keyword + 3 khoảng ngày (Ngày báo cáo/đến/rời). */
export interface ShipPortCallListParams {
  page?: number;
  size?: number;
  orgUnitId?: string;
  keyword?: string;
  reportDateFrom?: string;
  reportDateTo?: string;
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  departureDateFrom?: string;
  departureDateTo?: string;
}

export interface ShipPortCallPage {
  items: ShipPortCallResponse[];
  total: number;
}
