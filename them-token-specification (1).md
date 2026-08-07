# Theme Token Specification — Hệ thống KCHTGT Hàng hải

**Version:** 2.2
**Based on:** `frontend/src/theme.ts` (v5) + `frontend/src/tokens.ts` + Figma "Quản lý Tàu bay"
**Ngày:** 07/08/2026 (46 style preset 5.1-5.12 + Section 8 Sidebar phân cấp Menu)

---

## 1. Kiến trúc 2 tầng

```
theme.ts                        tokens.ts
─────────                       ─────────
Hạ tầng & Layout                Ngữ nghĩa & Nội dung
├── colors (brand, sidebar)     ├── Color palette (13 màu)
├── AntD ConfigProvider         ├── Number scales (radius, font, spacing)
├── globalCssVars (CSS class)   ├── Content-type conventions
├── layout dimensions           └── Chart defaults
└── Rules 1-14 (AI guide)
```

**Nguyên tắc:** `theme.ts` lo khung (sidebar, header, AntD component) — các giá trị semantic (màu trạng thái, text, surface, radius, fontSize, shadow) được **import từ `tokens.ts`**, không tự định nghĩa độc lập. `tokens.ts` là single source of truth cho mọi giá trị ngữ nghĩa. Chỉ infrastructure token (sidebar, iconBg, textOnDark) được giữ local trong theme.ts.

---

## 2. Bố cục trang danh sách chuẩn

```
┌──────────────────────────────────────────────────────┐
│ Breadcrumb (16px/14px)              [Action buttons] │
├────────────┬─────────────────────────────────────────┤
│ FILTER     │ StatusTabs                              │
│ 280-360px  │ padding: 7px 16px                       │
│ (scroll)   ├─────────────────────────────────────────┤
│            │ DATA TABLE                              │
│            │ - Header: bodyBg, 15px padding          │
│            │ - Cell: fontSizeMd, ellipsis            │
│            ├─────────────────────────────────────────┤
│            │ Pagination                              │
└────────────┴─────────────────────────────────────────┘
```

### Khoảng cách

| Vị trí | Token | Giá trị |
|--------|-------|---------|
| Gap filter ↔ content | — | **5px** |
| Tab ↔ bảng | — | **5px** |
| Filter field spacing | `spaceFormField` | 12px |
| Label → input | — | 4px |
| Card padding | — | 10px |
| ScreenHeader marginBottom | — | 16px |

---

## 3. Màu sắc

### Brand & Surface

| Token | File | Giá trị | Dùng cho |
|-------|------|---------|----------|
| `actionPrimary` | tokens.ts | `#0E6FD6` | Nút primary, accent (theme.ts import từ đây) |
| `colors.sidebarBg` | theme.ts | `#12468C` | Sidebar, breadcrumb, label filter |
| `surfacePage` | tokens.ts | `#eaf0f6` | Nền trang, header bảng (theme.ts import từ tokens.ts) |
| `colors.containerBg` | theme.ts | `#FFFFFF` | Nền card |

### Trạng thái (Semantic)

| Token | File | Giá trị | Ý nghĩa |
|-------|------|---------|---------|
| `statusOperational` | tokens.ts | `#1BAF7A` | Hoạt động, đã duyệt, tăng |
| `statusAttention` | tokens.ts | `#EDA100` | Chờ duyệt, cảnh báo |
| `statusCritical` | tokens.ts | `#E34948` | Từ chối, lỗi, khóa |
| `statusDraft` | tokens.ts | `#93a3b3` | Nháp, không hoạt động |
| `actionPrimary` | tokens.ts | `#0E6FD6` | Nút hành động, link |

### Text

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `textPrimary` | `#0c2438` | Số liệu, nội dung chính |
| `textSecondary` | `#566a7c` | Nhãn, mô tả, placeholder |
| `textTertiary` | `#93a3b3` | Metadata, timestamp |

---

## 4. Thang số (BẮT BUỘC)

