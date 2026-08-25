/**
 * theme.ts (v4)
 * ------------------------------------------------------------------
 * Bộ theme Ant Design v5 mô phỏng phong cách Metronic 8
 * Dùng cho: Hệ thống Quản trị kết cấu hạ tầng giao thông đường thủy & hàng hải
 * ------------------------------------------------------------------
 * CÁCH DÙNG:
 * 1. Import `metronicTheme` và bọc toàn app bằng <ConfigProvider theme={metronicTheme}>
 *    ở file gốc (main.tsx / App.tsx / _app.tsx).
 * 2. Import `globalCssVars` (chuỗi CSS) và chèn vào file CSS global (index.css / global.css)
 *    — vì AntD token KHÔNG cover hết mọi thứ (shadow card, sparkline, badge %, sidebar active bar...).
 * 3. Với 22 module còn lại: KHÔNG sửa màu/spacing thủ công theo cảm tính ở từng module.
 *    Toàn bộ style phải kế thừa từ token trong file này. Nếu 1 màu/spacing chưa có token
 *    tương ứng, hãy bổ sung vào file này trước, rồi mới dùng ở module.
 * ------------------------------------------------------------------
 */

import type { ThemeConfig } from 'antd';

// ============================================================
// 0. LAYOUT DIMENSIONS (single source of truth for sidebar, header, footer)
// ============================================================
export const layout = {
  sidebarWidth: 272,
  sidebarCollapsedWidth: 80,
  headerHeight: 64,
  footerHeight: 56,
  listTableMinWidth: 1000,
  // Reserve the status bar, table header and pagination so the pager never
  // overlays the last visible row of a list table.
  listTableScrollY: 'calc(100vh - 410px)',
};

// ============================================================
// 1. DESIGN TOKENS GỐC (single source of truth — đổi ở đây là đổi toàn hệ thống)
// ============================================================
export const colors = {
  primary: '#1B84FF',        // xanh dương Metronic (thay cho #1677ff mặc định AntD)
  primaryHover: '#3B94FF',
  primaryActive: '#0A6AE0',

  success: '#17C653',
  warning: '#F6B100',
  error: '#F1416C',
  info: '#7239EA',

  // Nền
  bodyBg: '#F5F8FA',         // nền layout tổng (xám rất nhạt đặc trưng Metronic)
  containerBg: '#FFFFFF',
  sidebarBg: '#12468C',      // nền sidebar xanh dương đồng nhất (v3)
  sidebarActiveBg: '#1B84FF', // pill active màu xanh dương sáng
  sidebarSearchBg: 'rgba(255, 255, 255, 0.12)', // nền ô tìm kiếm trong sidebar

  // Border
  borderLight: '#EFF2F5',
  borderBase: '#E4E6EF',

  // Chữ
  textPrimary: 'rgba(0, 0, 0, 0.85)',
  textSecondary: 'rgba(0, 0, 0, 0.55)',
  textTertiary: 'rgba(0, 0, 0, 0.35)',
  textOnDark: 'rgba(255, 255, 255, 0.85)',
  textOnDarkMuted: 'rgba(255, 255, 255, 0.55)',

  // Màu pastel nền icon cho card thống kê (giữ nguyên tinh thần ảnh gốc, chuẩn hoá lại)
  iconBgBlue: '#EEF6FF',
  iconBgGreen: '#EAFBF0',
  iconBgOrange: '#FFF6E8',
  iconBgPurple: '#F5EEFF',
  iconBgRed: '#FFEEF2',
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  labelUppercase: 12,   // label kiểu "CẢNG BIỂN" — uppercase, letter-spacing
  body: 14,
  bodyLg: 15,
  cardTitle: 16,
  sectionTitle: 20,
  pageTitle: 24,
  statNumber: 34,        // số liệu to trong card thống kê
};

export const shadow = {
  card: '0 0.1rem 1rem rgba(0, 0, 0, 0.05)',
  cardHover: '0 0.3rem 1.5rem rgba(0, 0, 0, 0.1)',
  dropdown: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.12)',
};

