# theme.ts — Bộ theme Ant Design v5 phong cách Metronic 8

> File gốc để dùng trong code là **`theme.ts`** (TypeScript). File `.md` này chỉ là bản đọc tham khảo — không import được vào project.

**Dùng cho:** Hệ thống Quản trị kết cấu hạ tầng giao thông đường thủy & hàng hải

---

## Cách dùng

1. Import `metronicTheme` và bọc toàn app bằng `<ConfigProvider theme={metronicTheme}>` ở file gốc (`main.tsx` / `App.tsx` / `_app.tsx`).
2. Import `globalCssVars` (chuỗi CSS) và chèn vào file CSS global (`index.css` / `global.css`) — vì token AntD không cover hết mọi thứ (shadow card, badge %, border-left sidebar active...).
3. Với 22 module còn lại: **không** sửa màu/spacing thủ công theo cảm tính ở từng module. Toàn bộ style phải kế thừa từ token trong file này. Nếu 1 màu/spacing chưa có token tương ứng, bổ sung vào `theme.ts` trước, rồi mới dùng ở module.

---

## 1. Design tokens gốc

### Màu sắc (`colors`)

| Nhóm | Token | Giá trị | Ghi chú |
|---|---|---|---|
| Thương hiệu | `primary` | `#1B84FF` | Xanh dương Metronic (thay `#1677ff` mặc định AntD) |
| | `primaryHover` | `#3B94FF` | |
| | `primaryActive` | `#0A6AE0` | |
| Trạng thái | `success` | `#17C653` | |
| | `warning` | `#F6B100` | |
| | `error` | `#F1416C` | |
| | `info` | `#7239EA` | |
| Nền | `bodyBg` | `#F5F8FA` | Nền layout tổng — xám rất nhạt đặc trưng Metronic |
| | `containerBg` | `#FFFFFF` | |
| | `sidebarBg` | `#1E2129` | Nền sidebar tối |
| | `sidebarActiveBg` | `rgba(27,132,255,0.12)` | |
| Border | `borderLight` | `#EFF2F5` | |
| | `borderBase` | `#E4E6EF` | |
| Chữ | `textPrimary` | `rgba(0,0,0,0.85)` | |
| | `textSecondary` | `rgba(0,0,0,0.55)` | |
| | `textTertiary` | `rgba(0,0,0,0.35)` | |
| | `textOnDark` | `rgba(255,255,255,0.85)` | |
| | `textOnDarkMuted` | `rgba(255,255,255,0.55)` | |
| Icon nền (card KPI) | `iconBgBlue` | `#EEF6FF` | |
| | `iconBgGreen` | `#EAFBF0` | |
| | `iconBgOrange` | `#FFF6E8` | |
| | `iconBgPurple` | `#F5EEFF` | |
| | `iconBgRed` | `#FFEEF2` | |

### Bo góc (`radius`)

| Token | Giá trị |
|---|---|
| `sm` | 6px |
| `md` | 10px |
| `lg` | 12px |
| `xl` | 16px |
| `pill` | 999px |

### Khoảng cách (`spacing`)

| Token | Giá trị |
|---|---|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `xxl` | 48px |

### Cỡ chữ (`fontSize`)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `labelUppercase` | 12px | Label kiểu "CẢNG BIỂN" — uppercase, letter-spacing |
| `body` | 14px | |
| `bodyLg` | 15px | |
| `cardTitle` | 16px | |
| `sectionTitle` | 20px | |
| `pageTitle` | 24px | |
| `statNumber` | 34px | Số liệu to trong card thống kê |

### Shadow (`shadow`)

| Token | Giá trị |
|---|---|
| `card` | `0 0.1rem 1rem rgba(0,0,0,0.05)` |
| `cardHover` | `0 0.3rem 1.5rem rgba(0,0,0,0.1)` |
| `dropdown` | `0 0.5rem 1.5rem rgba(0,0,0,0.12)` |

### Font family

```
Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

---

## 2. Ant Design ThemeConfig (`metronicTheme`)

### `token` (global)
- Toàn bộ màu (`colorPrimary`, `colorSuccess`...) map thẳng từ `colors` ở trên.
- `borderRadius: 10`, `borderRadiusLG: 12`, `borderRadiusSM: 6` — bo lớn hơn mặc định AntD (6px).
- `controlHeight: 40`, `controlHeightLG: 46` — input/button cao hơn, dễ bấm hơn.
- `boxShadow` / `boxShadowSecondary` dùng token `shadow.card` / `shadow.cardHover`.

### `components` (override riêng từng component)

| Component | Điểm chỉnh chính |
|---|---|
| **Layout** | `siderBg` tối, `headerHeight: 64` |
| **Menu** | Sidebar tối, item cao 46px, bo góc item 6px, active có nền xanh nhạt (border-left xử lý bằng CSS riêng, xem mục 3) |
| **Card** | Bo góc 12px, padding 24px, shadow nhẹ |
| **Button** | Bo góc 6px, cao 40px, font-weight 500 |
| **Table** | Header nền `#F9FAFB`, hover row `#F5F8FA`, padding dòng 14px |
| **Input / Select** | Bo góc 6px, cao 40px |
| **Tabs** | Ink bar + item active màu primary |
| **Breadcrumb** | Item thường xám, item cuối đậm |
| **Tag** | Bo góc 6px |
| **Progress** | Bo tròn hoàn toàn (pill) nếu vẫn dùng progress bar |
| **Modal** | Bo góc 12px |
| **Dropdown** | Bo góc 10px + shadow dropdown riêng |

