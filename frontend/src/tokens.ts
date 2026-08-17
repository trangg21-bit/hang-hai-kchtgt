// ============================================================
// tokens.ts — Semantic design token architecture
// Principle: tokens describe ROLE, not VALUE
// ============================================================

// --- COLOR PALETTE (13 tokens, CLOSED — no additions without design review) ---

// Action — the accent color, MAX 3 uses per screen
export const actionPrimary = '#0E6FD6';        // deeper blue — more authoritative
export const actionHover = '#0A5AB8';

// Status — semantic meaning, NOT color names
export const statusOperational = '#1BAF7A';   // good, operating, increase
export const statusAttention = '#EDA100';     // pending, warning, not-exploited
export const statusCritical = '#E34948';      // bad, stopped, rejected, decrease
export const statusDraft = '#93a3b3';         // draft, inactive

// Data — chart series, NOT "blue" / "pink"
export const dataPrimary = '#2A78D6';         // main data series (domestic, primary)
export const dataSecondary = '#E87BA4';       // secondary data series (transshipment)

// Surface — backgrounds
export const surfaceCard = '#FFFFFF';         // elevated cards
export const surfacePage = '#eaf0f6';         // page background — blue-ish tint, cards pop more

// Text — hierarchy encoded, NOT arbitrary grays
export const textPrimary = '#0c2438';         // KPIs, titles — deepest navy
export const textSecondary = '#566a7c';       // labels, descriptions
export const textTertiary = '#93a3b3';        // metadata, timestamps, placeholders

// Border
export const borderDefault = 'rgba(11,46,79,0.09)';

// Data series — 6-color sea gradient for charts
export const dataNavy = '#0b2e4f';
export const dataSea0 = '#123a63';
export const dataSea1 = '#2769b3';
export const dataSea2 = '#4f9bd8';
export const dataSea3 = '#9ecdf0';
export const dataTeal = '#bedaf2';    // icy light blue — continues sea gradient past dataSea3 (was teal #0ea5a3)

// Infrastructure colors (dùng cho sidebar, layout — cần cho style preset)
export const sidebarBg = '#12468C';

// Font families
export const fontSans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const fontMono = "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace";

// Shadows
export const shadowSm = '0 1px 2px rgba(11,46,79,0.04)';
export const shadowMd = '0 2px 4px rgba(11,46,79,0.05), 0 12px 28px rgba(11,46,79,0.07)';
export const shadowLg = '0 8px 24px rgba(11,46,79,0.12), 0 24px 60px rgba(11,46,79,0.14)';


// --- NUMBER SCALES (closed sets — no "in-between" values allowed) ---

// Radius: only 5 values. 6, 7, 10, 14 are BANNED.
export const radiusSm = 4;
export const radiusMd = 8;
export const radiusLg = 12;
export const radiusXl = 18;
export const radiusPill = 999;
export const radiusTextArea = radiusSm; // TextArea uses tight 4px — pill/round looks wrong on multi-line

// Spacing: tighter small, wider large — creates breathing room
export const spaceXs = 4;   // micro-gap: 4px — filter↔bảng, tab↔bảng, label→input, upload hint
export const spaceSm = 8;
export const spaceFormField = 12;
export const spaceMd = 12;
export const spaceLg = 24;
export const spaceXl = 32;
export const spaceXxl = 48;

// NOTE: pageSize moved to business constants — not a design token
// Use DEFAULT_PAGE_SIZE from constants if needed, or inline 20.

// Font size: 7 values — stronger hierarchy
export const fontSizeSm = 10;   // metadata, captions — clearly subordinate
export const fontSizeMd = 13;   // labels, body
export const fontSizeLg = 15;   // card titles, section headers
export const fontSizeXl = 18;   // page titles
export const fontSizeHeading = 22;
export const fontSizeDisplay = 28;
export const fontSizeStat = 34; // KPI numbers — dominant, immediate impact
export const fontSizeBreadcrumb = 14;     // breadcrumb path (ngoại lệ đã token hóa)
export const fontSizeBreadcrumbLast = 16; // breadcrumb last item, bold (ngoại lệ đã token hóa)