### Font size

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `fontSizeSm` | 10px | Metadata |
| `fontSizeMd` | **13px** | Body, label, cell, button |
| `fontSizeLg` | 15px | Card title, breadcrumb path |
| `fontSizeXl` | 18px | Page title |
| — | **16px** | Breadcrumb last item |
| — | **14px** | Breadcrumb path item |

> **CẤM:** 11, 12, 14, 16, 20, 24 trong component nội dung.
> **Ngoại lệ đã token hóa (v2.1):** `fontSizeBreadcrumb = 14`, `fontSizeBreadcrumbLast = 16` — đây là token chính thức trong `tokens.ts`, không phải giá trị hardcode.

### Radius

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `radiusSm` | 4px | TextArea |
| `radiusMd` | 8px | Card, menu item, bảng (theme.ts đã đồng bộ về 8 sau v5) |
| `radiusLg` | 12px | Card |
| `radiusPill` | **999px** | Input, Select, Button, Badge |

### Spacing

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `spaceXs` | 4px | |
| `spaceSm` | 8px | Gap nút |
| `spaceFormField` | **12px** | marginBottom Form.Item |
| `spaceMd` | 16px | |
| `spaceLg` | 24px | |
| `spaceXl` | 32px | |

### Font weight

| Token | Giá trị |
|-------|---------|
| `fontWeightNormal` | 400 |
| `fontWeightMedium` | 500 |
| `fontWeightBold` | 600 |

---

## 5. Style Presets — Tra cứu nhanh

Tất cả preset được định nghĩa trong `frontend/src/tokens.ts`. Dev import về dùng luôn, không tự ráp token thủ công.

### 5.1 Ô nhập liệu & Nút bấm

| Preset | Dùng cho |
|--------|----------|
| `inputStyle` | Input, InputNumber — viền pill, cao 40px |
| `selectStyle` | Select, DatePicker, TreeSelect — viền pill, cao 40px |
| `primaryButtonStyle` | Nút chính: "Tạo mới", "Lưu", "Phê duyệt", "Tìm kiếm" |
| `outlineButtonStyle` | Nút phụ: "Hủy", "Đóng", "Lưu tạm", "Xuất Excel" |
| `dangerButtonStyle` | Nút nguy hiểm: "Xóa", "Từ chối" |
| `iconButtonStyle` | Nút icon tròn 38×38px (VD: ↻ Làm mới) |

### 5.2 Form trong Drawer/Modal

| Preset | Dùng cho |
|--------|----------|
| `formFieldStyle` | marginBottom cho mọi `<Form.Item>` (= 12px) |
| `formRowGutter` | Row gutter form 2 cột `[16, 16]` |
| `drawerTitleStyle` | Tiêu đề Drawer: sidebarBg, đậm, 15px |
| `drawerCloseBtnStyle` | Nút ✕ đóng Drawer góc phải |
| `requiredMarkStyle` | CSS đưa dấu `*` required sang phải label |

### 5.3 Trang danh sách

| Preset | Dùng cho |
|--------|----------|
| `pageContainerStyle` | Container ngoài cùng: minHeight 100%, marginTop -8 |
| `screenHeaderStyle` | Vùng breadcrumb + nút hành động |
| `filterPanelStyle` | Panel lọc dọc bên trái: 280-360px, flex column |
| `filterFieldsStyle` | Vùng chứa trường filter (có scroll) |
| `filterFooterStyle` | Chân filter: nút Tìm kiếm + Làm mới, căn giữa |
| `filterLabelStyle` | Nhãn trường filter: đậm, sidebarBg |
| `statusTabsStyle` | Thanh tab trạng thái: cardStyle + padding |

### 5.4 Bảng dữ liệu

