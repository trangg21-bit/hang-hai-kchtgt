import React from 'react';
import {
  DeleteOutlined, HistoryOutlined, SendOutlined,
  CheckOutlined, CloseOutlined, PlusOutlined, SearchOutlined, ReloadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { colors as baseColors, layout as baseLayout } from './theme';

export const layout = baseLayout;


// ============================================================
// themetokenchk.ts — Bộ theme token thứ hai, dựng theo phong cách UI của
// project CHK (https://csdlhk.caa.gov.vn — Angular + PrimeNG + Metronic 8).
//
// File này là bản song song ĐỘC LẬP của `tokens.ts`: cùng cấu trúc, cùng danh
// sách export, chỉ khác giá trị. Nhờ vậy có thể thay thế 1:1 —
//
//   import { … } from '../../themetokenchk';        // thay cho '../../tokens'
//   <ThemeTokenProvider tokens={themeTokenChk}>     // cho component dùng chung
//
// Ba khác biệt tạo nên "chất CHK", áp dụng xuyên suốt file:
//   1. Xanh navy đậm #273e7c làm màu hành động, thay xanh sáng #0E6FD6.
//   2. Bảng có đường kẻ rõ: header nền xám #e4e4e4, chữ navy IN HOA 600, hàng chẵn sọc #f9fafb.
//   3. Bề mặt phẳng kiểu Metronic: nền trang #eef0f8, text thang xám gray-800/600/500,
//      shadow rất nhẹ — control GIỮ NGUYÊN bo viên thuốc (radiusPill 999) như chuẩn hệ thống.
//
// Nguồn đối chiếu trong project chk:
//   angular/src/assets/metronic/themes/default/css/custom-style.css
//   angular/src/assets/common/styles/metronic-customize.css
//   angular/src/app/shared/common/table-filter/table-filter.component.css
//   angular/src/app/shared/common/common-table/common-table.component.css
// ============================================================


// --- COLOR PALETTE ---

// Action — --primary-color / --kt-primary-active của chk
export const actionPrimary = '#273e7c';
export const actionHover = '#25396d';

// Status — bảng màu semantic chuẩn đồng bộ toàn hệ thống
export const statusOperational = '#1BAF7A';
export const statusAttention = '#EDA100';
export const statusWarning = statusAttention;
export const statusCritical = '#E34948';
export const statusDraft = '#93A3B3';
export const statusNeutral = statusDraft;

// Data — chart series
export const dataPrimary = '#273e7c';
export const dataSecondary = '#63abfd';       // --box-report-bg-color

// Surface
export const surfaceCard = '#ffffff';         // --panel-bg-color
export const surfacePage = '#eef0f8';         // --app-bg-color

// Text — thang xám của Metronic (gray-800 / gray-600 / gray-500)
export const textPrimary = '#181C32';
export const textSecondary = '#5E6278';
export const textTertiary = '#A1A5B7';

// Border — --panel-border-color
export const borderDefault = '#e4e4e4';

// Data series — dải xanh navy của chk
export const dataNavy = '#1d2359';            // --kt-color-text-device-diagram
export const dataSea0 = '#273e7c';
export const dataSea1 = '#1a3f83';
export const dataSea2 = '#63abfd';
export const dataSea3 = '#9ecdf0';
export const dataTeal = '#29cca3';            // --line-direct1-report-bg-color

// Sidebar — --sidebar-bg-color
export const sidebarBg = '#1a3f83';

// Font families — Metronic dùng Inter, giữ nguyên
export const fontSans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const fontMono = "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace";

// Shadows — chk phẳng hơn, đổ bóng rất nhẹ
export const shadowSm = '0 1px 2px rgba(0,0,0,0.04)';
export const shadowMd = '0 2px 6px rgba(0,0,0,0.06)';
export const shadowLg = '0 4px 16px rgba(0,0,0,0.10)';

/** `colors` của theme.ts, chỉnh các sắc độ mà layout dùng tới. */
export const colors = {
  ...baseColors,
  primary: actionPrimary,
  primaryHover: '#2f4a92',
  primaryActive: actionHover,
  bodyBg: surfacePage,
  sidebarBg,
};


// --- NUMBER SCALES ---

// Radius — quy đổi từ rem với ROOT FONT-SIZE = 13px (style.bundle.css: html,body
// { font-size: 13px !important }). Đây là chi tiết quyết định: chk dùng nút và ô
// nhập BO TRÒN VIÊN THUỐC, không phải bo góc chữ nhật.
export const radiusSm = 6;    // .dropdown-menu  0.475rem
export const radiusMd = 8;    // .card           0.625rem
export const radiusLg = 10;   // --card-border-radius (class .card-border-radius)
export const radiusXl = 12;
/** .form-control / .btn = 2.475rem ≈ 32px → viên thuốc với control cao 40px. */
export const radiusPill = 999;
/** .p-dropdown = 1.475rem ≈ 19px — bo mạnh nhưng chưa tới viên thuốc. */
export const radiusDropdown = 19;
export const radiusTextArea = radiusSm;

// Spacing — giữ nguyên thang của hệ thống để bố cục không xô lệch
export const spaceXs = 4;
export const spaceSm = 8;
export const spaceFormField = 12;
export const spaceMd = 12;
export const spaceLg = 24;
export const spaceXl = 32;
export const spaceXxl = 48;

// Font size
export const fontSizeSm = 11;
export const fontSizeMd = 13;   // .p-datatable font-size: 13px
export const fontSizeLg = 15;
export const fontSizeXl = 16;   // fs-4 1.25rem
export const fontSizeHeading = 22;
export const fontSizeDisplay = 28;
export const fontSizeStat = 34;
export const fontSizeBreadcrumb = 14;
export const fontSizeBreadcrumbLast = 16;

// Thang cỡ chữ Metronic quy đổi với root 13px:
//   fs-8 0.85rem = 11 | fs-7 0.95rem = 12 | body 1rem = 13
//   fs-6 1.075rem = 14 | fs-5 1.15rem = 15 | fs-4 1.25rem = 16

/** fs-6 — dòng tên đối tượng. */
export const fontSizeCellTitle = 14;

/** fs-7 — dòng mã đối tượng. */
export const fontSizeCellCode = 12;

// Font weight — Metronic dùng 600 cho tiêu đề cột
export const fontWeightNormal = 400;
export const fontWeightMedium = 500;
export const fontWeightBold = 600;

// Control dimensions — .btn padding calc(0.55rem + 1px) → cao ~40px
export const controlHeight = 40;


// --- SKIN TOKENS (các "núm" trình bày mà component dùng chung đọc qua context) ---

/** Bo tròn viên thuốc chuẩn Pill Radius */
export const buttonRadius = radiusPill;
export const inputRadius = radiusPill;

/** .card { --bs-card-border-radius: 10px } ≈ 10px */
export const cardRadius = radiusLg;

/** .p-datatable thead th { background-color: var(--panel-border-color) } */
export const tableHeaderBg = '#F8FAFC';

/** .p-datatable thead th { color: var(--primary-color) } */
export const tableHeaderColor = textSecondary;

// th: PrimeNG header padding chuẩn gọn gàng
export const tableHeaderPadding = '10px 12px';

// td: PrimeNG cell padding chuẩn
export const tableCellPadding = '8px 12px';

/** p-datatable-striped — hàng chẵn nền xám rất nhạt. */
export const tableRowStripeBg = '#f9fafb';

/** .p-datatable.p-datatable-hoverable-rows tbody tr:hover (mdc-light-indigo). */
export const tableRowHoverBg = 'rgba(0,0,0,0.04)';

/**
 * Nền hover cho ô ở cột ĐÓNG BĂNG (STT, thao tác). BẮT BUỘC đục.
 *
 * Cột đóng băng nằm đè lên phần bảng cuộn ngang bên dưới; nếu cho nó màu trong
 * suốt thì nội dung cột khác lộ xuyên qua. chk cũng chốt cứng nền đục cho cột
 * đóng băng (common-table.component.css: `td.p-frozen-column { background: white
 * !important }`). Giá trị dưới đây là bản đục tương đương rgba(0,0,0,0.04) trên nền trắng.
 */
export const tableRowHoverBgFixed = '#f5f5f5';

/**
 * chk render dòng trên bằng `text-gray-800 fw-bold fs-6` — chữ ĐEN đậm, KHÔNG
 * phải link xanh. Tự động hiển thị dấu ba chấm ... khi văn bản dài.
 */
export const cellTitleStyle: React.CSSProperties = {
  fontWeight: fontWeightBold,
  fontSize: fontSizeCellTitle,
  color: textPrimary,
  cursor: 'pointer',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block',
  maxWidth: '100%',
};

/** Dòng dưới: `text-gray-500 fw-semibold fs-7` → 12px, 600, #A1A5B7 có ... */
export const cellSubtitleStyle: React.CSSProperties = {
  fontSize: fontSizeCellCode,
  fontWeight: fontWeightBold,
  color: textTertiary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block',
  maxWidth: '100%',
};


/** .form-label { color: #1A3F83 } trong table-filter.component.css */
export const filterLabelColor = '#1A3F83';

/** --selected-table-row-bg-color: nền hàng đang chọn. */
export const tableRowSelectedBg = '#eff6ff';

/**
 * chk in con số ngay sau nhãn dưới dạng `(5)` tô màu ngữ nghĩa
 * (`text-muted` / `text-warning` / `text-info` / `text-success` / `text-danger`),
 * không dùng badge nền.
 */
export const statusTabsCountMode: 'badge' | 'text' = 'text';

/** .tabview-category .p-tabview-nav { padding: 5px } */
export const statusTabsPadding = '5px';

/** chk để thanh cuộn siêu mảnh (3px) và mờ nhẹ tinh tế. */
export const scrollbarSize = 3;
export const scrollbarThumb = 'rgba(0, 0, 0, 0.12)';
export const scrollbarThumbHover = 'rgba(0, 0, 0, 0.25)';

/**
 * Chuẩn chiều cao bảng trong Drawer (DRAWER_TABLE_SCROLL_Y)
 * Đảm bảo khoảng cách từ thanh phân trang xuống vạch kẻ footer luôn luôn cố định (16px - 20px)
 * và tổng cao độ giữa các Tab bằng nhau tuyệt đối (100vh - 290px):
 */
export const DRAWER_TABLE_SCROLL_Y = {
  /** Tab chỉ có bảng thuần (không có nút hay upload phía trên) */
  pureTable: 'calc(100vh - 328px)',
  /** Tab có nút bấm ở trên (Button 32px + margin 10px = 42px) */
  withButton: 'calc(100vh - 370px)',
  /** Tab có khung Upload Dragger (Dragger 104px + margin 10px = 114px) */
  withDragger: 'calc(100vh - 442px)',
  /** Tab GIS trong form tạo/sửa (Top controls cố định 194px) */
  withGisForm: 'calc(100vh - 522px)',
  /** Tab trong Drawer Xem chi tiết (Đồng bộ tọa độ Y chính xác tuyệt đối với Thêm mới / Sửa) */
  detailView: 'calc(100vh - 328px)',
  /** Tab GIS trong Drawer Xem chi tiết (Header cố định 132px) */
  detailGis: 'calc(100vh - 460px)',
} as const;

/** --info-color của chk, ghi đè --kt-info của Metronic (#7239ea tím). */
export const statusInfo = '#0284C7';

/** chk cho sắp xếp trên mọi cột dữ liệu, nên nút ⇅ xuất hiện ở tất cả tiêu đề. */
export const tableSortableByDefault = true;

/** Hàm so sánh hỗ trợ sắp xếp client-side chuỗi tiếng Việt có dấu cho DataTable */
export const clientSideStringSorter = (key: string, fallbackKey?: string) => (a: any, b: any) => {
  const aVal = a[key] ?? (fallbackKey ? a[fallbackKey] : '') ?? '';
  const bVal = b[key] ?? (fallbackKey ? b[fallbackKey] : '') ?? '';
  return String(aVal).localeCompare(String(bVal), 'vi');
};

/** Hàm so sánh hỗ trợ sắp xếp client-side thời gian cho DataTable */
export const clientSideDateSorter = (key: string, fallbackKey?: string) => (a: any, b: any) => {
  const aTime = a[key] ? new Date(a[key]).getTime() : (fallbackKey && a[fallbackKey] ? new Date(a[fallbackKey]).getTime() : 0);
  const bTime = b[key] ? new Date(b[key]).getTime() : (fallbackKey && b[fallbackKey] ? new Date(b[fallbackKey]).getTime() : 0);
  return aTime - bTime;
};

/** Hàm so sánh sắp xếp cột Cán bộ cập nhật (ưu tiên Họ và tên A-Z, sau đó theo ngày) */
export const clientSideUserSorter = (nameKey = 'updatedByName', fallbackNameKey = 'createdByName', dateKey = 'updatedAt', fallbackDateKey = 'createdAt') => (a: any, b: any) => {
  const nameA = a[nameKey] || (fallbackNameKey ? a[fallbackNameKey] : '') || '';
  const nameB = b[nameKey] || (fallbackNameKey ? b[fallbackNameKey] : '') || '';
  const cmp = String(nameA).localeCompare(String(nameB), 'vi');
  if (cmp !== 0) return cmp;
  const timeA = a[dateKey] ? new Date(a[dateKey]).getTime() : (fallbackDateKey && a[fallbackDateKey] ? new Date(a[fallbackDateKey]).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
  const timeB = b[dateKey] ? new Date(b[dateKey]).getTime() : (fallbackDateKey && b[fallbackDateKey] ? new Date(b[fallbackDateKey]).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
  return timeA - timeB;
};

/** Hàm so sánh sắp xếp cột Địa điểm (Tỉnh/TP) */
export const clientSideProvinceSorter = (nameKey = 'provinceName', idKey = 'provinceId') => (a: any, b: any) => {
  const valA = a[nameKey] || (a[idKey] ? String(a[idKey]) : '') || '';
  const valB = b[nameKey] || (b[idKey] ? String(b[idKey]) : '') || '';
  return String(valA).localeCompare(String(valB), 'vi');
};

/** Hàm so sánh sắp xếp cột Badge / Trạng thái / Tình trạng */
export const clientSideBadgeSorter = (key: string, labelMap?: Record<string, string>) => (a: any, b: any) => {
  const rawA = a[key] ?? '';
  const rawB = b[key] ?? '';
  const labelA = (labelMap && labelMap[rawA]) ? labelMap[rawA] : (a[`${key}Label`] || String(rawA));
  const labelB = (labelMap && labelMap[rawB]) ? labelMap[rawB] : (b[`${key}Label`] || String(rawB));
  return String(labelA).localeCompare(String(labelB), 'vi');
};

/** Chuyển đổi tọa độ thập phân sang Độ - Phút - Giây (DMS) */
export const ddToDms = (dd?: number) => {
  if (dd === undefined || dd === null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60 * 100) / 100;
  return { d, m, s };
};

/** Chuyển đổi tọa độ DMS sang thập phân */
export const dmsToDd = (d: number, m: number, s: number) => {
  return d + m / 60 + s / 3600;
};

/** Format Vĩ độ (Latitude - N) chuẩn Hàng hải */
export const formatDmsLat = (lat?: number) => {
  const dms = ddToDms(lat);
  return `${dms.d}° ${dms.m}' ${dms.s}" N`;
};

/** Format Kinh độ (Longitude - E) chuẩn Hàng hải */
export const formatDmsLng = (lng?: number) => {
  const dms = ddToDms(lng);
  return `${dms.d}° ${dms.m}' ${dms.s}" E`;
};

/**
 * Nút ⋮ của chk: `btn btn-icon btn-outline btn-icon-muted btn-active-primary`
 * — nền trắng, icon xám nhạt, tròn; khi menu mở thì nền chuyển primary, icon
 * trắng (quy tắc `.btn-active-primary.show` của Metronic).
 */
export const rowActionButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  color: textTertiary,
  borderColor: borderDefault,
  background: surfaceCard,
  fontSize: fontSizeMd,
};

/** Pill Badge Standard theo quy chuẩn hệ thống (bán nguyệt 2 đầu, viền và nền semantic). */
export const statusBadgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: radiusPill,
  fontSize: fontSizeMd,
  fontWeight: fontWeightMedium,
  background: `${color}15`,
  border: `1px solid ${color}40`,
  color,
  whiteSpace: 'nowrap',
});