export const fontFamily = `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

// ============================================================
// 2. ANT DESIGN THEME CONFIG (ConfigProvider)
// ============================================================
export const metronicTheme: ThemeConfig = {
  token: {
    // Màu
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,

    colorBgLayout: colors.bodyBg,
    colorBgContainer: colors.containerBg,
    colorBorder: colors.borderBase,
    colorBorderSecondary: colors.borderLight,

    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textTertiary,
    colorTextDescription: colors.textSecondary,

    // Typography
    fontFamily,
    fontSize: fontSize.body,
    fontSizeLG: fontSize.bodyLg,
    fontSizeXL: fontSize.sectionTitle,
    fontSizeHeading1: 32,
    fontSizeHeading2: fontSize.pageTitle,
    fontSizeHeading3: fontSize.sectionTitle,
    fontSizeHeading4: fontSize.cardTitle,

    // Bo góc — đặc trưng Metronic là bo lớn hơn AntD default (6px)
    borderRadius: radius.md,
    borderRadiusLG: radius.lg,
    borderRadiusSM: radius.sm,
    borderRadiusXS: 4,

    // Spacing / kích thước control
    controlHeight: 40,
    controlHeightLG: 46,
    controlHeightSM: 32,
    padding: spacing.md,
    paddingLG: spacing.lg,
    paddingContentHorizontalLG: spacing.lg,

    // Shadow chung
    boxShadow: shadow.card,
    boxShadowSecondary: shadow.cardHover,

    lineWidth: 1,
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },

  components: {
    Layout: {
      bodyBg: colors.bodyBg,
      headerBg: colors.containerBg,
      headerHeight: 64,
      siderBg: colors.sidebarBg,
    },

    Menu: {
      // Sidebar xanh dương đồng nhất — active item dạng PILL, không border-left
      darkItemBg: colors.sidebarBg,
      darkSubMenuItemBg: colors.sidebarBg,
      darkItemColor: colors.textOnDarkMuted,
      darkItemHoverColor: colors.textOnDark,
      darkItemSelectedColor: '#FFFFFF',
      darkItemSelectedBg: colors.sidebarActiveBg,
      itemHeight: 46,
      lineHeight: 1.5,
      itemMarginInline: 10,
      itemBorderRadius: radius.md,
      iconSize: 18,
      collapsedIconSize: 18,
      // Lưu ý cho AI: item đang active là PILL màu xanh dương sáng, KHÔNG có border-left.
      // Xem CSS .ant-menu-dark .ant-menu-item-selected để biết box-shadow glow.
    },

    Card: {
      borderRadiusLG: radius.lg,
      paddingLG: spacing.lg,
      boxShadowTertiary: shadow.card,
      colorBorderSecondary: colors.borderLight,
    },

    Button: {
      borderRadius: radius.sm,
      controlHeight: 40,
      fontWeight: 500,
      primaryShadow: 'none',
    },

    Table: {
      borderRadius: radius.md,
      headerBg: colors.bodyBg,
      headerColor: colors.textSecondary,
      rowHoverBg: '#F5F8FA',
      cellPaddingBlock: 9,
    },

    Dropdown: {
      fontSize: 13,
      borderRadiusLG: radius.md,
      boxShadowSecondary: shadow.dropdown,
    },

    Modal: {
      fontSize: 13,
      fontSizeLG: 13,
      titleFontSize: 15,
      borderRadiusLG: radius.lg,
    },

    Input: {
      borderRadius: radius.sm,
      controlHeight: 40,
      colorBorder: colors.borderBase,
    },

    Select: {
      borderRadius: radius.sm,
      controlHeight: 40,
    },

    Tabs: {
      inkBarColor: colors.primary,
      itemSelectedColor: colors.primary,
      itemHoverColor: colors.primaryHover,
      titleFontSize: fontSize.body,
    },

    Breadcrumb: {
      itemColor: colors.textSecondary,
      lastItemColor: colors.textPrimary,
      separatorColor: colors.textTertiary,
    },

    Tag: {
      borderRadiusSM: radius.sm,
      defaultBg: colors.iconBgBlue,
    },

    Progress: {
      // Nếu vẫn dùng progress bar trong card thống kê, làm mảnh & bo tròn hơn
      lineBorderRadius: radius.pill,
      defaultColor: colors.primary,
    },
  },
};

export default metronicTheme;

// ============================================================
// 3. CSS VARIABLES + GLOBAL OVERRIDE
// (Những gì AntD token KHÔNG cover được — chèn khối này vào file CSS global,
//  hoặc inject bằng <style> ở root nếu dự án không có chỗ chèn CSS thuần)
// ============================================================
export const globalCssVars = `
:root {
  --color-primary: ${colors.primary};
  --color-primary-hover: ${colors.primaryHover};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
  --color-info: ${colors.info};

  --bg-body: ${colors.bodyBg};
  --bg-container: ${colors.containerBg};
  --bg-sidebar: ${colors.sidebarBg};
  --sidebar-active-bg: ${colors.sidebarActiveBg};
  --sidebar-search-bg: ${colors.sidebarSearchBg};

  --border-light: ${colors.borderLight};
  --border-base: ${colors.borderBase};

  --text-primary: ${colors.textPrimary};
  --text-secondary: ${colors.textSecondary};
  --text-tertiary: ${colors.textTertiary};

  --icon-bg-blue: ${colors.iconBgBlue};
  --icon-bg-green: ${colors.iconBgGreen};
  --icon-bg-orange: ${colors.iconBgOrange};
  --icon-bg-purple: ${colors.iconBgPurple};
  --icon-bg-red: ${colors.iconBgRed};

  --radius-sm: ${radius.sm}px;
  --radius-md: ${radius.md}px;
  --radius-lg: ${radius.lg}px;
  --radius-xl: ${radius.xl}px;

  --shadow-card: ${shadow.card};
  --shadow-card-hover: ${shadow.cardHover};
  --list-table-scroll-y: ${layout.listTableScrollY};
  --table-header-bg: ${colors.bodyBg};

  --font-family: ${fontFamily};
}

/* ---------- Sidebar: 1 MÀU XANH DƯƠNG ĐỒNG NHẤT (Rule 8 v3) ---------- */
/* Header, Menu, Footer đều chung nền xanh #12468C — active item là PILL, không border-left. */

/* --- Brand zone (BLUE — đồng nhất với menu) --- */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 20px;
  background: var(--bg-sidebar);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.sidebar-header__logo-box {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sidebar-header__logo-box img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}
.sidebar-header__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.sidebar-header__title {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 15px;
  line-height: 1.3;
  white-space: nowrap;
}
.sidebar-header__subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
  font-size: 12px;
  line-height: 1.3;
  margin-top: 2px;
  white-space: nowrap;
}

/* --- Search box (trong sidebar) --- */
.sidebar-search {
  display: flex;
  align-items: center;
  padding: 0 14px;
  height: 40px;
  margin: 4px 12px 8px;
  border-radius: 999px;
  background: var(--sidebar-search-bg);
}
.sidebar-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #FFFFFF;
  font-size: 13px;
}
.sidebar-search input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}
.sidebar-search .anticon {
  color: rgba(255, 255, 255, 0.55);
  margin-right: 8px;
  font-size: 14px;
}

