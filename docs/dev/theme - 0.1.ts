/**
 * theme.ts
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
  sidebarBg: '#1E2129',      // nền sidebar tối
  sidebarActiveBg: 'rgba(27, 132, 255, 0.12)',

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
      // Sidebar tối kiểu Metronic
      darkItemBg: colors.sidebarBg,
      darkSubMenuItemBg: colors.sidebarBg,
      darkItemColor: colors.textOnDarkMuted,
      darkItemHoverColor: colors.textOnDark,
      darkItemSelectedColor: '#FFFFFF',
      darkItemSelectedBg: colors.sidebarActiveBg,
      itemHeight: 46,
      itemMarginInline: 8,
      itemBorderRadius: radius.sm,
      iconSize: 18,
      collapsedIconSize: 18,
      // Lưu ý cho AI: item đang active cần thêm border-left 3px solid var(--color-primary)
      // AntD token không hỗ trợ border-left riêng => xử lý bằng CSS override (xem globalCssVars mục .ant-menu-item-selected)
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
      cellPaddingBlock: 14,
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

  --font-family: ${fontFamily};
}

/* ---------- Sidebar: header (logo) + footer (nút thu gọn) BẮT BUỘC cùng 1 màu nền với menu ---------- */
/* Lý do phải khai báo tường minh: nếu không, AI hay tự set nền trắng cho header logo
   hoặc nền navy khác cho footer, gây ra 3 mảng màu tối khác nhau trong 1 sidebar. */
.sidebar-header,
.sidebar-footer,
.ant-layout-sider,
.ant-menu-dark {
  background: var(--bg-sidebar) !important;
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.sidebar-header__logo-box {
  /* Chỉ riêng icon logo (lá cờ) mới có khối nền, KHÔNG kéo nền trắng ra cả thanh ngang */
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.sidebar-header__title {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 14px;
  line-height: 1.3;
}
.sidebar-header__subtitle {
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  letter-spacing: 0.03em;
}
.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color 0.2s ease;
}
.sidebar-footer:hover {
  color: #FFFFFF;
}

/* ---------- Sidebar: border trái cho item đang active (đặc trưng Metronic) ---------- */
.ant-menu-dark .ant-menu-item-selected {
  position: relative;
  font-weight: 600;
}
.ant-menu-dark .ant-menu-item-selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: var(--color-primary);
}

/* ---------- Status badge (Hoạt động / Ngừng hoạt động...) — dùng cho MỌI bảng dữ liệu ---------- */
/* Thay cho việc để chữ trần màu xanh/đỏ như hiện tại */
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
/* Quy ước màu theo Ý NGHĨA vai trò, áp dụng nhất quán cho toàn bộ 22 module có khái niệm "vai trò/loại" */
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

/* ---------- Icon hành động trong bảng (sửa / khóa / xem / xoá) ---------- */
/* Quy tắc: hành động trung tính dùng 1 màu xám-xanh đồng nhất; CHỈ hành động xoá mới đỏ.
   Không tô mỗi icon 1 màu sặc sỡ như hiện tại. */
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
/* Badge % tăng/giảm — thay cho progress bar phẳng vô nghĩa */
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

/* ---------- Feature card ("Chức năng chính") ---------- */
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

/* ---------- Body background ---------- */
body, .ant-layout {
  background: var(--bg-body);
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
 * 8. Sidebar PHẢI có đúng 3 vùng dùng chung 1 class nền: `.sidebar-header` (logo),
 *    phần menu (Menu component theme="dark" — tự nhận var(--bg-sidebar) qua token Layout.siderBg),
 *    và `.sidebar-footer` (nút thu gọn). CẤM set background-color/hex riêng cho từng vùng này.
 *    Icon logo (lá cờ) chỉ bọc trong `.sidebar-header__logo-box` (khối nhỏ 36x36 nền trắng),
 *    KHÔNG để nền trắng tràn cả thanh ngang header.
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
 */