/** Render Pill Badge màu ngữ nghĩa cho trạng thái kế hoạch/công việc/xử lý. */
export const renderPlanStatusBadge = (status?: string): React.ReactNode => {
  if (!status) return '—';
  let color = statusDraft;
  if (status.includes('Hoàn thành') || status.includes('Đã xử lý') || status.includes('Đã khắc phục')) {
    color = statusOperational;
  } else if (status.includes('Đang thực hiện') || status.includes('Đang xử lý') || status.includes('Đã kích hoạt')) {
    color = actionPrimary;
  } else if (status.includes('Chưa thực hiện') || status.includes('Chờ')) {
    color = statusDraft;
  } else if (status.includes('Tạm dừng') || status.includes('Hủy') || status.includes('Dừng') || status.includes('Nghiêm trọng')) {
    color = statusCritical;
  }
  return React.createElement('span', { style: statusBadgeStyle(color) }, status);
};

/** Render Pill Badge màu ngữ nghĩa cho mức độ sự cố/rủi ro. */
export const renderSeverityBadge = (severity?: string): React.ReactNode => {
  if (!severity) return '—';
  let color = statusOperational;
  if (severity.includes('Nghiêm trọng') || severity.includes('Cao')) {
    color = statusCritical;
  } else if (severity.includes('Trung bình')) {
    color = statusAttention;
  } else if (severity.includes('Nhẹ') || severity.includes('Thấp')) {
    color = statusOperational;
  }
  return React.createElement('span', { style: statusBadgeStyle(color) }, severity);
};

/** Theme Ant Design cho vùng CHK — xem chú thích ở tokens.ts. */
export const antdTheme = {
  token: {
    colorPrimary: actionPrimary,
    colorText: textPrimary,
    colorTextSecondary: textSecondary,
    colorTextTertiary: textTertiary,
    colorTextDescription: textSecondary,
    colorTextPlaceholder: textTertiary,
    colorBorder: borderDefault,
    colorBgContainer: surfaceCard,
    colorError: statusCritical,
    colorSuccess: statusOperational,
    colorWarning: statusAttention,
    colorInfo: statusInfo,
    fontFamily: fontSans,
    fontSize: fontSizeMd,
    borderRadius: radiusPill,
    borderRadiusLG: radiusLg,
    borderRadiusSM: radiusPill,
    controlHeight,
  },
  components: {
    Button: {
      borderRadius: radiusPill,
      controlHeight,
      colorPrimary: actionPrimary,
      colorPrimaryHover: actionHover,
    },
    Input: {
      borderRadius: radiusPill,
      controlHeight,
    },
    Select: {
      borderRadius: radiusPill,
      controlHeight,
    },
    TreeSelect: {
      borderRadius: radiusPill,
      controlHeight,
    },
    DatePicker: {
      borderRadius: radiusPill,
      controlHeight,
    },
    InputNumber: {
      borderRadius: radiusPill,
      controlHeight,
    },
    Card: {
      borderRadiusLG: radiusLg,
    },
    Modal: {
      borderRadiusLG: radiusLg,
    },
    Drawer: {
      borderRadiusLG: radiusLg,
    },
    Table: {
      headerBg: tableHeaderBg,
      headerColor: tableHeaderColor,
      rowHoverBg: tableRowHoverBg,
      borderRadius: radiusSm,
    },
  },
};


// --- CẦU NỐI SANG CSS ---
// Xem chú thích mục 7 trong tokens.ts. Đây là nơi duy nhất khai giá trị cho các
// chỗ mà CSS toàn cục (dùng !important) và pseudo-element chi phối.

/** Biến CSS phát ra cho vùng đang áp theme CHK. */
export const themeCssVariables: Record<string, string> = {
  '--table-header-bg': tableHeaderBg,
  '--table-header-color': tableHeaderColor,
  '--color-primary': actionPrimary,
  '--primary-hover': actionHover,
  '--text-primary': textPrimary,
  '--text-secondary': textSecondary,
  '--text-tertiary': textTertiary,
  '--border-base': borderDefault,
  '--border-light': borderDefault,
  '--bg-body': surfacePage,
  '--bg-container': surfaceCard,
  '--font-family': fontSans,
  '--radius-sm': `${radiusSm}px`,
  '--radius-md': `${radiusMd}px`,
  '--radius-lg': `${radiusLg}px`,
  '--radius-pill': `${radiusPill}px`,
  '--selected-table-row-bg': tableRowSelectedBg,
};