/* --- Scrollable menu area --- */
.ant-layout-sider {
  position: relative;
}
.ant-layout-sider-children {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
}
.sidebar-menu-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar-menu-scroll::-webkit-scrollbar {
  width: 4px;
}
.sidebar-menu-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.sidebar-menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* Layout chuỗi flex cho bảng danh sách lấp đầy 100% chiều cao khả dụng */
/* Layout chuỗi flex cho bảng danh sách lấp đầy 100% chiều cao khả dụng */
.list-view-table-shell {
  width: 100%;
  min-width: 0;
  flex: 1 1 0% !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  height: 100% !important;
}

.list-view-table,
.ant-table-wrapper.list-view-table {
  flex: 1 1 0% !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  height: 100% !important;
}

.list-view-table .ant-spin,
.list-view-table .ant-spin-nested-loading,
.list-view-table .ant-spin-container,
.list-view-table .ant-table,
.list-view-table .ant-table-container {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 0% !important;
  min-height: 0 !important;
}

.list-view-table .ant-table-header {
  flex: 0 0 auto !important;
  background: var(--table-header-bg, #f1f5f9) !important;
  overflow: hidden !important;
}

.list-view-table .ant-table-content {
  height: 100% !important;
  min-height: 0 !important;
  flex: 1 1 0% !important;
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* Cột bảng không bị tràn text đè lên nhau */
.list-view-table .ant-table-thead > tr > th {
  position: sticky !important;
  top: 0 !important;
  background: var(--table-header-bg, #F5F8FA) !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  z-index: 10 !important;
}

.list-view-table th.ant-table-cell-scrollbar {
  display: none !important;
}

.list-view-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
.list-view-table .ant-table-thead > tr > th.ant-table-cell-fix-start {
  position: sticky !important;
  top: 0 !important;
  left: 0 !important;
  background: var(--table-header-bg, #F5F8FA) !important;
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.06) !important;
  z-index: 25 !important;
}

.list-view-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
.list-view-table .ant-table-thead > tr > th.ant-table-cell-fix-end {
  position: sticky !important;
  top: 0 !important;
  right: 0 !important;
  background: var(--table-header-bg, #F5F8FA) !important;
  box-shadow: -1px 0 0 rgba(0, 0, 0, 0.06) !important;
  z-index: 25 !important;
}

.list-view-table .ant-table-tbody > tr > td.ant-table-cell-fix-left,
.list-view-table .ant-table-tbody > tr > td.ant-table-cell-fix-start {
  position: sticky !important;
  left: 0 !important;
  background: #ffffff !important;
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.06) !important;
  z-index: 9 !important;
}

.list-view-table .ant-table-tbody > tr > td.ant-table-cell-fix-right,
.list-view-table .ant-table-tbody > tr > td.ant-table-cell-fix-end {
  position: sticky !important;
  right: 0 !important;
  background: #ffffff !important;
  box-shadow: -1px 0 0 rgba(0, 0, 0, 0.06) !important;
  z-index: 9 !important;
}

/* Gắn icon sort ngay sau title của cột (antd mặc định đẩy icon ra mép phải,
   tạo khoảng trống lớn khi cột thừa chiều rộng). */
.list-view-table .ant-table-thead .ant-table-column-sorters {
  justify-content: flex-start;
  max-width: 100%;
}
.list-view-table .ant-table-thead th.ant-table-cell-align-center .ant-table-column-sorters,
.list-view-table .ant-table-thead th[align="center"] .ant-table-column-sorters {
  justify-content: center !important;
  text-align: center !important;
}
.list-view-table .ant-table-thead th.ant-table-cell-align-center,
.list-view-table .ant-table-thead th[align="center"] {
  text-align: center !important;
}
/* Đồng bộ độ rộng, xóa margin thừa và căn giữa toàn cục cho mọi Badge/Tag trong cột center */
.list-view-table td.ant-table-cell-align-center .ant-tag,
.list-view-table td.ant-table-cell-align-center .status-badge,
.list-view-table td[align="center"] .ant-tag,
.list-view-table td[align="center"] .status-badge {
  min-width: 125px !important;
  margin: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  border-radius: 999px !important;
}
.list-view-table .ant-table-thead .ant-table-column-title {
  flex: 0 1 auto;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.list-view-table .ant-table-cell {
  white-space: nowrap !important;
}

/* --- Navigation zone (BLUE — đồng nhất) --- */
.sidebar-footer,
.ant-layout-sider,
.ant-menu-dark {
  background: var(--bg-sidebar) !important;
}

/* Active item: PILL với box-shadow glow, KHÔNG có border-left */
.ant-menu-dark .ant-menu-item-selected {
  position: relative;
  font-weight: 600;
  box-shadow: 0 0 12px rgba(27, 132, 255, 0.4);
}

/* Menu item spacing đồng bộ với form field (height ~40px, padding 10 = cellPaddingBlock) */
.ant-menu-dark .ant-menu-item {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  height: auto !important;
}
.ant-menu-dark .ant-menu-submenu-title {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  height: auto !important;
}
/* Cho phép text menu dài xuống dòng */
.ant-menu-dark .ant-menu-title-content {
  white-space: normal;
  line-height: 1.5 !important;
}

/* Footer với nút collapse dạng FLOATING */
.sidebar-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 0 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.sidebar-footer__version {
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  white-space: nowrap;
}
.sidebar-footer__collapse-btn {
  position: absolute;
  right: -16px;
  top: 50%;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #FFFFFF;
  color: var(--color-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 10;
  transform: translateY(-50%);
}
.sidebar-footer__collapse-btn:hover {
  background: var(--color-primary);
  color: #FFFFFF;
}
.sidebar-footer__collapse-btn--collapsed svg {
  transform: rotate(180deg);
}

/* ---------- Status badge (Hoạt động / Ngừng hoạt động...) — dùng cho MỌI bảng dữ liệu ---------- */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 3px 10px 3px 8px;
  border-radius: var(--radius-pill, 999px);
  white-space: nowrap !important;
  flex-shrink: 0;
  line-height: 1.4;
}
.status-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status-badge--active {
  color: var(--color-success);
  background: rgba(23, 198, 83, 0.1);
}
.status-badge--inactive {
  color: var(--text-tertiary);
  background: rgba(0, 0, 0, 0.04);
}
.status-badge--locked {
  color: var(--color-error);
  background: rgba(241, 65, 108, 0.1);
}
.status-badge--pending {
  color: var(--color-warning);
  background: rgba(246, 177, 0, 0.1);
}

/* ---------- Tag vai trò / phân loại — MỖI vai trò 1 màu cố định, không dùng chung 1 màu ---------- */
.role-tag {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}
.role-tag--admin {          /* Quản trị hệ thống */
  color: #7239EA;
  background: #F5EEFF;
}
.role-tag--org-admin {      /* Quản trị đơn vị */
  color: var(--color-primary);
  background: var(--icon-bg-blue);
}
.role-tag--manager {        /* Quản lý người dùng / quản lý nghiệp vụ */
  color: #C9720A;
  background: var(--icon-bg-orange);
}
.role-tag--viewer {         /* Người xem (Viewer) */
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.045);
}
.role-tag--user {           /* Người dùng thường / USER */
  color: #0AA5C2;
  background: #E6F9FC;
}

/* ---------- Icon hành động trong bảng (sửa / khóa / xem / xoá) ---------- */
.table-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.table-actions__btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  transition: background 0.2s ease, color 0.2s ease;
  cursor: pointer;
}
.table-actions__btn:hover {
  background: var(--icon-bg-blue);
  color: var(--color-primary);
}
.table-actions__btn--danger:hover {
  background: var(--icon-bg-red);
  color: var(--color-error);
}

/* ---------- Card thống kê (KPI card) kiểu Metronic ---------- */
.kpi-card {
  background: var(--bg-container);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px 24px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.kpi-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}
.kpi-card__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.kpi-card__value {
  font-size: 34px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-top: 4px;
}
.kpi-card__icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-card__delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-pill, 999px);
  margin-top: 8px;
}
.kpi-card__delta--up {
  color: var(--color-success);
  background: rgba(23, 198, 83, 0.1);
}
.kpi-card__delta--down {
  color: var(--color-error);
  background: rgba(241, 65, 108, 0.1);
}