---

## 3. CSS Variables & Global Override (`globalCssVars`)

Phần AntD token **không** cover được, cần chèn thêm CSS thuần:

- **`:root { --color-primary: ...; }`** — toàn bộ token ở trên dưới dạng CSS variable, dùng được ở bất kỳ đâu kể cả ngoài AntD.
- **`.ant-menu-dark .ant-menu-item-selected::before`** — thêm thanh border trái 3px màu primary cho menu item đang active (đặc trưng Metronic, AntD không có sẵn).
- **`.sidebar-header` / `.sidebar-footer`** — ép cả 2 vùng dùng chung `var(--bg-sidebar)` với phần menu, tránh tình trạng 3 mảng màu tối khác nhau. Logo chỉ bọc trong khối nhỏ `.sidebar-header__logo-box` (36×36, nền trắng), không để nền trắng tràn cả thanh ngang.
- **`.status-badge`** (`--active` / `--inactive` / `--locked` / `--pending`) — badge trạng thái dạng pill có chấm tròn, dùng cho **mọi cột "Trạng thái"** trong mọi bảng dữ liệu, thay vì chữ trần như hiện tại.
- **`.role-tag`** (`--admin` / `--org-admin` / `--manager` / `--viewer`) — mỗi vai trò/loại có 1 màu cố định theo ngữ nghĩa, dùng nhất quán xuyên suốt hệ thống thay vì tất cả cùng 1 màu xanh nhạt.
- **`.table-actions` / `.table-actions__btn` (`--danger`)** — icon hành động trong bảng dùng 1 màu trung tính đồng nhất khi hover, chỉ icon xoá mới có màu đỏ cảnh báo, thay vì mỗi icon 1 màu ngẫu nhiên như hiện tại.
- **`.kpi-card`** — class dùng chung cho 4 card thống kê (CẢNG BIỂN, ĐÈN BIỂN...): nền trắng, bo góc 12px, shadow nhẹ, hover nhấc lên (`translateY(-2px)`).
  - `.kpi-card__label` — label uppercase nhỏ, màu xám nhạt.
  - `.kpi-card__value` — số liệu to 34px, đậm.
  - `.kpi-card__icon-box` — khối icon vuông bo góc.
  - `.kpi-card__delta` (`--up` / `--down`) — **badge % tăng/giảm, thay thế progress bar phẳng vô nghĩa hiện tại.**
- **`.feature-card`** — class cho card "Chức năng chính", có hover shadow + `.feature-card__link` (nút "Truy cập →" dạng ghost, có hover nền nhạt).
- **`body, .ant-layout { background: var(--bg-body); }`** — đảm bảo nền tổng toàn app đồng nhất.

---

## 4. Quy tắc bắt buộc khi AI sửa 22 module

1. **Không hard-code màu hex** trực tiếp trong component (vd `style={{color: '#1677ff'}}`). Luôn dùng token từ `colors` hoặc CSS var (`var(--color-primary)`).
2. Card thống kê (4 ô kiểu CẢNG BIỂN/ĐÈN BIỂN...) ở **mọi module** phải dùng chung class `.kpi-card` + `.kpi-card__label` + `.kpi-card__value`, không tự viết style riêng lẻ từng nơi.
3. Card chức năng / link truy cập nhanh → dùng `.feature-card`.
4. Progress bar phẳng hiện tại nên thay bằng `.kpi-card__delta` (badge % tăng/giảm) nếu có dữ liệu so sánh kỳ trước; nếu không có dữ liệu, bỏ hẳn — không để progress bar vô nghĩa.
5. Sidebar dùng chung component `Menu` đã theme sẵn (`mode="inline" theme="dark"`), không tự dựng menu bằng `div`/`ul` thủ công.
6. Nếu module cần màu/spacing/radius **chưa có token tương ứng** → dừng lại, bổ sung token mới vào `theme.ts` (đúng nhóm `colors`/`radius`/`spacing`/`fontSize`) trước, rồi mới dùng. Không tự đặt giá trị rời rạc trong từng file.
7. Toàn bộ 22 module import `metronicTheme` **gián tiếp qua `ConfigProvider` ở root** — không wrap thêm `ConfigProvider` theme khác ở cấp module, tránh theme bị override lệch nhau.
8. **Sidebar** phải có đúng 3 vùng dùng chung nền tối (`.sidebar-header`, `Menu` theme dark, `.sidebar-footer`) — cấm set màu riêng từng vùng. Logo chỉ bọc trong khối nhỏ `.sidebar-header__logo-box`, không tràn nền trắng ra cả thanh ngang.
9. **Cột "Trạng thái"** trong mọi bảng dữ liệu phải dùng `.status-badge` (4 biến thể `active/inactive/locked/pending`) — không để chữ trạng thái trần.
10. **Cột "Vai trò/Loại"** phải dùng `.role-tag` (4 biến thể `admin/org-admin/manager/viewer`) — mỗi ý nghĩa 1 màu cố định, dùng lại xuyên suốt hệ thống, không dùng chung 1 màu cho mọi loại.
11. **Cột "Hành động"** dùng `.table-actions` bọc ngoài + `.table-actions__btn` cho từng icon (màu trung tính), riêng icon xoá thêm `--danger` (màu đỏ). Không tô mỗi icon 1 màu ngẫu nhiên.

---

*File thực thi (import vào code): `theme.ts`. File này (`theme.md`) chỉ để đọc và đối chiếu.*