| Preset | Dùng cho |
|--------|----------|
| `tableHeaderStyle` | Hàng tiêu đề cột: nền surfacePage, đậm, hoa |
| `tableCellStyle` | Ô dữ liệu: fontSizeMd, textPrimary |
| `paginationBtnStyle` | Nút số trang: tròn 32×32, dataSea1 |
| `paginationSizeSelectStyle` | Dropdown chọn cỡ trang: pill, 72×32 |

### 5.5 Drawer

| Preset | Dùng cho |
|--------|----------|
| `drawerProps` | Props chuẩn: 50% right, không nút X mặc định |
| `drawerFooterStyle` | Chân Drawer: nút căn giữa, gap 8px |
| `detailDescriptionsStyle` | `<Descriptions>`: bordered, 2 cột, label 180px |
| `detailSectionTitleStyle` | Tiêu đề section collapsible: sidebarBg, đậm |

### 5.6 Upload file

| Preset | Dùng cho |
|--------|----------|
| `uploadAreaStyle` | Vùng kéo-thả/tải file: viền đứt, nền xám, căn giữa |
| `uploadHintStyle` | Dòng gợi ý định dạng file (vd: "PDF, JPEG/PNG <5MB") |
| `uploadFileItemStyle` | Item file đã tải lên: icon + tên file |

### 5.7 Import Excel

| Preset | Dùng cho |
|--------|----------|
| `importTemplateLinkStyle` | Link tải file template Excel mẫu |
| `importAreaStyle` | Vùng tải file Excel (kế thừa uploadAreaStyle) |

### 5.8 Modal xác nhận

| Preset | Dùng cho |
|--------|----------|
| `confirmModalBodyStyle` | Nội dung modal: chữ căn giữa, padding dọc 16px |
| `rejectReasonStyle` | Input nhập lý do từ chối: pill, cao 40px |

### 5.9 Timeline (Lịch sử thay đổi)

| Preset | Dùng cho |
|--------|----------|
| `timelineDotStyle` | Chấm tròn 12px, actionPrimary |
| `timelineContentStyle` | Nội dung mục timeline: fontSizeMd, lineHeight 1.6 |
| `timelineChangeStyle` | Dòng hiển thị thay đổi (before → after): chữ nhỏ, secondary |
| `timelineLineStyle` | Đường nối dọc 1px giữa các chấm, borderDefault |
| `timelineTimeStyle` | Timestamp: fontSizeSm, textTertiary, fontWeightMedium |

### 5.10 Multi-select

| Preset | Dùng cho |
|--------|----------|
| `multiSelectTagStyle` | Tag hiển thị số đã chọn (vd: "+1", "+2") |
| `multiSelectHintStyle` | Dòng hint giới hạn (vd: "Chọn tối đa 50 bản ghi") |

### 5.11 Breadcrumb

| Preset | Dùng cho |
|--------|----------|
| `breadcrumbStyle` | Container: flex, fontSizeBreadcrumb (14px) |
| `breadcrumbLastStyle` | Mục cuối (trang hiện tại): đậm, fontSizeBreadcrumbLast (16px) |

### 5.12 Content-type Conventions (có sẵn)

| Preset | Dùng cho |
|--------|----------|
| `cardStyle` | Card container: nền trắng, bo 12px, shadow |
| `badgeBaseStyle` | Status badge base: fontSizeSm, pill |
| `metaStyle` | Metadata: fontSizeSm, textTertiary |
| `dividerStyle` | Separator / hairline |
| `actionStyle` | Action / pill button style |

> **Tổng: 46 preset.** Cách dùng: `import { inputStyle } from '../tokens'; <Input style={inputStyle} />`

---

## 6. Component Style Chuẩn

### Filter Panel

```
┌─────────────────────┐
│ Label (13px Bold,   │  ← dùng filterLabelStyle
│  (fontSizeMd, đậm,  │
│   sidebarBg)        │
│ [Input/Select]      │  ← radiusPill, height: 40px
│ marginBottom: 12px  │
├─────────────────────┤  ← borderTop: borderDefault
│  ↻ (38x38, circle)  │  ← dùng iconButtonStyle
│  [Tìm kiếm] (38px)  │  ← actionPrimary bg
│ centered            │
└─────────────────────┘
```