/* ---------- Feature card (\"Chức năng chính\") ---------- */
.feature-card {
  background: var(--bg-container);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 24px;
  transition: box-shadow 0.2s ease;
}
.feature-card:hover {
  box-shadow: var(--shadow-card-hover);
}
.feature-card__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: transparent;
  transition: background 0.2s ease;
}
.feature-card__link:hover {
  background: var(--icon-bg-blue);
}

/* ---------- Topbar user (avatar + tên + vai trò góc phải header) ---------- */
.topbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.topbar-user__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.topbar-user__info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.topbar-user__name {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}
.topbar-user__role {
  color: var(--text-secondary) !important;
  font-size: 12px;
  white-space: nowrap;
}
.topbar-user__arrow {
  color: var(--text-tertiary);
  font-size: 10px;
  margin-left: 2px;
}
.topbar-user__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.topbar-user__status-dot {
  position: absolute;
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  border: 2px solid var(--bg-container);
}

/* ---------- Body background ---------- */
body, .ant-layout {
  background: var(--bg-body);
}

/* ---------- TextArea — bo góc chặt (4px) làm mặc định; từng form có thể override bằng token radiusPill ---------- */
textarea.ant-input {
  border-radius: 4px;
}

/* ---------- Required mark (*) bên phải label ---------- */
.ant-form-item-required::before { display: inline-block; margin-left: 4px; order: 1; }
.ant-form-item-required::after { display: none; }

/* ---------- Select đã chọn giá trị: ẩn con trỏ nhấp nháy (caret) trong ô select ---------- */
.ant-select:has(.ant-select-selection-item) .ant-select-selection-search-input {
  caret-color: transparent;
}

/* ============================================================
   5. MẢNG DANH SÁCH — CẢNG BIỂN / BẾN CẢNG / CẦU CẢNG / CẢNG CAN / PHAO TIÊU
   ============================================================ */

/* --- Màn danh sách tổng thể (list-view page container) --- */
.port-module-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--bg-body);
}

/* --- Vùng Screen Header (breadcrumb + nút hành động) --- */
.port-screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 8px 8px;
  margin-bottom: 12px;
}
.port-screen-header__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.port-screen-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.port-screen-header__action-btn {
  border-radius: 999px;
  height: 40px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
}
.port-screen-header__action-btn--primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF;
}
.port-screen-header__action-btn--outline {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}

/* --- Filter Table Layout (bộ lọc bên trái, bảng bên phải) --- */
.port-filter-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* Panel filter dọc bên trái */
.port-filter-panel {
  flex-shrink: 0;
  width: 320px;
  max-width: 360px;
  background: var(--bg-container);
  border: 0.5px solid var(--border-base);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all 0.2s ease;
}
.port-filter-panel--collapsed {
  flex-shrink: 0;
  width: 44px;
}