// Font weight: 3 values. 450, 550, 700+ are BANNED unless exceptional.
export const fontWeightNormal = 400;
export const fontWeightMedium = 500;
export const fontWeightBold = 600;

// Control dimensions
export const controlHeight = 40; // Input, Select, Button — mọi ô nhập liệu và nút bấm


// --- CONTENT-TYPE CONVENTIONS (fixed mappings, apply everywhere) ---

// Metadata style (timestamps, counts, captions)
export const metaStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  fontWeight: fontWeightNormal,
};

// Card container style
export const cardStyle: React.CSSProperties = {
  background: surfaceCard,
  border: `0.5px solid ${borderDefault}`,
  borderRadius: radiusLg,
  padding: spaceMd,
};

// Separator / hairline
export const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${borderDefault}`,
  margin: `${spaceMd}px 0`,
};

// Action / pill button style
export const actionStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  color: actionPrimary,
  fontWeight: fontWeightMedium,
  cursor: 'pointer',
};

// Status badge base
export const badgeBaseStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  fontWeight: fontWeightMedium,
  padding: `2px ${spaceSm}px`,
  borderRadius: radiusPill,
  display: 'inline-block',
};


// ============================================================
// STYLE PRESETS — Mẫu giao diện đóng gói sẵn (Section 5)
// Mỗi preset = 1 khu vực màn hình. Dev import về dùng luôn,
// không tự ráp token thủ công.
// ============================================================

// --- 5.1 Ô nhập liệu & Nút bấm ---

/** Input, InputNumber — viền pill, cao 40px */
export const inputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
};

/** Select, DatePicker, TreeSelect — viền pill, cao 40px */
export const selectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
};

/** Nút chính: "Tạo mới", "Lưu", "Phê duyệt", "Tìm kiếm" */
export const primaryButtonStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
  fontSize: fontSizeMd,
  background: actionPrimary,
  borderColor: actionPrimary,
  color: '#FFFFFF',
};

/** Nút phụ: "Hủy", "Đóng", "Lưu tạm", "Xuất Excel" */
export const outlineButtonStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
  borderColor: actionPrimary,
  color: actionPrimary,
  fontSize: fontSizeMd,
  cursor: 'pointer',
};

/** Nút nguy hiểm: "Xóa", "Từ chối" */
export const dangerButtonStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
  borderColor: statusCritical,
  color: statusCritical,
};

/** Nút icon tròn 38×38px: ↻ Làm mới trong Filter */
export const iconButtonStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: `1px solid ${borderDefault}`,
  color: textSecondary,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};


// --- 5.2 Form trong Drawer/Modal ---

/** marginBottom cho mọi <Form.Item> */
export const formFieldStyle: React.CSSProperties = {
  marginBottom: spaceFormField,
};

/** Row gutter form 2 cột */
export const formRowGutter: [number, number] = [16, 16];

/** Tiêu đề Drawer: màu sidebarBg, đậm, 15px */
export const drawerTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeLg,
};

/** Nút ✕ đóng Drawer góc phải */
export const drawerCloseBtnStyle: React.CSSProperties = {
  fontSize: 18,
  color: textSecondary,
  borderRadius: radiusPill,
  width: 36,
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/** CSS đưa dấu * required sang bên phải label */
export const requiredMarkStyle =
  '.ant-form-item-required::before { display: inline-block; margin-left: 4px; order: 1; } .ant-form-item-required::after { display: none; }';


// --- 5.3 Trang danh sách ---

/** Container ngoài cùng trang danh sách */
export const pageContainerStyle: React.CSSProperties = {
  minHeight: '100%',
  marginTop: -8,
};

/** Vùng breadcrumb + nút hành động, cách nội dung dưới 16px */
export const screenHeaderStyle: React.CSSProperties = {
  marginBottom: spaceMd,
};

/** Panel lọc dọc bên trái: rộng 280-360px, flex column */
export const filterPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minWidth: 280,
  maxWidth: 360,
};

/** Vùng chứa trường filter (có scroll nếu dài) */
export const filterFieldsStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto' as const,
  padding: '12px 16px',
};

/** Chân filter: nút Tìm kiếm + Làm mới, căn giữa */
export const filterFooterStyle: React.CSSProperties = {
  borderTop: `1px solid ${borderDefault}`,
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'center',
  gap: spaceSm,
};

/** Nhãn mỗi trường filter: đậm, sidebarBg */
export const filterLabelStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  color: sidebarBg,
};

/** Thanh tab trạng thái: cardStyle + padding 7px 16px */
export const statusTabsStyle: React.CSSProperties = {
  ...cardStyle,
  padding: '7px 16px',
  marginBottom: spaceXs,
};


// --- 5.4 Bảng dữ liệu ---

/** Hàng tiêu đề cột: nền surfacePage, đậm, hoa, sidebarBg */
export const tableHeaderStyle: React.CSSProperties = {
  background: surfacePage,
  padding: '15px 16px',
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  textTransform: 'uppercase' as const,
  color: sidebarBg,
};

/** Ô dữ liệu: fontSizeMd, textPrimary, padding dọc 9px */
export const tableCellStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
  paddingBlock: 9,
};

/** Nút số trang: tròn 32×32, dataSea1 */
export const paginationBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  color: dataSea1,
};

/** Dropdown chọn cỡ trang: pill, 72×32 */
export const paginationSizeSelectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  width: 72,
  height: 32,
};


// --- 5.5 Drawer ---

/** Props chuẩn cho Drawer CRUD: width 1000px, right, không nút X mặc định */
export const drawerProps = {
  size: 1000 as any,
  placement: 'right' as const,
  closable: false,
  styles: {
    header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
    body: { padding: '0 24px 12px 24px' },
  },
};

/** Chân Drawer: nút căn giữa, gap 8px */
export const drawerFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: spaceSm,
};

/** <Descriptions> trong Xem chi tiết: bordered, 2 cột, label 180px */
export const detailDescriptionsStyle = {
  bordered: true,
  column: 2 as const,
  labelStyle: { width: 180 } as React.CSSProperties,
};

/** Tiêu đề section collapsible trong Xem chi tiết */
export const detailSectionTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
};


// --- 5.6 Upload file ---

/** Vùng kéo-thả/tải file: viền đứt, nền xám nhạt, căn giữa */
export const uploadAreaStyle: React.CSSProperties = {
  border: `1px dashed ${borderDefault}`,
  borderRadius: radiusMd,
  background: surfacePage,
  padding: '24px 16px',
  textAlign: 'center',
  cursor: 'pointer',
};

/** Dòng gợi ý định dạng file bên dưới vùng upload */
export const uploadHintStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  marginTop: spaceXs,
};

/** Item file đã tải lên: icon + tên file, nền xám nhạt, bo góc */
export const uploadFileItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
  padding: `${spaceXs}px ${spaceSm}px`,
  background: surfacePage,
  borderRadius: radiusSm,
  fontSize: fontSizeMd,
  color: textPrimary,
};


// --- 5.7 Import Excel ---

/** Link tải file template Excel mẫu */
export const importTemplateLinkStyle: React.CSSProperties = {
  color: actionPrimary,
  fontSize: fontSizeSm,
  cursor: 'pointer',
  marginBottom: spaceSm,
  display: 'inline-block',
};

/** Vùng tải file Excel (kế thừa giao diện uploadAreaStyle) */
export const importAreaStyle: React.CSSProperties = {
  ...uploadAreaStyle,
};


// --- 5.8 Modal xác nhận (Xóa / Phê duyệt / Từ chối) ---

/** Nội dung modal confirm: chữ căn giữa, padding dọc 16px */
export const confirmModalBodyStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
  textAlign: 'center',
  padding: `${spaceMd}px 0`,
};

/** Input/TextArea nhập lý do từ chối trong modal */
export const rejectReasonStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: controlHeight,
  marginTop: spaceMd,
  marginBottom: spaceMd,
};


// --- 5.9 Timeline (Lịch sử thay đổi thông tin) ---

/** Chấm tròn trên timeline: 12px, màu actionPrimary */
export const timelineDotStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: actionPrimary,
  flexShrink: 0,
};

/** Nội dung một mục timeline: tên người, nguồn, thời gian */
export const timelineContentStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
  lineHeight: 1.6,
};

/** Dòng hiển thị thay đổi (before → after): chữ nhỏ, secondary */
export const timelineChangeStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textSecondary,
  marginTop: spaceXs,
};

/** Đường nối dọc giữa các chấm timeline: 1px, borderDefault */
export const timelineLineStyle: React.CSSProperties = {
  width: 1,
  background: borderDefault,
  marginLeft: 5,
  flex: '1 0 auto',
  minHeight: 8,
};

/** Timestamp trên timeline: fontSizeSm, textTertiary, đậm hơn metadata */
export const timelineTimeStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  fontWeight: fontWeightMedium,
  marginBottom: spaceXs,
};

// --- 5.9b Lịch sử kiểu card (gom nhóm — chuẩn Hệ thống VTS / Cảng biển) ---

/** Badge trạng thái bản ghi (Thêm mới / Chỉnh sửa): pill theo màu truyền vào.
 *  Dùng: historyBadgeStyle(statusOperational) → "Thêm mới", historyBadgeStyle(actionPrimary) → "Chỉnh sửa" */
export const historyBadgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  padding: `2px ${spaceSm}px`,
  borderRadius: radiusPill,
  fontSize: fontSizeMd,
  fontWeight: fontWeightMedium,
  background: `${color}15`,
  color,
});

/** Khung 1 nhóm bản ghi: cột trái (thời gian + người + đơn vị) | cột phải (card thông tin) */
export const historyGroupGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(190px, 0.38fr) minmax(0, 1fr)',
  gap: spaceLg,
  alignItems: 'start',
  marginBottom: spaceSm,
};

/** Thời gian nhóm bản ghi (16:11 17/08/2026): to, đậm */
export const historyTimeStyle: React.CSSProperties = {
  fontSize: fontSizeLg,
  color: textPrimary,
  fontWeight: fontWeightBold,
  lineHeight: 1.5,
};

/** Dòng meta trong cột trái (Người cập nhật: … / Đơn vị: …): đậm, cùng hàng với nhãn */
export const historyMetaRowStyle: React.CSSProperties = {
  display: 'block',
  fontSize: fontSizeMd,
  color: textSecondary,
  fontWeight: fontWeightBold,
  lineHeight: 1.5,
};

/** Card thông tin thay đổi: nền surfacePage, chừa khoảng trái cho thanh accent */
export const historyInfoCardStyle: React.CSSProperties = {
  position: 'relative',
  minWidth: 0,
  background: surfacePage,
  borderRadius: radiusSm,
  padding: spaceMd,
  paddingLeft: spaceLg,
  overflow: 'hidden',
};

/** Thanh dọc gradient bên trái card: đậm → nhạt theo màu truyền vào */
export const historyAccentBarStyle = (color: string): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: spaceXs,
  background: `linear-gradient(180deg, ${color} 0%, ${color}40 100%)`,
});

/** Tiêu đề card: "Thông tin thêm mới:" / "Thông tin thay đổi:" */
export const historyInfoTitleStyle: React.CSSProperties = {
  display: 'block',
  color: textPrimary,
  fontSize: fontSizeMd + 1,
  fontWeight: fontWeightBold,
  marginBottom: spaceXs,
};

/** Dòng thay đổi (chỉnh sửa): field | giá trị cũ | → | giá trị mới */
export const historyChangeRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 1.15fr) minmax(90px, 0.85fr) 24px minmax(120px, 1.35fr)',
  gap: spaceSm,
  alignItems: 'start',
  paddingTop: spaceXs,
  fontSize: fontSizeMd,
  lineHeight: 1.5,
};

/** Dòng thay đổi (thêm mới): field | giá trị mới */
export const historyCreateRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(150px, 1fr) minmax(160px, 2fr)',
  gap: spaceSm,
  alignItems: 'start',
  paddingTop: spaceXs,
  fontSize: fontSizeMd,
  lineHeight: 1.5,
};

/** Tên field trong dòng thay đổi */
export const historyFieldLabelStyle: React.CSSProperties = {
  minWidth: 0,
  fontWeight: fontWeightMedium,
  color: textPrimary,
  overflowWrap: 'anywhere',
};

/** Giá trị cũ: màu nhạt */
export const historyOldValueStyle: React.CSSProperties = {
  minWidth: 0,
  color: textSecondary,
  overflowWrap: 'anywhere',
};

/** Giá trị mới: nhấn mạnh (medium, textPrimary) */
export const historyNewValueStyle: React.CSSProperties = {
  minWidth: 0,
  color: textPrimary,
  fontWeight: fontWeightMedium,
  overflowWrap: 'anywhere',
};

/** Mũi tên chuyển đổi cũ → mới */
export const historyArrowStyle: React.CSSProperties = {
  color: textTertiary,
  textAlign: 'center',
};

// --- 5.10 Multi-select ---

/** Tag hiển thị số lượng đã chọn (vd: "+1", "+2 VN003-003") */
export const multiSelectTagStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  background: surfacePage,
  color: actionPrimary,
};

/** Dòng hint giới hạn số bản ghi được chọn */
export const multiSelectHintStyle: React.CSSProperties = {
  fontSize: fontSizeSm,
  color: textTertiary,
  marginTop: spaceXs,
};


// --- 5.11 Breadcrumb ---

/** Container breadcrumb: flex, gap 8px, fontSizeBreadcrumb */
export const breadcrumbStyle: React.CSSProperties = {
  fontSize: fontSizeBreadcrumb,
  color: textSecondary,
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
  marginBottom: spaceSm,
};

/** Mục breadcrumb cuối (trang hiện tại): đậm, to hơn, textPrimary */
export const breadcrumbLastStyle: React.CSSProperties = {
  fontSize: fontSizeBreadcrumbLast,
  fontWeight: fontWeightBold,
  color: textPrimary,
};


// Chart ECharts defaults
export const chartGrid = { top: 16, right: 16, bottom: 16, left: 16, containLabel: true };
export const chartTooltip = {
  backgroundColor: '#0b2e4f',
  borderColor: 'transparent',
  textStyle: { color: '#eaf4fc', fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace", fontSize: 12 },
  extraCssText: 'border-radius:10px;padding:10px 14px;box-shadow:none;',
};
export const chartTextStyle = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: 11,
  color: '#93a3b3',
};


// --- ACCENT BUDGET TRACKER (documentation) ---
// Per-page limit: actionPrimary appears MAX 3 times.
// Current dashboard usage:
//   1. KpiCard variant="action" (Hồ sơ chờ duyệt) — action border/color
//   2. TrendChartCard error state "Thử lại" button
//   3. (reserved for future)
// Status colors, data colors, text colors do NOT count against budget.


// --- 5.12 Detail View (Xem chi tiết) ---

/** Label trong trang xem chi tiết: sidebarBg, đậm, fontSizeMd */
export const detailLabelStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
};

/** Dòng hiển thị label:value trong detail: flex, padding, borderBottom */
export const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  padding: '10px 12px',
  borderBottom: `1px solid ${borderDefault}`,
};

/** Label cột trong detail row: width 200px, không co */
export const detailLabelColStyle: React.CSSProperties = {
  width: 200,
  flexShrink: 0,
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
};

/** Value trong detail row: flex 1, textPrimary */
export const detailValueStyle: React.CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeMd,
  flex: 1,
};


// --- 5.13 Form Sub-Table (bảng con: GPS, KCHT, File) ---

/** Empty state cho bảng con trong form: dashed border, căn giữa */
export const formEmptyTableStyle: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  border: `1px dashed ${borderDefault}`,
  borderRadius: radiusMd,
  background: surfaceCard,
};

/** Section header cho bảng con: label + nút thêm */
export const formSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spaceFormField,
};


// --- 5.14 Filter Panel (Sidebar bộ lọc) ---

/** Select/Input full-width trong filter: pill, cao 40px */
export const filterInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusPill,
  height: controlHeight,
};