- Panel: `flex column`, `overflow: hidden`
- Fields: `flex: 1`, `overflow-y: auto`, `padding: 12px 16px`
- Footer buttons: `borderTop: 1px solid borderDefault`, `padding: 12px 16px`, centered

### ScreenHeader

```
┌──────────────────────────────────────────┐
│ Breadcrumb           [Primary] [Outline] │
│ path (14px) > last (16px bold)          │
│ marginBottom: 16px                       │
└──────────────────────────────────────────┘
```

### StatusTabs

- Wrapper: `cardStyle`, `padding: 7px 16px`, `marginBottom: 5px`
- Active tab: `actionPrimary`, underline 2px
- Count badge: `badgeBaseStyle` với background `${color}15`

### DataTable

| Thuộc tính | Giá trị |
|-----------|---------|
| Header bg | `colors.bodyBg` (#F5F8FA) |
| Header padding | 15px 16px |
| Header font | fontSizeMd, Bold, UPPERCASE, sidebarBg |
| Cell font | fontSizeMd, textPrimary |
| Cell padding | 9px (cellPaddingBlock) |
| Ellipsis | `true` → tooltip AntD |
| Cột fixed | `fixed: 'left'` / `fixed: 'right'` |

### Pagination

- Mặc định: **10/page**, options: [10, 20, 50, 100]
- Nút trang: tròn 32x32px, màu `dataSea1`
- Select pageSize: `radiusPill`, 72x32px

---

## 7. CSS Class Dùng Chung

| Class | Dùng cho |
|-------|----------|
| `.sidebar-header`, `__logo-box`, `__text`, `__title`, `__subtitle` | Sidebar brand |
| `.sidebar-search` | Ô tìm kiếm sidebar |
| `.sidebar-menu-scroll` | Menu scroll |
| `.sidebar-footer`, `__collapse-btn`, `__version` | Footer sidebar |
| `.status-badge`, `--active`, `--inactive`, `--locked`, `--pending` | Cột trạng thái |
| `.role-tag`, `--admin`, `--org-admin`, `--manager`, `--viewer` | Cột vai trò |
| `.table-actions`, `__btn`, `__btn--danger` | Cột hành động |
| `.kpi-card`, `__label`, `__value`, `__icon-box`, `__delta` | Card thống kê |
| `.topbar-user`, `__avatar`, `__info`, `__name`, `__role` | User topbar |

---

## 8. Sidebar — Phân cấp Menu (Submenu Hierarchy)

Sidebar dùng Ant Design `Menu` component, mode `dark`, theme `dark`. Phân cấp 3 tầng theo đúng Figma:

```
┌──────────────────────────────┐
│  LOGO          CỤC HÀNG KHÔNG│  ← sidebar-header
├──────────────────────────────┤
│  Quản lý phương tiện HK       │  ← category group (BEM)
│  ┌────────────────────────┐  │
│  │ ▼ Quản lý Tàu bay      │  │  ← menu cha (SubMenu) — sidebarBg
│  │   Quản lý thông tin    │  │  ← menu con (Item) — lùi 24px
│  │   Trình phê duyệt      │  │
│  │   Phê duyệt            │  │
│  │   Báo cáo số liệu      │  │
│  │ ▶ Quản lý phương tiện..│  │  ← menu cha khác (đóng)
│  └────────────────────────┘  │
├──────────────────────────────┤
│  ☰ collapse       v1.0.0    │  ← sidebar-footer
└──────────────────────────────┘
```

### 8.1 Cấp độ & Indent

| Cấp | Component | Indent | Font | Weight | Color |
|-----|-----------|--------|------|--------|-------|
| 0 — Category | `<div>` BEM | 0 | 11px | 600 | `textOnDarkMuted` (55%) |
| 1 — Parent | `<SubMenu>` | 0 | 13px | 400 | `textOnDark` (85%) |
| 2 — Child | `<MenuItem>` | +24px | 13px | 400 | `textOnDark` (85%) |

### 8.2 Trạng thái

| Thành phần | Bình thường | Hover | Active/Selected |
|-----------|-------------|-------|-----------------|
| Parent (SubMenu) | Nền `sidebarBg`, chữ 85% | Nền sáng hơn 5% | — (không có selected) |
| Child (Item) | Nền `sidebarBg` | Nền `actionPrimary` | Nền `actionPrimary`, chữ trắng, `font-weight:600`, glow `box-shadow: 0 0 12px rgba(14,111,214,0.4)` |
| Icon expand | ▶ đóng / ▼ mở, 12px | — | — |

### 8.3 CSS Class (theme.ts globalCssVars)

```css
/* Parent: SubMenu title */
.ant-menu-dark .ant-menu-submenu-title {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  height: auto !important;
}

/* Child: menu item — height đủ cho text dài */
.ant-menu-dark .ant-menu-item {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  height: auto !important;
  padding-left: 48px !important;  /* lùi vào 24px so với parent */
}

/* Active child: nền actionPrimary + glow */
.ant-menu-dark .ant-menu-item-selected {
  background: #0E6FD6 !important;  /* actionPrimary */
  font-weight: 600;
  box-shadow: 0 0 12px rgba(14, 111, 214, 0.4);
}

/* Text dài xuống dòng thay vì ẩn */
.ant-menu-dark .ant-menu-title-content {
  white-space: normal;
  line-height: 1.5 !important;
}

/* Category group label */
.sidebar-category {
  padding: 16px 24px 8px 24px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### 8.4 Agent workflow

```
PMO Lead
  └── Dispatch Dev làm menu mới → PHẢI chép constraints vào prompt:
        "Menu sidebar dùng AntD Menu dark. Phân cấp 3 tầng:
         Category (BEM, 11px, uppercase, 55% opacity),
         Parent (SubMenu, 13px, 85% opacity, padding 10px),
         Child (Item, lùi 24px, active = nền actionPrimary + glow).
         KHÔNG tự tạo sidebar riêng — dùng AppLayout.tsx.
         CSS cho submenu đã có trong theme.ts globalCssVars."
```

---

## 9. Drawer — Tạo mới (Create)

```
┌──────────────────────────────────────────┐ header
│ Title (15px Bold, sidebarBg)        [✕] │ extra (phải)
├──────────────────────────────────────────┤ body (scroll)
│ Form (layout="vertical")                 │
│ * required bên phải label               │
│ Row gutter={16}, 2 cột/1 cột xen kẽ    │
│ Upload area cuối form                   │
├──────────────────────────────────────────┤ footer (fixed)
│      [Hủy]  [Lưu tạm]  [Lưu và PD]     │ centered
└──────────────────────────────────────────┘
```

| Prop | Giá trị |
|------|---------|
| `width` | `'50%'` |
| `placement` | `'right'` |
| `closable` | `false` |
| `extra` | `<Button>✕</Button>` |
| `footer` | 3 nút centered: Hủy / Lưu tạm / Lưu và PD |
| Form layout | `"vertical"`, không tab, scroll toàn bộ |

### CSS Required `*` bên phải

Dùng `requiredMarkStyle` (đã định nghĩa trong tokens.ts — Section 5.2):

```tsx
<style>{requiredMarkStyle}</style>
```

CSS tương đương:

```css
.ant-form-item-required::before { display: inline-block; margin-left: 4px; order: 1; }
.ant-form-item-required::after { display: none; }
```

---

## 10. Drawer — Chỉnh sửa (Edit)

| Điểm | Khác với Tạo mới |
|------|-----------------|
| Title | `Chỉnh sửa — ${name}` |
| Mã code | Readonly (không đổi) |
| Pre-fill | `form.setFieldsValue(data)` |
| Upload | File đã có + thêm mới |
| Iframe | Fallback `<Modal width='100%'>` |

> Layout, width, placement, footer, form giống hệt Tạo mới.

---

## 11. Drawer — Xem chi tiết (Detail)

```
┌──────────────────────────────────────────┐ header
│ Chi tiết [Entity]: [Tên]            [✕] │
├──────────────────────────────────────────┤ body
│ ▼ Thông tin chung                       │ collapsible
│ ┌──────────────┬──────────────────────┐ │ Descriptions 2 cột
│ │ Label        │ Value                │ │
│ └──────────────┴──────────────────────┘ │
│ ▼ Hệ thống                              │
├──────────────────────────────────────────┤ footer (fixed)
│  [Đóng] [Sửa] [Lịch sử] [Xóa] [...]    │ centered
└──────────────────────────────────────────┘
```

| Prop | Giá trị |
|------|---------|
| `width` | `'50%'` |
| `placement` | `'right'` |
| `closable` | `false` |
| Content | `<Descriptions>` dùng `detailDescriptionsStyle`: bordered, 2 cột, label width 180px |
| Divider | `orientation="left"`, collapsible, dùng `detailSectionTitleStyle` (sidebarBg, đậm) |

### Footer buttons

| Nút | Điều kiện | Style |
|-----|-----------|-------|
| Đóng | Luôn hiện | outline |
| Chỉnh sửa | `hasPerm('update')` | primary |
| Lịch sử | Luôn hiện | outline |
| Xóa | `hasPerm('delete')` | danger |
| Từ chối | status=PENDING | danger |
| Phê duyệt | status=PENDING | success |

---

## 12. Component Code Mẫu

```tsx
<Drawer
  title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 15 }}>Tiêu đề</span>}
  open={visible} onClose={handleClose}
  width={'50%'} placement="right" closable={false}
  extra={<Button type="text" onClick={handleClose} style={{ fontSize: 18, color: textSecondary }}>✕</Button>}
  footer={
    <Space style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Button onClick={handleClose} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
      <Button onClick={handleDraft} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Lưu tạm</Button>
      <Button type="primary" onClick={handleSubmit} loading={loading} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Lưu và phê duyệt</Button>
    </Space>
  }