/* Nút mở/đóng filter */
.port-filter-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-container);
  border: 1px solid var(--border-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.port-filter-toggle-btn:hover {
  background: var(--icon-bg-blue);
  color: var(--color-primary);
}

/* Body filter (scrollable fields) */
.port-filter-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.port-filter-field {
  margin-bottom: 12px;
}
.port-filter-field:last-child {
  margin-bottom: 0;
}
.port-filter-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--bg-sidebar);
  margin-bottom: 6px;
  display: block;
}
.port-filter-field__input {
  width: 100%;
  height: 40px;
  border-radius: 999px;
  font-size: 13px;
}

/* Footer filter (nút Tìm kiếm + Làm mới) */
.port-filter-footer {
  border-top: 1px solid var(--border-base);
  padding: 12px 16px;
  display: flex;
  justify-content: center;
  gap: 8px;
}
.port-filter-footer__btn {
  border-radius: 999px;
  height: 40px;
  padding: 0 24px;
  font-size: 13px;
  font-weight: 500;
}
.port-filter-footer__btn--search {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF;
}
.port-filter-footer__btn--reset {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}

/* --- Status Tabs (tab trạng thái: Tất cả, Nháp, Chờ duyệt, Đã duyệt, Từ chối) --- */
.port-status-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-container);
  border: 0.5px solid var(--border-base);
  border-radius: 12px;
  margin-bottom: 8px;
}
.port-status-tabs__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}
.port-status-tabs__item:hover {
  background: var(--icon-bg-blue);
}
.port-status-tabs__item--active {
  background: var(--icon-bg-blue);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}
.port-status-tabs__count {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--icon-bg-blue);
  color: var(--text-secondary);
}
.port-status-tabs__item--active .port-status-tabs__count {
  background: var(--color-primary);
  color: #FFFFFF;
}

/* --- Data Table --- */
.port-data-table {
  background: var(--bg-container);
  border: 0.5px solid var(--border-base);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.port-data-table__header {
  background: #eaf0f6;
  padding: 15px 16px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--bg-sidebar);
}
.port-data-table__row-hover:hover {
  background: #F5F8FA;
}
.port-data-table__cell {
  font-size: 13px;
  color: var(--text-primary);
  padding-block: 9px;
}
.port-data-table__empty {
  text-align: center;
  padding: 48px 0;
  color: var(--text-tertiary);
  font-size: 14px;
}
.port-data-table__loading {
  text-align: center;
  padding: 48px 0;
  color: var(--text-tertiary);
}
.port-data-table__error {
  background: var(--bg-container);
  border: 0.5px solid var(--border-base);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: var(--color-error);
}

/* --- Pagination --- */
.port-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
}
.port-pagination__btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  color: var(--data-sea1, #2769b3);
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.port-pagination__btn:hover {
  background: var(--icon-bg-blue);
  border-color: var(--color-primary);
}
.port-pagination__btn--active {
  background: var(--color-primary);
  color: #FFFFFF;
}
.port-pagination__size-select {
  width: 72px;
  height: 32px;
  border-radius: 999px;
  font-size: 13px;
}

/* --- Detail Section (Xem chi tiết) --- */
.port-detail-section {
  margin-bottom: 24px;
}
.port-detail-section__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--bg-sidebar);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-base);
}
.port-detail-row {
  display: flex;
  padding: 8px 0;
  gap: 8px;
}
.port-detail-row__label {
  flex-shrink: 0;
  width: 180px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.port-detail-row__value {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-word;
}

/* --- Approval Action Bar --- */
.port-approval-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--icon-bg-blue);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  margin-bottom: 16px;
}
.port-approval-bar__btn {
  border-radius: 999px;
  height: 40px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
}
.port-approval-bar__btn--approve {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #FFFFFF;
}
.port-approval-bar__btn--reject {
  background: transparent;
  border: 1px solid var(--color-error);
  color: var(--color-error);
}
.port-approval-bar__btn--submit {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF;
}

/* --- Delete Confirmation Modal --- */
.port-delete-modal {
  max-width: 480px;
}
.port-delete-modal__warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--icon-bg-red);
  border: 1px solid rgba(241, 65, 108, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}
.port-delete-modal__confirm-input {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  margin-bottom: 12px;
}

/* --- Reject Reason Modal --- */
.port-reject-modal {
  max-width: 560px;
}
.port-reject-modal__textarea {
  width: 100%;
  border-radius: 8px;
  min-height: 120px;
  margin-bottom: 8px;
}
.port-reject-modal__error {
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
}

/* --- History Timeline --- */
.port-history-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.port-history-group {
  border-left: 2px solid var(--color-primary);
  padding-left: 12px;
  padding-bottom: 12px;
  position: relative;
}
.port-history-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.port-history-group__time {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}
.port-history-group__badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}
.port-history-group__badge--edit {
  background: rgba(14, 111, 214, 0.1);
  color: var(--color-primary);
}
.port-history-group__meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.port-history-group__changes {
  background: var(--bg-container);
  border: 0.5px solid var(--border-base);
  border-radius: 8px;
  padding: 12px;
}
.port-history-group__change-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}
.port-history-group__change-label {
  flex-shrink: 0;
  width: 140px;
  font-weight: 600;
  color: var(--text-secondary);
}
.port-history-group__change-old {
  flex: 1;
  color: var(--text-tertiary);
  text-decoration: line-through;
}
.port-history-group__change-arrow {
  color: var(--text-tertiary);
}
.port-history-group__change-new {
  flex: 1;
  color: var(--text-primary);
  font-weight: 500;
}

/* ============================================================
   6. MẢNG FORM (Drawer/Modal) — THÊM MỚI / CHỈNH SỬA
   ============================================================ */