/** Quy tắc CSS chỉ áp trong vùng theme CHK: thanh cuộn mảnh, tiêu đề cột navy. */
export const themeScopedCss = (scope: string): string => `
.${scope} { font-family: ${fontSans}; }
.${scope} .ant-dropdown-menu { border-radius: ${radiusMd}px; padding: 6px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.10); }
.${scope} .ant-dropdown-menu-item { font-size: ${fontSizeMd}px; padding: 8px 16px; border-radius: 0; color: ${textPrimary}; }
.${scope} .ant-dropdown-menu-item-danger,
.${scope} .ant-dropdown-menu-item-danger .anticon { color: ${statusCritical}; }
.${scope} .ant-dropdown-menu-item:hover { background: #f4f5f8; }
.${scope} .ant-dropdown-menu-item .anticon { margin-right: 8px; width: 16px; text-align: center; }
.${scope} .ant-btn { border-radius: 999px !important; }
.${scope} input.ant-input:not(.ant-space-compact *) { border-radius: 999px !important; }
.${scope} .ant-input:not(textarea):not(.ant-space-compact *) { border-radius: 999px !important; }
.${scope} .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-textarea-with-clear-btn):not(.ant-space-compact *) {
  border-radius: 999px !important;
  padding: 0 12px !important;
  height: 40px !important;
  display: inline-flex !important;
  align-items: center !important;
}
.${scope} .ant-input-affix-wrapper > input.ant-input {
  padding: 0 !important;
  font-size: 13px !important;
  height: 38px !important;
  line-height: 38px !important;
}
.${scope} .ant-input:not(.ant-input-affix-wrapper):not(textarea):not(.ant-input-affix-wrapper input) {
  padding: 0 12px !important;
  height: 40px !important;
  font-size: 13px !important;
  line-height: 38px !important;
}
.${scope} textarea.ant-input,
.${scope} .ant-input-textarea,
.${scope} .ant-input-textarea > textarea,
.${scope} .ant-input-textarea-show-count,
.${scope} .ant-input-textarea-show-count textarea,
textarea.ant-input {
  border-radius: 20px !important;
  padding: 10px 16px !important;
}
.${scope} .ant-select-single .ant-select-selector {
  border-radius: 999px !important;
  padding: 0 12px !important;
  height: 40px !important;
}
.${scope} .ant-select-single:not(.ant-select-customize-input) .ant-select-selector .ant-select-selection-placeholder,
.${scope} .ant-select-single:not(.ant-select-customize-input) .ant-select-selector .ant-select-selection-item {
  left: 12px !important;
  padding: 0 !important;
  line-height: 38px !important;
  font-size: 13px !important;
}
.${scope} .ant-picker {
  border-radius: 999px !important;
  padding: 0 12px !important;
  height: 40px !important;
}
.${scope} .ant-input-number:not(.ant-space-compact *) { border-radius: 999px !important; }
.${scope} .ant-space-compact > .ant-input-number,
.${scope} .ant-space-compact > .ant-input-number-affix-wrapper {
  border-top-left-radius: 6px !important;
  border-bottom-left-radius: 6px !important;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
.${scope} .ant-space-compact > div:last-child {
  border-top-right-radius: 6px !important;
  border-bottom-right-radius: 6px !important;
}
.${scope} .ant-tree-select .ant-select-selector { border-radius: 999px !important; padding: 0 12px !important; }
.${scope} .list-view-table .ant-btn.ant-dropdown-open,
.${scope} .list-view-table .ant-btn:hover { background: ${actionPrimary} !important; border-color: ${actionPrimary} !important; color: #ffffff !important; }

/* ── Chi tiết 2 cột trong Drawer/Modal ── */
.chk-detail-grid,
.${scope} .chk-detail-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  column-gap: 24px !important;
  row-gap: 0 !important;
}
.chk-detail-row,
.${scope} .chk-detail-row {
  display: flex !important;
  align-items: flex-start !important;
  min-height: 38px !important;
  padding: 8px 0 !important;
  border-bottom: 1px solid ${borderDefault} !important;
  line-height: 1.5 !important;
}
.chk-detail-row--full,
.${scope} .chk-detail-row--full {
  grid-column: 1 / -1 !important;
}
.chk-detail-label,
.${scope} .chk-detail-label {
  width: 190px !important;
  flex-shrink: 0 !important;
  color: ${sidebarBg} !important;
  font-weight: ${fontWeightBold} !important;
  font-size: ${fontSizeMd}px !important;
  text-align: left !important;
  line-height: 1.5 !important;
}
.chk-detail-label::after,
.${scope} .chk-detail-label::after {
  content: ':' !important;
  margin-left: 1px !important;
}
.chk-detail-value,
.${scope} .chk-detail-value {
  color: ${textPrimary} !important;
  font-size: ${fontSizeMd}px !important;
  flex: 1 !important;
  min-width: 0 !important;
  text-align: left !important;
  line-height: 1.5 !important;
  overflow-wrap: anywhere !important;
}

/* ── Modal chuẩn giao diện ── */
.ant-modal {
  top: 120px;
}
.ant-modal .ant-modal-content {
  border-radius: 16px !important;
  padding: 24px !important;
}
.ant-modal .ant-modal-header {
  margin-bottom: 16px !important;
}
.ant-modal .ant-modal-title {
  color: ${sidebarBg} !important;
  font-weight: 700 !important;
  font-size: 16px !important;
}
.ant-modal textarea.ant-input,
.ant-modal .ant-input-textarea,
.ant-modal .ant-input-textarea > textarea {
  border-radius: 8px !important;
  padding: 10px 14px !important;
}
.ant-modal .ant-modal-footer {
  margin-top: 20px !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 10px !important;
}
.ant-modal .ant-modal-footer .ant-btn {
  height: 38px !important;
  border-radius: 999px !important;
  padding: 0 20px !important;
  font-weight: 500 !important;
}
.ant-modal .ant-modal-footer .ant-btn-primary {
  background: ${sidebarBg} !important;
  border-color: ${sidebarBg} !important;
}

/* ── Chuẩn hóa ô chọn nhiều (Select mode="multiple") hiển thị toàn bộ ── */
/* High-specificity override for multi-select using dedicated class */
.${scope} .chk-multi-select.ant-select-multiple .ant-select-selector,
.chk-multi-select.ant-select-multiple .ant-select-selector,
.${scope} .ant-select-multiple.ant-select-multiple .ant-select-selector,
.ant-select-multiple.ant-select-multiple .ant-select-selector {
  border-radius: 12px !important;
  padding: 8px 34px 8px 12px !important;
  min-height: 40px !important;
  height: auto !important;
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 4px !important;
  box-sizing: border-box !important;
}

.${scope} .ant-select-multiple .ant-select-selection-overflow,
.ant-select-multiple .ant-select-selection-overflow {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 6px !important;
  width: 100% !important;
  padding: 0 !important;
}

.${scope} .ant-select-multiple .ant-select-selection-placeholder,
.ant-select-multiple .ant-select-selection-placeholder {
  left: 12px !important;
  font-size: 13px !important;
}

.${scope} .ant-select-multiple .ant-select-selection-item,
.ant-select-multiple .ant-select-selection-item {
  margin: 2px 0 !important;
  padding: 0 10px 0 10px !important;
  height: 28px !important;
  line-height: 26px !important;
  border-radius: 999px !important;
  background: #eef3fb !important;
  border: 1px solid #c6d9f5 !important;
  color: ${sidebarBg} !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  display: inline-flex !important;
  align-items: center !important;
  white-space: nowrap !important;
}

.${scope} .ant-select-multiple .ant-select-selection-item-content,
.ant-select-multiple .ant-select-selection-item-content {
  margin-right: 4px !important;
  color: ${sidebarBg} !important;
  font-size: 12px !important;
}

.${scope} .ant-select-multiple .ant-select-selection-item-remove,
.ant-select-multiple .ant-select-selection-item-remove {
  color: #7e8299 !important;
  font-size: 11px !important;
  display: inline-flex !important;
  align-items: center !important;
}

.${scope} .ant-select-multiple .ant-select-selection-item-remove:hover,
.ant-select-multiple .ant-select-selection-item-remove:hover {
  color: #f1416c !important;
}

/* Dịch vụ cung cấp: giữ toàn bộ lựa chọn theo từng dòng như mẫu nghiệp vụ */
.${scope} .chk-multi-select.ant-select-multiple .ant-select-selector,
.chk-multi-select.ant-select-multiple .ant-select-selector {
  border-radius: ${radiusMd}px !important;
  padding: ${spaceMd}px 34px ${spaceMd}px ${spaceMd}px !important;
  min-height: ${controlHeight}px !important;
  height: auto !important;
  align-items: stretch !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-selection-overflow,
.chk-multi-select.ant-select-multiple .ant-select-selection-overflow {
  flex-direction: column !important;
  align-items: stretch !important;
  gap: ${spaceSm}px !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-selection-item,
.chk-multi-select.ant-select-multiple .ant-select-selection-item {
  flex: 0 0 100% !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  padding: 0 !important;
  height: auto !important;
  min-height: 32px !important;
  line-height: 32px !important;
  border: 0 !important;
  border-radius: ${radiusMd}px !important;
  background: transparent !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-selection-item-content,
.chk-multi-select.ant-select-multiple .ant-select-selection-item-content {
  display: block !important;
  min-width: 0 !important;
  width: 100% !important;
  margin-right: 0 !important;
  overflow: hidden !important;
}

/* Ant Design v6: DOM mới dùng ant-select-content/ant-select-content-item */
.${scope} .chk-multi-select.ant-select-multiple,
.chk-multi-select.ant-select-multiple {
  min-height: ${controlHeight}px !important;
  height: auto !important;
  padding: ${spaceSm}px 34px ${spaceSm}px ${spaceSm}px !important;
  border-radius: ${controlHeight / 2}px !important;
  box-sizing: border-box !important;
  align-items: stretch !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-content,
.chk-multi-select.ant-select-multiple .ant-select-content {
  display: flex !important;
  flex-direction: column !important;
  flex-wrap: nowrap !important;
  align-items: stretch !important;
  gap: ${spaceXs}px !important;
  width: 100% !important;
  min-width: 0 !important;
  padding: 0 !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-content::before,
.chk-multi-select.ant-select-multiple .ant-select-content::before {
  display: none !important;
  content: none !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-content-item:not(.ant-select-content-item-suffix),
.chk-multi-select.ant-select-multiple .ant-select-content-item:not(.ant-select-content-item-suffix) {
  display: block !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-content-item:not(.ant-select-content-item-suffix) > span,
.chk-multi-select.ant-select-multiple .ant-select-content-item:not(.ant-select-content-item-suffix) > span {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
}

.${scope} .chk-multi-select.ant-select-multiple .ant-select-content-item-suffix,
.chk-multi-select.ant-select-multiple .ant-select-content-item-suffix {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  overflow: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* ── Menu danh sách chọn trong Dropdown (lùi sâu 16px chuẩn đồng bộ) ── */
.ant-select-dropdown .ant-select-item {
  padding: 8px 16px !important;
  font-size: 13px !important;
}
.ant-select-dropdown .ant-select-item-option-content {
  padding-left: 2px !important;
}

/* ── Đồng bộ thanh cuộn toàn hệ thống (Table, Dropdown, Modal, Drawer) ── */
*::-webkit-scrollbar,
.${scope} ::-webkit-scrollbar,
.ant-select-dropdown ::-webkit-scrollbar,
.ant-select-tree-dropdown ::-webkit-scrollbar,
.ant-tree-select-dropdown ::-webkit-scrollbar,
.ant-picker-dropdown ::-webkit-scrollbar,
.ant-drawer-body ::-webkit-scrollbar,
.ant-modal-body ::-webkit-scrollbar,
.rc-virtual-list-holder ::-webkit-scrollbar,
.ant-select-tree-list-holder ::-webkit-scrollbar {
  width: ${scrollbarSize}px !important;
  height: ${scrollbarSize}px !important;
}

*::-webkit-scrollbar-button,
::-webkit-scrollbar-button,
.${scope} ::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

*::-webkit-scrollbar-thumb,
.${scope} ::-webkit-scrollbar-thumb,
.ant-select-dropdown ::-webkit-scrollbar-thumb,
.ant-select-tree-dropdown ::-webkit-scrollbar-thumb,
.ant-tree-select-dropdown ::-webkit-scrollbar-thumb,
.ant-picker-dropdown ::-webkit-scrollbar-thumb,
.ant-drawer-body ::-webkit-scrollbar-thumb,
.ant-modal-body ::-webkit-scrollbar-thumb,
.rc-virtual-list-holder ::-webkit-scrollbar-thumb,
.ant-select-tree-list-holder ::-webkit-scrollbar-thumb {
  background: ${scrollbarThumb} !important;
  border-radius: 999px !important;
  border: none !important;
}

*::-webkit-scrollbar-thumb:hover,
.${scope} ::-webkit-scrollbar-thumb:hover,
.ant-select-dropdown ::-webkit-scrollbar-thumb:hover,
.ant-select-tree-dropdown ::-webkit-scrollbar-thumb:hover,
.ant-tree-select-dropdown ::-webkit-scrollbar-thumb:hover,
.ant-picker-dropdown ::-webkit-scrollbar-thumb:hover,
.ant-drawer-body ::-webkit-scrollbar-thumb:hover,
.ant-modal-body ::-webkit-scrollbar-thumb:hover,
.rc-virtual-list-holder ::-webkit-scrollbar-thumb:hover,
.ant-select-tree-list-holder ::-webkit-scrollbar-thumb:hover {
  background: ${scrollbarThumbHover} !important;
}

*::-webkit-scrollbar-track,
.${scope} ::-webkit-scrollbar-track,
.ant-select-dropdown ::-webkit-scrollbar-track,
.ant-select-tree-dropdown ::-webkit-scrollbar-track,
.ant-tree-select-dropdown ::-webkit-scrollbar-track,
.rc-virtual-list-holder ::-webkit-scrollbar-track,
.ant-select-tree-list-holder ::-webkit-scrollbar-track {
  background: transparent !important;
}

*::-webkit-scrollbar-corner,
.${scope} ::-webkit-scrollbar-corner {
  background: transparent !important;
}

/* Ant Design Virtual List Scrollbar (RC Virtual List cho Select / TreeSelect) */
.rc-virtual-list-scrollbar,
.ant-select-tree-list-scrollbar,
.ant-tree-list-scrollbar {
  width: ${scrollbarSize}px !important;
  right: 2px !important;
  background: transparent !important;
}
.rc-virtual-list-scrollbar-thumb,
.ant-select-tree-list-scrollbar-thumb,
.ant-tree-list-scrollbar-thumb {
  width: ${scrollbarSize}px !important;
  min-width: ${scrollbarSize}px !important;
  max-width: ${scrollbarSize}px !important;
  background: ${scrollbarThumb} !important;
  border-radius: 999px !important;
  border: none !important;
}
.rc-virtual-list-scrollbar-thumb:hover,
.ant-select-tree-list-scrollbar-thumb:hover,
.ant-tree-list-scrollbar-thumb:hover {
  background: ${scrollbarThumbHover} !important;
}

.${scope} .ant-table-body,
.${scope} .ant-table-content,
.${scope} .ant-table-sticky-scroll,
.ant-select-dropdown,
.ant-select-tree-dropdown,
.ant-tree-select-dropdown,
.rc-virtual-list-holder {
  scrollbar-width: thin;
  scrollbar-color: ${scrollbarThumb} transparent;
}
.${scope} .ant-table-sticky-scroll-bar {
  background: ${scrollbarThumb} !important;
  border-radius: 999px !important;
  height: ${scrollbarSize}px !important;
}
.${scope} .ant-table-sticky-scroll-bar:hover {
  background: ${scrollbarThumbHover} !important;
}
.${scope} .ant-table-sticky-scroll {
  height: ${scrollbarSize}px !important;
  background: transparent !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th,
.${scope} .ant-table-thead > tr > th,
.ant-table-thead > tr > th { 
  background: ${tableHeaderBg};
  color: ${tableHeaderColor}; 
  font-weight: 600;
  border-bottom: 1px solid ${borderDefault};
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
  white-space: nowrap !important;
  vertical-align: middle !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th.ant-table-column-has-sorters,
.${scope} .ant-table-thead > tr > th.ant-table-column-has-sorters {
  cursor: pointer !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th.ant-table-column-has-sorters:hover { 
  background: #f4f6fa !important;
  color: ${actionPrimary} !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th.ant-table-column-sort { 
  background: #f8fafc !important;
  color: ${actionPrimary} !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th.ant-table-column-sort:hover { 
  background: #ffffff !important;
  color: ${actionPrimary} !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th.ant-table-column-has-sorters .ant-table-column-sorters,
.${scope} .ant-table-thead > tr > th.ant-table-column-has-sorters .ant-table-column-sorters {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 100% !important;
  cursor: pointer !important;
  padding: 0 !important;
  white-space: nowrap !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th.ant-table-column-has-sorters .ant-table-column-title,
.${scope} .ant-table-thead > tr > th.ant-table-column-has-sorters .ant-table-column-title,
.${scope} .ant-table-thead > tr > th .ant-table-column-title {
  flex: 0 1 auto !important;
  white-space: nowrap !important;
}
.${scope} .list-view-table .ant-table-thead > tr > th.ant-table-column-has-sorters .ant-table-column-sorter,
.${scope} .ant-table-thead > tr > th.ant-table-column-has-sorters .ant-table-column-sorter {
  margin-left: 6px !important;
  display: inline-flex !important;
  align-items: center !important;
  flex-shrink: 0 !important;
}
.${scope} .list-view-table .ant-table-tbody > tr > td {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.${scope} .list-view-table .ant-table-tbody > tr > td:not(.ant-table-cell-fix-right) > div:not([style*="display: inline-flex"]):not([style*="border-radius: 999"]) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.${scope} .list-view-table .ant-table-tbody > tr > td a {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.${scope} .list-view-table .ant-table-tbody > tr:nth-child(even) > td {
  background: ${tableRowStripeBg};
}
.${scope} .list-view-table .ant-table-tbody > tr:hover > td { 
  background: ${tableRowHoverBg} !important; 
}
.${scope} .list-view-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left,
.${scope} .list-view-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-start,
.${scope} .list-view-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
.${scope} .list-view-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-end { 
  background: ${tableRowHoverBgFixed} !important; 
}

/* ── Drawer & Detail Table Card Standard (Khóa cứng phân trang cố định đáy, đỉnh bảng đồng đều) ── */
.ant-drawer .ant-drawer-body {
  overflow: hidden !important;
  padding: 0 24px !important;
}
.ant-drawer .ant-drawer-body::-webkit-scrollbar,
.ant-drawer .ant-tabs-content-holder div::-webkit-scrollbar,
.ant-drawer .ant-tabs-tabpane div::-webkit-scrollbar {
  width: 6px !important;
  display: block !important;
}
.ant-drawer .ant-drawer-body::-webkit-scrollbar-thumb,
.ant-drawer .ant-tabs-content-holder div::-webkit-scrollbar-thumb,
.ant-drawer .ant-tabs-tabpane div::-webkit-scrollbar-thumb {
  background-color: #cbd5e1 !important;
  border-radius: 4px !important;
}
.ant-drawer .ant-drawer-body::-webkit-scrollbar-track,
.ant-drawer .ant-tabs-content-holder div::-webkit-scrollbar-track,
.ant-drawer .ant-tabs-tabpane div::-webkit-scrollbar-track {
  background: transparent !important;
}
.ant-drawer .ant-drawer-body::-webkit-scrollbar-button,
.ant-drawer .ant-tabs-content-holder div::-webkit-scrollbar-button,
.ant-drawer .ant-tabs-tabpane div::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.ant-drawer .chk-detail-table-card,
.chk-detail-table-card {
  margin-top: 0 !important;
  padding-top: 0 !important;
}
.ant-drawer .ant-table-wrapper {
  margin-top: 0 !important;
}
.ant-drawer .ant-table-wrapper .ant-spin-container {
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}
.ant-drawer .ant-table-wrapper .ant-table {
  flex: 0 0 auto !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.ant-drawer .ant-table table {
  table-layout: fixed !important;
}
.ant-drawer .ant-table-thead > tr > th {
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
  padding: 8px 12px !important;
}
.ant-drawer .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
  padding: 6px 12px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.ant-drawer .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(.ant-tag),
.ant-drawer .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="999px"]),
.ant-drawer .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="borderRadius: 999px"]),
.ant-drawer .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="border-radius: 999px"]),
.ant-drawer .ant-table-tbody > tr:not(.ant-table-measure-row) > td.chk-col-status {
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
}
.ant-drawer .ant-table-thead > tr > th.ant-table-cell-align-right,
.ant-drawer .ant-table-tbody > tr > td.ant-table-cell-align-right {
  padding-right: 18px !important;
}
.ant-drawer .ant-table-tbody > tr.ant-table-measure-row,
.ant-drawer .ant-table-tbody > tr.ant-table-measure-row > td {
  padding: 0 !important;
  height: 0 !important;
  border: 0 !important;
  line-height: 0 !important;
  font-size: 0 !important;
}
.ant-drawer .ant-table-wrapper .ant-table-pagination.ant-pagination {
  flex: 0 0 auto !important;
  margin-top: 12px !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  align-self: flex-end !important;
}

/* ── Tabs thanh cuộn ngang mượt mà, sticky cố định trên đầu khi scroll ── */
.ant-drawer .ant-tabs-nav,
.ant-tabs-nav {
  position: sticky !important;
  top: 0 !important;
  z-index: 50 !important;
  background: #ffffff !important;
  margin: 0 0 12px 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.ant-drawer .ant-tabs-content-holder,
.ant-tabs-content-holder {
  margin: 0 !important;
  padding: 0 !important;
}
.ant-tabs-tabpane,
.ant-drawer .ant-tabs-tabpane {
  animation: none !important;
  transition: none !important;
}
.ant-tabs-content,
.ant-drawer .ant-tabs-content {
  transition: none !important;
}
.ant-drawer .ant-tabs-nav-wrap::-webkit-scrollbar,
.ant-tabs-nav-wrap::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.ant-drawer .ant-tabs-nav-list,
.ant-tabs-nav-list {
  display: flex !important;
  flex-wrap: nowrap !important;
  margin-left: 0 !important;
  padding-left: 0 !important;
  transition: none !important;
}
.ant-drawer .ant-tabs-nav-operations,
.ant-tabs-nav-operations {
  display: none !important;
}
.ant-drawer .ant-tabs-content-holder,
.ant-drawer .ant-tabs-tabpane {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
.ant-drawer .ant-tabs-nav::before {
  border-bottom: 1px solid #e8ebf0 !important;
}
.ant-drawer .ant-tabs-tab,
.ant-tabs-tab {
  padding: 8px 16px !important;
  margin: 0 4px 0 0 !important;
  font-size: ${fontSizeMd}px !important;
  font-weight: 500 !important;
  color: ${textSecondary} !important;
  transition: color 0.15s ease !important;
  flex-shrink: 0 !important;
  white-space: nowrap !important;
  text-align: center !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.ant-drawer .ant-tabs-tab .ant-tabs-tab-btn,
.ant-tabs-tab .ant-tabs-tab-btn {
  text-align: center !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.ant-drawer .ant-tabs-tab:hover {
  color: ${sidebarBg} !important;
}
.ant-drawer .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
  color: ${sidebarBg} !important;
  font-weight: 600 !important;
}
.ant-drawer .ant-tabs-ink-bar {
  background: ${sidebarBg} !important;
  height: 2px !important;
  border-radius: 2px !important;
}
.ant-drawer .ant-form-item-label {
  padding: 0 0 8px 0 !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
}
.ant-drawer .ant-form-item-label > label {
  height: 32px !important;
  display: inline-flex !important;
  align-items: center !important;
}
.ant-select-tree-dropdown,
.ant-tree-select-dropdown,
.ant-select-dropdown {
  border-radius: 8px !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
}
.ant-select-tree-dropdown,
.ant-tree-select-dropdown {
  min-width: 280px !important;
}
.ant-select-tree {
  font-family: inherit !important;
  font-size: ${fontSizeMd}px !important;
  color: ${textPrimary} !important;
  padding: 4px 0 !important;
}
.ant-select-tree .ant-select-tree-treenode {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  padding: 5px 8px !important;
  margin-bottom: 2px !important;
  border-radius: 8px !important;
  min-height: 32px !important;
  height: auto !important;
  transition: all 0.15s ease !important;
}
.ant-select-tree .ant-select-tree-treenode:hover,
.ant-select-tree .ant-select-tree-treenode.ant-select-tree-treenode-active {
  background-color: #f1f5f9 !important;
  color: ${actionPrimary} !important;
}
.ant-select-tree .ant-select-tree-treenode:hover .ant-select-tree-node-content-wrapper,
.ant-select-tree .ant-select-tree-treenode.ant-select-tree-treenode-active .ant-select-tree-node-content-wrapper,
.ant-select-tree .ant-select-tree-treenode:hover .ant-select-tree-title,
.ant-select-tree .ant-select-tree-treenode.ant-select-tree-treenode-active .ant-select-tree-title {
  color: ${actionPrimary} !important;
  font-weight: 500 !important;
}
.ant-select-tree .ant-select-tree-treenode-selected,
.ant-select-tree .ant-select-tree-treenode-selected .ant-select-tree-node-content-wrapper,
.ant-select-tree .ant-select-tree-treenode-selected .ant-select-tree-title {
  background-color: #eef2ff !important;
  color: ${actionPrimary} !important;
  font-weight: 600 !important;
}
.ant-select-tree-indent {
  align-self: center !important;
}
.ant-select-tree-indent-unit {
  width: 16px !important;
}
.ant-select-tree-switcher {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 18px !important;
  height: 18px !important;
  line-height: 18px !important;
  align-self: flex-start !important;
  margin-top: 2px !important;
  margin-right: 4px !important;
  cursor: pointer !important;
  color: #64748b !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  transition: color 0.15s ease, transform 0.2s ease !important;
}
.ant-select-tree-switcher::before,
.ant-select-tree-switcher::after {
  display: none !important;
  content: none !important;
}
.ant-select-tree-switcher:hover {
  color: ${actionPrimary} !important;
  background: transparent !important;
  box-shadow: none !important;
}
.ant-select-tree-switcher_open .ant-select-tree-switcher-icon {
  transform: rotate(0deg) !important;
  display: inline-flex !important;
  align-items: center !important;
}
.ant-select-tree-switcher_close .ant-select-tree-switcher-icon {
  transform: rotate(-90deg) !important;
  display: inline-flex !important;
  align-items: center !important;
}
.ant-select-tree-node-content-wrapper {
  display: inline-flex !important;
  align-items: flex-start !important;
  flex: 1 !important;
  min-height: 22px !important;
  padding: 1px 4px !important;
  border-radius: 4px !important;
  color: inherit !important;
  background: transparent !important;
  white-space: normal !important;
  word-break: break-word !important;
}
.ant-select-tree-title {
  color: inherit !important;
  font-size: ${fontSizeMd}px !important;
  line-height: 1.4 !important;
  white-space: normal !important;
  word-break: break-word !important;
  display: block !important;
  width: 100%;
}
.ant-select-dropdown .ant-select-item-option-active {
  background-color: #f1f5f9 !important;
  color: ${actionPrimary} !important;
  font-weight: 600 !important;
}
.ant-select-dropdown .ant-select-item {
  font-size: ${fontSizeMd}px !important;
  border-radius: 6px !important;
  padding: 4px 10px !important;
  margin-bottom: 2px !important;
  min-height: 28px !important;
  height: auto !important;
  display: flex !important;
  align-items: center !important;
  white-space: normal !important;
  word-break: break-word !important;
  line-height: 1.4 !important;
}
.ant-select-dropdown .ant-select-item-option-content {
  white-space: normal !important;
  word-break: break-word !important;
  line-height: 1.4 !important;
}
.ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
  background-color: #eff6ff !important;
  color: ${actionPrimary} !important;
  font-weight: 600 !important;
}

/* ── DatePicker Dropdown & Calendar Styling ── */
.ant-picker-dropdown {
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  z-index: 1200 !important;
}

.chk-form-datepicker-popup.ant-picker-dropdown {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
  z-index: 1500 !important;
  background: #ffffff !important;
}

.chk-form-datepicker-popup .ant-picker-panel-container {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  background: #ffffff !important;
  border: 1px solid ${borderDefault} !important;
}

.chk-form-datepicker-popup .ant-picker-panel {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  display: block !important;
}

.chk-form-datepicker-popup .ant-picker-date-panel,
.chk-form-datepicker-popup .ant-picker-year-panel,
.chk-form-datepicker-popup .ant-picker-month-panel,
.chk-form-datepicker-popup .ant-picker-decade-panel,
.chk-form-datepicker-popup .ant-picker-quarter-panel {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

.chk-form-datepicker-popup .ant-picker-header {
  width: 100% !important;
  padding: 6px 14px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  border-bottom: 1px solid ${borderDefault} !important;
  height: 36px !important;
  box-sizing: border-box !important;
}

.chk-form-datepicker-popup .ant-picker-header button {
  padding: 0 6px !important;
  font-size: 12px !important;
}

.chk-form-datepicker-popup .ant-picker-header-view {
  font-size: 13px !important;
  font-weight: 600 !important;
}

.chk-form-datepicker-popup .ant-picker-body {
  width: 100% !important;
  padding: 8px 12px !important;
  box-sizing: border-box !important;
}

.chk-form-datepicker-popup .ant-picker-content {
  width: 100% !important;
  table-layout: fixed !important;
  border-collapse: collapse !important;
}

.chk-form-datepicker-popup .ant-picker-content tr {
  display: table-row !important;
  width: 100% !important;
}

.chk-form-datepicker-popup .ant-picker-date-panel .ant-picker-content th {
  width: 14.2857% !important;
  text-align: center !important;
  padding: 2px 0 !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  color: ${textSecondary} !important;
  height: 24px !important;
}

.chk-form-datepicker-popup .ant-picker-date-panel .ant-picker-cell {
  width: 14.2857% !important;
  text-align: center !important;
  padding: 2px 0 !important;
}

.chk-form-datepicker-popup .ant-picker-date-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  line-height: 28px !important;
  border-radius: ${radiusPill} !important;
  font-size: 12px !important;
}

.chk-form-datepicker-popup .ant-picker-year-panel .ant-picker-cell,
.chk-form-datepicker-popup .ant-picker-month-panel .ant-picker-cell,
.chk-form-datepicker-popup .ant-picker-decade-panel .ant-picker-cell {
  width: 33.333333% !important;
  text-align: center !important;
  padding: 6px 4px !important;
  box-sizing: border-box !important;
}

.chk-form-datepicker-popup .ant-picker-year-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-form-datepicker-popup .ant-picker-month-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-form-datepicker-popup .ant-picker-decade-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: calc(100% - 8px) !important;
  height: 32px !important;
  line-height: 32px !important;
  border-radius: ${radiusPill} !important;
  font-size: 13px !important;
  padding: 0 8px !important;
  box-sizing: border-box !important;
}

.chk-form-datepicker-popup .ant-picker-quarter-panel .ant-picker-cell {
  width: 25% !important;
  text-align: center !important;
  padding: 6px 4px !important;
  box-sizing: border-box !important;
}

.chk-form-datepicker-popup .ant-picker-quarter-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: calc(100% - 8px) !important;
  height: 32px !important;
  line-height: 32px !important;
  border-radius: ${radiusPill} !important;
  font-size: 13px !important;
  padding: 0 4px !important;
  box-sizing: border-box !important;
}

.chk-form-datepicker-popup .ant-picker-cell-selected .ant-picker-cell-inner {
  background: ${actionPrimary} !important;
  color: #ffffff !important;
}

.chk-form-datepicker-popup .ant-picker-cell-today .ant-picker-cell-inner::before {
  border-radius: ${radiusPill} !important;
  border-color: ${actionPrimary} !important;
}

.chk-form-datepicker-popup .ant-picker-footer {
  width: 100% !important;
  border-top: 1px solid ${borderDefault} !important;
  padding: 8px 12px 10px 12px !important;
  text-align: center !important;
  min-height: auto !important;
}

.chk-form-datepicker-popup .ant-picker-ranges {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none !important;
}

.chk-form-datepicker-popup .ant-picker-today-btn {
  color: ${actionPrimary} !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  line-height: 20px !important;
  display: inline-block !important;
  padding: 2px 8px !important;
}

/* ── RangePicker Dropdown & 2-Panel Calendar Styling (x2 Width) ── */
.chk-range-datepicker-popup.ant-picker-dropdown {
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
  z-index: 1500 !important;
  background: #ffffff !important;
}

.chk-range-datepicker-popup .ant-picker-panel-container {
  border-radius: 12px !important;
  overflow: hidden !important;
  background: #ffffff !important;
  border: 1px solid ${borderDefault} !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
  padding-bottom: 10px !important;
}

.chk-range-datepicker-popup .ant-picker-panels {
  display: flex !important;
  flex-direction: row !important;
  width: 560px !important;
  background: #ffffff !important;
}

.chk-range-datepicker-popup .ant-picker-panel {
  flex: 1 !important;
  width: 280px !important;
  display: block !important;
  background: #ffffff !important;
}

.chk-range-datepicker-popup .ant-picker-panel:first-child {
  border-right: 1px solid ${borderDefault} !important;
}

.chk-range-datepicker-popup .ant-picker-date-panel {
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

.chk-range-datepicker-popup .ant-picker-header {
  width: 100% !important;
  padding: 6px 14px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  border-bottom: 1px solid ${borderDefault} !important;
  height: 36px !important;
}

.chk-range-datepicker-popup .ant-picker-header button {
  padding: 0 6px !important;
  font-size: 12px !important;
}

.chk-range-datepicker-popup .ant-picker-header-view {
  font-size: 13px !important;
  font-weight: 600 !important;
}

.chk-range-datepicker-popup .ant-picker-body {
  width: 100% !important;
  padding: 8px 10px !important;
}

.chk-range-datepicker-popup .ant-picker-content {
  width: 100% !important;
  table-layout: fixed !important;
}

.chk-range-datepicker-popup .ant-picker-date-panel .ant-picker-content th {
  width: 14.285% !important;
  text-align: center !important;
  padding: 2px 0 !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  color: ${textSecondary} !important;
  height: 24px !important;
}

.chk-range-datepicker-popup .ant-picker-date-panel .ant-picker-cell {
  width: 14.285% !important;
  text-align: center !important;
  padding: 1px 0 !important;
}

.chk-range-datepicker-popup .ant-picker-date-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
  line-height: 26px !important;
  border-radius: ${radiusPill} !important;
  font-size: 12px !important;
}

.chk-range-datepicker-popup .ant-picker-year-panel .ant-picker-cell,
.chk-range-datepicker-popup .ant-picker-month-panel .ant-picker-cell,
.chk-range-datepicker-popup .ant-picker-decade-panel .ant-picker-cell {
  width: 33.333333% !important;
  text-align: center !important;
  padding: 8px 4px !important;
}

.chk-range-datepicker-popup .ant-picker-year-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-range-datepicker-popup .ant-picker-month-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-range-datepicker-popup .ant-picker-decade-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: calc(100% - 12px) !important;
  max-width: 90px !important;
  min-width: 52px !important;
  height: 28px !important;
  line-height: 28px !important;
  border-radius: ${radiusPill} !important;
  font-size: 13px !important;
}

.chk-range-datepicker-popup .ant-picker-quarter-panel .ant-picker-cell {
  width: 25% !important;
  text-align: center !important;
  padding: 8px 4px !important;
}

.chk-range-datepicker-popup .ant-picker-quarter-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: calc(100% - 10px) !important;
  max-width: 76px !important;
  min-width: 44px !important;
  height: 28px !important;
  line-height: 28px !important;
  border-radius: ${radiusPill} !important;
  font-size: 13px !important;
}

.chk-range-datepicker-popup .ant-picker-cell-selected .ant-picker-cell-inner,
.chk-range-datepicker-popup .ant-picker-cell-range-start .ant-picker-cell-inner,
.chk-range-datepicker-popup .ant-picker-cell-range-end .ant-picker-cell-inner {
  background: ${actionPrimary} !important;
  color: #ffffff !important;
}

.chk-range-datepicker-popup .ant-picker-cell-in-range:not(.ant-picker-cell-selected):not(.ant-picker-cell-range-start):not(.ant-picker-cell-range-end) {
  background: #eff6ff !important;
}

.chk-range-datepicker-popup .ant-picker-cell-today .ant-picker-cell-inner::before {
  border-radius: ${radiusPill} !important;
  border-color: ${actionPrimary} !important;
}

.chk-range-datepicker-popup .ant-picker-footer {
  width: 100% !important;
  border-top: 1px solid ${borderDefault} !important;
  padding: 8px 12px 10px 12px !important;
  text-align: center !important;
  min-height: auto !important;
}

.chk-range-datepicker-popup .ant-picker-ranges {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none !important;
}

/* ── Sidebar Compact 1-Panel RangePicker Styling (280px) ── */
.chk-sidebar-range-datepicker-popup.ant-picker-dropdown {
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
  z-index: 1500 !important;
  background: #ffffff !important;
  width: 280px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-panel-container {
  border-radius: 12px !important;
  overflow: hidden !important;
  background: #ffffff !important;
  border: 1px solid ${borderDefault} !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
  padding-bottom: 10px !important;
  width: 280px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-panels {
  display: flex !important;
  flex-direction: row !important;
  width: 280px !important;
  background: #ffffff !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-panel {
  width: 280px !important;
  display: block !important;
  background: #ffffff !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-panel + .ant-picker-panel {
  display: none !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-date-panel {
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-header {
  width: 100% !important;
  padding: 6px 14px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  border-bottom: 1px solid ${borderDefault} !important;
  height: 36px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-header button {
  padding: 0 6px !important;
  font-size: 12px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-header-view {
  font-size: 13px !important;
  font-weight: 600 !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-body {
  width: 100% !important;
  padding: 8px 10px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-content {
  width: 100% !important;
  table-layout: fixed !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-date-panel .ant-picker-content th {
  width: 14.285% !important;
  text-align: center !important;
  padding: 2px 0 !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  color: ${textSecondary} !important;
  height: 24px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-date-panel .ant-picker-cell {
  width: 14.285% !important;
  text-align: center !important;
  padding: 1px 0 !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-date-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
  line-height: 26px !important;
  border-radius: ${radiusPill} !important;
  font-size: 12px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-year-panel .ant-picker-cell,
.chk-sidebar-range-datepicker-popup .ant-picker-month-panel .ant-picker-cell,
.chk-sidebar-range-datepicker-popup .ant-picker-decade-panel .ant-picker-cell {
  width: 33.333333% !important;
  text-align: center !important;
  padding: 8px 4px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-year-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-sidebar-range-datepicker-popup .ant-picker-month-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-sidebar-range-datepicker-popup .ant-picker-decade-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: calc(100% - 12px) !important;
  max-width: 90px !important;
  min-width: 52px !important;
  height: 28px !important;
  line-height: 28px !important;
  border-radius: ${radiusPill} !important;
  font-size: 13px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-quarter-panel .ant-picker-cell {
  width: 25% !important;
  text-align: center !important;
  padding: 8px 4px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-quarter-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: calc(100% - 10px) !important;
  max-width: 76px !important;
  min-width: 44px !important;
  height: 28px !important;
  line-height: 28px !important;
  border-radius: ${radiusPill} !important;
  font-size: 13px !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-cell-selected .ant-picker-cell-inner,
.chk-sidebar-range-datepicker-popup .ant-picker-cell-range-start .ant-picker-cell-inner,
.chk-sidebar-range-datepicker-popup .ant-picker-cell-range-end .ant-picker-cell-inner {
  background: ${actionPrimary} !important;
  color: #ffffff !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-cell-in-range:not(.ant-picker-cell-selected):not(.ant-picker-cell-range-start):not(.ant-picker-cell-range-end) {
  background: #eff6ff !important;
}

.chk-sidebar-range-datepicker-popup .ant-picker-cell-today .ant-picker-cell-inner::before {
  border-radius: ${radiusPill} !important;
  border-color: ${actionPrimary} !important;
}

/* ── Sidebar Compact 1-Panel DatePicker Styling (280px) ── */
.chk-sidebar-datepicker-popup.ant-picker-dropdown {
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
  z-index: 1500 !important;
  background: #ffffff !important;
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
}

.chk-sidebar-datepicker-popup .ant-picker-panel-container {
  border-radius: 12px !important;
  overflow: hidden !important;
  background: #ffffff !important;
  border: 1px solid ${borderDefault} !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
  padding-bottom: 10px !important;
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
}

.chk-sidebar-datepicker-popup .ant-picker-panel {
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
  display: block !important;
  background: #ffffff !important;
}

.chk-sidebar-datepicker-popup .ant-picker-date-panel,
.chk-sidebar-datepicker-popup .ant-picker-year-panel,
.chk-sidebar-datepicker-popup .ant-picker-month-panel,
.chk-sidebar-datepicker-popup .ant-picker-decade-panel,
.chk-sidebar-datepicker-popup .ant-picker-quarter-panel {
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
  display: flex !important;
  flex-direction: column !important;
}

.chk-sidebar-datepicker-popup .ant-picker-header {
  width: 100% !important;
  padding: 6px 14px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  border-bottom: 1px solid ${borderDefault} !important;
  height: 36px !important;
}

.chk-sidebar-datepicker-popup .ant-picker-header button {
  padding: 0 6px !important;
  font-size: 12px !important;
}

.chk-sidebar-datepicker-popup .ant-picker-header-view {
  font-size: 13px !important;
  font-weight: 600 !important;
}

.chk-sidebar-datepicker-popup .ant-picker-body {
  width: 100% !important;
  padding: 8px 10px !important;
}

.chk-sidebar-datepicker-popup .ant-picker-content {
  width: 100% !important;
  table-layout: fixed !important;
}

.chk-sidebar-datepicker-popup .ant-picker-year-panel .ant-picker-cell,
.chk-sidebar-datepicker-popup .ant-picker-month-panel .ant-picker-cell,
.chk-sidebar-datepicker-popup .ant-picker-decade-panel .ant-picker-cell {
  width: 33.333333% !important;
  text-align: center !important;
  padding: 8px 4px !important;
}

.chk-sidebar-datepicker-popup .ant-picker-year-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-sidebar-datepicker-popup .ant-picker-month-panel .ant-picker-cell .ant-picker-cell-inner,
.chk-sidebar-datepicker-popup .ant-picker-decade-panel .ant-picker-cell .ant-picker-cell-inner {
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: calc(100% - 12px) !important;
  max-width: 90px !important;
  min-width: 52px !important;
  height: 28px !important;
  line-height: 28px !important;
  border-radius: ${radiusPill} !important;
  font-size: 13px !important;
}
`;