>
  <style>{`.ant-form-item-required::before { display: inline-block; margin-left: 4px; order: 1; } .ant-form-item-required::after { display: none; }`}</style>
  <Form form={form} layout="vertical" onFinish={handleFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item name="field1" label="..." required style={{ marginBottom: spaceFormField }}>
          <Input style={{ borderRadius: radiusPill, height: 40 }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="field2" label="..." style={{ marginBottom: spaceFormField }}>
          <Select options={opts} style={{ borderRadius: radiusPill, height: 40 }} />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</Drawer>
```

---

## 13. Quy tắc vàng

1. **Không hardcode** màu hex, spacing, font-size — dùng token từ `theme.ts` / `tokens.ts`. Ưu tiên dùng Style Preset (Section 5) thay vì tự ráp token thủ công.
2. **Không tự tạo** Layout/Sider/Menu — dùng `AppLayout.tsx`
3. **Dùng chung** list-view components: `ScreenHeader`, `StatusTabs`, `DataTable`, `Pagination`
4. **Filter panel** dọc bên trái, bảng bên phải là pattern chuẩn
5. **Drawer 50% right** cho form CRUD (Tạo mới, Sửa, Chi tiết)
6. **Modal** cho confirm/alert, history
7. **Footer buttons centered**, fixed bottom trong Drawer
8. **Cột action** `fixed: 'right'`, cột quan trọng `fixed: 'left'`
9. **Sort** client-side cho cột ngày tháng
10. **Accent budget**: `actionPrimary` ≤ 3 lần/màn hình
11. **Required `*`**: bên phải label (CSS)
12. **Form không tab**: scroll toàn bộ trong Drawer