/* --- Drawer Container --- */
.port-form-drawer {
  width: 1000px;
}
.port-form-drawer__header {
  padding: 12px 24px;
  border-bottom: 1px solid var(--border-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.port-form-drawer__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--bg-sidebar);
}
.port-form-drawer__close-btn {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-form-drawer__close-btn:hover {
  background: var(--icon-bg-red);
  color: var(--color-error);
}
.port-form-drawer__body {
  padding: 0 24px 12px;
}
.port-form-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid var(--border-base);
}

/* --- Form Tabs --- */
.port-form-tabs {
  margin-bottom: 0;
  padding-top: 0;
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg-container);
}
.port-form-tabs__ink {
  background: var(--color-primary);
}
.port-form-tabs__item {
  font-size: 13px;
  color: var(--text-secondary);
}
.port-form-tabs__item--active {
  color: var(--color-primary);
  font-weight: 600;
}

/* --- Form Field --- */
.port-form-field {
  margin-bottom: 12px;
}
.port-form-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--bg-sidebar);
}
.port-form-field__input {
  width: 100%;
  height: 40px;
  border-radius: 999px;
  font-size: 13px;
}
.port-form-field__textarea {
  width: 100%;
  border-radius: 4px;
  min-height: 80px;
  font-size: 13px;
}
.port-form-field__error {
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
}
.port-form-field__hint {
  color: var(--text-tertiary);
  font-size: 11px;
  margin-top: 2px;
}
.port-form-field__max-reached {
  border-color: var(--color-error) !important;
}

/* --- Form Row (2 columns) --- */
.port-form-row {
  display: flex;
  gap: 16px;
}
.port-form-row > * {
  flex: 1;
}

/* --- Upload Area --- */
.port-upload-area {
  border: 1px dashed var(--border-base);
  border-radius: 8px;
  background: #eaf0f6;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-upload-area:hover {
  border-color: var(--color-primary);
  background: var(--icon-bg-blue);
}
.port-upload-area__icon {
  font-size: 32px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}
.port-upload-area__text {
  font-size: 13px;
  color: var(--text-secondary);
}
.port-upload-area__hint {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* --- Uploaded File Item --- */
.port-upload-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #eaf0f6;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-primary);
}
.port-upload-file-item__remove {
  color: var(--color-error);
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-upload-file-item__remove:hover {
  color: #c82333;
}

/* --- Coordinate List --- */
.port-coordinate-table {
  margin-top: 12px;
  border: 0.5px solid var(--border-base);
  border-radius: 8px;
  overflow: hidden;
}
.port-coordinate-table__header {
  background: #eaf0f6;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bg-sidebar);
  text-transform: uppercase;
}
.port-coordinate-table__row {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
}
.port-coordinate-table__row:last-child {
  border-bottom: none;
}
.port-coordinate-table__input {
  width: 120px;
  height: 36px;
  border-radius: 4px;
  font-size: 13px;
}
.port-coordinate-table__remove-btn {
  color: var(--color-error);
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-coordinate-table__remove-btn:hover {
  color: #c82333;
}
.port-coordinate-table__add-btn {
  border-radius: 999px;
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-coordinate-table__add-btn:hover {
  background: var(--icon-bg-blue);
}

/* ============================================================
   7. BẢNG CHI TIẾT (Detail View) — XEM CHI TIẾT
   ============================================================ */

/* --- Detail Drawer --- */
.port-detail-drawer {
  width: 1000px;
}
.port-detail-drawer__header {
  padding: 12px 24px;
  border-bottom: 1px solid var(--border-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.port-detail-drawer__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--bg-sidebar);
}
.port-detail-drawer__body {
  padding: 0 24px 12px;
}

/* --- Descriptions --- */
.port-detail-descriptions {
  border: 1px solid var(--border-light);
  border-radius: 8px;
  overflow: hidden;
}
.port-detail-descriptions__item {
  display: flex;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
}
.port-detail-descriptions__item:last-child {
  border-bottom: none;
}
.port-detail-descriptions__label {
  flex-shrink: 0;
  width: 180px;
  font-weight: 600;
  color: var(--text-secondary);
}
.port-detail-descriptions__value {
  flex: 1;
  color: var(--text-primary);
  word-break: break-word;
}

/* --- Detail Section Collapsible --- */
.port-detail-section--collapsible {
  margin-bottom: 16px;
  border: 0.5px solid var(--border-base);
  border-radius: 8px;
  overflow: hidden;
}
.port-detail-section--collapsible__header {
  padding: 12px 16px;
  background: #eaf0f6;
  font-size: 14px;
  font-weight: 700;
  color: var(--bg-sidebar);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.port-detail-section--collapsible__header:hover {
  background: var(--icon-bg-blue);
}
.port-detail-section--collapsible__body {
  padding: 16px;
}

/* --- Detail Files --- */
.port-detail-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.port-detail-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-container);
  border: 0.5px solid var(--border-base);
  border-radius: 8px;
  font-size: 13px;
}
.port-detail-file-item__name {
  flex: 1;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.port-detail-file-item__size {
  color: var(--text-tertiary);
  font-size: 11px;
}

/* ============================================================
   8. MẢNG XÁC NHẬN / POPUP
   ============================================================ */

/* --- Confirm Modal (phê duyệt, từ chối, xóa, gửi duyệt) --- */
.port-confirm-modal {
  max-width: 480px;
}
.port-confirm-modal__body {
  padding: 16px 0;
}
.port-confirm-modal__text {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.port-confirm-modal__input {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  margin-bottom: 8px;
}
.port-confirm-modal__textarea {
  width: 100%;
  border-radius: 8px;
  min-height: 100px;
  margin-bottom: 8px;
}
.port-confirm-modal__error {
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 8px;
}

/* --- Approval Content --- */
.port-approval-content {
  padding: 12px 16px;
  background: var(--icon-bg-green);
  border: 1px solid rgba(23, 198, 83, 0.2);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-primary);
}

/* --- Status Badge (tái sử dụng từ global, nhưng thêm biến thể riêng cho port module) --- */
.port-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 999px;
}
.port-status-badge--proposed {
  background: rgba(14, 111, 214, 0.1);
  color: var(--color-primary);
}
.port-status-badge--pending {
  background: rgba(237, 161, 0, 0.1);
  color: #EDA100;
}
.port-status-badge--approved {
  background: rgba(27, 175, 122, 0.1);
  color: #1BAF7A;
}
.port-status-badge--rejected {
  background: rgba(227, 73, 72, 0.1);
  color: #E34948;
}
.port-status-badge--draft {
  background: rgba(147, 163, 179, 0.1);
  color: #93a3b3;
}

/* ============================================================
   9. MODULE RIÊNG — CẦU CẢNG (PIER)
   ============================================================ */

/* --- Pier-specific filter fields --- */
.pier-filter__structure-type {
  /* Loại kết cấu: bệ cọc cao / cường từ / trọng lực */
}
.pier-filter__construction-grade {
  /* Phân cấp: đặc biệt / cấp 1-4 */
}
.pier-filter__operational-function {
  /* Công năng: container / tổng hợp / hành khách / xăng dầu / rời/quặng / khác */
}

/* --- Pier-specific table columns --- */
.pier-column__pier-type {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-blue);
  color: var(--color-primary);
}
.pier-column__construction-grade {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-orange);
  color: #C9720A;
}