/**
 * Helper chuẩn hóa props cho DatePicker (đơn) và RangePicker (khoảng ngày)
 * Đảm bảo kích thước đồng nhất:
 * - DatePicker đơn trong form: popupClassName="chk-form-datepicker-popup", co dãn ôm khít 100% chiều rộng ô input.
 * - DatePicker đơn trên Sidebar: popupClassName="chk-sidebar-datepicker-popup", khóa chuẩn 280px theo Sidebar.
 * - DatePicker.RangePicker: popupClassName="chk-range-datepicker-popup", kích thước x2 (2 panel cạnh nhau 560px), ô ngày 26px đồng bộ.
 * - DatePicker.RangePicker (Sidebar): popupClassName="chk-sidebar-range-datepicker-popup", kích thước 1 panel ôm trọn thanh Sidebar 280px.
 */
export const getDatePickerProps = (extraProps?: Record<string, any>) => {
  const { classNames: extraClassNames, getPopupContainer, ...rest } = extraProps || {};
  return {
    format: 'DD/MM/YYYY',
    getPopupContainer: getPopupContainer || ((trigger: HTMLElement) => trigger.closest('.ant-form-item-control-input-content') || trigger.parentElement || document.body),
    classNames: {
      ...extraClassNames,
      popup: {
        ...extraClassNames?.popup,
        root: [
          'chk-form-datepicker-popup',
          typeof extraClassNames?.popup === 'object' ? extraClassNames.popup?.root : undefined,
          typeof extraClassNames?.popup === 'string' ? extraClassNames.popup : undefined,
        ].filter(Boolean).join(' '),
      },
    },
    style: { ...inputStyle, width: '100%' },
    ...rest,
  };
};

