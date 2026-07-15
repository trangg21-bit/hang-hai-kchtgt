# Quy chuẩn màn DANH SÁCH (List View) — Token & Bố cục chuẩn (Final)

> Áp cho mọi màn "Quản lý / Danh sách X". Light mode.
> Đã verify trên UsersPage (M-001/F-001).

---

## 0. Nguyên tắc

- **5 vùng**: Header → FilterBar → StatusTabs (card riêng) → Bảng (card riêng) → Pagination
- **Token**: Kế thừa `tokens.ts` (semantic) + `theme.ts` (layout/AntD). Cấm hex tùy tiện.
- **Font**: Toàn bộ dùng **Inter** — không dùng JetBrains Mono.
- **Chiều cao dòng**: Do `cellPaddingBlock` trong `theme.ts` quyết định (AntD cssinjs). `onCell`/`ConfigProvider`/`!important` đều không override được.

---

## 1. Token — giá trị đã chốt

### 1.1 Kế thừa từ `tokens.ts`

```ts
// Màu
actionPrimary, dataSea1,          // nút chính, tab active, viền chip
statusOperational, statusCritical, statusDraft, statusAttention,  // trạng thái
textPrimary, textSecondary, textTertiary,  // text hierarchy
surfaceCard, borderDefault, shadowMd,      // card & border
// Thang số
fontSizeLg (15), fontSizeMd (13),          // chỉ dùng 2 size này
fontWeightBold (600), fontWeightMedium (500),
radiusMd (8), radiusPill (999),
spaceSm (6), spaceMd (16), spaceLg (24),
// Style conventions
cardStyle, badgeBaseStyle, metaStyle,
```

### 1.2 Kế thừa từ `theme.ts`

```ts
colors.sidebarBg (#12468C),  // breadcrumb, filter labels, table header
colors.bodyBg (#F5F8FA),     // table header background
```

### 1.3 Token bổ sung (riêng cho bảng)

| Token | Giá trị | Vai trò |
|---|---|---|
| `cellPaddingBlock` | **10** (theme.ts) | Padding dọc mỗi ô dữ liệu |
| Header padding | `16px 16px` (onHeaderCell) | Giữ nguyên cho tiêu đề |
| Row height | ~36px | 10 + 13×1.2 + 10 |

---

## 2. Header màn (`<ScreenHeader />`)

```tsx
<ScreenHeader
  breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý người dùng' }]}
  actions={[
    { key: 'create', label: 'Thêm mới', variant: 'primary', icon, onClick },
    { key: 'export', label: '', variant: 'subtle', icon: <FileExcelOutlined />, 
      borderColor: statusOperational, color: statusOperational, onClick },
  ]}
/>
```

**Style:**
- Breadcrumb: `fontSizeLg` (15px), `fontWeightBold`, màu `#12468C`, tất cả item cùng style
- Separator `>`: `textTertiary`
- Buttons: `height: 40`, `fontSizeMd`, `borderRadius: radiusPill`, gap `spaceSm` (6px)
- Primary: nền `actionPrimary`, chữ trắng
- Subtle: nền trong suốt, viền+chữ theo `borderColor`/`color`
- Layout: flex, breadcrumb trái, buttons phải (`marginLeft: 'auto'`)
- marginBottom: **12px**

---

## 3. FilterBar (`<FilterBar />`)

```tsx
<FilterBar
  fields={[
    { key: 'search', type: 'search', label: 'Tìm kiếm', placeholder: '...' },
    { key: 'roleId', type: 'select', label: 'Vai trò', options: [...] },
    { key: 'status', type: 'select', label: 'Trạng thái', options: [...] },
  ]}
  onSearch={...} onReset={...}
/>
```

**Style:**
- Label: `fontSizeMd` (13px), `fontWeightBold`, màu `#12468C`, marginBottom 4px
- Input/Select: `borderRadius: radiusPill`, `height: 40`
- Buttons: cùng hàng với field, `height: 40`, `fontSizeMd`, `radiusPill`
- "Làm mới": icon-only, outline xám
- "Tìm kiếm": `actionPrimary` đặc
- Gap giữa các field + buttons: `spaceSm` (6px)
- Card: `marginBottom: 4px`

---

## 4. StatusTabs (`<StatusTabs />`)

```tsx
<StatusTabs
  tabs={[
    { key: 'all', label: 'Tất cả', count: N, color: textSecondary, active: ... },
    { key: 'active', label: 'Hoạt động', count: N, color: actionPrimary, active: ... },
    { key: 'locked', label: 'Đã khóa', count: N, color: statusCritical, active: ... },
    { key: 'inactive', label: 'Không hoạt động', count: N, color: statusDraft, active: ... },
  ]}
  onChange={...}
/>
```

**Style:**
- Card riêng: `marginBottom: 4px`, `padding: 8px 16px`, bo góc, nền trắng
- Tabs: `justifyContent: center`, gap `spaceLg`, không border-bottom
- Active tab: `actionPrimary`, `fontWeightBold`, gạch chân 2px
- Badge: `fontSizeMd`, nền `${color}15`, chữ cùng màu

---

## 5. Bảng dữ liệu (`<DataTable />`)