/* ============================================================
   10. MODULE RIÊNG — BẾN CẢNG (BERTH)
   ============================================================ */

/* --- Berth-specific --- */
.berth-filter__structure-type {
  /* Loại kết cấu bến: cọc cao / cường từ / trọng lực / khác */
}
.berth-filter__operational-function {
  /* Công năng: container / hành khách / hànggeneral / xăng dầu */
}

/* --- Berth-specific table columns --- */
.berth-column__structure-type {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-purple);
  color: #7239EA;
}

/* ============================================================
   11. MODULE RIÊNG — CẢNG CAN (DRY PORT)
   ============================================================ */

/* --- Dry Port-specific --- */
.dry-port-filter__transport-corridor {
  /* Hành lang giao thông */
}
.dry-port-filter__region {
  /* Vùng: Bắc / Trung / Nam */
}

/* --- Dry Port-specific table columns --- */
.dry-port-column__connection-mode {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-green);
  color: #17C653;
}
.dry-port-column__area {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ============================================================
   12. MODULE RIÊNG — LUỒNG HÀNG HẢI (NAVIGATION CHANNEL)
   ============================================================ */

/* --- Navigation Channel-specific --- */
.nav-channel-filter__status {
  /* Trạng thái: PROPOSED / PENDING / APPROVED / REJECTED */
}

/* --- Navigation Channel-specific table columns --- */
.nav-channel-column__station-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.nav-channel-column__clearance-height {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-blue);
  color: var(--color-primary);
}

/* ============================================================
   13. MODULE RIÊNG — PHAO TIÊU & NHÀ TRẠM (BUOY / STATION)
   ============================================================ */

/* --- Buoy-specific --- */
.buoy-filter__type {
  /* Loại phao: báo hiệu / cảnh báo / dẫn đường */
}
.buoy-filter__operational-status {
  /* Tình trạng: đang hoạt động / tạm ngừng / hư hỏng */
}

/* --- Buoy-specific table columns --- */
.buoy-column__type {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-blue);
  color: var(--color-primary);
}
.buoy-column__condition {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-green);
  color: #17C653;
}

/* --- Station-specific --- */
.station-filter__station-type {
  /* Loại trạm: radar / đặc biệt / ven bờ */
}

/* --- Station-specific table columns --- */
.station-column__status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--icon-bg-green);
  color: #17C653;
}

/* ============================================================
   14. CHUNG — ACTION BUTTONS (Tạo mới, Sửa, Xóa, Xem, Phê duyệt, Từ chối)
   ============================================================ */