export const getSidebarDatePickerProps = (extraProps?: Record<string, any>) => {
  const { classNames: extraClassNames, ...rest } = extraProps || {};
  return {
    format: 'DD/MM/YYYY',
    classNames: {
      ...extraClassNames,
      popup: {
        ...extraClassNames?.popup,
        root: [
          'chk-sidebar-datepicker-popup',
          typeof extraClassNames?.popup === 'object' ? extraClassNames.popup?.root : undefined,
          typeof extraClassNames?.popup === 'string' ? extraClassNames.popup : undefined,
        ].filter(Boolean).join(' '),
      },
    },
    style: { ...inputStyle, width: '100%' },
    ...rest,
  };
};

export const getRangePickerProps = (extraProps?: Record<string, any>) => {
  const { classNames: extraClassNames, ...rest } = extraProps || {};
  return {
    format: 'DD/MM/YYYY',
    placeholder: ['Từ ngày', 'Đến ngày'] as [string, string],
    classNames: {
      ...extraClassNames,
      popup: {
        ...extraClassNames?.popup,
        root: [
          'chk-range-datepicker-popup',
          typeof extraClassNames?.popup === 'object' ? extraClassNames.popup?.root : undefined,
          typeof extraClassNames?.popup === 'string' ? extraClassNames.popup : undefined,
        ].filter(Boolean).join(' '),
      },
    },
    style: { ...inputStyle, width: '100%' },
    ...rest,
  };
};