```tsx
<DataTable
  columns={columns}
  dataSource={data}
  rowKey="id"
  rowActions={(record) => [...]}
  scroll={{ x: 1200 }}
  onSort={handleSort}
/>
```

### 5.1 Header cột

| Thuộc tính | Giá trị |
|---|---|
| Màu chữ | `#12468C` |
| Font | `fontSizeMd` (13px), `fontWeightBold` |
| Chữ | **UPPERCASE** |
| Nền | `#F5F8FA` (bodyBg) |
| Padding | `16px 16px` |
| Wrap | `nowrap` |

### 5.2 Dòng dữ liệu

| Thuộc tính | Giá trị |
|---|---|
| Màu chữ | `textPrimary` (#0c2438) |
| Font | `fontSizeMd` (13px) |
| Padding dọc | `cellPaddingBlock: 10` (không set qua onCell) |
| Tràn | `overflow: hidden`, `textOverflow: ellipsis`, `whiteSpace: nowrap` |

### 5.3 Cột

| Cột | Width | Align | Ghi chú |
|---|---|---|---|
| STT | 60 | center | |
| Tên | 200 | left | `Typography.Text strong` |
| Text thường | 150-200 | left | |
| Vai trò | 180 | center | Chip bo 8px (xem 5.4) |
| Trạng thái | 140 | center | Chip bo 8px (xem 5.4) |
| Ngày | 170 | center | |
| Hành động | 60 | center | Nút ⋮ tròn 28×28 (xem 5.5) |

### 5.4 Chip (Trạng thái & Vai trò)

```tsx
// Cả 2 loại chip dùng chung style:
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '2px 10px', borderRadius: 8,
  fontSize: fontSizeMd, fontWeight: fontWeightMedium,
  background: `${color}15`, color,
}}>
  {label}
</span>
```

**Màu map:**
| Trạng thái | Color |
|---|---|
| Hoạt động | `actionPrimary` (#0E6FD6) |
| Đã khóa | `statusCritical` (#E34948) |
| Không hoạt động | `statusDraft` (#93a3b3) |

### 5.5 Cột Hành động

- **Tiêu đề**: rỗng (không text)
- **Nội dung**: 1 nút ⋮ (`MoreOutlined`), 28×28px, `borderRadius: '50%'`, viền `borderDefault`, chữ `textSecondary`
- Bấm mở `Dropdown` chứa các action (Sửa, Khóa/Mở khóa, Reset MK, Xóa)

---

## 6. Pagination (`<Pagination />`)

```tsx
<Pagination total={N} current={page} pageSize={pageSize} onChange={...} />
```

**Layout:** Cả cụm căn phải. Theo thứ tự trái→phải:
1. "Tổng cộng: N" (`fontSizeMd`, `textSecondary`, số bold)
2. « ‹ (nút tròn 32×32, disabled mờ 35%)
3. **Trang hiện tại** — hình tròn 32×32, viền+nền+chữ `dataSea1` (nền 15%, viền 40%)
4. › » (nút tròn 32×32)
5. Dropdown "10" (rộng 80px, `radiusMd`, height 34)

**Style:**
- Tất cả nút: `borderRadius: '50%'`, `color: textSecondary`, `border: borderDefault`
- Container: `justifyContent: flex-end`, `padding: 8px 0`, gap `spaceSm` (6px)

---

## 7. Khoảng cách giữa các vùng

| Vị trí | Gap |
|---|---|
| Topbar → breadcrumb | marginTop -8px (wrapper) |
| Breadcrumb → FilterBar | 12px |
| FilterBar → StatusTabs | 4px |
| StatusTabs → Bảng | 4px |
| Bảng → Pagination | 0 (cùng card) |
| Card padding | 8px 16px |

---

## 8. Quy tắc vàng

1. **Chỉ 2 cỡ chữ**: 15px (breadcrumb) + 13px (tất cả còn lại)
2. **1 font**: Inter — không mono, không font khác
3. **cellPaddingBlock = 10**: Sửa trong theme.ts, không override được bằng cách khác
4. **Nút ⋮ quyết định chiều cao dòng**: Phải nhỏ hơn cellPaddingBlock×2 + lineHeight
5. **Chip đồng nhất**: Trạng thái & Vai trò cùng padding/borderRadius/fontSize, chỉ khác màu
6. **Accent budget**: Mỗi màn ≤ 3 lần `actionPrimary`
7. **Cấm**: hex cứng, fontSize ngoài thang (10, 12, 14, 16, 18), radius ngoài thang (6, 10, 14)

---

## 9. Checklist cho màn mới

- [ ] Import token từ `tokens.ts` + `colors` từ `theme.ts`
- [ ] Dùng 5 component: ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination
- [ ] cellPaddingBlock = 10 trong theme.ts
- [ ] Font Inter toàn bộ, fontSizeMd (13px) cho hầu hết text
- [ ] Chip trạng thái & vai trò: `padding: 2px 10px, borderRadius: 8`
- [ ] Nút ⋮ 28×28, tròn, viền borderDefault
- [ ] Pagination: Tổng cộng + nút tròn + trang hiện tại dataSea1 + dropdown
- [ ] Table header: #12468C, bold, UPPERCASE, nền bodyBg
- [ ] Các vùng cách nhau 4px, header→filter 12px