/* --- Primary Actions --- */
.port-action--create {
  border-radius: 999px;
  height: 40px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF;
}
.port-action--create:hover {
  background: var(--primary-hover, #3B94FF);
  border-color: var(--primary-hover, #3B94FF);
}

.port-action--update {
  border-radius: 999px;
  height: 36px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-action--update:hover {
  background: var(--icon-bg-blue);
  color: var(--color-primary);
}

.port-action--delete {
  border-radius: 999px;
  height: 36px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-action--delete:hover {
  background: var(--icon-bg-red);
  color: var(--color-error);
}

.port-action--view {
  border-radius: 999px;
  height: 36px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.port-action--view:hover {
  background: var(--icon-bg-green);
  color: #17C653;
}

/* --- Approval Actions --- */
.port-action--approve {
  border-radius: 999px;
  height: 40px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-success);
  border-color: var(--color-success);
  color: #FFFFFF;
}
.port-action--approve:hover {
  background: #15a84a;
  border-color: #15a84a;
}

.port-action--reject {
  border-radius: 999px;
  height: 40px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  border: 1px solid var(--color-error);
  color: var(--color-error);
}
.port-action--reject:hover {
  background: rgba(241, 65, 108, 0.1);
}

.port-action--submit {
  border-radius: 999px;
  height: 40px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF;
}
.port-action--submit:hover {
  background: var(--primary-hover, #3B94FF);
  border-color: var(--primary-hover, #3B94FF);
}

/* --- Outline / Secondary --- */
.port-action--outline {
  border-radius: 999px;
  height: 40px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: transparent;
  cursor: pointer;
}
.port-action--outline:hover {
  background: var(--icon-bg-blue);
}

/* --- Loading / Spinner --- */
.port-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: port-spin 0.6s linear infinite;
}
@keyframes port-spin {
  to { transform: rotate(360deg); }
}

`;

// ============================================================
// 4. GHI CHÚ CHO AI KHI SỬA 22 MODULE
// ============================================================
/**
 * QUY TẮC BẮT BUỘC khi refactor từng module:
 *
 * 1. KHÔNG hard-code màu hex trực tiếp trong component (vd style={{color: '#1677ff'}}).
 *    → Luôn dùng token từ `colors` object hoặc CSS var (var(--color-primary)).
 *
 * 2. Card thống kê (kiểu 4 ô CẢNG BIỂN / ĐÈN BIỂN...) trong MỌI module
 *    phải dùng chung class `.kpi-card` + `.kpi-card__label` + `.kpi-card__value`
 *    thay vì tự viết style riêng lẻ từng nơi → đảm bảo đồng bộ toàn hệ thống.
 *
 * 3. Card chức năng / danh sách link truy cập nhanh → dùng `.feature-card`.
 *
 * 4. Progress bar phẳng hiện tại trong card thống kê nên được thay bằng
 *    `.kpi-card__delta` (badge % tăng giảm) nếu có dữ liệu so sánh kỳ trước;
 *    nếu không có dữ liệu so sánh, có thể bỏ hẳn, không để progress bar vô nghĩa.
 *
 * 5. Sidebar: mọi menu item dùng chung component Menu đã theme sẵn (mode="inline" theme="dark"),
 *    không tự tạo menu riêng bằng div/ul thủ công.
 *
 * 6. Nếu 1 module cần màu/spacing/radius KHÔNG có sẵn trong file này:
 *    dừng lại, bổ sung token mới vào theme.ts trước (ở đúng nhóm colors/radius/spacing/fontSize),
 *    rồi mới dùng ở module đó. Không tự ý đặt giá trị rời rạc trong từng file.
 *
 * 7. Toàn bộ 22 module phải import `metronicTheme` gián tiếp qua ConfigProvider ở root,
 *    KHÔNG được wrap thêm ConfigProvider theme khác ở cấp module (tránh theme bị override lệch nhau).
 *
 * 8. Sidebar: 1 MÀU XANH DƯƠNG ĐỒNG NHẤT (#12468C) cho header, menu, footer.
 *    Active menu item là PILL màu xanh dương sáng (#1B84FF), KHÔNG có border-left.
 *
 * 9. MỌI cột "Trạng thái" trong MỌI bảng dữ liệu (Table) của 22 module phải dùng class
 *    `.status-badge` + 1 trong 4 biến thể: `--active`, `--inactive`, `--locked`, `--pending`.
 *    KHÔNG để chữ trạng thái trần không có nền/pill.
 *
 * 10. MỌI cột "Vai trò / Loại / Phân loại" phải dùng class `.role-tag` + biến thể tương ứng
 *     ý nghĩa nghiệp vụ (`--admin`, `--org-admin`, `--manager`, `--viewer`). KHÔNG dùng chung
 *     1 màu cho tất cả các loại khác nhau — mỗi ý nghĩa phải có 1 màu cố định, dùng lại xuyên
 *     suốt hệ thống (vd "Quản trị đơn vị" ở module nào cũng phải ra đúng 1 màu xanh dương).
 *
 * 11. MỌI cột "Hành động" trong bảng dữ liệu dùng class `.table-actions` bọc ngoài,
 *     mỗi icon là `.table-actions__btn` (icon sửa/khóa/xem dùng màu trung tính mặc định),
 *     riêng icon xoá thêm class `.table-actions__btn--danger`. CẤM tô mỗi icon 1 màu ngẫu nhiên
 *     (tím/xanh/cam lẫn lộn không theo quy tắc) như hiện tại đang bị.
 *
 * 12. JSX template cho sidebar (AppLayout.tsx):
 *     <Sider width={layout.sidebarWidth} collapsedWidth={layout.sidebarCollapsedWidth} ...>
 *       <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
 *         <div className="sidebar-header">
 *           <div className="sidebar-header__logo-box">
 *             <img src="/images/logo-hanghai.svg" alt="Logo" />
 *           </div>
 *           <div className="sidebar-header__text">
 *             <span className="sidebar-header__title">Cuc Hang Hai</span>
 *             <span className="sidebar-header__subtitle">Viet Nam</span>
 *           </div>
 *         </div>
 *         <div className="sidebar-search">
 *           <SearchOutlined />
 *           <input type="text" placeholder="Tim kiem..." />
 *         </div>
 *         <div className="sidebar-menu-scroll">
 *           <Menu theme="dark" mode="inline" selectedKeys={...} items={...} ... />
 *         </div>
 *         <div className="sidebar-footer">
 *           <button className="sidebar-footer__collapse-btn ...">
 *             <LeftOutlined />
 *           </button>
 *         </div>
 *       </div>
 *     </Sider>
 *     Nut collapse o footer la FLOATING (absolute, right: -14px, top: 50%, transform: translateY(-50%)),
 *     nen trang, icon xanh. Kich thuoc 32x32.
 *
 * 13. Import bat buoc trong AppLayout.tsx:
 *     import { metronicTheme, layout } from '../theme';
 *     Su dung layout.sidebarWidth va layout.sidebarCollapsedWidth cho Sider props.
 *
 * 14. Khi sidebar collapsed, ẩn `.sidebar-header__text` và `.sidebar-search` theo điều kiện
 *     `!collapsed && (...)`.
 */