export const getSidebarRangePickerProps = (extraProps?: Record<string, any>) => {
  const { classNames: extraClassNames, ...rest } = extraProps || {};
  return {
    format: 'DD/MM/YYYY',
    placeholder: ['Từ ngày', 'Đến ngày'] as [string, string],
    classNames: {
      ...extraClassNames,
      popup: {
        ...extraClassNames?.popup,
        root: [
          'chk-sidebar-range-datepicker-popup',
          typeof extraClassNames?.popup === 'object' ? extraClassNames.popup?.root : undefined,
          typeof extraClassNames?.popup === 'string' ? extraClassNames.popup : undefined,
        ].filter(Boolean).join(' '),
      },
    },
    style: { ...inputStyle, width: '100%' },
    ...rest,
  };
};




// --- CONTENT-TYPE CONVENTIONS ---

export const metaStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  fontWeight: fontWeightNormal,
};

/** .card .card-body { padding: 20px }, viền 1px, bo 10px */
export const cardStyle: React.CSSProperties = {
  background: surfaceCard,
  border: `1px solid ${borderDefault}`,
  borderRadius: cardRadius,
  padding: 20,
};

export const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${borderDefault}`,
  margin: `${spaceMd}px 0`,
};

export const actionStyle: React.CSSProperties = {
  borderRadius: buttonRadius,
  color: actionPrimary,
  fontWeight: fontWeightMedium,
  cursor: 'pointer',
};

/** Badge Metronic: bo góc nhẹ, KHÔNG phải viên thuốc. */
/** .badge: radius 1.425rem, padding 0.325rem 0.5rem, font 0.85rem/600. */
export const badgeBaseStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: fontWeightBold,
  padding: '4px 7px',
  borderRadius: radiusPill,
  display: 'inline-block',
};


// ============================================================
// STYLE PRESETS (Section 5) — cùng bố cục như tokens.ts
// ============================================================

// --- 5.1 Ô nhập liệu & Nút bấm ---

/** Ô nhập liệu: bo tròn viên thuốc Pill Radius, cao 40px */
export const inputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
};

export const selectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
};

export const textAreaStyle: React.CSSProperties = {
  borderRadius: 20,
  padding: '10px 16px',
  resize: 'none',
};

/** Nút chính: nền navy đậm, bo tròn viên thuốc */
export const primaryButtonStyle: React.CSSProperties = {
  borderRadius: buttonRadius,
  height: controlHeight,
  fontSize: fontSizeMd,
  background: actionPrimary,
  borderColor: actionPrimary,
  color: '#FFFFFF',
};

/** Nút phụ: viền navy, nền trắng — kiểu btn-outline của Metronic */
export const outlineButtonStyle: React.CSSProperties = {
  borderRadius: buttonRadius,
  height: controlHeight,
  background: surfaceCard,
  borderColor: actionPrimary,
  color: actionPrimary,
  fontSize: fontSizeMd,
  cursor: 'pointer',
};

export const dangerButtonStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
  borderColor: statusCritical,
  color: statusCritical,
  background: surfaceCard,
};

export const outlineDangerButtonStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
  borderColor: statusCritical,
  color: statusCritical,
  background: surfaceCard,
  fontSize: fontSizeMd,
  cursor: 'pointer',
};

/**
 * Nút icon tròn: đây là chi tiết chk GIỮ hình tròn (`rounded-circle` ở nút Reset
 * trong table-filter), nên không đổi sang bo góc chữ nhật.
 */
export const iconButtonStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: `1px solid ${borderDefault}`,
  color: textSecondary,
  background: surfaceCard,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};


// --- 5.2 Form trong Drawer/Modal ---

/** .form-label { color: #1A3F83 } */
export const formLabelStyle: React.CSSProperties = {
  color: filterLabelColor,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
};

export const labelProps = (text: string) => ({
  label: React.createElement('span', { style: formLabelStyle }, text),
});

export const formFieldStyle: React.CSSProperties = {
  marginBottom: spaceFormField,
};

export const drawerTabBarStyle: React.CSSProperties = {
  marginBottom: 12,
  paddingTop: 0,
  paddingBottom: 0,
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: '#ffffff',
};

export const drawerTabContentStyle: React.CSSProperties = {
  paddingTop: 0,
};

export const drawerTabsStyle: React.CSSProperties = {
  marginBottom: spaceFormField,
};

/** Cấu hình styles chuẩn cho AntD Drawer */
export const drawerStyles = {
  header: { padding: '16px 24px', borderBottom: `1px solid ${borderDefault}` },
  body: { padding: '0 24px 0 24px', overflow: 'hidden' as const },
  footer: { padding: '12px 24px', borderTop: `1px solid ${borderDefault}` },
};

/** Khung cuộn nội dung form Tab 1 trong Drawer tạo/sửa */
export const drawerFormScrollStyle: React.CSSProperties = {
  maxHeight: 'calc(100vh - 210px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '0 24px 16px 0',
  marginRight: -24,
  boxSizing: 'border-box',
};

/** Khung controls trên đỉnh Tab GIS trong Drawer tạo/sửa (cao cố định 194px) */
export const drawerGisControlBoxStyle: React.CSSProperties = {
  height: 194,
  boxSizing: 'border-box',
};

/** Ô read-only: nền --bs-light của Metronic */
export const readonlyInputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
  backgroundColor: '#f5f8fa',
};

export const formTreeSelectStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusPill,
  height: controlHeight,
};

/** Style chuẩn cho OrgUnitTreeSelect trong Sidebar bộ lọc */
export const filterTreeSelectStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusPill,
  height: controlHeight,
};

/** Style popup menu Dropdown chuẩn cho OrgUnitTreeSelect trong Sidebar bộ lọc */
export const filterTreeSelectDropdownStyle: React.CSSProperties = {
  minWidth: 380,
  maxWidth: 520,
  maxHeight: 320,
  borderRadius: radiusMd,
  padding: '6px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
};

/** Style popup menu Dropdown chuẩn cho OrgUnitTreeSelect trong Form (Drawer / Modal) */
export const formTreeSelectDropdownStyle: React.CSSProperties = {
  minWidth: '100%',
  maxWidth: 650,
  maxHeight: 320,
  borderRadius: radiusMd,
  padding: '6px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
};

export const ATTACHMENT_HELPER_TEXT =
  'Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤10MB.';

export const ATTACHMENT_MAX_FILE_SIZE_MB = 10;

export const formRowGutter: [number, number] = [16, 16];

export const drawerTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeLg,
};

export const drawerCloseBtnStyle: React.CSSProperties = {
  fontSize: 18,
  color: textSecondary,
  borderRadius: buttonRadius,
  width: 36,
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const requiredMarkStyle =
  '.ant-form-item-required::before { display: inline-block; margin-left: 4px; order: 1; } .ant-form-item-required::after { display: none; }';


// --- 5.3 Trang danh sách ---

export const pageContainerStyle: React.CSSProperties = {
  minHeight: '100%',
  marginTop: -8,
};

export const screenHeaderStyle: React.CSSProperties = {
  marginBottom: spaceMd,
};

/** Panel lọc trái — chk dùng col-lg-3 của Bootstrap, tương đương 280–360px */
export const filterPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minWidth: 280,
  maxWidth: 360,
};

export const filterFieldsStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto' as const,
  padding: '12px 16px',
};

export const filterFooterStyle: React.CSSProperties = {
  borderTop: `1px solid ${borderDefault}`,
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'center',
  gap: spaceSm,
};

export const filterLabelStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  color: filterLabelColor,
};

export const statusTabsStyle: React.CSSProperties = {
  ...cardStyle,
  padding: '7px 16px',
  marginBottom: spaceXs,
};


// --- 5.4 Bảng dữ liệu ---

/** .p-datatable thead th — nền xám, chữ navy, IN HOA, 600 */
export const tableHeaderStyle: React.CSSProperties = {
  background: tableHeaderBg,
  padding: tableHeaderPadding,
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  textTransform: 'uppercase' as const,
  color: tableHeaderColor,
};

/** .p-datatable tbody td { padding: 0.5rem 0.75rem } */
export const tableCellStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
  padding: tableCellPadding,
};

export const paginationBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  color: actionPrimary,
};

/** p-paginator dropdown cỡ trang — bo góc nhẹ */
export const paginationSizeSelectStyle: React.CSSProperties = {
  borderRadius: radiusDropdown,
  width: 72,
  height: 32,
};


// --- 5.5 Drawer ---

export const drawerProps = {
  size: '50%' as const,
  placement: 'right' as const,
  closable: false,
  // Chống Drawer con đẩy Drawer cha (antd v6 mặc định push {distance:180} khi lồng nhau)
  push: false,
  styles: {
    header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
    body: { padding: '0 24px 12px 24px' },
  },
};

export const drawerFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  gap: 12,
};

export const detailDescriptionsStyle = {
  bordered: true,
  column: 2 as const,
  labelStyle: { width: 180 } as React.CSSProperties,
};

export const detailSectionTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
};


// --- 5.6 Upload file ---

/** .border-dash { border: 1px dashed var(--panel-border-color) } */
export const uploadAreaStyle: React.CSSProperties = {
  border: `1px dashed ${borderDefault}`,
  borderRadius: radiusSm,
  background: '#f9f9f9',            // --box-content-bg-color
  padding: '24px 16px',
  textAlign: 'center',
  cursor: 'pointer',
};

export const uploadHintStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  marginTop: spaceXs,
};

export const uploadFileItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
  padding: `${spaceXs}px ${spaceSm}px`,
  background: '#f9f9f9',
  borderRadius: radiusSm,
  fontSize: fontSizeMd,
  color: textPrimary,
};


// --- 5.7 Import Excel ---

export const importTemplateLinkStyle: React.CSSProperties = {
  color: actionPrimary,
  fontSize: fontSizeSm,
  cursor: 'pointer',
  marginBottom: spaceSm,
  display: 'inline-block',
};

export const importAreaStyle: React.CSSProperties = {
  ...uploadAreaStyle,
};


// --- 5.8 Modal xác nhận ---

export const confirmModalBodyStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
  textAlign: 'center',
  padding: `${spaceMd}px 0`,
};

export const rejectReasonStyle: React.CSSProperties = {
  borderRadius: radiusSm,
  minHeight: 80,
  marginTop: spaceMd,
  marginBottom: spaceMd,
};


// --- 5.9 Timeline ---

export const timelineDotStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: actionPrimary,
  flexShrink: 0,
};

export const timelineContentStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
  lineHeight: 1.6,
};

export const timelineChangeStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textSecondary,
  marginTop: spaceXs,
};

export const timelineLineStyle: React.CSSProperties = {
  width: 1,
  background: borderDefault,
  marginLeft: 5,
  flex: '1 0 auto',
  minHeight: 8,
};

export const timelineTimeStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  fontWeight: fontWeightMedium,
  marginBottom: spaceXs,
};


// --- 5.9b Lịch sử kiểu card ---

/** Badge lịch sử: bo góc nhẹ theo Metronic thay vì viên thuốc. */
export const historyBadgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  padding: `2px ${spaceSm}px`,
  borderRadius: radiusMd,
  fontSize: fontSizeMd,
  fontWeight: fontWeightMedium,
  background: `${color}15`,
  color,
});

export const historyGroupGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(190px, 0.38fr) minmax(0, 1fr)',
  gap: spaceLg,
  alignItems: 'start',
  marginBottom: spaceSm,
};

export const historyTimeStyle: React.CSSProperties = {
  fontSize: fontSizeLg,
  color: textPrimary,
  fontWeight: fontWeightBold,
  lineHeight: 1.5,
};

export const historyMetaRowStyle: React.CSSProperties = {
  display: 'block',
  fontSize: fontSizeMd,
  color: textSecondary,
  fontWeight: fontWeightBold,
  lineHeight: 1.5,
};

export const historyInfoCardStyle: React.CSSProperties = {
  position: 'relative',
  minWidth: 0,
  background: '#f9f9f9',
  borderRadius: radiusSm,
  padding: spaceMd,
  paddingLeft: spaceLg,
  overflow: 'hidden',
};

export const historyAccentBarStyle = (color: string): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: spaceXs,
  background: `linear-gradient(180deg, ${color} 0%, ${color}40 100%)`,
});

export const historyInfoTitleStyle: React.CSSProperties = {
  display: 'block',
  color: textPrimary,
  fontSize: fontSizeMd + 1,
  fontWeight: fontWeightBold,
  marginBottom: spaceXs,
};

export const historyChangeRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 1.15fr) minmax(90px, 0.85fr) 24px minmax(120px, 1.35fr)',
  gap: spaceSm,
  alignItems: 'start',
  paddingTop: spaceXs,
  fontSize: fontSizeMd,
  lineHeight: 1.5,
};

export const historyCreateRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(150px, 1fr) minmax(160px, 2fr)',
  gap: spaceSm,
  alignItems: 'start',
  paddingTop: spaceXs,
  fontSize: fontSizeMd,
  lineHeight: 1.5,
};

export const historyFieldLabelStyle: React.CSSProperties = {
  minWidth: 0,
  fontWeight: fontWeightMedium,
  color: textPrimary,
  overflowWrap: 'anywhere',
};

export const historyOldValueStyle: React.CSSProperties = {
  minWidth: 0,
  color: textSecondary,
  overflowWrap: 'anywhere',
};

export const historyNewValueStyle: React.CSSProperties = {
  minWidth: 0,
  color: textPrimary,
  fontWeight: fontWeightMedium,
  overflowWrap: 'anywhere',
};

export const historyArrowStyle: React.CSSProperties = {
  color: textTertiary,
  textAlign: 'center',
};


// --- 5.10 Multi-select ---

export const multiSelectTagStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  background: surfacePage,
  color: actionPrimary,
};

export const multiSelectHintStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  marginTop: spaceXs,
};


// --- 5.11 Breadcrumb ---

/**
 * chk render breadcrumb bằng <h1 class="fs-3 fw-bold">, mục đầu `text-primary`
 * và mục cuối `text-gray-800`.
 */
export const breadcrumbStyle: React.CSSProperties = {
  fontSize: fontSizeBreadcrumb,
  color: actionPrimary,
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
  marginBottom: spaceSm,
};

export const breadcrumbLastStyle: React.CSSProperties = {
  fontSize: fontSizeBreadcrumbLast,
  fontWeight: fontWeightBold,
  color: textPrimary,
};


// --- Chart ECharts defaults ---

export const chartGrid = { top: 16, right: 16, bottom: 16, left: 16, containLabel: true };
export const chartTooltip = {
  backgroundColor: '#ffffff',
  borderColor: borderDefault,
  textStyle: { color: '#3f4254', fontFamily: fontSans, fontSize: 12 },
  extraCssText: 'border-radius:6px;padding:10px 14px;box-shadow:0 2px 6px rgba(0,0,0,0.08);',
};
export const chartTextStyle = {
  fontFamily: fontSans,
  fontSize: 11,
  color: textTertiary,
};


// --- 5.12 Detail View ---

export const detailLabelStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
};

export const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  padding: '8px 12px',
  borderBottom: `1px solid ${borderDefault}`,
};

export const detailLabelColStyle: React.CSSProperties = {
  width: 200,
  flexShrink: 0,
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
};

export const detailValueStyle: React.CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeMd,
  flex: 1,
};


// --- 5.13 Form Sub-Table ---

export const formEmptyTableStyle: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  border: `1px dashed ${borderDefault}`,
  borderRadius: radiusSm,
  background: surfaceCard,
};

export const formSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spaceFormField,
};


// --- 5.14 Filter Panel ---

export const listPageContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100% - 32px)',
};

export const filterInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusSm,
  height: controlHeight,
};


// --- BỘ ICON ---
// Icon là một phần diện mạo, nên khai ở file theme để đổi theme là đổi cả bộ.
// Component/màn hình chỉ tra theo tên hành động, không tự chọn icon.
// chk dùng Font Awesome bản đặc (`fa-solid fa-eye`, `fa-pen-to-square`...).
const ViewIconSvg = (props: React.SVGProps<SVGSVGElement>) => React.createElement('svg', {
  viewBox: '0 0 576 512',
  width: '1em',
  height: '1em',
  fill: 'currentColor',
  style: { display: 'inline-block', verticalAlign: '-0.125em', ...props.style },
  ...props,
}, React.createElement('path', {
  d: 'M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-72.8-88.7-75.1c-2.3-.1-4-.1-4 0z'
}));

const EditIconSvg = (props: React.SVGProps<SVGSVGElement>) => React.createElement('svg', {
  viewBox: '0 0 512 512',
  width: '1em',
  height: '1em',
  fill: 'currentColor',
  style: { display: 'inline-block', verticalAlign: '-0.125em', ...props.style },
  ...props,
}, React.createElement('path', {
  d: 'M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z'
}));

export const icons = {
  view: React.createElement(ViewIconSvg),
  edit: React.createElement(EditIconSvg),
  delete: React.createElement(DeleteOutlined),
  history: React.createElement(HistoryOutlined),
  submit: React.createElement(SendOutlined),
  approve: React.createElement(CheckOutlined),
  reject: React.createElement(CloseOutlined),
  create: React.createElement(PlusOutlined),
  search: React.createElement(SearchOutlined),
  reset: React.createElement(ReloadOutlined),
  location: React.createElement(EnvironmentOutlined),
};

/**
 * Icon sắp xếp lấy NGUYÊN path SVG của PrimeNG — cùng bộ icon mà chk đang chạy:
 *   sortalt          → chưa sắp xếp (hai mũi tên lên/xuống cạnh nhau)
 *   sortamountupalt  → tăng dần
 *   sortamountdown   → giảm dần
 * Nguồn: primeng/esm2020/icons/{sortalt,sortamountupalt,sortamountdown}
 */
const SORT_ICON_PATHS: Record<'none' | 'asc' | 'desc', string[]> = {
  none: [
    'M5.64515 3.61291C5.47353 3.61291 5.30192 3.54968 5.16644 3.4142L3.38708 1.63484L1.60773 3.4142C1.34579 3.67613 0.912244 3.67613 0.650309 3.4142C0.388374 3.15226 0.388374 2.71871 0.650309 2.45678L2.90837 0.198712C3.17031 -0.0632236 3.60386 -0.0632236 3.86579 0.198712L6.12386 2.45678C6.38579 2.71871 6.38579 3.15226 6.12386 3.4142C5.98837 3.54968 5.81676 3.61291 5.64515 3.61291Z',
    'M3.38714 14C3.01681 14 2.70972 13.6929 2.70972 13.3226V0.677419C2.70972 0.307097 3.01681 0 3.38714 0C3.75746 0 4.06456 0.307097 4.06456 0.677419V13.3226C4.06456 13.6929 3.75746 14 3.38714 14Z',
    'M10.6129 14C10.4413 14 10.2697 13.9368 10.1342 13.8013L7.87611 11.5432C7.61418 11.2813 7.61418 10.8477 7.87611 10.5858C8.13805 10.3239 8.5716 10.3239 8.83353 10.5858L10.6129 12.3652L12.3922 10.5858C12.6542 10.3239 13.0877 10.3239 13.3497 10.5858C13.6116 10.8477 13.6116 11.2813 13.3497 11.5432L11.0916 13.8013C10.9561 13.9368 10.7845 14 10.6129 14Z',
    'M10.6129 14C10.2426 14 9.93552 13.6929 9.93552 13.3226V0.677419C9.93552 0.307097 10.2426 0 10.6129 0C10.9833 0 11.2904 0.307097 11.2904 0.677419V13.3226C11.2904 13.6929 10.9832 14 10.6129 14Z',
  ],
  asc: [
    'M4.59864 3.99958C4.44662 3.99958 4.2946 3.94357 4.17458 3.82356L2.59836 2.24734L1.02214 3.82356C0.79011 4.05559 0.406057 4.05559 0.174024 3.82356C-0.0580081 3.59152 -0.0580081 3.20747 0.174024 2.97544L2.1743 0.97516C2.40634 0.743127 2.79039 0.743127 3.02242 0.97516L5.0227 2.97544C5.25473 3.20747 5.25473 3.59152 5.0227 3.82356C4.90268 3.94357 4.75066 3.99958 4.59864 3.99958Z',
    'M2.59841 13.2009C2.27036 13.2009 1.99833 12.9288 1.99833 12.6008V1.39922C1.99833 1.07117 2.27036 0.799133 2.59841 0.799133C2.92646 0.799133 3.19849 1.07117 3.19849 1.39922V12.6008C3.19849 12.9288 2.92646 13.2009 2.59841 13.2009Z',
    'M13.3999 11.2006H6.99902C6.67098 11.2006 6.39894 10.9285 6.39894 10.6005C6.39894 10.2725 6.67098 10.0004 6.99902 10.0004H13.3999C13.728 10.0004 14 10.2725 14 10.6005C14 10.9285 13.728 11.2006 13.3999 11.2006Z',
    'M10.1995 6.39991H6.99902C6.67098 6.39991 6.39894 6.12788 6.39894 5.79983C6.39894 5.47179 6.67098 5.19975 6.99902 5.19975H10.1995C10.5275 5.19975 10.7996 5.47179 10.7996 5.79983C10.7996 6.12788 10.5275 6.39991 10.1995 6.39991Z',
    'M8.59925 3.99958H6.99902C6.67098 3.99958 6.39894 3.72754 6.39894 3.3995C6.39894 3.07145 6.67098 2.79941 6.99902 2.79941H8.59925C8.92729 2.79941 9.19933 3.07145 9.19933 3.3995C9.19933 3.72754 8.92729 3.99958 8.59925 3.99958Z',
    'M11.7997 8.80025H6.99902C6.67098 8.80025 6.39894 8.52821 6.39894 8.20017C6.39894 7.87212 6.67098 7.60008 6.99902 7.60008H11.7997C12.1277 7.60008 12.3998 7.87212 12.3998 8.20017C12.3998 8.52821 12.1277 8.80025 11.7997 8.80025Z',
  ],
  desc: [
    'M2.59836 13.2009C2.44634 13.2009 2.29432 13.1449 2.1743 13.0248L0.174024 11.0246C-0.0580081 10.7925 -0.0580081 10.4085 0.174024 10.1764C0.406057 9.94441 0.79011 9.94441 1.02214 10.1764L2.59836 11.7527L4.17458 10.1764C4.40662 9.94441 4.79067 9.94441 5.0227 10.1764C5.25473 10.4085 5.25473 10.7925 5.0227 11.0246L3.02242 13.0248C2.90241 13.1449 2.75038 13.2009 2.59836 13.2009Z',
    'M2.59836 13.2009C2.27032 13.2009 1.99833 12.9288 1.99833 12.6008V1.39922C1.99833 1.07117 2.27036 0.799133 2.59841 0.799133C2.92646 0.799133 3.19849 1.07117 3.19849 1.39922V12.6008C3.19849 12.9288 2.92641 13.2009 2.59836 13.2009Z',
    'M13.3999 11.2006H6.99902C6.67098 11.2006 6.39894 10.9285 6.39894 10.6005C6.39894 10.2725 6.67098 10.0004 6.99902 10.0004H13.3999C13.728 10.0004 14 10.2725 14 10.6005C14 10.9285 13.728 11.2006 13.3999 11.2006Z',
    'M10.1995 6.39991H6.99902C6.67098 6.39991 6.39894 6.12788 6.39894 5.79983C6.39894 5.47179 6.67098 5.19975 6.99902 5.19975H10.1995C10.5275 5.19975 10.7996 5.47179 10.7996 5.79983C10.7996 6.12788 10.5275 6.39991 10.1995 6.39991Z',
    'M8.59925 3.99958H6.99902C6.67098 3.99958 6.39894 3.72754 6.39894 3.3995C6.39894 3.07145 6.67098 2.79941 6.99902 2.79941H8.59925C8.92729 2.79941 9.19933 3.07145 9.19933 3.3995C9.19933 3.72754 8.92729 3.99958 8.59925 3.99958Z',
    'M11.7997 8.80025H6.99902C6.67098 8.80025 6.39894 8.52821 6.39894 8.20017C6.39894 7.87212 6.67098 7.60008 6.99902 7.60008H11.7997C12.1277 7.60008 12.3998 7.87212 12.3998 8.20017C12.3998 8.52821 12.1277 8.80025 11.7997 8.80025Z',
  ],
};

export const tableSortIcon = ({ sortOrder }: { sortOrder: 'ascend' | 'descend' | null }): React.ReactNode => {
  const state = sortOrder === 'ascend' ? 'asc' : sortOrder === 'descend' ? 'desc' : 'none';
  return React.createElement(
    'svg',
    {
      width: 12,
      height: 12,
      viewBox: '0 0 14 14',
      fill: 'currentColor',
      xmlns: 'http://www.w3.org/2000/svg',
      style: { marginLeft: 6, color: sortOrder ? actionPrimary : '#b5b5c3', flexShrink: 0 },
    },
    ...SORT_ICON_PATHS[state].map((d, i) => React.createElement('path', { key: i, d })),
  );
};

/**
 * chk chỉ in một dòng chữ căn giữa, không có hình minh họa:
 *   <div class="primeng-no-data">{{ 'NoResultsFound' | localize }}</div>
 *   .primeng-no-data { text-align: center; margin-top: 10px; margin-bottom: 10px; }
 * CSS của chk không khai màu cho dòng này; màu dưới đây lấy theo ảnh chụp thực tế.
 */
export const tableEmptyState: React.ReactNode = React.createElement(
  'div',
  {
    style: {
      textAlign: 'center' as const,
      marginTop: 10,
      marginBottom: 10,
      fontSize: fontSizeMd,
      color: '#7E6B3F',
    },
  },
  'Không có kết quả tìm kiếm',
);

/**
 * Helper sinh mã ID duy nhất cho tệp đính kèm và các dòng con tạm thời trong Form/Drawer:
 * Tránh lỗi trùng ID khi người dùng kéo thả tải lên nhiều file cùng lúc trong cùng 1 mili-giây.
 */
export const generateTempId = (prefix: string = 'temp'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * QUY CHUẨN BẢNG CHI TIẾT DETAILTABLE & BẢNG CON TRONG DRAWER/FORM:
 * 1. Mặc định padEmptyRows = false: chỉ render đúng số dòng dữ liệu thực tế, tuyệt đối CẤM đệm các dòng kẻ ngang trống thừa (__isPlaceholder).
 * 2. Cột STT tính chuẩn theo: (page - 1) * pageSize + index + 1.
 * 3. Khi upload nhiều file hoặc thêm mới row con: BẮT BUỘC dùng generateTempId(...) để tránh trùng lặp rowKey.
 * 4. Phân trang sử dụng tabPaneFlexContainerStyle (minHeight linh hoạt theo 100vh) + pagedTablePaginationWrapperStyle (marginTop auto) + .chk-pagination-stable để cố định vị trí đáy tuyệt đối trên mọi độ phân giải.
 */
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];

export const drawerPagedTabContainerStyle = (offsetTop: number = 210): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: `calc(100vh - ${offsetTop}px)`,
  justifyContent: 'space-between',
  width: '100%',
});

export const drawerPaginationWrapperStyle: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: 8,
  width: '100%',
};

export const tabPaneFlexContainerStyle = (hasMultiplePages: boolean = false, offsetTop: number = 260): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: hasMultiplePages ? `calc(100vh - ${offsetTop}px)` : undefined,
  justifyContent: 'space-between',
  width: '100%',
});

export const pagedTableContainerStyle = (hasMultiplePages: boolean = false, offsetTop: number = 260): React.CSSProperties =>
  tabPaneFlexContainerStyle(hasMultiplePages, offsetTop);

export const pagedTablePaginationWrapperStyle: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: 12,
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  width: '100%',
};

export const pagedTablePaginationStyle = `
  .chk-pagination-stable .ant-pagination-item,
  .chk-pagination-stable .ant-pagination-prev,
  .chk-pagination-stable .ant-pagination-next {
    min-width: 32px !important;
    width: 32px !important;
    height: 32px !important;
    line-height: 30px !important;
    text-align: center !important;
    margin: 0 4px !important;
    border-radius: 999px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .chk-pagination-stable .ant-pagination-options {
    margin-left: 12px !important;
  }
`;

/** Preset cho khu vực bảng / danh sách rỗng (Empty State chuẩn Theme CHK) */
export const emptyStateContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 16px',
  textAlign: 'center',
  userSelect: 'none',
  width: '100%',
};

export const emptyStateTitleStyle: React.CSSProperties = {
  fontSize: fontSizeLg,
  fontWeight: fontWeightBold,
  color: colors.sidebarBg,
  marginTop: 14,
  marginBottom: 4,
};

export const emptyStateDescriptionStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textTertiary,
  maxWidth: 420,
  lineHeight: '20px',
};



