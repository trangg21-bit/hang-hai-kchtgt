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
  listTableMinWidth: 1400,
  listTableScrollY: 'calc(100vh - 380px)',
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
      headerBg: '#F9FAFB',
      headerColor: colors.textSecondary,
      rowHoverBg: '#F5F8FA',
      cellPaddingBlock: 10,
    },

    Dropdown: {
      fontSize: 13,
    },

    Modal: {
      fontSize: 13,
      fontSizeLG: 13,
      titleFontSize: 15,
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

    Modal: {
      borderRadiusLG: radius.lg,
    },

    Dropdown: {
      borderRadiusLG: radius.md,
      boxShadowSecondary: shadow.dropdown,
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

/* ---------- TextArea — tight corners, never pill/round ---------- */
textarea.ant-input {
  border-radius: 4px !important;
}

/* ---------- Required mark (*) bên phải label ---------- */
.ant-form-item-required::before { display: inline-block; margin-left: 4px; order: 1; }
.ant-form-item-required::after { display: none; }
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
